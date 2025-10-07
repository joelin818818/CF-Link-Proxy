// File: functions/[[path]].js

// --- 后端代理逻辑 (这部分保持不变) ---

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
      case "KEEP": break;
      case "DELETE": requestToModify.headers.delete(key); break;
      default: requestToModify.headers.set(key, value); break;
    }
  }
}

async function processProxyRequest(incomingRequest) {
  const url = new URL(incomingRequest.url);
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

  const modifiedRequest = new Request(actualUrl.toString(), {
    headers: new Headers(incomingRequest.headers),
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

// --- Worker 入口函数 ---

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 当访问根路径时，返回新的 UI 界面
  if (url.pathname === "/") {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN" class="light">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CF-Link-Proxy</title>
        
        <!-- 关键修复：使用稳定、公开的 CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        
        <script>
          // 配置 Tailwind 以支持暗黑模式
          tailwind.config = { darkMode: 'class' }
        </script>

        <style>
          /* 添加自定义字体和入场动画 */
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; }
          
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.5s ease-out forwards;
          }

          /* 防止因CDN加载延迟导致的样式闪烁 (FOUC) */
          body { visibility: hidden; }
        </style>
    </head>
    <body class="bg-gray-50 dark:bg-gray-900">
      <div class="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:text-white">
        
        <div class="w-full max-w-6xl flex justify-between items-center mb-auto pt-6">
          <a href="https://github.com/joelin818818/CF-Link-Proxy" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg bg-white/80 text-gray-700 hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 backdrop-blur-sm">
            <i class="fa-brands fa-github"></i>
            <span>GitHub</span>
          </a>
          
          <button id="theme-toggle" class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg bg-white/80 text-gray-700 hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 backdrop-blur-sm" aria-label="切换主题">
            <i id="theme-icon" class="fa-solid fa-moon"></i>
            <span id="theme-text">Dark Mode</span>
          </button>
        </div>
        
        <div class="w-full max-w-3xl flex flex-col items-center justify-center my-12">
          <h1 class="animate-fade-in-down text-[clamp(2.5rem,8vw,4rem)] font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
            CF-Link-Proxy
          </h1>
          
          <div id="input-container" class="w-full max-w-2xl relative transition-transform duration-300">
            <div class="flex items-center rounded-full overflow-hidden shadow-lg dark:shadow-gray-700/30 shadow-gray-200/80">
              <input id="url-input" type="text" value="https://example.com" class="flex-1 px-6 py-4 text-base bg-white/90 dark:bg-gray-800/90 border-0 focus:ring-0 focus:outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm" placeholder="输入目标链接，按 Ctrl+Enter 访问...">
              <button id="access-button" class="px-6 py-4 font-medium transition-all duration-300 whitespace-nowrap bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                <div id="button-content" class="flex items-center gap-2">
                  <i class="fa-solid fa-arrow-right"></i>
                  <span>访问</span>
                </div>
              </button>
            </div>
            <div id="focus-highlight" class="absolute -top-px -left-px w-1/3 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-tl-full opacity-0 transition-opacity duration-300"></div>
          </div>
        </div>
        
        <div class="w-full max-w-6xl mt-auto pb-6 text-center text-sm text-gray-600 dark:text-gray-500">
          <p>通过 CF 网络中继请求 · <kbd class="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs mx-1">/</kbd> 键快速聚焦搜索框</p>
        </div>
      </div>

      <script>
        // 使用 DOMContentLoaded 确保在操作 DOM 前 HTML 已加载完毕
        document.addEventListener('DOMContentLoaded', () => {
          const urlInput = document.getElementById('url-input');
          const accessButton = document.getElementById('access-button');
          const buttonContent = document.getElementById('button-content');
          const themeToggle = document.getElementById('theme-toggle');
          const themeIcon = document.getElementById('theme-icon');
          const themeText = document.getElementById('theme-text');
          const inputContainer = document.getElementById('input-container');
          const focusHighlight = document.getElementById('focus-highlight');
          const html = document.documentElement;

          let isLoading = false;

          const handleAccess = () => {
            if (isLoading) return;
            let targetUrl = urlInput.value.trim();
            if (!targetUrl) return alert('请输入链接!');
            if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

            try { new URL(targetUrl); } 
            catch (e) { return alert('链接格式无效!'); }

            isLoading = true;
            accessButton.disabled = true;
            buttonContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>处理中...</span>';

            setTimeout(() => { window.location.href = '/' + targetUrl; }, 800);
          };

          const applyTheme = (theme) => {
            if (theme === 'dark') {
              html.classList.add('dark');
              themeIcon.className = 'fa-solid fa-sun';
              themeText.textContent = 'Light Mode';
            } else {
              html.classList.remove('dark');
              themeIcon.className = 'fa-solid fa-moon';
              themeText.textContent = 'Dark Mode';
            }
          };

          themeToggle.addEventListener('click', () => {
            const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
          });
          
          urlInput.addEventListener('focus', () => {
            inputContainer.style.transform = 'scale(1.01)';
            focusHighlight.style.opacity = '1';
          });

          urlInput.addEventListener('blur', () => {
            inputContainer.style.transform = 'scale(1)';
            focusHighlight.style.opacity = '0';
          });
          
          accessButton.addEventListener('click', handleAccess);
          
          window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleAccess();
            }
            if (e.key === 'Escape' && document.activeElement === urlInput) {
              urlInput.blur();
            }
            if (e.key === '/' && document.activeElement !== urlInput) {
              e.preventDefault();
              urlInput.focus();
              urlInput.select();
            }
          });
          
          const savedTheme = localStorage.getItem('theme') || 'light';
          applyTheme(savedTheme);
          
          // 在所有设置完成后，显示页面
          document.body.style.visibility = 'visible';
        });
      </script>
    </body>
    </html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  return await processProxyRequest(context.request);
}
