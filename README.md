## CF-Link-Proxy

![image](https://github.com/user-attachments/assets/962182e7-d99e-4233-ac30-e130d07a2de5)

---



`CF-Link-Proxy` 是一个 CF Workers 脚本，旨在提供一个通过 CF 网络中继网络请求的工具。它的主要目的是帮助用户在访问某些网络资源（如下载链接）时，获得更稳定、更持续的连接体验，尤其是在直接连接目标服务器存在网络波动或速度不理想的情况下。

#### ✨ 主要功能

*   **🌐 连接中继与优化**: 利用 CF 强大的全球网络作为中转，以期改善连接的稳定性和下载的持续性。
*   **🚀 智能 URL 处理**: 自动为用户输入的裸域名（如 `example.com`）补全 `https://` 协议，并进行基础的URL有效性检查。
*   **🔧 请求头定制 (可配置)**:
    *   默认情况下，脚本会移除传出请求中的 `Origin` 和 `Referer` HTTP头部。
    *   用户可以通过修改脚本中的 `specialCases` JavaScript 对象，为所有域名或特定域名自定义请求头的处理策略。可选择保留（`KEEP`）、删除（`删除`）或设置（指定值）特定的HTTP头部，以适应不同目标服务器的需求（例如，保留 `Range` 头以支持断点续传）。
*   **🤝 跨域适应性**: 自动向从目标服务器获取的响应中注入必要的HTTP头部（如 `Access-Control-Allow-Origin: *`），使得通过此服务中继的资源能够更容易地被不同源的Web应用程序集成和使用。
*   **🛡️ 错误反馈**: 当用户提供的URL无效或中继过程中发生网络错误时，脚本会向客户端返回相应的错误状态和提示信息。

#### 🛠️ 可配置项: `specialCases`

脚本内包含一个名为 `specialCases` 的 JavaScript 对象，允许用户精细控制传出请求的HTTP头部。

**配置示例结构**:
```javascript
const specialCases = {
  "*": { // 通用规则，适用于所有未明确指定的域名
    "Origin": "DELETE",     // 删除 Origin 头部
    "Referer": "DELETE"     // 删除 Referer 头部
    // "User-Agent": "MyCustomClient/1.0" // 示例：设置自定义 User-Agent
  },
  "target-domain.com": { // 针对特定域名的规则
    "X-Custom-Header": "Value", // 添加或设置 X-Custom-Header
    "Authorization": "KEEP"     // 保留原始请求中的 Authorization 头部
  }
};
```

*   **`"HeaderName": "DELETE"`**: 从请求中移除名为 `HeaderName` 的头部。
*   **`"HeaderName": "KEEP"`**: 保留原始请求中名为 `HeaderName` 的头部（若存在）。
*   **`"HeaderName": "SpecificValue"`**: 将名为 `HeaderName` 的头部设置为 `SpecificValue`。

#### ⚠️ 使用须知

*   请确保您的使用行为符合相关服务提供商（包括 CF）的服务条款。
*   免费层级的服务通常在请求次数、CPU时间等方面存在限制。
*   部分目标服务器可能对来自代理或特定请求模式的访问设有反制策略。

---



`CF-Link-Proxy` is a CF Workers script designed to provide a tool for relaying network requests through the CF network. Its primary purpose is to help users achieve a more stable and consistent connection experience when accessing certain network resources (such as download links), especially when direct connections to the target server are subject to network fluctuations or suboptimal speeds.

#### ✨ Key Features

*   **🌐 Connection Relaying & Optimization**: Leverages CF's robust global network as an intermediary to potentially improve connection stability and download persistence.
*   **🚀 Smart URL Handling**: Automatically prepends `https://` to bare domains (e.g., `example.com`) entered by the user and performs basic URL validity checks.
*   **🔧 Request Header Customization (Configurable)**:
    *   By default, the script removes `Origin` and `Referer` HTTP headers from outgoing requests.
    *   Users can modify the `specialCases` JavaScript object within the script to define custom header handling policies for all domains or specific domains. Options include preserving (`KEEP`), deleting (`删除`), or setting (to a specific value) particular HTTP headers to meet the requirements of different target servers (e.g., preserving the `Range` header for resumable downloads).
*   **🤝 Cross-Origin Adaptability**: Automatically injects necessary HTTP headers (such as `Access-Control-Allow-Origin: *`) into responses fetched from the target server. This facilitates easier integration and usage of resources relayed through this service within web applications dificuldades from different origins.
*   **🛡️ Error Feedback**: When an invalid URL is provided by the user or a network error occurs during the relay process, the script returns an appropriate error status and message to the client.

#### 🛠️ Configuration: `specialCases`

The script includes a JavaScript object named `specialCases` that allows users to fine-tune the HTTP headers of outgoing requests.

**Configuration Structure Example**:
```javascript
const specialCases = {
  "*": { // Default rules, apply to all domains not explicitly specified
    "Origin": "DELETE",     // Deletes the Origin header
    "Referer": "DELETE"     // Deletes the Referer header
    // "User-Agent": "MyCustomClient/1.0" // Example: Set a custom User-Agent
  },
  "target-domain.com": { // Rules specific to "target-domain.com"
    "X-Custom-Header": "Value", // Adds or sets X-Custom-Header
    "Authorization": "KEEP"     // Preserves the Authorization header from the original request
  }
};
```

*   **`"HeaderName": "DELETE"`**: Removes the header named `HeaderName` from the request.
*   **`"HeaderName": "KEEP"`**: Preserves the header named `HeaderName` from the original request (if present).
*   **`"HeaderName": "SpecificValue"`**: Sets the header named `HeaderName` to `SpecificValue`.

#### ⚠️ Important Considerations

*   Ensure your usage complies with the terms of service of relevant service providers (including CF).
*   Free tiers of services often have limitations on request counts, CPU time, etc.
*   Some target servers may have policies मूड or restricting access from proxies or specific request patterns.

```
