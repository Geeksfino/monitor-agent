# FinClip 聊天小部件嵌入演示

本目录包含用于演示如何在网页应用中嵌入 FinClip 聊天小部件的资源。

## 文件说明

- `embed-demo.html`：展示如何嵌入 FinClip 聊天小部件的示例 HTML 页面
- `nginx-cors-server.sh`：设置带有 CORS 头的 Nginx 服务器用于测试
- `python-cors-server.sh`：设置带有 CORS 头的 Python HTTP 服务器用于测试

## 用途

这些演示服务器仅供开发和测试使用。它们模拟了生产环境中所需的 CORS 设置。

在生产环境中，您需要使用类似的 CORS 设置配置您的 Web 服务器，以允许聊天小部件与 FinClip 代理 API 通信。

## 使用方法

您可以使用以下命令从项目根目录运行演示服务器：

```bash
# 启动 Nginx CORS 服务器
bun run serve:nginx

# 启动 Python CORS 服务器
bun run serve:python
```

两个服务器都将提供 `embed-demo.html` 文件，该文件演示了如何在您的网页应用中嵌入 FinClip 聊天小部件。

## 嵌入方式

FinClip 聊天小部件可以通过以下方式嵌入到您的网页中：

1. **浮动小部件**：在页面右下角显示一个可点击的聊天图标，点击后展开聊天界面
2. **内嵌界面**：将聊天界面直接嵌入到页面的指定区域

示例代码可以在 `embed-demo.html` 文件中找到。

## 自定义设置

您可以通过修改嵌入代码中的参数来自定义聊天小部件的外观和行为：

- 更改小部件的位置和大小
- 自定义主题颜色
- 设置初始问候语
- 配置 API 端点

请参考 `embed-demo.html` 中的示例代码了解更多详情。
