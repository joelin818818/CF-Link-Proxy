// File: functions/[[path]].js

// --- 配置区 ---
// 允许代理的域名白名单（通过环境变量 ALLOWED_DOMAINS 配置，逗号分隔）
// 支持通配符，例如: *.example.com,google.com
const ALLOWED_DOMAINS = context.env.ALLOWED_DOMAINS?.split(',') || [];
// --- 配置区结束 ---

/**
 * 为特定目标或所有目标（"*"）修改请求头
 * @param {Request} requestToModify 要修改的请求对象
 * @param {URL} targetUrlForRules 目标URL对象
 */
function handleSpecialCases(requestToModify, targetUrlForRules) {
  // 注意：specialCases 对象需要您根据实际需求在代码中定义
  const specialCases = {}; // 示例: { "example.com": { "user-agent": "MyBot/1.0" } }

  const rules = specialCases[targetUrlForRules.hostname] || specialCases["*"] || {};
  for (const [key, value] of Object.entries(rules)) {
    switch (value) {
      case "KEEP":
        break;
      case "DELETE":
        requestToModify.headers.delete(key);
        break;
      default:
        requestToModify.headers.set(key, value);
    }
  }
}

/**
 * 获取客户端真实IP地址
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
    'Cookie', 'Referer', 'Origin',
    'X-Forwarded-For', 'X-Forwarded-Proto', 'X-Real-IP'
  ];
  sensitiveHeaders.forEach(header => headers.delete(header));
  return headers;
}

/**
 * [已更新] 验证目标URL是否在允许的域名白名单内（支持通配符）
 * @param {string} url 要验证的目标URL字符串
 * @returns {boolean} 如果允许则返回 true，否则返回 false
 */
function validateTargetUrl(url) {
  if (!ALLOWED_DOMAINS.length) return true;
  
  try {
    const targetUrl = new URL(url);
    const hostname = targetUrl.hostname;

    return ALLOWED_DOMAINS.some(domain => {
      if (domain.startsWith('*.')) {
        // 如果是通配符域名，检查 hostname 是否以该域名（去掉*）结尾
        return hostname.endsWith(domain.substring(1));
      } else {
        // 否则，进行精确匹配
        return hostname === domain;
      }
    });
  } catch {
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

  const modifiedRequest = new Request(actualUrl.toString(), incomingRequest);
  
  sanitizeHeaders(modifiedRequest.headers);
  modifiedRequest.headers.delete('Cookie');
  handleSpecialCases(modifiedRequest, actualUrl);

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.body, response);
    
    modifiedResponse.headers.set('Access-Control-Allow-Origin', context.env.TRUSTED_ORIGIN || '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', incomingRequest.headers.get('Access-Control-Request-Headers') || '*');
    modifiedResponse.headers.set('Access-Control-Expose-Headers', '*');
    
    console.log(`[代理] ${clientIp} -> ${actualUrl.hostname} [状态: ${response.status}]`);
    
    return modifiedResponse;
  } catch (error) {
    console.error(`[代理失败] ${clientIp} -> ${actualUrl.hostname}: ${error.message}`);
    return new Response(`代理请求失败: ${error.message}`, { status: 502 });
  }
}

/**
 * [已更新] Worker 的主入口函数，增加了健康检查和状态端点
 * @param {object} context 包含 request 和 env 等信息的上下文对象
 * @returns {Promise<Response>}
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 路由分发
  switch (url.pathname) {
    case "/":
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

    // 新增：健康检查端点
    case "/__health":
      return new Response("OK", { status: 200 });

    // 新增：状态信息端点
    case "/__status":
      const info = {
        status: "running",
        timestamp: new Date().toISOString(),
        config: {
          allowedDomains: ALLOWED_DOMAINS
        }
      };
      return new Response(JSON.stringify(info, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });

    // 默认处理代理请求
    default:
      return await processProxyRequest(context.request, context);
  }
}
