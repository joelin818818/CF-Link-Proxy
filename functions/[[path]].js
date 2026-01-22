/**
 * CF-Link-Proxy Main Handler
 * File: functions/[[path]].js
 * 
 * 命名说明：
 * - [[path]] 是 Cloudflare Pages 的通配符路由约定
 * - 匹配所有路径请求（包括根路径 /）
 * - 实现单文件部署的代理下载服务
 * 
 * 主要功能：
 * 1. 首页 UI 渲染（路径为 / 时）
 * 2. 代理请求处理（路径包含目标 URL 时）
 * 3. 主题切换支持（Light/Dark Mode）
 * 4. 二维码生成
 * 5. 自定义请求头处理
 */

// --- 核心功能函数 ---

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

  // --- 首页 UI ---
  if (url.pathname === "/") {
    const cookieHeader = incomingRequest.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
    const theme = cookies.theme === 'dark' ? 'dark' : 'light';
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN" class="${theme}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CF-Link-Proxy</title>
        <!-- 引入二维码生成库 -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
        <style>
          :root {
            --gradient-1: #3b82f6; --gradient-2: #8b5cf6; --gradient-3: #ec4899; --gradient-4: #f59e0b;
            --text-color: #334155; --card-bg: rgba(255, 255, 255, 0.7);
            --card-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1);
            --input-text: #1e293b; --footer-text: #64748b; --kbd-bg: #e2e8f0; --kbd-text: #475569;
            --button-bg: #3b82f6; --button-hover: #2563eb; --button-text: #ffffff;
            --header-button-bg: rgba(255, 255, 255, 0.5); --header-button-hover: #ffffff;
            --header-button-text: #475569;
            --title-gradient-start: #3b82f6; --title-gradient-end: #6366f1;
            --clear-btn-color: #94a3b8; --clear-btn-hover: #475569;
            --modal-bg: rgba(255, 255, 255, 0.95);
          }
          html.dark {
            --gradient-1: #1e3a8a; --gradient-2: #5b21b6; --gradient-3: #9d174d; --gradient-4: #b45309;
            --text-color: #cbd5e1; --card-bg: rgba(30, 41, 59, 0.5);
            --card-shadow: 0 20px 25px -5px rgba(0,0,0,.2), 0 8px 10px -6px rgba(0,0,0,.2);
            --input-text: #f1f5f9; --footer-text: #64748b; --kbd-bg: #334155; --kbd-text: #e2e8f0;
            --button-bg: #3b82f6; --button-hover: #60a5fa;
            --header-button-bg: rgba(30, 41, 59, 0.4); --header-button-hover: #334155;
            --header-button-text: #cbd5e1;
            --clear-btn-color: #64748b; --clear-btn-hover: #e2e8f0;
            --modal-bg: rgba(30, 41, 59, 0.95);
          }
          *,:before,:after { box-sizing: border-box; }
          body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: var(--text-color);
            background: linear-gradient(-45deg, var(--gradient-1), var(--gradient-2), var(--gradient-3), var(--gradient-4));
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            transition: color .3s ease;
          }
          @keyframes gradientBG {
            0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; }
          }
          .main-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 1rem; }
          .header, .footer { width: 100%; max-width: 80rem; padding: 1.5rem 1rem; z-index: 10;}
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: auto; }
          .content { display: flex; flex-direction: column; align-items: center; justify-content: center; margin: auto 0; text-align: center; width: 100%;}
          .footer { margin-top: auto; text-align: center; font-size: .875rem; color: var(--footer-text); }
          .header-btn {
            display: flex; align-items: center; gap: .5rem; padding: .5rem 1rem; border-radius: 9999px;
            font-size: .875rem; font-weight: 500; text-decoration: none; border: none; background: none;
            background-color: var(--header-button-bg); color: var(--header-button-text);
            box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1);
            transition: all .2s ease; cursor: pointer;
            -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
          }
          .header-btn:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1); }
          .title { 
            font-size: clamp(2.8rem, 8vw, 4.5rem); font-weight: 900; margin-bottom: 2.5rem; color: #fff;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            opacity: 0; transform: translateY(-20px); animation: fadeInDown .5s .1s ease-out forwards;
          }
          .form-container { 
            width: 100%; max-width: 48rem; opacity: 0; transform: translateY(-20px);
            animation: fadeInDown .5s .2s ease-out forwards;
            background-color: var(--card-bg); border-radius: 9999px; 
            box-shadow: var(--card-shadow); display: flex; overflow: hidden;
            -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
            align-items: center;
          }
          #url-input { flex: 1 1 0%; border: none; outline: none; background: transparent; font-size: 1rem; padding: 1rem 1.5rem; color: var(--input-text); min-width: 0; }
          #url-input::placeholder { color: #9ca3af; }
          
          .icon-btn {
            background: none; border: none; cursor: pointer; padding: 0 0.75rem;
            color: var(--clear-btn-color); display: none; align-items: center; justify-content: center;
            transition: color .2s ease; flex-shrink: 0;
          }
          .icon-btn:hover { color: var(--clear-btn-hover); }
          
          #access-button {
            border: none; cursor: pointer; padding: 1rem 1.5rem; color: var(--button-text);
            background-color: var(--button-bg); font-weight: 500; transition: background-color .2s ease;
            display: flex; align-items: center; gap: .5rem; flex-shrink: 0;
          }
          #access-button:hover:not(:disabled) { background-color: var(--button-hover); }
          .icon { width: 1.2rem; height: 1.2rem; display: inline-block; fill: currentColor; vertical-align: middle; }
          
          /* 二维码弹窗样式 */
          #qr-modal {
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: none;
            align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px);
          }
          .modal-content {
            background: var(--modal-bg); padding: 2rem; border-radius: 1.5rem;
            text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            max-width: 90vw; max-height: 90vh; animation: scaleIn 0.3s ease-out;
            overflow: auto;
          }
          @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          #qr-canvas { background: white; padding: 10px; border-radius: 8px; margin-bottom: 1rem; max-width: 100%; height: auto !important; display: block;}
          .modal-close {
             margin-top: 1rem; padding: 0.5rem 1.5rem; border: none; border-radius: 999px;
             background: var(--button-bg); color: white; cursor: pointer; font-weight: 500;
          }
          .qr-tip { font-size: 0.875rem; margin-top: 0.5rem; color: var(--footer-text); }

          .sun-icon, .moon-icon, #button-spinner { display: none; }
          html.dark .sun-icon { display: inline-block; } html.light .moon-icon { display: inline-block; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spinner-icon { animation: spin 1s linear infinite; }
          kbd { 
            background-color: var(--kbd-bg); color: var(--kbd-text); border-radius: .25rem;
            padding: .25rem .5rem; font-size: .75rem; margin: 0 .25rem; display: inline-block;
          }
          @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    </head>
    <body>
      <div class="main-container">
        <header class="header">
          <a href="https://github.com/joelin818818/CF-Link-Proxy" target="_blank" rel="noopener noreferrer" class="header-btn">
            <svg class="icon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.466-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z"/></svg>
            <span>GitHub</span>
          </a>
          <button id="theme-toggle" class="header-btn" aria-label="切换主题">
            <svg class="icon sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 3zM7.06 7.06a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM3 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 12zm3.94 4.94a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM12 18a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 18zm4.94-3.94a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM21 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM15.88 7.06a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/></svg>
            <svg class="icon moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-3.833 2.067-7.17 5.168-8.972a.75.75 0 01.818.162z" clip-rule="evenodd" /></svg>
            <span id="theme-text">Dark Mode</span>
          </button>
        </header>

        <main class="content">
          <h1 class="title">CF-Link-Proxy</h1>
          <div class="form-container">
            <input id="url-input" type="url" placeholder="https://example.com" autocomplete="off">
            
            <!-- 生成二维码按钮 -->
            <button id="qr-btn" class="icon-btn" title="生成访问二维码">
              <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm0-4h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2zM17 17h2v2h-2v-2zm-4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2z"/>
              </svg>
            </button>

            <!-- 重置按钮 -->
            <button id="clear-btn" class="icon-btn" title="清除并重置">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
            </button>

            <button id="access-button">
              <span id="button-text">访问</span>
              <svg id="button-arrow" class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" /></svg>
              <svg id="button-spinner" class="icon spinner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </button>
          </div>
        </main>

        <!-- 二维码遮罩层 -->
        <div id="qr-modal">
          <div class="modal-content">
            <h3 style="margin-top:0">手机扫码访问</h3>
            <canvas id="qr-canvas"></canvas>
            <div id="qr-url-display" style="word-break: break-all; font-size: 11px; opacity: 0.7; max-width: 400px; margin: 0 auto; line-height: 1.4;"></div>
            <p class="qr-tip">使用手机相机或浏览器扫描此码</p>
            <button class="modal-close" onclick="document.getElementById('qr-modal').style.display='none'">关闭</button>
          </div>
        </div>

        <footer class="footer">
          <p>通过 CF 网络中继请求 · <kbd>/</kbd> 键快速聚焦搜索框</p>
          <p style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.6;">v2.0</p>
        </footer>
      </div>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const urlInput = document.getElementById('url-input');
          const clearBtn = document.getElementById('clear-btn');
          const qrBtn = document.getElementById('qr-btn');
          const accessButton = document.getElementById('access-button');
          const buttonText = document.getElementById('button-text');
          const buttonArrow = document.getElementById('button-arrow');
          const buttonSpinner = document.getElementById('button-spinner');
          const themeToggle = document.getElementById('theme-toggle');
          const themeText = document.getElementById('theme-text');
          const qrModal = document.getElementById('qr-modal');
          const qrCanvas = document.getElementById('qr-canvas');
          const qrUrlDisplay = document.getElementById('qr-url-display');
          const html = document.documentElement;
          let isLoading = false;

          const resetUI = () => {
            isLoading = false;
            accessButton.disabled = false;
            buttonText.textContent = '访问';
            buttonArrow.style.display = 'inline-block';
            buttonSpinner.style.display = 'none';
          };

          const getProcessedUrl = () => {
            let targetUrl = urlInput.value.trim();
            if (!targetUrl) return null;
            if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
            try { 
                new URL(targetUrl); 
                return window.location.origin + '/' + targetUrl;
            } catch (e) { 
                return null; 
            }
          };

          const handleAccess = () => {
            if (isLoading) return;
            const fullUrl = getProcessedUrl();
            if (!fullUrl) return alert('请输入有效的链接!');
            
            isLoading = true;
            accessButton.disabled = true;
            buttonText.textContent = '处理中...';
            buttonArrow.style.display = 'none';
            buttonSpinner.style.display = 'inline-block';
            
            window.open(fullUrl, '_blank', 'noopener,noreferrer');

            setTimeout(resetUI, 2500);
          };

          // 二维码生成逻辑
          qrBtn.addEventListener('click', () => {
            const fullUrl = getProcessedUrl();
            if (!fullUrl) return alert('请输入链接以生成二维码!');
            
            // 生成二维码（优化长链接识别）
            // level: 'L' - 低容错率减少二维码复杂度
            // size: 400 - 增大尺寸提高识别率
            new QRious({
              element: qrCanvas,
              value: fullUrl,
              size: 400,
              level: 'L',
              padding: 20
            });
            
            qrUrlDisplay.textContent = fullUrl;
            qrModal.style.display = 'flex';
          });

          // 输入控制
          const handleInput = () => {
            const hasValue = !!urlInput.value.trim();
            clearBtn.style.display = hasValue ? 'flex' : 'none';
            qrBtn.style.display = hasValue ? 'flex' : 'none';
          };

          clearBtn.addEventListener('click', () => {
            urlInput.value = '';
            handleInput();
            urlInput.focus();
            resetUI();
          });

          // 点击遮罩关闭弹窗
          qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) qrModal.style.display = 'none';
          });
          
          const applyTheme = (theme, isInitial) => {
            html.className = theme;
            themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
            if (!isInitial) {
              localStorage.setItem('theme', theme);
              document.cookie = "theme=" + theme + "; path=/; max-age=31536000";
            }
          };

          themeToggle.addEventListener('click', () => {
            const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(newTheme, false);
          });
          
          accessButton.addEventListener('click', handleAccess);
          urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleAccess(); });
          urlInput.addEventListener('input', handleInput);
          
          window.addEventListener('pageshow', (e) => { if (e.persisted) resetUI(); });

          window.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== urlInput) {
              e.preventDefault();
              urlInput.focus();
            }
          });
          
          applyTheme(html.classList.contains('dark') ? 'dark' : 'light', true);
          handleInput();
        });
      </script>
    </body>
    </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // --- 代理请求逻辑 (保持不变) ---
  let actualUrlStr = url.pathname.substring(1) + url.search + url.hash;
  
  try {
    actualUrlStr = decodeURIComponent(actualUrlStr);
  } catch(e) { }

  let actualUrl;
  try {
    actualUrl = new URL(actualUrlStr);
  } catch (e1) {
    if (actualUrlStr.includes('.') && !actualUrlStr.includes('://') && !actualUrlStr.startsWith('/')) {
      try {
        actualUrl = new URL('https://' + actualUrlStr);
      } catch (e2) {
        return new Response('无效的目标URL (1)', { status: 400 });
      }
    } else {
      return new Response('无效的目标URL (2)', { status: 400 });
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
    modifiedResponse.headers.set('Access-control-expose-headers', '*');

    if (incomingRequest.method === 'OPTIONS') {
      return new Response(null, { headers: modifiedResponse.headers });
    }
    
    return modifiedResponse;

  } catch (error) {
    return new Response("代理请求失败: " + error.message, { status: 502 });
  }
}

export async function onRequest(context) {
  return await processProxyRequest(context.request);
}
