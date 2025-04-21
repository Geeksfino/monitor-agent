# Monitor Agent

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/powered%20by-Bun-orange.svg" alt="由 Bun 提供支持"></a>
  <a href="https://github.com/Geeksfino/finclip-agent"><img src="https://img.shields.io/badge/based%20on-finclip--agent-blue.svg" alt="基于 finclip-agent"></a>
  <a href="README.md">English</a> |
  <a href="README.zh-CN.md">简体中文</a>
</p>

一个专门用于监控 finclip-agent 对话的服务。该服务订阅由 finclip-agent 中的 NatsConversationHandler 发布的对话片段，并将其转发给一个正在运行的 cxagent 实例进行分析。

该服务作为一个由 `supervisor` 管理的 Docker 容器运行，同时运行监控逻辑 (`Monitor.ts`) 和底层的 cxagent (`scripts/start.js`)。

## 概述

Monitor 旨在与 finclip-agent 实例协同工作。它连接到 NATS 服务器以接收对话片段，并将其转发给嵌入的 cxagent 实例进行分析。

## 特性

- **NATS 集成**: 订阅由 finclip-agent 发布的对话片段。
- **对话转发**: 将对话转发给嵌入的 cxagent 实例进行分析。
- **LLM 驱动分析**: 利用 cxagent 的 LLM 能力进行对话分析。
- **Docker化**: 作为一个包含 `supervisor` 的自包含 Docker 镜像运行。
- **可配置**: NATS 连接可通过环境变量配置。
- **CI/CD**: 通过 GitHub Actions 自动构建并发布到 GitHub Container Registry。

## 先决条件

- [Docker](https://www.docker.com/) 和 Docker Compose (推荐)。
- NATS 服务器的访问权限。
- (可选) [Bun](https://bun.sh/) v1.2.0 或更高版本，用于本地开发。

## 使用 Docker 运行

这是运行 Monitor Agent 的推荐方式。

### 构建镜像

您可以在本地构建镜像：

```bash
# 导航到 monitor-agent 目录
cd monitor-agent

# 构建 Docker 镜像
docker build -t monitor-agent:latest .
```

或者，使用来自 GitHub Container Registry 的预构建镜像（请参阅 CI/CD 部分）。

### 运行容器

容器需要通过环境变量传递 NATS 服务器 URL。

```bash
docker run -it --rm \
  -e MONITOR_NATS_URL="nats://your-nats-server:4222" \
  ghcr.io/geeksfino/monitor-agent:latest
```

**将 `nats://your-nats-server:4222` 替换为您的实际 NATS 服务器地址。**

**连接到本地 NATS:**

如果您的 NATS 服务器直接运行在 Docker 主机（macOS 或 Windows）上，请使用 `host.docker.internal` 作为主机名：

```bash
docker run -it --rm \
  -e MONITOR_NATS_URL="nats://host.docker.internal:4222" \
  ghcr.io/geeksfino/monitor-agent:latest
```

**使用本地配置文件:**

您可以通过使用 `-v` 标志挂载本地文件/目录来覆盖镜像中内置的配置文件。这对于开发或在不重新构建镜像的情况下提供自定义设置很有用。

```bash
# 从 monitor-agent 目录运行
docker run -it --rm \
  -v "$(pwd)/conf":/app/conf \
  -v "$(pwd)/brain.md":/app/brain.md \
  -e MONITOR_NATS_URL="nats://host.docker.internal:4222" \
  ghcr.io/geeksfino/monitor-agent:latest
```

此命令将您的本地 `./conf` 目录挂载到容器内的 `/app/conf`，并将您的本地 `./brain.md` 挂载到容器内的 `/app/brain.md`。

## 配置

### NATS 连接 (`MONITOR_NATS_URL`)

- **主要方法 (Docker):** 在运行 Docker 容器时设置 `MONITOR_NATS_URL` 环境变量（例如，`-e MONITOR_NATS_URL="nats://your-server:4222"`）。
- **备用 / 本地开发:** 如果未设置环境变量，服务将尝试从 `conf/nats_subscriber.yml` 读取 URL。如果失败，则默认为 `nats://localhost:4222`。

```yaml
# conf/nats_subscriber.yml (备用配置)
enabled: true
nats:
  url: nats://localhost:4222 # 如果未设置 MONITOR_NATS_URL 环境变量，则使用此项
  subject: conversation.segments.>
```

### Agent LLM 配置 (`.agent.env`)

底层的 cxagent 需要 LLM API 凭据。如果您计划挂载本地配置，请在*您的本地项目检出*的根目录中创建一个 `.agent.env` 文件。**请勿提交此文件。**

```env
# .agent.env (OpenAI 示例)
AGENT_OPENAI_API_KEY=your_openai_api_key
AGENT_OPENAI_MODEL=gpt-4-turbo
```

当使用 Docker 运行并挂载 `conf` 目录时，如果 supervisor 启动的代理脚本需要，请确保 `.agent.env` 文件存在于*挂载的*目录中。然而，更好的实践通常是直接将 API 密钥等机密信息作为环境变量传递给 `docker run` 命令（例如 `-e AGENT_OPENAI_API_KEY=...`）。*注意：当前的 Dockerfile/supervisor 设置并未明确加载 `.agent.env`；这需要根据 `scripts/start.js` 如何处理环境变量进行验证。*

## 本地开发 / 测试

虽然推荐使用 Docker，但您可以在本地运行组件进行测试。

1.  **安装依赖:** `bun install`
2.  **运行测试发布者:** 使用测试脚本向您的 NATS 服务器发送示例消息。
    ```bash
    bun run tests/test-publisher.ts
    ```
    *(确保 `tests/test-publisher.ts` 和可能在 `conf/nats_subscriber.yml` 中的 NATS 服务器地址对于本地测试是正确的)*。
3.  **本地运行监控服务:**
    ```bash
    # 确保在您的 shell 中正确设置了 MONITOR_NATS_URL 或
    # 依赖 conf/nats_subscriber.yml
    bun scripts/run-monitor.js
    ```
4.  **本地运行 Agent:**
    ```bash
    # 需要 .agent.env 或环境变量来设置 API 密钥
    bun scripts/start.js
    ```

## CI/CD

该项目使用 GitHub Actions 在每次推送到 `main` 分支时自动构建 Docker 镜像并将其推送到 GitHub Container Registry (GHCR)。

- **工作流文件:** `.github/workflows/docker-build.yml`
- **发布的镜像:** `ghcr.io/geeksfino/monitor-agent` (标签: `latest` 和 commit SHA)
- **GHCR 包:** [https://github.com/orgs/Geeksfino/packages/container/package/monitor-agent](https://github.com/orgs/Geeksfino/packages/container/package/monitor-agent) (如果需要，请调整链接)

## 架构

### 组件

- **Monitor.ts**: 处理 NATS 订阅并将对话转发到 cxagent HTTP API。
- **scripts/start.js**: 标准 cxagent 启动脚本。
- **scripts/run-monitor.js**: 用于运行 Monitor.ts 服务的脚本。
- **conf/nats_subscriber.yml**: NATS 连接的备用配置。
- **conf/supervisord.conf**: Supervisor 配置，用于管理 Docker 容器内的 monitor 和 agent 进程。
- **Dockerfile**: 定义 Docker 镜像构建过程。

### 工作流程 (Docker 容器内部)

1.  `supervisord` 启动 `monitor` 进程 (`run-monitor.js`) 和 `agent` 进程 (`start.js`)。
2.  Monitor 连接到 NATS 服务器（主要使用 `MONITOR_NATS_URL`）并订阅对话片段。
3.  收到片段后，Monitor 将其格式化并通过 HTTP API 发送给 cxagent（在同一容器内本地运行）。
4.  cxagent 使用其 LLM 功能分析对话。
5.  分析结果打印到控制台（通过 supervisor 输出到 stdout）。

## 与 finclip-agent 集成

该监控服务旨在与 finclip-agent 中的 `NatsConversationHandler` 配合使用。

1.  确保在您的 finclip-agent 实例中配置并启用了 `NatsConversationHandler`。
2.  在 finclip-agent 和 Monitor Agent (`MONITOR_NATS_URL`) 中配置 NATS 服务器 URL，使其指向同一个 NATS 服务器。
3.  运行 finclip-agent 实例和 Monitor Agent Docker 容器。

由 finclip-agent 发布的对话片段将被 Monitor Agent 捕获，并由嵌入的 cxagent 进行分析。

## 未来增强

- 通过 MCP 服务器与通知提供商（电子邮件、Matrix、Telegram）集成。
- 用于监控和配置的 Web 界面。
- 高级过滤和模式识别。
- 对话历史和分析结果的持久存储。

## 许可证

该项目采用 MIT 许可证授权 - 详情请参阅 LICENSE 文件。
