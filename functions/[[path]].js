
// File: functions/[[path]].js

// --- 配置区 ---
// 密码将从Cloudflare的环境变量中读取，不再硬编码在此处
const AUTH_COOKIE_NAME = 'cf-proxy-auth';
// --- 配置区结束 ---

const specialCases = {
  "*": {
    "Origin": "DELETE",
    "Referer": "DELETE"
  }
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
      default:
        requestToModify.headers.set(key, value);
        break;
    }
  }
}

function getCookie(request, 名字) {
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.分屏(';');
    for (let cookie of cookies) {
      const parts = cookie.trim().分屏('=');
      if (parts[0] === 名字) {
        return parts[1] || null;
      }
    }
  }
  return null;
}

function getPasswordPromptResponse(hasError = false) {
  const errorHtml = hasError ? `<p style="color: red;">密码错误，请重试！</p>` : '';
  const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>需要身份验证</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background-color:#f0f2f5}.container{background:white;padding:30px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);text-align:center}input{padding:10px;margin-right:10px;border:1px solid #ccc;border-radius:4px}button{padding:10px 15px;border:none;background-color:#1877f2;color:white;border-radius:4px;cursor:pointer}button:hover{background-color:#166fe5}</style></head><body><div class="container"><h2>访问受限</h2><p>请输入密码以继续访问。</p>${errorHtml}<form method="POST" style="margin-top:20px;"><input type="password" name="password" required autofocus><button type="submit">验证</button></form></div></body></html>`;
  return 新建 Response(html, { 状态: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function processProxyRequest(incomingRequest, context) {
  const url = 新建 URL(incomingRequest.url);
  const 密码 = context.env.密码;

  // 检查管理员是否设置了密码
  if (!密码) {
    return 新建 Response('错误：管理员尚未在Cloudflare后台设置PASSWORD环境变量。', { 状态: 500 });
  }

  // 1. 处理首页 (/)
  if (url.pathname === "/") {
    const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CF-Link-Proxy</title><style>:root{--gradient-color-1:#ee7752;--gradient-color-2:#e73c7e;--gradient-color-3:#23a6d5;--gradient-color-4:#23d5ab}body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#333;background:linear-gradient(-45deg,var(--gradient-color-1),var(--gradient-color-2),var(--gradient-color-3),var(--gradient-color-4));background-size:400% 400%;animation:gradientBG 15s ease infinite;transition:color .3s ease,background-color .3s ease}@keyframes gradientBG{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}.container{background-color:rgba(255,255,255,.9);padding:30px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);text-align:center;max-width:500px;width:90%;z-index:10;transition:background-color .3s ease,box-shadow .3s ease}h1{color:#1877f2;margin-bottom:20px;transition:color .3s ease}input[type=url]{width:calc(100% - 24px);padding:12px;margin-bottom:20px;border:1px solid #ccc;border-radius:6px;font-size:16px;transition:background-color .3s ease,border-color .3s ease,color .3s ease}.button-group{display:flex;justify-content:center;gap:10px}button{background-color:#1877f2;color:#fff;border:none;padding:12px 20px;font-size:16px;border-radius:6px;cursor:pointer;transition:background-color .2s}button:hover{background-color:#166fe5}button.secondary{background-color:#6c757d}button.secondary:hover{background-color:#5a6268}.footer{margin-top:20px;font-size:.9em;color:#606770;z-index:10;transition:color .3s ease}.top-link{position:absolute;padding:10px 15px;font-size:.9em;text-decoration:none;color:#fff;background-color:rgba(0,0,0,.3);border-radius:0 0 5px 0;z-index:20;transition:background-color .2s ease}.top-link:hover{background-color:rgba(0,0,0,.5)}#github-link{top:0;left:0;border-radius:0 0 5px 0}#dark-mode-toggle{top:0;right:0;cursor:pointer;-webkit-user-select:none;user-select:none;border-radius:0 0 0 5px}body.dark-mode{color:#f0f2f5}body.dark-mode .container{background-color:rgba(40,40,40,.9);box-shadow:0 4px 12px rgba(0,0,0,.5)}body.dark-mode h1{color:#58a6ff}body.dark-mode input[type=url]{background-color:#3a3b3c;border-color:#555;color:#f0f2f5}body.dark-mode button{background-color:#58a6ff}body.dark-mode button:hover{background-color:#4a8ecc}body.dark-mode button.secondary{background-color:#8b949e}body.dark-mode button.secondary:hover{background-color:#6e7681}body.dark-mode .footer{color:#a0a0a0}body.dark-mode .top-link{color:#e0e0e0;background-color:rgba(20,20,20,.4)}body.dark-mode .top-link:hover{background-color:rgba(0,0,0,.6)}</style></head><body><a href="https://github.com/joelin818818/CF-Link-Proxy" target="_blank" rel="noopener noreferrer" id="github-link" class="top-link">GitHub</a><div id="dark-mode-toggle" class="top-link">🌙 暗黑模式</div><div class="container"><h1>CF-Link-Proxy</h1><p>请输入目标链接 (例如: https://example.com):</p><input type="url" id="targetUrlInput" placeholder="https://example.com" required><div class="button-group"><button onclick="navigateToProxy()">访问</button><button onclick="copyProxyLink(this)" class="secondary">复制链接</button></div></div><div class="footer"><p>通过 CF 网络中继请求。</p></div><script>function getTargetUrl(){let e=document.getElementById("targetUrlInput").value.trim();return e?(!e.startsWith("http://")&&!e.startsWith("https://")&&e.includes(".")&&(e="https://"+e),new URL(e),e):(alert("请输入链接!"),null)}function navigateToProxy(){const e=getTargetUrl();e&&(window.location.href="/"+e)}function copyProxyLink(e){const t=getTargetUrl();t&&navigator.clipboard.writeText(window.location.origin+"/"+t).then(()=>{const t=e.textContent;e.textContent="已复制!",setTimeout(()=>{e.textContent=t},2e3)}).catch(t=>{console.error("复制失败: ",t),alert("复制失败!")})}document.getElementById("targetUrlInput").addEventListener("keypress",function(e){"Enter"===e.key&&navigateToProxy()});const darkModeToggle=document.getElementById("dark-mode-toggle"),body=document.body;function setDarkMode(e){e?(body.classList.add("dark-mode"),darkModeToggle.textContent="☀️ 日间模式",localStorage.setItem("darkMode","enabled")):(body.classList.remove("dark-mode"),darkModeToggle.textContent="🌙 暗黑模式",localStorage.setItem("darkMode","disabled"))}darkModeToggle.addEventListener("click",()=>setDarkMode(!body.classList.contains("dark-mode"))),"enabled"===localStorage.getItem("darkMode")?setDarkMode(!0):setDarkMode(!1);function getRandomHexColor(){let e="#";for(let t=0;t<6;t++)e+="0123456789ABCDEF"[Math.floor(16*Math.random())];return e}function setRandomGradientColors(){const e=document.documentElement;e.style.setProperty("--gradient-color-1",getRandomHexColor()),e.style.setProperty("--gradient-color-2",getRandomHexColor()),e.style.setProperty("--gradient-color-3",getRandomHexColor()),e.style.setProperty("--gradient-color-4",getRandomHexColor())}setRandomGradientColors();</script></body></html>`;
    return 新建 Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 2. 身份验证逻辑
  const authToken = await crypto.subtle.digest('SHA-256', 新建 TextEncoder().encode(密码))
      .then(hash => Array.from(新建 Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  const cookieToken = getCookie(incomingRequest, AUTH_COOKIE_NAME);

  if (cookieToken !== authToken) {
    if (incomingRequest.method === 'POST') {
      const formData = await incomingRequest.formData();
      if (formData.get('password') === 密码) {
        return 新建 Response('验证成功，正在跳转...', {
          状态: 302,
          headers: {
            'Location': url.pathname,
            'Set-Cookie': `${AUTH_COOKIE_NAME}=${authToken}; Path=/; Max-Age=10800; HttpOnly; SameSite=Strict`,
          },
        });
      } else {
        return getPasswordPromptResponse(true);
      }
    }
    return getPasswordPromptResponse();
  }
  
  // 3. 代理逻辑 (验证通过后执行)
  const actualUrlStr = url.pathname.substring(1) + url.搜索 + url.hash;
  let actualUrl;
  try {
    actualUrl = 新建 URL(actualUrlStr);
  } catch (e) {
    return 新建 Response(`无效的目标URL: "${actualUrlStr}"`, { 状态: 400 });
  }

  const modifiedRequest = 新建 Request(actualUrl.toString(), incomingRequest);
  modifiedRequest.headers.删除('Cookie'); // 避免将验证cookie传给目标服务器

  handleSpecialCases(modifiedRequest, actualUrl);

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = 新建 Response(response.内容, response);
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', incomingRequest.headers.get('Access-Control-Request-Headers') || '*');
    modifiedResponse.headers.set('Access-Control-Expose-Headers', '*');
    
    return modifiedResponse;
  } catch (error) {
    return 新建 Response(`代理请求失败: ${error.message}`, { 状态: 502 });
  }
}

输出 async function onRequest(context) {
  // context包含了环境变量、请求等所有信息
  return await processProxyRequest(context.request, context);
}
