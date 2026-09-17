# GitHub Reference Ecosystem & Architecture Catalog

This catalog documents the curated ecosystem of 27 reference repositories integrated into Antigravity IDE for **AniVerse**. These repositories provide architectural blueprints, Model Context Protocol (MCP) server integrations, autonomous agent patterns, and cutting-edge 3D/creative web UI references.

---

## 1. Model Context Protocol (MCP) Servers & Developer Tooling

Antigravity IDE integrates these servers via `~/.gemini/config/mcp_config.json` to empower autonomous agent pair programming, database management, and UI verification.

### [github/github-mcp-server](https://github.com/github/github-mcp-server)
* **Category**: VCS & Project Management
* **Role**: Context provider for GitHub repositories, pull requests, issue tracking, and git commits.
* **Usage in AniVerse**: Allows the agent to inspect pull requests, read GitHub discussions, manage issue triage, and push branches directly.
* **Runtime**: Docker (`ghcr.io/github/github-mcp-server`) with `GITHUB_PERSONAL_ACCESS_TOKEN`.

### [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
* **Category**: Browser Automation & E2E Testing
* **Role**: Official Microsoft Playwright Model Context Protocol server.
* **Usage in AniVerse**: Enables end-to-end browser execution, visual regression testing, snapshot verification, and headless browser navigation for AniVerse's Playwright test suite (`e2e/` folder).
* **Runtime**: `npx -y @playwright/mcp@latest`

### [supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)
* **Category**: Database & Backend Infrastructure
* **Role**: MCP server connecting agents directly to Supabase PostgreSQL, auth, storage, and edge functions.
* **Usage in AniVerse**: Deeply relevant to AniVerse's PostgreSQL backend (`supabase/migrations/`). Allows the agent to run database queries, inspect RLS policies, verify table schemas (`profiles`, `anime_library`, `watch_history`), and test SQL migrations.
* **Runtime**: `npx -y @supabase/mcp-server-supabase@latest` with `SUPABASE_ACCESS_TOKEN` and `PROJECT_REF`.

### [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP)
* **Category**: Design Systems & Visual Specs
* **Role**: Bridges Figma design nodes, layout trees, color tokens, and typography into LLM prompt context.
* **Usage in AniVerse**: Translates anime companion Figma wireframes, dark-mode gradients, glassmorphism specs, and hero banners directly into Tailwind CSS and React components.
* **Runtime**: `npx -y figma-developer-mcp@latest` with `FIGMA_API_KEY`.

### [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp)
* **Category**: AI UI Component Generation
* **Role**: 21st.dev MCP tool for generating beautiful, production-ready React components, Tailwind styles, and micro-interactions.
* **Usage in AniVerse**: Rapidly generates high-polish anime companion widgets (e.g. DNA archetype badges, streaming telemetry graphs, episode steppers).
* **Runtime**: `npx -y @21st-dev/magic@latest` with `API_KEY`.

### [idosal/mcp-ui](https://github.com/idosal/mcp-ui)
* **Category**: Visual MCP Interface & Tool Inspection
* **Role**: Web UI dashboard for inspecting, debugging, and executing MCP tool schemas and responses interactively.
* **Usage in AniVerse**: Visual debugging of multi-tool chains and agent tool payloads.

### [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
* **Category**: Reference Protocol Implementation
* **Role**: Official Anthropic repository of core reference MCP servers (Filesystem, Git, PostgreSQL, SQLite, Fetch, Puppeteer, Memory).
* **Usage in AniVerse**: Standard pattern library for implementing or tailoring custom in-house MCP tools.

### [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)
* **Category**: MCP Debugger & Protocol Verification
* **Role**: Official interactive developer console to inspect MCP tool schemas, resources, and prompt templates.
* **Usage in AniVerse**: Used to test connection health, tool registration, and payload responses across all configured servers.
* **Runtime**: `npx -y @modelcontextprotocol/inspector@latest`

---

## 2. AI & Autonomous Agent Architectures & Curricula

These repositories provide reference architectures, multi-agent coordination strategies, and machine learning foundations to elevate AniVerse's conversational AI ("Ask AniVerse") and personality profiling engines.

| Repository | Primary Focus | AniVerse Architectural Value |
| :--- | :--- | :--- |
| **[Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT)** | Autonomous multi-agent execution, planning loops, recursive subtasks | Blueprint for long-running agent workflows, background anime discovery, and multi-step reasoning loops. |
| **[microsoft/ML-For-Beginners](https://github.com/microsoft/ML-For-Beginners)** | 26-lesson structured curriculum on classic ML algorithms, NLP, regression | Mathematical and architectural foundation for anime genre clustering and tabular recommendation systems. |
| **[microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners)** | 24-lesson comprehensive AI curriculum covering neural nets, transformers, LLMs | Reference patterns for prompt engineering, token embeddings, and semantic search. |
| **[microsoft/machine-learning-collection](https://github.com/microsoft/machine-learning-collection)** | Production ML templates, PyTorch/ONNX models, deployment recipes | Reference notebooks for model quantization, vector indexing, and low-latency inference. |
| **[dotnet/machinelearning](https://github.com/dotnet/machinelearning)** | ML.NET high-performance cross-platform ML engine | Enterprise ML patterns, pipeline abstractions, model scoring, and prediction engines. |
| **[lightgbm-org/LightGBM](https://github.com/lightgbm-org/LightGBM)** | Fast, distributed gradient boosting decision tree framework | Benchmark for high-throughput ranking engines (e.g. ranking anime recommendations based on telemetry). |
| **[e2b-dev/awesome-ai-agents](https://github.com/e2b-dev/awesome-ai-agents)** | Curated ecosystem of production autonomous agent runtimes & sandboxes | Evaluates agent frameworks, secure sandbox execution, and tool-augmented LLM architectures. |
| **[kyrolabs/awesome-agents](https://github.com/kyrolabs/awesome-agents)** | Comprehensive list of intelligent agents, multi-agent frameworks, papers | Extensive reference directory for agent memory, self-reflection, tool use, and cognitive architectures. |
| **[ashishpatel26/500-AI-Agents-Projects](https://github.com/ashishpatel26/500-AI-Agents-Projects)** | 500 practical implementations of AI agents across domains | Implementation examples for agent grounding, API retrieval fallback, and conversational persona design. |

---

## 3. Modern 3D, WebGL & Creative Web Showcases

These repositories serve as design and implementation benchmarks for creating an unforgettable, state-of-the-art anime aesthetic in AniVerse (Three.js, React Three Fiber, WebGL shaders, smooth micro-interactions, dark neon palettes).

### 3D & WebGL Canvas Experiences
* **[giuucmp/aether-boilerplate](https://github.com/giuucmp/aether-boilerplate)**: Modern Three.js / React Three Fiber boilerplate with post-processing (bloom, vignette, chromatic aberration) and shader pipeline. Use for AniVerse's interactive 3D hero background and anime character viewer.
* **[shlokkhemani/ode-to-yosemite](https://github.com/shlokkhemani/ode-to-yosemite)**: Immersive 3D landscape experience with particle effects, ambient lighting, and smooth camera path transitions.
* **[cgr-ai/terrain_world_fable](https://github.com/cgr-ai/terrain_world_fable)**: Procedural 3D terrain exploration with dynamic lighting and camera controls.
* **[Braffolk/fable5-world-demo](https://github.com/Braffolk/fable5-world-demo)**: Interactive 3D world demo highlighting low-latency scene rendering and asset management.

### Creative Portfolios & Interactive UI
* **[adkotlorz/WebDeveloper-3D-Portfolio](https://github.com/adkotlorz/WebDeveloper-3D-Portfolio)**: Award-winning 3D web developer portfolio integrating interactive 3D rooms, physics-enabled models, and floating UI HUDs.
* **[himanshu8443/Portfolio](https://github.com/himanshu8443/Portfolio)**: Sleek, high-performance portfolio featuring smooth glassmorphism, gradient accents, and responsive layout transitions.
* **[nadjascodejourney/scrollr3fproject](https://github.com/nadjascodejourney/scrollr3fproject)**: Scroll-driven React Three Fiber camera choreographies. Provides the exact scroll-rigging pattern for AniVerse's landing page story flow.

### Modern Frontend & UI Showcases
* **[codewithmuh/fable5-websites](https://github.com/codewithmuh/fable5-websites)**: Collection of modern, dynamic website concepts featuring buttery-smooth micro-animations, hover states, and dark aesthetic layouts.
* **[az9713/fable-5-frontend-design](https://github.com/az9713/fable-5-frontend-design)**: Frontend design templates with high visual polish, fluid card grids, and neon accents.
* **[pulkitxm/claude-directory](https://github.com/pulkitxm/claude-directory)**: Clean, high-density directory showcase with instant filtering, keyboard navigation, and responsive drawer components.

---

## 4. AniVerse Integration Guidelines

When implementing new features or UI components in AniVerse:
1. **Glassmorphism & Neon Palette**: Combine Tailwind CSS styling with Three.js canvas backgrounds following patterns from `aether-boilerplate` and `fable5-websites`.
2. **Scroll-Driven Animation**: Structure scroll timelines using the camera control patterns in `scrollr3fproject`.
3. **Database & Migrations**: Verify all schema modifications against Supabase using `supabase-mcp` before committing.
4. **Automated Verification**: Run headless UI regression checks using `playwright-mcp` to ensure no visual regressions across viewport sizes.
