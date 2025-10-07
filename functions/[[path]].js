// File: functions/[[path]].js

// --- 配置区 ---
// 允许代理的域名白名单（通过环境变量 ALLOWED_DOMAINS 配置，逗号分隔）
const ALLOWED_DOMAINS = context.env.ALLOWED_DOMAINS?.split(',') || [];
// --- 配置区结束 ---

/**
 * 为特定目标或所有目标（"*"）修改请求头
 * @param {Request} requestToModify 要修改的请求对象
 * @param {URL} targetUrlForRules 目标URL对象
 */
function handleSpecialCases(requestToModify, targetUrlForRules) {
  // 注意：specialCases 对象需要您根据实际需求在代码中定义
  const specialCases = {
    // 示例:
    // "example.com": {
    //   "user-agent": "MyCustomBot/1.0", // 修改 User-Agent
    //   "x-custom-header": "DELETE" // 删除某个头
    // },
    // "*": {
    //   "x-powered-by": "Cloudflare-Worker-Proxy" // 为所有请求添加头
    // }
  };

  const rules = specialCases[targetUrlForRules.hostname] || specialCases["*"] || {};
  for (const [key, value] of Object.entries(rules)) {
    switch (value) {
      case "KEEP": // 保留原始请求头，不做任何操作
        break;
      case "DELETE": // 删除该请求头
        requestToModify.headers.delete(key);
        break;
      default: // 设置为指定的值
        requestToModify.headers.set(key, value);
    }
  }
}

/**
 * 获取客户端真实IP地址（优先使用Cloudflare提供的CF-Connecting-IP）
 * @param {Request} request 传入的请求
 * @returns {string} 客户端IP地址
 */
function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
}

/**
 * 清理请求中可能包含的敏感信息头
 * @param {Headers} headers 请求头对象
 * @returns {Headers} 清理后的请求头对象
 */
function sanitizeHeaders(headers) {
  const sensitiveHeaders = [
    'Cookie',
    'Referer',

    // 以下是常见的代理IP头，为避免信息泄露或混淆，统一清理
    'X-Forwarded-For',
    'X-Forwarded-Proto',
    'X-Real-IP'
  ];
  sensitiveHeaders.forEach(header => headers.delete(header));
  return headers;
}

/**
 * 验证目标URL是否在允许的域名白名单内
 * @param {string} url 要验证的目标URL字符串
 * @returns {boolean} 如果允许则返回 true，否则返回 false
 */
function validateTargetUrl(url) {
  // 如果没有配置白名单，则默认允许所有域名（注意：这可能存在安全风险）
  if (!ALLOWED_DOMAINS.length) return true;
  
  try {
    const targetUrl = new URL(url);
    return ALLOWED_DOMAINS.includes(targetUrl.hostname);
  } catch {
    // 如果URL格式无效，则视为验证失败
    return false;
  }
}

/**
 * 核心代理请求处理函数
 * @param {Request} incomingRequest 客户端发来的原始请求
 * @param {object} context Worker的上下文对象
 * @returns {Promise<Response>} 返回给客户端的响应
 */
async function processProxyRequest(incomingRequest, context) {
  const url = new URL(incomingRequest.url);
  const clientIp = getClientIp(incomingRequest);

  // 1. 目标域名白名单检查
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

  // 2. 请求预处理
  // 创建一个指向目标URL的新请求，并复制原始请求的方法、主体等信息
  const modifiedRequest = new Request(actualUrl.toString(), incomingRequest);
  
  // 清理敏感头信息
  sanitizeHeaders(modifiedRequest.headers);
  // 显式删除Cookie，因为 sanitizeHeaders 已经包含了它，但这里作为双重保障
  modifiedRequest.headers.delete('Cookie');

  // 根据自定义规则处理特殊请求头
  handleSpecialCases(modifiedRequest, actualUrl);

  // 3. 执行代理请求
  try {
    const response = await fetch(modifiedRequest);
    
    // 4. 处理响应（增加CORS头）
    const modifiedResponse = new Response(response.body, response);
    
    // 从环境变量获取信任的来源域，实现更安全的CORS策略
    modifiedResponse.headers.set('Access-Control-Allow-Origin', context.env.TRUSTED_ORIGIN || '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', incomingRequest.headers.get('Access-Control-Request-Headers') || '*');
    modifiedResponse.headers.set('Access-Control-Expose-Headers', '*');
    
    // 记录脱敏后的访问日志
    console.log(`[代理] ${clientIp} -> ${actualUrl.hostname} [状态: ${response.status}]`);
    
    return modifiedResponse;
  } catch (error) {
    console.error(`[代理失败] ${clientIp} -> ${actualUrl.hostname}: ${error.message}`);
    return new Response(`代理请求失败: ${error.message}`, { status: 502 });
  }
}

/**
 * Worker 的主入口函数
 * @param {object} context 包含 request 和 env 等信息的上下文对象
 * @returns {Promise<Response>}
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 当访问根路径时，返回一个引导用户输入目标链接的前端页面
  if (url.pathname === "/") {
    const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CF-Link-Proxy</title><style>body{font-family:sans-serif;margin:2em;background-color:#f8f9fa;color:#212529;} .container{max-width:600px;margin:auto;padding:2em;background-color:#fff;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.1);} h1{color:#007bff;} input[type=url]{width:calc(100% - 22px);padding:10px;margin-bottom:1em;border:1px solid #ced4da;border-radius:4px;} button{padding:10px 15px;background-color:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;} button:hover{background-color:#0056b3;}</style></head><body><div class="container"><h1>URL 代理服务</h1><p>请输入目标链接（仅允许白名单域名）:</p><input type="url" id="targetUrlInput" placeholder="https://example.com" required><button onclick="navigateToProxy()">访问</button></div><script>
      function navigateToProxy() {
        const input = document.getElementById("targetUrlInput");
        const url = input.value.trim();
        if (!url) return alert("请输入链接！");
        const target = url.startsWith("http") ? url : "https://" + url;
        window.location.href = "/" + encodeURIComponent(target);
      }
      document.getElementById("targetUrlInput").addEventListener("keypress", e => {
        if (e.key === "Enter") navigateToProxy();
      });
    </script></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 其他所有路径都视为代理请求
  return await processProxyRequest(context.request, context);
}
