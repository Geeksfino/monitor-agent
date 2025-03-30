# finclip-agent

本项目是一个聊天机器人，当配置工具后，可以成为一个智能代理（Agent）。目前主要支持关于FinClip相关的问题回答。其前端聊天界面可以浮窗方式嵌入至网站中，后端则是一个基于[CxAgent](https://github.com/Geeksfino/cxagent)的Agent。

部署本项目前，需要先生成知识库。只要把一些文档放在 `content` 目录下，然后运行 `bun run kb:package` 就可以生成知识库了。但知识库的生成需要一些运算时间，可以参考 [kb-mcp-server](https://github.com/Geeksfino/kb-mcp-server) 的文档。此外，知识库的检索扩展生成质量，取决于 `kb.yml` 中的配置，包括源文件的格式、数据切块的策略（例如按行、按段落）、数据切块的重叠量、检索器的类型、embedding models的选择等。

运行脚本 `bun setup:env` 可以设置环境。该脚本已经包含了所有必要的设置步骤，并且会自动基于 `kb.yml` 中配置的模型，下载所需的模型和生成配置文件。

准备完成后，可以使用 `bun start` 启动代理。


## 快速开始

```bash
# 克隆仓库
git clone https://gitlab.finogeeks.club/liangqh/finclip-agent.git
cd finclip-agent

# 运行环境设置脚本（安装所有依赖）
bun setup:env

# 启动代理
bun start

# 使用检查器界面验证代理是否正常工作
bun start --inspect
```

## 手动设置

如果您更喜欢手动运行每个步骤：

1. 设置依赖项：
   ```bash
   bun run setup
   ```

2. 下载所需模型：
   ```bash
   bun run download-models
   ```

3. 生成配置：
   ```bash
   bun run generate-config
   ```

## 配置

设置完成后，您需要：

1. 编辑 `.agent.env` 文件，填入您的 API 密钥和其他设置
2. 将您的知识库嵌入文件放在 `./finclip.tar.gz` 或在 `conf/preproc-mcp.json` 中更新路径
3. 可选地创建 `brain.md` 文件来自定义您的代理行为

## 验证代理

要快速验证代理是否正常工作，您可以使用检查器界面：

```bash
bun start --inspect
```

这将打开一个网页界面，您可以在其中查看代理的配置，测试其功能，并确保一切设置正确。

## 嵌入演示

本项目包含一个演示，展示如何在网页应用中嵌入 FinClip 聊天小部件。有关更多信息，请参阅[嵌入演示 README](./embedding-demo/README.md)。

您可以使用以下命令之一运行嵌入演示：

```bash
# 使用 Python HTTP 服务器（推荐）
bun run serve:python

# 使用 Nginx（需要安装 Nginx）
bun run serve:nginx
```

## 知识库管理

### 交互模式

finclip-agent 包含一个用于管理知识库的交互式脚本：

```bash
# 启动交互式知识库管理工具
bun run kb:interactive
```

该工具通过简单的菜单界面引导您完成构建、导出和搜索知识库的过程。它还会在构建或导出知识库后自动提供更新 MCP 配置的选项。

### 直接命令

如果您更喜欢直接访问知识库工具，可以使用以下命令：

```bash
# 从内容目录构建知识库
bun run kb:build

# 使用调试输出构建
bun run kb:build:debug

# 交互式搜索知识库
bun run kb:search

# 使用图形检索搜索
bun run kb:search:graph

# 导出知识库以便分发
bun run kb:package
```

这些命令使用 `kb.yml` 中的配置。导出知识库后，将创建 `finclip.tar.gz` 文件，该文件由 MCP 服务器使用。

## 运行代理

```bash
# 启动代理
bunx @finogeek/cxagent
```

## 嵌入聊天小部件

创建一个包含以下内容的 HTML 文件：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finclip Agent 聊天</title>
</head>
<body>
  <h1>Finclip Agent 聊天</h1>
  
  <script 
    src="./node_modules/@finogeek/cxagent/web/dist/finclip-chat.js" 
    data-finclip-chat 
    data-api-url="http://localhost:5678" 
    data-streaming-url="http://localhost:5679"
  ></script>
</body>
</html>
```

在浏览器中打开此 HTML 文件以与代理交互。

## 项目结构

- `setup.sh`：安装 Bun，检查 Python，安装 uv，并设置环境
- `download-models.js`：根据 kb.yml 从 Hugging Face 下载所需模型
- `generate-config.js`：为 kb-mcp-server 生成 MCP 配置
- `index.js`：按顺序运行所有设置步骤的主脚本
- `build-kb.js`：交互式知识库管理工具

## 要求

- [Bun](https://bun.sh/) 运行时（v1.0.0 或更高版本）
- Python 3.9+ 和 pip
- 用于下载模型的互联网连接

## 故障排除

### 常见问题

1. **模型下载失败**：
   - 检查您的互联网连接
   - 确保您有足够的磁盘空间
   - 尝试再次运行 `bun run download-models`

2. **配置生成失败**：
   - 确保 kb-mcp-server 已正确安装
   - 检查虚拟环境是否已激活

3. **代理无法启动**：
   - 验证 `.agent.env` 中的 API 密钥
   - 检查嵌入文件是否存在于指定路径

## 高级配置

有关高级配置选项，请参考：
- [CxAgent 文档](https://github.com/Geeksfino/cxagent)
- [kb-mcp-server 文档](https://github.com/Geeksfino/kb-mcp-server)
