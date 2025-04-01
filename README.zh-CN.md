# finclip-agent-starterkit

<p align="right">
  <a href="README.md">English</a> |
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/Geeksfino/finclip-agent-starterkit/stargazers"><img src="https://img.shields.io/github/stars/Geeksfino/finclip-agent-starterkit.svg" alt="GitHub stars"></a>
  <a href="https://github.com/Geeksfino/finclip-agent-starterkit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Geeksfino/finclip-agent-starterkit.svg" alt="许可证"></a>
  <a href="https://github.com/Geeksfino/finclip-agent-starterkit/issues"><img src="https://img.shields.io/github/issues/Geeksfino/finclip-agent-starterkit.svg" alt="GitHub issues"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/powered%20by-Bun-orange.svg" alt="由 Bun 提供支持"></a>
  <a href="https://github.com/Geeksfino/finclip-agent"><img src="https://img.shields.io/badge/based%20on-finclip--agent-blue.svg" alt="基于 finclip-agent"></a>
</p>

本项目是一个用于构建基于知识库的聊天机器人的启动套件，使用 finclip-agent 技术。它提供了所有必要的设置和配置工具，以快速部署具有自定义知识的智能代理。其前端聊天界面可以浮窗方式嵌入至网站中，后端则是一个基于[finclip-agent](https://github.com/Geeksfino/finclip-agent)的Agent。

**重要提示**：在创建您自己的代理时，请确保严格遵循 [finclip-agent 文档](https://github.com/Geeksfino/finclip-agent#agent-brain)中指定的 `brain.md` 文件的 YAML 格式要求。该文件只能包含以下顶级字段：`name`（名称）、`role`（角色）、`goal`（目标）和 `capabilities`（能力）。任何其他结构都会导致代理无法正常启动。

## 开始使用

设置脚本将自动检测并安装所需的依赖项。您只需要：

- 类 Unix 环境（macOS、Linux 或 Windows 上的 WSL）
- [Python](https://www.python.org/) 3.9 或更高版本（设置脚本将检测但不会安装 Python）

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Geeksfino/finclip-agent-starterkit.git
cd finclip-agent-starterkit

# 运行环境设置脚本（自动检测并安装依赖项）
bun setup:env

# 将示例文件复制到 contents 目录（可选）
bun run kb:use-samples

# 构建知识库（生成 kb.tar.gz）
bun run kb:package

# 配置您的 API 密钥到 .agent.env 文件中（必需）
# 编辑 .agent.env 文件并添加您的 LLM API 密钥

# 启动代理
bun start

# 使用检查器界面验证代理是否正常工作
bun start --inspect
# 浏览器访问 http://localhost:5173

# 或者指定端口
bun start --inspect --inspect-port 3000
# 浏览器访问 http://localhost:3000
```

## 环境设置

### 自动设置

设置环境的最简单方法是运行：

```bash
bun setup:env
```

此脚本将：
1. 检查并安装 Bun（如果尚未安装）
2. 验证 Python 是否已安装（如果未找到，您需要手动安装 Python）
3. 安装所有必要的依赖项
4. 创建 Python 虚拟环境
5. 安装 kb-mcp-server
6. 下载所需的模型
7. 生成配置文件

### 手动设置

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

1. 编辑 `.agent.env` 文件，设置您的 API 密钥和其他设置（必需）
   ```
   # .agent.env 配置示例
   LLM_API_KEY=your_api_key_here        # 替换为您的实际 API 密钥
   LLM_PROVIDER_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4o                    # 或者您选择的其他模型
   LLM_STREAM_MODE=true
   ```
2. 可选择编辑 `brain.md` 文件，自定义您的代理行为

> **注意**：`conf/preproc-mcp.json` 文件包含特定于您本地环境的路径，由设置过程自动生成。不应手动编辑或提交到版本控制系统。

## 示例知识库内容

本启动套件在 `knowledge-samples` 目录中附带了示例 Markdown 文件，涵盖数据科学、机器学习、神经网络和自然语言处理等主题。这使您可以在添加自己的内容之前快速构建一个可用于测试的知识库。

### 使用示例文件

要使用提供的示例文件：

```bash
# 将示例文件复制到 contents 目录
bun run kb:use-samples

# 构建知识库（生成 kb.tar.gz）
bun run kb:package
```

### 构建知识库

1. 将示例文件复制到 `contents` 目录后，运行知识库构建命令时将使用这些文件
2. 要生成知识库，运行 `bun run kb:package`
3. 知识库将根据根目录中 `kb.yml` 的设置进行构建
4. 构建完成后，您可以运行 `bun run kb:search "您的搜索查询"` 来搜索知识库中的信息

### 使用自己的内容进行自定义

当您准备好使用自己的知识自定义聊天机器人时：

1. 将您自己的 Markdown、PDF 或其他支持的文档放在 `contents` 目录中
2. 如有需要，调整 `kb.yml` 中的设置（例如，分块策略、嵌入模型等）
3. 使用 `bun run kb:package` 重新构建知识库

知识库的检索扩展生成质量，取决于 `kb.yml` 中的配置，包括源文件的格式、数据切块的策略（例如按行、按段落）、数据切块的重叠量、检索器的类型、embedding models 的选择等。生成过程需要一些计算时间；有关详细信息，请参阅 [kb-mcp-server](https://github.com/Geeksfino/kb-mcp-server) 文档。

> **注意**：`conf/preproc-mcp.json` 文件包含特定于您本地环境的路径，由设置过程自动生成。不应手动编辑或提交到版本控制系统。

## 验证代理

要快速验证代理是否正常工作，您可以使用检查器界面：

```bash
# 使用 start 脚本
bun start --inspect
# 浏览器访问 http://localhost:5173

# 或者指定自定义端口
bun start --inspect --inspect-port 3000
# 浏览器访问 http://localhost:3000

# 或者，您可以直接使用 cxagent 命令
bunx @finogeek/cxagent --inspect
# 或者
bunx @finogeek/cxagent --inspect --inspect-port 3000
```

这将打开一个网页界面，您可以在其中查看代理的配置，测试其功能，并确保一切设置正确。

## 故障排除

### 常见问题

1. **构建知识库时关于 `.gitkeep` 文件的错误**
   ```
   Error processing file contents/.gitkeep: File format not allowed: .gitkeep
   ```
   这是一个无害的警告。`.gitkeep` 文件用于确保 `contents` 目录在 Git 中存在，但它不是有效的知识库文档。您可以安全地忽略此警告。

2. **设置过程中关于找不到嵌入文件的警告**
   ```
   Warning: Embeddings file not found at /path/to/kb.tar.gz
   ```
   此警告出现是因为知识库尚未构建。运行 `bun run kb:package` 后将解决此问题。

3. **API 密钥问题**
   如果您看到与 API 认证相关的错误，请确保您已在 `.agent.env` 文件中正确配置了 API 密钥。

4. **命令未找到错误**
   如果遇到“命令未找到”错误，请确保您已使用 `bun setup:env` 完成设置过程。

5. **知识库搜索不工作**
   如果 `bun run kb:search` 不按预期工作，请尝试使用直接命令：
   ```bash
   .venv/bin/kb-search kb.tar.gz "您的搜索查询"
   ```

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
- [finclip-agent 文档](https://github.com/Geeksfino/finclip-agent)
- [kb-mcp-server 文档](https://github.com/Geeksfino/kb-mcp-server)
