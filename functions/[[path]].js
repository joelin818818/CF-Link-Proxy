// File: functions/[[path]].js

// --- 注入脚本和 Rewriter 定义 ---
const INJECTION_SCRIPT = `<script>(function(){const p='/';const r=(u)=>{if(typeof u==='string'&&(u.startsWith('http://')||u.startsWith('https://'))){return p+u}return u};const f=window.fetch;window.fetch=function(i,n){const u=i instanceof Request?i.url:i;const e=r(u);if(i instanceof Request){i=new Request(e,i)}else{i=e}return f.call(this,i,n)};const o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(t,u,...a){const e=r(u);return o.apply(this,[t,e,...a])};const m=new MutationObserver(s=>{s.forEach(t=>{t.addedNodes.forEach(n=>{if(n.nodeType===1){const e=el=>{const a=['src','href','action','data-src'];a.forEach(t=>{if(el.hasAttribute(t)){el.setAttribute(t,r(el.getAttribute(t)))}});if(el.hasAttribute('srcset')){el.setAttribute('srcset',el.getAttribute('srcset').split(',').map(t=>{const n=t.trim().split(/\s+/);n[0]=r(n[0]);return n.join(' ')}).join(', '))}};if(n.matches('script,link,img,a,source,iframe,form')){e(n)}n.querySelectorAll('script,link,img,a,source,iframe,form').forEach(e)}})})});m.observe(document.documentElement,{childList:!0,subtree:!0})})();</script>`;

class HeadInjector { element(element) { element.prepend(INJECTION_SCRIPT, { html: true }); } }
class AttributeRewriter {
    constructor(prefix) { this.prefix = prefix; }
    element(element) {
        const attrs = ['href', 'src', 'action', 'data-src'];
        attrs.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && (value.startsWith('http:') || value.startsWith('https://'))) {
                element.setAttribute(attr, this.prefix + value);
            }
        });
        const srcset = element.getAttribute('srcset');
        if (srcset) {
            const newSrcset = srcset.split(',').map(part => {
                const item = part.trim().split(/\s+/);
                if (item[0].startsWith('http')) item[0] = this.prefix + item[0];
                return item.join(' ');
            }).join(', ');
            element.setAttribute('srcset', newSrcset);
        }
    }
}

// --- 核心代理逻辑 (基于您提供的稳定版本进行修改) ---
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
        <style>
          :root {
            --bg-color: #ffffff; --text-color: #334155; --card-bg: #ffffff;
            --card-shadow: 0 10px 15px -3px rgba(0,0,0,.05), 0 4px 6px -4px rgba(0,0,0,.05);
            --input-text: #1e293b; --footer-text: #64748b; --kbd-bg: #e2e8f0; --kbd-text: #475569;
            --button-bg: #3b82f6; --button-hover: #2563eb; --button-text: #ffffff;
            --header-button-bg: #f1f5f9; --header-button-hover: #e2e8f0; --header-button-text: #475569;
            --gradient-start: #3b82f6; --gradient-end: #6366f1;
          }
          html.dark {
            --bg-color: #020617; --text-color: #cbd5e1; --card-bg: #1e293b;
            --card-shadow: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1);
            --input-text: #f1f5f9; --footer-text: #64748b; --kbd-bg: #334155; --kbd-text: #e2e8f0;
            --button-bg: #3b82f6; --button-hover: #60a5fa;
            --header-button-bg: #1e293b; --header-button-hover: #334155; --header-button-text: #cbd5e1;
          }
          *,:before,:after { box-sizing: border-box; }
          body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color); color: var(--text-color);
            transition: background-color .3s ease, color .3s ease;
          }
          .main-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 1rem; }
          .header, .footer { width: 100%; max-width: 80rem; padding: 1.5rem 1rem; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: auto; }
          .content { display: flex; flex-direction: column; align-items: center; justify-content: center; margin: auto 0; text-align: center; width: 100%;}
          .footer { margin-top: auto; text-align: center; font-size: .875rem; color: var(--footer-text); }
          .header-btn {
            display: flex; align-items: center; gap: .5rem; padding: .5rem 1rem; border-radius: 9999px;
            font-size: .875rem; font-weight: 500; text-decoration: none; border: none;
            background-color: var(--header-button-bg); color: var(--header-button-text);
            box-shadow: 0 1px 2px 0 rgba(0,0,0,.05); transition: all .2s ease; cursor: pointer;
          }
          .header-btn:hover { background-color: var(--header-button-hover); box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1); }
          .title { 
            font-size: clamp(2.5rem, 8vw, 4rem); font-weight: 900; margin-bottom: 2rem;
            background-image: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
            -webkit-background-clip: text; background-clip: text; color: transparent;
            opacity: 0; transform: translateY(-20px); animation: fadeInDown .5s .1s ease-out forwards;
          }
          .form-container { 
            width: 100%; max-width: 48rem; opacity: 0; transform: translateY(-20px);
            animation: fadeInDown .5s .2s ease-out forwards;
            background-color: var(--card-bg); border-radius: 9999px; 
            box-shadow: var(--card-shadow); display: flex; overflow: hidden;
            transition: transform .2s ease, box-shadow .2s ease;
          }
          #url-input {
            flex: 1 1 0%; border: none; outline: none; background: transparent;
            font-size: 1rem; padding: 1rem 1.5rem; color: var(--input-text);
          }
          #url-input::placeholder { color: #9ca3af; }
          #access-button {
            border: none; cursor: pointer; padding: 1rem 1.5rem; color: var(--button-text);
            background-color: var(--button-bg); font-weight: 500; transition: background-color .2s ease;
            display: flex; align-items: center; gap: .5rem;
          }
          #access-button:hover:not(:disabled) { background-color: var(--button-hover); }
          #access-button:disabled { opacity: .7; cursor: not-allowed; }
          .icon { width: 1em; height: 1em; display: inline-block; fill: currentColor; vertical-align: middle; }
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
            <svg class="icon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z"/></svg>
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
            <input id="url-input" type="url" placeholder="https://example.com">
            <button id="access-button">
              <span id="button-text">访问</span>
              <svg id="button-arrow" class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" /></svg>
              <svg id="button-spinner" class="icon spinner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </button>
          </div>
        </main>
        <footer class="footer">
          <p>通过 CF 网络中继请求 · <kbd>/</kbd> 键快速聚焦搜索框</p>
        </footer>
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const urlInput = document.getElementById('url-input');
          const accessButton = document.getElementById('access-button');
          const buttonText = document.getElementById('button-text');
          const buttonArrow = document.getElementById('button-arrow');
          const buttonSpinner = document.getElementById('button-spinner');
          const themeToggle = document.getElementById('theme-toggle');
          const themeText = document.getElementById('theme-text');
          const html = document.documentElement;
          let isLoading = false;

          const handleAccess = () => {
            if (isLoading) return;
            let targetUrl = urlInput.value.trim();
            if (!targetUrl) return alert('请输入链接!');
            if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

            try { new URL(targetUrl); } 
            catch (e) { alert('链接格式无效!'); return; }

            isLoading = true;
            accessButton.disabled = true;
            buttonText.textContent = '处理中...';
            buttonArrow.style.display = 'none';
            buttonSpinner.style.display = 'inline-block';

            setTimeout(() => { window.location.href = '/' + encodeURIComponent(targetUrl); }, 800);
          };
          
          const applyTheme = (theme, isInitial) => {
            html.className = theme;
            themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
            if (!isInitial) {
              localStorage.setItem('theme', theme);
              document.cookie = \`theme=\${theme}; path=/; max-age=31536000\`;
            }
          };

          themeToggle.addEventListener('click', () => {
            const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(newTheme, false);
          });
          
          accessButton.addEventListener('click', handleAccess);
          
          window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement === urlInput) { e.preventDefault(); handleAccess(); }
            if (e.key === 'Escape' && document.activeElement === urlInput) { urlInput.blur(); }
            if (e.key === '/' && document.activeElement !== urlInput) {
              e.preventDefault();
              urlInput.focus();
            }
          });
          
          applyTheme(html.classList.contains('dark') ? 'dark' : 'light', true);
        });
      </script>
    </body>
    </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // --- 代理请求逻辑 ---
  const actualUrlStr = url.pathname.substring(1) + url.search + url.hash;

  let actualUrl;
  try {
    actualUrl = new URL(decodeURIComponent(actualUrlStr));
  } catch (e) {
    // 尝试不解码，以防URL本身包含编码字符
    try {
        actualUrl = new URL(actualUrlStr);
    } catch (e2) {
        return new Response(`无效的目标URL: "${actualUrlStr}"`, { status: 400 });
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
    let newResponse = new Response(response.body, response);

    // [关键修复] 只对HTML内容应用HTMLRewriter
    const contentType = newResponse.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        const rewriter = new HTMLRewriter()
            .on('head', new HeadInjector())
            .on('a,link,script,img,iframe,form,source,video,audio', new AttributeRewriter('/'));
        newResponse = rewriter.transform(newResponse);
    }

    return newResponse;
  } catch (error) {
    console.error(`代理错误 for ${actualUrl.toString()}: ${error.message}`);
    return new Response(`代理请求失败: ${error.message}`, { status: 502 });
  }
}

// Pages Functions 入口
export async function onRequest(context) {
  return await processProxyRequest(context.request);
}
