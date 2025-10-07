// File: functions/[[path]].js

// --- 后端代理逻辑 (保持不变) ---
const specialCases = { "*": { "Origin": "DELETE", "Referer": "DELETE" } };
function handleSpecialCases(requestToModify, targetUrlForRules) { const rules = specialCases[targetUrlForRules.hostname] || specialCases["*"] || {}; for (const [key, value] of Object.entries(rules)) { switch (value) { case "KEEP": break; case "DELETE": requestToModify.headers.delete(key); break; default: requestToModify.headers.set(key, value); break; } } }
async function processProxyRequest(incomingRequest) { const url = new URL(incomingRequest.url); const actualUrlStr = url.pathname.substring(1) + url.search + url.hash; let actualUrl; try { actualUrl = new URL(actualUrlStr); } catch (e1) { if (actualUrlStr.includes('.') && !actualUrlStr.includes('://') && !actualUrlStr.startsWith('/')) { try { actualUrl = new URL('https://' + actualUrlStr); } catch (e2) { return new Response(`无效的目标URL (1): "${actualUrlStr}"`, { status: 400 }); } } else { return new Response(`无效的目标URL (2): "${actualUrlStr}"`, { status: 400 }); } } const modifiedRequest = new Request(actualUrl.toString(), { headers: new Headers(incomingRequest.headers), method: incomingRequest.method, body: incomingRequest.body, redirect: 'follow' }); handleSpecialCases(modifiedRequest, actualUrl); try { const response = await fetch(modifiedRequest); const modifiedResponse = new Response(response.body, response); modifiedResponse.headers.set('Access-Control-Allow-Origin', '*'); modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH'); modifiedResponse.headers.set('Access-Control-Allow-Headers', incomingRequest.headers.get('Access-Control-Request-Headers') || '*'); modifiedResponse.headers.set('Access-Control-Expose-Headers', '*'); if (incomingRequest.method === 'OPTIONS') { return new Response(null, { headers: modifiedResponse.headers }); } return modifiedResponse; } catch (error) { console.error(`Fetch error for ${actualUrl.toString()}: ${error.message}`); if (error.message.includes('DNS lookup failed')) { return new Response(`无法解析目标主机: ${actualUrl.hostname}`, { status: 502 }); } return new Response(`代理请求失败: ${error.message}`, { status: 502 }); } }

// --- Worker 入口函数 ---
export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/") {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN" class="light">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CF-Link-Proxy</title>
        
        <!-- 字体和图标通过 CDN 加载 -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        
        <style>
          /* --- 核心 Tailwind 样式 (INLINED) --- */
          *,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:theme('borderColor.DEFAULT','currentColor')}::before,::after{--tw-content:''}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:theme('fontFamily.sans',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji");font-feature-settings:theme('fontFamily.sans[1].fontFeatureSettings',normal)}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:theme('fontFamily.mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace);font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,[type='button'],[type='reset'],[type='submit']{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type='search']{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:theme('colors.gray.500',#6b7280)}button,[role="button"]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}.dark .dark\:from-gray-800{--tw-gradient-from:#1f2937 var(--tw-gradient-from-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgb(31 41 55/0))}.dark .dark\:to-gray-800{--tw-gradient-to:#1f2937 var(--tw-gradient-to-position)}.dark .dark\:bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity))}.dark .dark\:bg-gray-800{--tw-bg-opacity:1;background-color:rgb(31 41 55/var(--tw-bg-opacity))}.dark .dark\:bg-gray-800\/90{background-color:rgb(31 41 55/.9)}.dark .dark\:bg-gray-900{--tw-bg-opacity:1;background-color:rgb(17 24 39/var(--tw-bg-opacity))}.dark .dark\:from-gray-900{--tw-gradient-from:#111827 var(--tw-gradient-from-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgb(17 24 39/0))}.dark .dark\:bg-blue-600{--tw-bg-opacity:1;background-color:rgb(37 99 235/var(--tw-bg-opacity))}.dark .dark\:text-gray-200{--tw-text-opacity:1;color:rgb(229 231 235/var(--tw-text-opacity))}.dark .dark\:text-gray-300{--tw-text-opacity:1;color:rgb(209 213 219/var(--tw-text-opacity))}.dark .dark\:text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity))}.dark .dark\:text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity))}.dark .dark\:placeholder-gray-400::placeholder{--tw-placeholder-opacity:1;color:rgb(156 163 175/var(--tw-placeholder-opacity))}.dark .dark\:shadow-gray-700\/30{--tw-shadow-color:rgb(55 65 81/.3);--tw-shadow:var(--tw-shadow-colored)}.dark .dark\:hover\:bg-blue-700:hover{--tw-bg-opacity:1;background-color:rgb(29 78 216/var(--tw-bg-opacity))}.dark .dark\:hover\:bg-gray-700:hover{--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity))}.relative{position:relative}.mx-1{margin-left:.25rem;margin-right:.25rem}.my-12{margin-top:3rem;margin-bottom:3rem}.mb-8{margin-bottom:2rem}.mb-auto{margin-bottom:auto}.mt-auto{margin-top:auto}.flex{display:flex}.min-h-screen{min-height:100vh}.w-full{width:100%}.max-w-2xl{max-width:42rem}.max-w-3xl{max-width:48rem}.max-w-6xl{max-width:72rem}.flex-1{flex:1 1 0%}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-2{gap:.5rem}.overflow-hidden{overflow:hidden}.whitespace-nowrap{white-space:nowrap}.rounded{border-radius:.25rem}.rounded-full{border-radius:9999px}.border-0{border-width:0}.bg-blue-500{--tw-bg-opacity:1;background-color:rgb(59 130 246/var(--tw-bg-opacity))}.bg-gray-200{--tw-bg-opacity:1;background-color:rgb(229 231 235/var(--tw-bg-opacity))}.bg-white\/80{background-color:rgb(255 255 255/.8)}.bg-white\/90{background-color:rgb(255 255 255/.9)}.bg-gradient-to-br{background-image:linear-gradient(to bottom right,var(--tw-gradient-stops))}.bg-gradient-to-r{background-image:linear-gradient(to right,var(--tw-gradient-stops))}.from-blue-500{--tw-gradient-from:#3b82f6 var(--tw-gradient-from-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgb(59 130 246/0))}.from-gray-50{--tw-gradient-from:#f9fafb var(--tw-gradient-from-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgb(249 250 251/0))}.to-gray-100{--tw-gradient-to:#f3f4f6 var(--tw-gradient-to-position)}.to-indigo-600{--tw-gradient-to:#4f46e5 var(--tw-gradient-to-position)}.bg-clip-text{background-clip:text;-webkit-background-clip:text}.p-4{padding:1rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-4{padding-top:1rem;padding-bottom:1rem}.pb-6{padding-bottom:1.5rem}.pt-6{padding-top:1.5rem}.text-center{text-align:center}.text-\\[clamp\\(2\\.5rem\\,8vw\\,4rem\\)\\]{font-size:clamp(2.5rem,8vw,4rem)}.text-base{font-size:1rem;line-height:1.5rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xs{font-size:.75rem;line-height:1rem}.font-black{font-weight:900}.font-medium{font-weight:500}.text-gray-600{--tw-text-opacity:1;color:rgb(75 85 99/var(--tw-text-opacity))}.text-gray-700{--tw-text-opacity:1;color:rgb(55 65 81/var(--tw-text-opacity))}.text-gray-800{--tw-text-opacity:1;color:rgb(31 41 55/var(--tw-text-opacity))}.text-gray-900{--tw-text-opacity:1;color:rgb(17 24 39/var(--tw-text-opacity))}.text-transparent{color:transparent}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity))}.placeholder-gray-500::placeholder{--tw-placeholder-opacity:1;color:rgb(107 114 128/var(--tw-placeholder-opacity))}.shadow-lg{--tw-shadow:0 10px 15px -3px rgb(0 0 0/.1),0 4px 6px -4px rgb(0 0 0/.1);--tw-shadow-colored:0 10px 15px -3px var(--tw-shadow-color),0 4px 6px -4px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-gray-200\/80{--tw-shadow-color:rgb(229 231 235/.8);--tw-shadow:var(--tw-shadow-colored)}.backdrop-blur-sm{--tw-backdrop-blur:blur(4px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms}.transition-transform{transition-property:transform;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms}.transition-opacity{transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms}.duration-300{transition-duration:300ms}.duration-500{transition-duration:500ms}.hover\\:bg-blue-600:hover{--tw-bg-opacity:1;background-color:rgb(37 99 235/var(--tw-bg-opacity))}.hover\\:bg-white:hover{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity))}.hover\\:shadow-lg:hover{--tw-shadow:0 10px 15px -3px rgb(0 0 0/.1),0 4px 6px -4px rgb(0 0 0/.1);--tw-shadow-colored:0 10px 15px -3px var(--tw-shadow-color),0 4px 6px -4px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus\\:ring-0:focus{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}
          /* --- Custom Styles & Animations --- */
          body { font-family: 'Inter', sans-serif; visibility: hidden; }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; }
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
              <input id="url-input" type="text" value="https://example.com" class="flex-1 px-6 py-4 text-base bg-white/90 dark:bg-gray-800/90 border-0 focus:ring-0 focus:outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm" placeholder="输入目标链接...">
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

            setTimeout(() => { window.location.href = '/' + encodeURIComponent(targetUrl); }, 800);
          };

          const applyTheme = (theme) => {
            html.classList.toggle('dark', theme === 'dark');
            themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
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
            if (e.key === 'Escape' && document.activeElement === urlInput) { urlInput.blur(); }
            if (e.key === '/' && document.activeElement !== urlInput) {
              e.preventDefault();
              urlInput.focus();
              urlInput.select();
            }
          });
          
          const savedTheme = localStorage.getItem('theme') || 'light';
          applyTheme(savedTheme);
          
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
