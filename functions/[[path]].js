// File: functions/[[path]].js

// --- 配置区 ---
const AUTH_COOKIE_NAME = 'cf-proxy-auth'; // 保留但不再使用（兼容旧Cookie）
const RATE_LIMIT_ENABLED = true; // 启用速率限制（通过环境变量控制更灵活）
const ALLOWED_DOMAINS = context.env.ALLOWED_DOMAINS?.split(',') || []; // 允许代理的域名白名单（逗号分隔）
const CACHE_TTL = 300; // 静态资源缓存时间（秒）
// --- 配置区结束 ---

// 速率限制缓存（使用Cloudflare KV存储，需在环境变量配置KV_NAMESPACE）
const rateLimitCache = context.env.RATE_LIMIT_CACHE || null;

function handleSpecialCases(requestToModify, targetUrlForRules) {
  const rules = specialCases[targetUrlForRules.hostname] || specialCases["*"] || {};
  for (const [key, value] of Object.entries(rules)) {
    switch (value) {
      case "KEEP": break;
      case "DELETE": requestToModify.headers.delete(key); break;
      default: requestToModify.headers.set(key, value);
    }
  }
}

/**
 * 获取客户端真实IP（优先使用Cloudflare提供的CF-Connecting-IP）
 */
function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
}

/**
 * 速率限制检查（基于IP）
 */
async function checkRateLimit(ip) {
  if (!RATE_LIMIT_ENABLED || !rateLimitCache) return true;
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分钟窗口
  const maxRequests = 100; // 每分钟最大请求数
  
  const cacheKey = `rate_limit:${ip}`;
  const record = await rateLimitCache.get(cacheKey, { type: 'json' });
  
  if (record && (now - record.timestamp < windowMs) && record.count >= maxRequests) {
    return false; // 超过限制
  }
  
  // 更新计数
  await rateLimitCache.put(cacheKey, {
    timestamp: now,
    count: (record?.count || 0) + 1
  }, { ttl: windowMs });
  
  return true;
}

/**
 * 清理敏感请求头
 */
function sanitizeHeaders(headers) {
  const sensitiveHeaders = [
    'Cookie', 'Referer', 'Origin', 
    'X-Forwarded-For', 'X-Forwarded-Proto', 'X-Real-IP'
  ];
  sensitiveHeaders.forEach(header => headers.delete(header));
  return headers;
}

/**
 * 处理目标URL验证（白名单检查）
 */
function validateTargetUrl(url) {
  if (!ALLOWED_DOMAINS.length) return true; // 未配置白名单时允许所有域名
  
  try {
    const targetUrl = new URL(url);
    return ALLOWED_DOMAINS.includes(targetUrl.hostname);
  } catch {
    return false;
  }
}

/**
 * 缓存响应（针对静态资源）
 */
async function getCachedResponse(request) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, { headers: request.headers });
  const cached = await cache.match(cacheKey);
  return cached || null;
}

async function cacheResponse(response, request) {
  if (response.status !== 200) return response;
  if (!response.headers.get('Content-Type')?.startsWith('image/')) return response; // 仅缓存图片
  
  const cache = caches.default;
  const cacheKey = new Request(request.url, { headers: request.headers });
  await cache.put(cacheKey, response.clone());
  return response;
}

function getPasswordPromptResponse(hasError = false) {
  // 保留原登录页HTML（可选，可删除或替换为引导页）
  return new Response(/* 原HTML内容 */, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function processProxyRequest(incomingRequest, context) {
  const url = new URL(incomingRequest.url);

  // ===================== 取消密码验证后调整 =====================
  // 原密码验证逻辑全部删除，仅保留基础功能

  // ===================== 新增安全校验 =====================
  // 1. 客户端IP速率限制
  const clientIp = getClientIp(incomingRequest);
  if (!(await checkRateLimit(clientIp))) {
    return new Response('请求过于频繁，请1分钟后重试', { status: 429 });
  }

  // 2. 目标域名白名单检查
  const actualUrlStr = url.pathname.substring(1) + url.search + url.hash;
  if (!validateTargetUrl(actualUrlStr)) {
    return new Response(`目标域名不允许代理`, { status: 403 });
  }

  let actualUrl;
  try {
    actualUrl = new URL(actualUrlStr);
  } catch (e) {
    return new Response(`无效的目标URL: "${actualUrlStr}"`, { status: 400 });
  }

  // ===================== 请求预处理 =====================
  const modifiedRequest = new Request(actualUrl.toString(), incomingRequest);
  
  // 清理敏感头 + 删除Cookie
  sanitizeHeaders(modifiedRequest.headers);
  modifiedRequest.headers.delete('Cookie');

  // 处理特殊头规则
  handleSpecialCases(modifiedRequest, actualUrl);

  // ===================== 缓存处理 =====================
  // 优先返回缓存（仅对GET请求有效）
  if (incomingRequest.method === 'GET') {
    const cached = await getCachedResponse(modifiedRequest);
    if (cached) return cached;
  }

  // ===================== 执行代理请求 =====================
  try {
    const response = await fetch(modifiedRequest);
    
    // 缓存响应（仅静态资源）
    const cachedResponse = await cacheResponse(response.clone(), modifiedRequest);
    if (cachedResponse) return cachedResponse;

    // 处理CORS
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('Access-Control-Allow-Origin', context.env.TRUSTED_ORIGIN || '*'); // 从环境变量获取信任源
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', incomingRequest.headers.get('Access-Control-Request-Headers') || '*');
    modifiedResponse.headers.set('Access-Control-Expose-Headers', '*');
    
    // 日志记录（脱敏）
    console.log(`[代理] ${clientIp} -> ${incomingRequest.url} -> ${actualUrl.hostname} [状态: ${response.status}]`);
    
    return modifiedResponse;
  } catch (error) {
    console.error(`[代理失败] ${clientIp} -> ${actualUrl}: ${error.message}`);
    return new Response(`代理请求失败: ${error.message}`, { status: 502 });
  }
}

// ===================== 前端页面处理（保留输入功能，移除认证逻辑） =====================
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 根路径返回输入页面（可选，可改为重定向或其他逻辑）
  if (url.pathname === "/") {
    const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CF-Link-Proxy（无密码版）</title><style>/* 原样式保留，移除暗黑模式相关逻辑（可选） */</style></head><body><div class="container"><h1>URL 代理服务</h1><p>请输入目标链接（仅允许白名单域名）:</p><input type="url" id="targetUrlInput" placeholder="https://example.com" required><button onclick="navigateToProxy()">访问</button></div><script>
      function navigateToProxy() {
        const input = document.getElementById("targetUrlInput");
        const url = input.value.trim();
        if (!url) return alert("请输入链接！");
        // 自动补全协议
        const target = url.startsWith("http") ? url : "https://" + url;
        window.location.href = "/" + encodeURIComponent(target);
      }
      // 支持回车提交
      document.getElementById("targetUrlInput").addEventListener("keypress", e => {
        if (e.key === "Enter") navigateToProxy();
      });
    </script></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 其他路径走代理逻辑
  return await processProxyRequest(context.request, context);
}
