### README.md (中文版)

# CF-Link-Proxy

`CF-Link-Proxy` 是一个部署在 Cloudflare Pages 上的极简、高效的单文件代理工具。它的主要目的是作为**文件下载中继**，利用 Cloudflare 的全球网络来加速或稳定对部分访问不佳的资源的下载。

请注意，该工具**并未对完整的网页浏览进行适配**，直接用它浏览复杂网站可能会导致页面样式、图片或脚本加载不全。

#### ✨ 主要功能

*   **⚡️ 极致性能与零依赖**: 整个前端是一个纯粹的单文件应用，所有 CSS 和图标均已内联，无需任何外部网络请求。这确保了首页在任何网络环境下都能实现瞬时加载。
*   **🎨 动态美学界面**: 拥有一个美观且用户友好的首页，包含平滑过渡的动态渐变背景，能根据用户的系统偏好或手动选择，在亮色与暗黑模式间无缝切换。
*   **🍪 无闪烁主题切换**: 通过 Cookie 记忆用户的颜色主题偏好，在服务端直接渲染，彻底告别了页面加载时的样式闪烁。
*   **🌐 文件下载中继**: 核心功能是作为下载链接的中继站。当您遇到下载缓慢或不稳定的文件链接时，可以通过本工具进行中转，以期获得更稳定、持续的下载体验。
*   **🚀 智能 URL 处理**: 自动为用户输入的裸域名（如 `example.com`）补全 `https://` 协议。
*   **🤝 跨域支持**: 自动为所有代理请求的响应添加必要的CORS头部，方便开发者进行 API 调试或资源调用。
*   **🔧 请求头定制 (高级)**: 允许通过修改脚本中的 `specialCases` 对象，为所有或特定域名自定义传出请求的HTTP头部（例如，为支持断点续传而保留 `Range` 头）。

#### 🚀 部署与配置

本项目专为 Cloudflare Pages 设计，部署过程极其简单。

1.  **准备代码**: 将本项目中的 `functions/[[path]].js` 文件放置在你的代码仓库的 `functions` 目录下。
2.  **创建 Pages 项目**:
    *   登录到 Cloudflare Dashboard。
    *   在 "Workers & Pages" 中，创建一个新的 Pages 项目，并将其连接到你的代码仓库。
    *   部署设置可以保留默认。
3.  **完成部署**:
    *   该版本**无需配置任何环境变量**，部署成功后即可立即使用。

#### 🛠️ 高级配置: `specialCases`

如果你需要精细控制传出请求的HTTP头部，可以编辑 `[[path]].js` 文件中的 `specialCases` 对象。

**配置示例**:
```javascript
const specialCases = {
  "*": { // 通用规则
    "Origin": "DELETE",
    "Referer": "DELETE"
  },
  "download.example.com": { // 针对特定下载域名的规则
    "Range": "KEEP"     // 保留 Range 头部以支持断点续传
  }
};
```
*   `"HeaderName": "DELETE"`: 移除该头部。
*   `"HeaderName": "KEEP"`: 保留原始请求中的该头部。
*   `"HeaderName": "SpecificValue"`: 将该头部的值设置为 `SpecificValue`。

#### ⚠️ 使用须知

*   本工具主要为文件下载设计，直接用它浏览复杂的网站可能会导致页面样式或功能异常。
*   请确保您的使用行为符合 Cloudflare 的服务条款。
*   免费层级的服务在请求次数、CPU时间等方面存在限制。

---
---

### README.md (English Version)

# CF-Link-Proxy

`CF-Link-Proxy` is a minimalist and high-performance single-file proxy tool deployed on Cloudflare Pages. Its primary purpose is to act as a **file download relay**, leveraging Cloudflare's global network to accelerate or stabilize downloads for resources that are otherwise slow or difficult to access.

Please note that this tool is **not adapted for full web browsing**. Using it to browse complex websites may result in incomplete loading of styles, images, or scripts.

#### ✨ Key Features

*   **⚡️ Extreme Performance & Zero Dependencies**: The entire frontend is a pure, single-file application. All CSS and icons are inlined, requiring zero external network requests. This ensures the homepage loads instantly under any network conditions.
*   **🎨 Dynamic & Aesthetic UI**: Features a beautiful and user-friendly homepage with a smooth, animated gradient background. It seamlessly switches between light and dark modes based on user preference or system settings.
*   **🍪 Flicker-Free Theming**: Remembers the user's theme preference via a cookie, allowing for server-side rendering of the correct theme. This completely eliminates any flash of incorrect styles on page load.
*   **🌐 File Download Relay**: The core function is to act as a relay for download links. When you encounter a slow or unstable file link, you can route it through this tool to achieve a more stable and persistent download experience.
*   **🚀 Smart URL Handling**: Automatically prepends `https://` to bare domains entered by the user (e.g., `example.com`).
*   **🤝 Cross-Origin Support**: Automatically adds necessary CORS headers to all proxied responses, making it useful for developers debugging APIs or calling resources.
*   **🔧 Request Header Customization (Advanced)**: Allows fine-tuning of outgoing HTTP headers for all or specific domains by modifying the `specialCases` object in the script (e.g., preserving the `Range` header for resumable downloads).

#### 🚀 Deployment & Configuration

This project is designed for Cloudflare Pages, making deployment extremely simple.

1.  **Prepare the Code**: Place the `functions/[[path]].js` file from this project into the `functions` directory of your code repository.
2.  **Create a Pages Project**:
    *   Log in to the Cloudflare Dashboard.
    *   Navigate to "Workers & Pages," create a new Pages project, and connect it to your repository.
    *   The default deployment settings are sufficient.
3.  **Deploy**:
    *   **No environment variables are required** for this version. Once deployed, it is ready to use immediately.

#### 🛠️ Advanced Configuration: `specialCases`

If you need to fine-tune the HTTP headers of outgoing requests, you can edit the `specialCases` object inside the `[[path]].js` file.

**Configuration Example**:
```javascript
const specialCases = {
  "*": { // General rules
    "Origin": "DELETE",
    "Referer": "DELETE"
  },
  "download.example.com": { // Rules for a specific download domain
    "Range": "KEEP"     // Preserve the Range header to support resumable downloads
  }
};
```
*   `"HeaderName": "DELETE"`: Removes the specified header.
*   `"HeaderName": "KEEP"`: Preserves the header from the original request.
*   `"HeaderName": "SpecificValue"`: Sets the header's value to `SpecificValue`.

#### ⚠️ Usage Notice

*   This tool is primarily designed for file downloads. Using it to browse complex websites may lead to broken page styles or functionality.
*   Ensure your usage complies with the Cloudflare Terms of Service.
*   The free tier has limitations on requests, CPU time, etc.
