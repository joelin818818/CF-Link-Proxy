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
        requestToModify.headers.delete(key);
        break;
      default:
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
            :root {
                --gradient-color-1: #ee7752;
                --gradient-color-2: #e73c7e;
                --gradient-color-3: #23a6d5;
                --gradient-color-4: #23d5ab;
            }

            body {
                font-family: sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh; /* Changed to 100vh for full page gradient */
                margin: 0;
                color: #333;
                background: linear-gradient(-45deg, var(--gradient-color-1), var(--gradient-color-2), var(--gradient-color-3), var(--gradient-color-4));
                background-size: 400% 400%;
                animation: gradientBG 15s ease infinite;
                transition: color 0.3s ease, background-color 0.3s ease; /* For dark mode text/bg */
            }

            @keyframes gradientBG {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            .container {
                background-color: rgba(255, 255, 255, 0.9); /* Slightly transparent white */
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                text-align: center;
                max-width: 500px;
                width: 90%;
                z-index: 10;
                 transition: background-color 0.3s ease, box-shadow 0.3s ease;
            }
            h1 {
                color: #1877f2;
                margin-bottom: 20px;
                transition: color 0.3s ease;
            }
            input[type="url"] {
                width: calc(100% - 24px);
                padding: 12px;
                margin-bottom: 20px;
                border: 1px solid #ccc;
                border-radius: 6px;
                font-size: 16px;
                transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
            }
            button {
                background-color: #1877f2;
                color: white;
                border: none;
                padding: 12px 20px;
                font-size: 16px;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            button:hover {
                background-color: #166fe5;
            }
            .footer {
                margin-top: 20px;
                font-size: 0.9em;
                color: #606770;
                z-index: 10;
                transition: color 0.3s ease;
            }

            .top-link {
                position: absolute;
                padding: 10px 15px;
                font-size: 0.9em;
                text-decoration: none;
                color: #fff; /* White for better visibility on gradient */
                background-color: rgba(0,0,0,0.3);
                border-radius: 0 0 5px 0;
                z-index: 20;
                transition: background-color 0.2s ease;
            }
            .top-link:hover {
                background-color: rgba(0,0,0,0.5);
            }

            #github-link {
                top: 0;
                left: 0;
                border-radius: 0 0 5px 0; /* Rounded bottom-right corner */
            }

            #dark-mode-toggle {
                top: 0;
                right: 0;
                cursor: pointer;
                user-select: none;
                border-radius: 0 0 0 5px; /* Rounded bottom-left corner */
            }

            /* Dark Mode Styles */
            body.dark-mode {
                color: #f0f2f5;
                /* Gradient will still be primary, but good to have a fallback if needed */
                /* background-color: #1c1c1e; */
            }
            body.dark-mode .container {
                background-color: rgba(40, 40, 40, 0.9); /* Slightly transparent dark */
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
            body.dark-mode h1 {
                color: #58a6ff; /* Lighter blue for dark mode */
            }
            body.dark-mode input[type="url"] {
                background-color: #3a3b3c;
                border-color: #555;
                color: #f0f2f5;
            }
            body.dark-mode button {
                background-color: #58a6ff;
            }
            body.dark-mode button:hover {
                background-color: #4a8ecc;
            }
            body.dark-mode .footer {
                color: #a0a0a0;
            }
            body.dark-mode .top-link {
                color: #e0e0e0;
                background-color: rgba(20,20,20,0.4);
            }
            body.dark-mode .top-link:hover {
                background-color: rgba(0,0,0,0.6);
            }
        </style>
    </head>
    <body>
        <a href="https://github.com/joelin818818/CF-Link-Proxy" target="_blank" rel="noopener noreferrer" id="github-link" class="top-link">GitHub</a>
        <div id="dark-mode-toggle" class="top-link">🌙 Dark Mode</div>

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
                if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && targetUrl.includes('.')) {
                    targetUrl = 'https://' + targetUrl;
                }
                try {
                    new URL(targetUrl);
                } catch (e) {
                    alert('链接格式无效!');
                    return;
                }
                window.location.href = '/' + targetUrl;
            }

            document.getElementById('targetUrlInput').addEventListener('keypress', function(event) {
                if (event.key === 'Enter') navigateToProxy();
            });

            // Dark Mode Toggle
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            const body = document.body;

            function setDarkMode(isDark) {
                if (isDark) {
                    body.classList.add('dark-mode');
                    darkModeToggle.textContent = '☀️ Light Mode';
                    localStorage.setItem('darkMode', 'enabled');
                } else {
                    body.classList.remove('dark-mode');
                    darkModeToggle.textContent = '🌙 Dark Mode';
                    localStorage.setItem('darkMode', 'disabled');
                }
            }

            darkModeToggle.addEventListener('click', () => {
                setDarkMode(!body.classList.contains('dark-mode'));
            });

            // Load saved dark mode preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                setDarkMode(true);
            } else {
                setDarkMode(false); // Explicitly set to light if not enabled or not set
            }

            // Random Gradient Colors
            function getRandomHexColor() {
                let color = '#';
                for (let i = 0; i < 6; i++) {
                    color += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
                }
                return color;
            }

            function setRandomGradientColors() {
                const root = document.documentElement;
                root.style.setProperty('--gradient-color-1', getRandomHexColor());
                root.style.setProperty('--gradient-color-2', getRandomHexColor());
                root.style.setProperty('--gradient-color-3', getRandomHexColor());
                root.style.setProperty('--gradient-color-4', getRandomHexColor());
            }

            // Set random colors on initial load
            setRandomGradientColors();

        </script>
    </body>
    </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // ... (rest of the proxy logic remains the same)

  const actualUrlStr = url.pathname.substring(1) + url.search + url.hash;

  let actualUrl;
  try {
    actualUrl = new URL(actualUrlStr);
  } catch (e1) {
    if (actualUrlStr.includes('.') && !actualUrlStr.includes('://') && !actualUrlStr.startsWith('/')) {
      try {
        actualUrl = new URL('https://' + actualUrlStr);
      } catch (e2) {
        return new Response(`无效的目标URL (1): "${actualUrlStr}"`, { status: 400 });
      }
    } else {
      return new Response(`无效的目标URL (2): "${actualUrlStr}"`, { status: 400 });
    }
  }

  const modifiedRequestHeaders = new Headers(incomingRequest.headers);
  const modifiedRequest = new Request(actualUrl.toString(), {
    headers: modifiedRequestHeaders,
    method: incomingRequest.method,
    body: incomingRequest.body,
    redirect: 'follow'
  });

  handleSpecialCases(modifiedRequest, actualUrl);

  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.body, response);

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
      return new Response(`无法解析目标主机: ${actualUrl.hostname}`, { status: 502 });
    }
    return new Response(`代理请求失败: ${error.message}`, { status: 502 });
  }
}

export async function onRequest(context) {
  return await processProxyRequest(context.request);
}
