# CF-Link-Proxy

![image](https://github.com/user-attachments/assets/962182e7-d99e-4233-ac30-e130d07a2de5)

---

`CF-Link-Proxy` 是一个部署在 Cloudflare Pages 上的函数脚本，旨在提供一个**安全、私密且高效**的网络请求中继工具。它不仅能帮助用户在访问网络资源（如下载链接）时获得更稳定的连接体验，还通过密码保护确保了服务的私密性。

#### ✨ 主要功能

*   **🛡️ 密码保护**: 通过环境变量配置访问密码，为您的代理服务提供安全保障。未验证的访问将被拦截，确保只有您自己能使用。
*   **🎨 现代化前端**: 提供一个美观且用户友好的首页，包含动态渐变背景、暗黑模式切换以及便捷的输入体验。
*   **📋 一键复制链接**: 在首页输入目标链接后，可以一键生成并复制完整的代理链接，方便分享和使用。
*   **🌐 连接中继与优化**: 利用 Cloudflare 强大的全球网络作为中转，以期改善连接的稳定性和下载的持续性。
*   **🚀 智能 URL 处理**: 自动为用户输入的裸域名（如 `example.com`）补全 `https://` 协议，并进行基础的URL有效性检查。
*   **🤝 跨域适应性**: 自动向响应中注入必要的CORS头部（如 `Access-Control-Allow-Origin: *`），使得中继的资源能被轻松集成到其他Web应用中。
*   **🔧 请求头定制 (高级)**: 允许通过修改脚本中的 `specialCases` 对象，为所有或特定域名自定义传出请求的HTTP头部。

#### 🚀 部署与配置

本项目专为 Cloudflare Pages 设计，部署过程非常简单。

1.  **准备代码**: 将本项目中的 `functions/[[path]].js` 文件放置在你的项目仓库的 `functions` 目录下。
2.  **创建 Pages 项目**:
    *   登录到 Cloudflare Dashboard。
    *   在 "Workers & Pages" 中，创建一个新的 Pages 项目，并将其连接到你的代码仓库。
    *   部署设置可以保留默认。
3.  **配置环境变量 (最重要的一步)**:
    *   在你的 Pages 项目设置中，找到 **"设置 (Settings)"** > **"环境变量 (Environment variables)"**。
    *   在 **"生产 (Production)"** 下点击 **"添加变量 (Add variable)"**。
    *   **变量名称 (Variable name)**: `PASSWORD`
    *   **值 (Value)**: `输入你自己的复杂密码`
    *   点击值的输入框右侧的 **"加密 (Encrypt)"** 按钮，将其保存为 **Secret (机密)**。
    *   **保存**并**重新部署**你的项目，使环境变量生效。

#### 🛠️ 高级配置: `specialCases`

如果你需要精细控制传出请求的HTTP头部（例如，为支持断点续传而保留 `Range` 头），可以编辑 `[[path]].js` 文件中的 `specialCases` 对象。

**配置示例结构**:
```javascript
const specialCases = {
  "*": { // 通用规则，适用于所有未明确指定的域名
    "Origin": "DELETE",     // 删除 Origin 头部
    "Referer": "DELETE"     // 删除 Referer 头部
  },
  "download.example.com": { // 针对特定域名的规则
    "Range": "KEEP"     // 保留原始请求中的 Range 头部
  }
};
```
*   `"HeaderName": "DELETE"`: 移除该头部。
*   `"HeaderName": "KEEP"`: 保留原始请求中的该头部。
*   `"HeaderName": "SpecificValue"`: 将该头部的值设置为 `SpecificValue`。

#### ⚠️ 使用须知

*   请确保您的使用行为符合 Cloudflare 的服务条款。
*   免费层级的服务在请求次数、CPU时间等方面存在限制。
*   部分目标服务器可能对来自代理的访问设有反制策略。

---
---

# CF-Link-Proxy (English)

`CF-Link-Proxy` is a Cloudflare Pages Function script designed to provide a **secure, private, and efficient** tool for relaying network requests. It not only helps users achieve a more stable connection experience when accessing network resources (like download links) but also ensures the privacy of the service through password protection.

#### ✨ Key Features

*   **🛡️ Password Protection**: Secures your proxy service with an access password configured via environment variables. Unauthenticated access is blocked, ensuring only you can use it.
*   **🎨 Modern Frontend**: Features a beautiful and user-friendly homepage with a dynamic gradient background, a dark mode toggle, and a convenient input interface.
*   **📋 One-Click Link Copying**: After entering a target URL on the homepage, you can generate and copy the full proxy link with a single click, making it easy to share and use.
*   **🌐 Connection Relaying & Optimization**: Leverages Cloudflare's robust global network as an intermediary to potentially improve connection stability and download persistence.
*   **🚀 Smart URL Handling**: Automatically prepends `https://` to bare domains (e.g., `example.com`) and performs basic URL validity checks.
*   **🤝 Cross-Origin Adaptability**: Automatically injects necessary CORS headers (such as `Access-Control-Allow-Origin: *`) into responses, facilitating easier integration of relayed resources into other web applications.
*   **🔧 Request Header Customization (Advanced)**: Allows fine-tuning of outgoing HTTP headers for all or specific domains by modifying the `specialCases` object in the script.

#### 🚀 Deployment & Configuration

This project is designed for Cloudflare Pages, making deployment straightforward.

1.  **Prepare the Code**: Place the `functions/[[path]].js` file from this project into the `functions` directory of your own repository.
2.  **Create a Pages Project**:
    *   Log in to the Cloudflare Dashboard.
    *   In "Workers & Pages," create a new Pages project and connect it to your code repository.
    *   You can leave the deployment settings as default.
3.  **Configure Environment Variable (The Most Important Step)**:
    *   In your Pages project, navigate to **"Settings"** > **"Environment variables"**.
    *   Under **"Production"**, click **"Add variable"**.
    *   **Variable name**: `PASSWORD`
    *   **Value**: `Enter your own complex password`
    *   Click the **"Encrypt"** button to the right of the value input field to save it as a **Secret**.
    *   **Save** and **re-deploy** your project for the environment variable to take effect.

#### 🛠️ Advanced Configuration: `specialCases`

If you need to fine-tune the HTTP headers of outgoing requests (e.g., to preserve the `Range` header for resumable downloads), you can edit the `specialCases` object inside the `[[path]].js` file.

**Configuration Structure Example**:
```javascript
const specialCases = {
  "*": { // Default rules, apply to all domains not explicitly specified
    "Origin": "DELETE",     // Deletes the Origin header
    "Referer": "DELETE"     // Deletes the Referer header
  },
  "download.example.com": { // Rules specific to a domain
    "Range": "KEEP"     // Preserves the Range header from the original request
  }
};
```
*   `"HeaderName": "DELETE"`: Removes the specified header.
*   `"HeaderName": "KEEP"`: Preserves the header from the original request.
*   `"HeaderName": "SpecificValue"`: Sets the header's value to `SpecificValue`.

#### ⚠️ Important Considerations

*   Ensure your usage complies with the Cloudflare Terms of Service.
*   Free tiers often have limitations on request counts, CPU time, etc.
*   Some target servers may have policies to block or restrict access from proxies.
