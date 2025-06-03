addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const specialCases = {
  "*": {
    "Origin": "DELETE",
    "Referer": "DELETE"
  }
}

function handleSpecialCases(request) {
  const url = new URL(request.url);
  const rules = specialCases[url.hostname] || specialCases["*"] || {};

  for (const [key, value] of Object.entries(rules)) {
    switch (value) {
      case "KEEP":
        break;
      case "DELETE":
        request.headers.delete(key);
        break;
      default:
        request.headers.set(key, value);
        break;
    }
  }
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>链接代理服务</title>
        <style>
            :root {
                --bg-color-light: #f4f7f6;
                --text-color-light: #333;
                --container-bg-light: white;
                --container-shadow-light: 0 4px 15px rgba(0, 0, 0, 0.1);
                --header-color-light: #007bff;
                --input-border-light: #ccc;
                --input-bg-light: white;
                --input-text-light: #333;
                --button-bg-light: #007bff;
                --button-text-light: white;
                --button-hover-bg-light: #0056b3;
                --footer-text-light: #777;
                --switch-bg-light: #ccc;
                --switch-slider-light: white;
                --switch-checked-bg-light: #007bff;

                --bg-color-dark: #2c3e50;
                --text-color-dark: #ecf0f1;
                --container-bg-dark: #34495e;
                --container-shadow-dark: 0 4px 20px rgba(0, 0, 0, 0.25);
                --header-color-dark: #3498db;
                --input-border-dark: #566573;
                --input-bg-dark: #2c3e50;
                --input-text-dark: #ecf0f1;
                --button-bg-dark: #3498db;
                --button-text-dark: white;
                --button-hover-bg-dark: #2980b9;
                --footer-text-dark: #bdc3c7;
                --switch-bg-dark: #566573;
                --switch-slider-dark: #ecf0f1;
                --switch-checked-bg-dark: #3498db;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 90vh;
                margin: 0;
                background-color: var(--bg-color-light);
                color: var(--text-color-light);
                transition: background-color 0.3s, color 0.3s;
            }
            body.dark-mode {
                background-color: var(--bg-color-dark);
                color: var(--text-color-dark);
            }

            .container {
                background-color: var(--container-bg-light);
                padding: 30px 40px;
                border-radius: 8px;
                box-shadow: var(--container-shadow-light);
                text-align: center;
                width: 90%;
                max-width: 500px;
                transition: background-color 0.3s, box-shadow 0.3s;
            }
            body.dark-mode .container {
                background-color: var(--container-bg-dark);
                box-shadow: var(--container-shadow-dark);
            }

            h1 {
                color: var(--header-color-light);
                margin-bottom: 15px;
                transition: color 0.3s;
            }
            body.dark-mode h1 {
                color: var(--header-color-dark);
            }

            p {
                margin-bottom: 25px;
                line-height: 1.6;
            }

            input[type="url"] {
                width: calc(100% - 22px);
                padding: 12px;
                margin-bottom: 20px;
                border: 1px solid var(--input-border-light);
                background-color: var(--input-bg-light);
                color: var(--input-text-light);
                border-radius: 4px;
                font-size: 16px;
                box-sizing: border-box;
                transition: border-color 0.3s, background-color 0.3s, color 0.3s;
            }
            body.dark-mode input[type="url"] {
                border-color: var(--input-border-dark);
                background-color: var(--input-bg-dark);
                color: var(--input-text-dark);
            }
             input[type="url"]::placeholder {
                color: #999;
            }
            body.dark-mode input[type="url"]::placeholder {
                color: #777;
            }


            button {
                background-color: var(--button-bg-light);
                color: var(--button-text-light);
                border: none;
                padding: 12px 25px;
                font-size: 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            button:hover {
                background-color: var(--button-hover-bg-light);
            }
            body.dark-mode button {
                background-color: var(--button-bg-dark);
                color: var(--button-text-dark);
            }
            body.dark-mode button:hover {
                background-color: var(--button-hover-bg-dark);
            }

            .footer {
                margin-top: 30px;
                font-size: 0.9em;
                color: var(--footer-text-light);
                transition: color 0.3s;
            }
            body.dark-mode .footer {
                color: var(--footer-text-dark);
            }

            .theme-switch-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: 20px;
                margin-bottom: 10px;
            }
            .theme-switch {
                display: inline-block;
                height: 26px;
                position: relative;
                width: 50px;
                margin-right: 10px;
            }
            .theme-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--switch-bg-light);
                transition: .4s;
                border-radius: 26px;
            }
            body.dark-mode .slider {
                background-color: var(--switch-bg-dark);
            }
            .slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: var(--switch-slider-light);
                transition: .4s;
                border-radius: 50%;
            }
            body.dark-mode .slider:before {
                background-color: var(--switch-slider-dark);
            }
            input:checked + .slider {
                background-color: var(--switch-checked-bg-light);
            }
            body.dark-mode input:checked + .slider {
                background-color: var(--switch-checked-bg-dark);
            }
            input:checked + .slider:before {
                transform: translateX(24px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>链接代理服务</h1>
            <p>请输入您想要通过代理访问的完整链接 (例如: https://example.com)，然后点击“访问”按钮。</p>
            <div class="theme-switch-wrapper">
                <label class="theme-switch" for="themeToggleCheckbox" aria-label="切换夜间模式">
                    <input type="checkbox" id="themeToggleCheckbox" />
                    <span class="slider round"></span>
                </label>
                <span>夜间模式</span>
            </div>
            <input type="url" id="targetUrlInput" placeholder="例如: www.google.com 或 https://www.google.com" required>
            <button onclick="navigateToProxy()">访问</button>
        </div>
        <div class="footer">
            <p>此服务将请求转发到您指定的链接。</p>
        </div>

        <script>
            const themeToggle = document.getElementById('themeToggleCheckbox');
            const body = document.body;
            const targetUrlInput = document.getElementById('targetUrlInput');

            function applyTheme(theme) {
                if (theme === 'dark') {
                    body.classList.add('dark-mode');
                    themeToggle.checked = true;
                } else {
                    body.classList.remove('dark-mode');
                    themeToggle.checked = false;
                }
            }

            function isNightTime(nightHour = 18, morningHour = 6) {
                const currentHour = new Date().getHours();
                return currentHour >= nightHour || currentHour < morningHour;
            }

            function initializeTheme() {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                    applyTheme(savedTheme);
                } else {
                    if (isNightTime()) {
                        applyTheme('dark');
                    } else {
                        applyTheme('light');
                    }
                }
            }

            themeToggle.addEventListener('change', function() {
                const newTheme = this.checked ? 'dark' : 'light';
                applyTheme(newTheme);
                localStorage.setItem('theme', newTheme);
            });
            
            initializeTheme();

            function navigateToProxy() {
                let rawTargetUrl = targetUrlInput.value.trim();

                if (!rawTargetUrl) {
                    alert('请输入一个有效的链接！');
                    targetUrlInput.focus();
                    return;
                }

                let finalUrlToProxy = rawTargetUrl;
                try {
                    // 尝试直接解析，看是否已经是完整合法的URL
                    new URL(rawTargetUrl);
                } catch (e) {
                    // 如果直接解析失败，判断是否是裸域名 (如 example.com/path)
                    // 条件：包含点 . AND 不包含 :// AND 不以 / 开头 (避免误处理 /path/to/resource)
                    if (rawTargetUrl.includes('.') && !rawTargetUrl.includes('://') && !rawTargetUrl.startsWith('/')) {
                        finalUrlToProxy = 'https://' + rawTargetUrl;
                        try {
                            new URL(finalUrlToProxy); // 再次验证添加协议后是否合法
                        } catch (e2) {
                            alert('您输入的链接在尝试添加 "https://" 前缀后仍然无效。请检查链接格式，例如 "www.example.com" 或 "https://www.example.com"。');
                            targetUrlInput.focus();
                            return;
                        }
                    } else {
                        // 如果不是可自动修复的裸域名，则提示错误
                        alert('输入的链接格式似乎不正确。请确保包含协议 (如 https://) 或是一个有效的域名 (如 www.example.com)。');
                        targetUrlInput.focus();
                        return;
                    }
                }
                
                const proxyUrl = window.location.origin + '/' + finalUrlToProxy;
                window.location.href = proxyUrl;
            }

            targetUrlInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    navigateToProxy();
                }
            });
        </script>
    </body>
    </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // --- 服务器端代理逻辑 ---
  const actualUrlStr = url.pathname.substring(1) + url.search + url.hash;
  let actualUrl;

  try {
    // 尝试1: 直接将路径后的字符串作为URL解析
    actualUrl = 新建 URL(actualUrlStr);
  } catch (e1) {
    // 尝试2: 如果直接解析失败，判断是否是裸域名，尝试添加 https://
    // 条件：包含点 . AND 不包含 :// AND 不以 / 开头
    if (actualUrlStr.includes('.') && !actualUrlStr.includes('://') && !actualUrlStr.startsWith('/')) {
      try {
        actualUrl = 新建 URL('https://' + actualUrlStr);
      } catch (e2) {
        // 添加 https:// 后仍然解析失败
        return 新建 Response(`无效的目标URL: "${actualUrlStr}". (尝试添加 "https://" 后仍然无效)`, { 状态: 400 });
      }
    } else {
      // 不是可自动修复的裸域名，原始解析错误有效
      return 新建 Response(`无效的目标URL: "${actualUrlStr}". (不符合自动添加 "https://" 的条件)`, { 状态: 400 });
    }
  }

  // 如果 actualUrl 成功解析
  const modifiedRequest = 新建 Request(actualUrl.toString(), {
    headers: 新建 Headers(request.headers),
    method: request.method,
    内容: request.内容,
    redirect: 'follow'
  });

  handleSpecialCases(modifiedRequest);

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = 新建 Response(response.内容, response);

    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers') || '*');
    modifiedResponse.headers.set('Access-Control-Expose-Headers', '*');

    if (request.method === 'OPTIONS') {
      return 新建 Response(null, { headers: modifiedResponse.headers });
    }

    return modifiedResponse;

  } catch (error) {
    console.error(`Fetch error for ${actualUrl.toString()}:`, error);
    if (error.message.includes('DNS lookup failed') || error.message.includes('ENOTFOUND') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        return 新建 Response(`无法解析目标主机: ${actualUrl.hostname}. 请检查链接是否正确。`, { 状态: 502 });
    }
    if (error.message.includes('invalid URL')) {
        return 新建 Response(`代理内部错误：形成的URL无效 (${actualUrl.toString()}).`, { 状态: 500 });
    }
    return 新建 Response(`代理请求失败: ${error.message}`, { 状态: 502 });
  }
}
