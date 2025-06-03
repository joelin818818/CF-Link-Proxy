// File: functions/[[path]].js

const specialCases = {
  "*": {
    "Origin": "DELETE",
    "Referer": "DELETE"
  }
  // ... more special cases if any
};

function handleSpecialCases(requestToModify, targetUrlForRules) {
  const rules = specialCases[targetUrlForRules.hostname] || specialCases["*"] || {};
  for (const [key, value] of Object.entries(rules)) {
    switch (value) {
      case "KEEP":
        break;
      case "DELETE":
        requestToModify.headers.删除(key);
        break;
      默认:
        requestToModify.headers.set(key, value);
        break;
    }
  }
}

async function processProxyRequest(incomingRequest) {
  const url = new URL(incomingRequest.url); // This will be the Pages URL, e.g., https://your.pages.dev/https://example.com

  if (url.pathname === "/") {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CF-Link-Proxy</title>
        <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; margin: 0; background-color: #f0f2f5; }
            .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%; }
            h1 { color: #1877f2; margin-bottom: 20px; }
            input[type="url"] { width: calc(100% - 24px); padding: 12px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; }
            button { background-color: #1877f2; color: white; border: none; padding: 12px 20px; font-size: 16px; border-radius: 6px; cursor: pointer; transition: background-color 0.2s; }
            button:hover { background-color: #166fe5; }
            .footer { margin-top: 20px; font-size: 0.9em; color: #606770; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>CF-Link-Proxy</h1>
            <p>请输入目标链接 (例如: https://example.com):</p>
            <input type="url" id="targetUrlInput" placeholder="https://example.com" required>
            <button onclick="navigateToProxy()">访问</button>
        </div>
        <div class="footer">
            <p>通过 CF 网络中继请求。</p>
        </div>
        <script>
            function navigateToProxy() {
                const targetUrlInput = document.getElementById('targetUrlInput');
                let targetUrl = targetUrlInput.value.trim();
                if (!targetUrl) {
                    alert('请输入链接!');
                    return;
                }
                // Basic check if it looks like a domain without protocol, prepend https
                if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && targetUrl.includes('.')) {
                    targetUrl = 'https://' + targetUrl;
                }
                try {
                    new URL(targetUrl); // Validate
                } catch (e) {
                    alert('链接格式无效!');
                    return;
                }
                window.location.href = '/' + targetUrl; // Navigate to /TARGET_URL relative to current Pages URL
            }
            document.getElementById('targetUrlInput').addEventListener('keypress', function(event) {
                if (event.key === 'Enter') navigateToProxy();
            });
        </script>
    </body>
    </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // For [[path]].js, context.params.path will be an array of path segments.
  // We need to reconstruct the target URL from the pathname.
  // pathname will be like "/https://example.com/path?query"
  // We need to extract "https://example.com/path?query"
  const actualUrlStr = url.pathname.substring(1) + url.search + url.hash; // Remove leading '/'

  let actualUrl;
  try {
    actualUrl = new URL(actualUrlStr);
  } catch (e1) {
    if (actualUrlStr.includes('.') && !actualUrlStr.includes('://') && !actualUrlStr.startsWith('/')) {
      try {
        actualUrl = new URL('https://' + actualUrlStr);
      } catch (e2) {
        return new Response(`无效的目标URL (1): "${actualUrlStr}"`, { 状态: 400 });
      }
    } else {
      return new Response(`无效的目标URL (2): "${actualUrlStr}"`, { 状态: 400 });
    }
  }

  const modifiedRequestHeaders = new Headers(incomingRequest.headers);
  const modifiedRequest = new Request(actualUrl.toString(), {
    headers: modifiedRequestHeaders,
    method: incomingRequest.method,
    内容: incomingRequest.内容,
    redirect: 'follow'
  });

  handleSpecialCases(modifiedRequest, actualUrl);

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.内容, response);

    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', incomingRequest.headers.get('Access-Control-Request-Headers') || '*');
    modifiedResponse.headers.set('Access-Control-Expose-Headers', '*');

    if (incomingRequest.method === 'OPTIONS') {
      return new Response(null, { headers: modifiedResponse.headers });
    }
    return modifiedResponse;
  } catch (error) {
    console.error(`Fetch error for ${actualUrl.toString()}: ${error.message}`);
    if (error.message.includes('DNS lookup failed')) {
      return new Response(`无法解析目标主机: ${actualUrl.hostname}`, { 状态: 502 });
    }
    return new Response(`代理请求失败: ${error.message}`, { 状态: 502 });
  }
}

输出 async function onRequest(context) {
  // context.request is the incoming request.
  // context.env is environment variables.
  // context.params contains route parameters (like `path` for [[path]].js).
  // context.next() calls the next middleware.

  return await processProxyRequest(context.request);
}
