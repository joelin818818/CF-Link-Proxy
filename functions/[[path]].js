// File: functions/[[path]].js

/**
 * 为特定目标或所有目标（"*"）修改请求头
 * @param {Request} requestToModify 要修改的请求对象
 * @param {URL} targetUrlForRules 目标URL对象
 */
function handleSpecialCases(requestToModify, targetUrlForRules) {
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
 * [修正] 验证目标URL是否在允许的域名白名单内（支持通配符）
 * @param {string} url 要验证的目标URL字符串
 * @param {string[]} allowedDomains 允许的域名列表
 * @returns {boolean} 如果允许则返回 true，否则返回 false
 */
function validateTargetUrl(url, allowedDomains) { // [变化] 接收 allowedDomains 参数
  if (!allowedDomains.length) return true;
  
  try {
    const targetUrl = new URL(url);
    const hostname = targetUrl.hostname;

    return allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        return hostname.endsWith(domain.substring(1));
      } else {
        return hostname === domain;
      }
    });
  } catch {
    return false;
  }
}

/**
 * [修正] 核心代理请求处理函数
 * @param {Request} incomingRequest 客户端发来的原始请求
 * @param {object} context Worker的上下文对象
 * @param {string[]} allowedDomains 允许的域名列表
 * @returns {Promise<Response>} 返回给客户端的响应
 */
async function processProxyRequest(incomingRequest, context, allowedDomains) { // [变化] 接收 allowedDomains 参数
  const url = new URL(incomingRequest.url);
  const clientIp = getClientIp(incomingRequest);

  const actualUrlStr = url.pathname.substring(1) + url.search + url.hash;
  if (!validateTargetUrl(actualUrlStr, allowedDomains)) { // [变化] 传递 allowedDomains
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
 * [修正] Worker 的主入口函数
 * @param {object} context 包含 request 和 env 等信息的上下文对象
 * @returns {Promise<Response>}
 */
export async function onRequest(context) {
  // [修正] 将环境变量的读取和解析移到函数内部
  const ALLOWED_DOMAINS = context.env.ALLOWED_DOMAINS?.split(',') || [];
  
  const url = new URL(context.request.url);
  
  switch (url.pathname) {
    case "/":
      // ... (HTML 内容保持不变)
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

    case "/__health":
      return new Response("OK", { status: 200 });

    case "/__status":
      const info = {
        status: "running",
        timestamp: new Date().toISOString(),
        config: {
          allowedDomains: ALLOWED_DOMAINS // [变化] 使用在这里定义的变量
        }
      };
      return new Response(JSON.stringify(info, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });

    default:
      // [变化] 将解析后的配置传递给代理处理函数
      return await processProxyRequest(context.request, context, ALLOWED_DOMAINS);
  }
}
