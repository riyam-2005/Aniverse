---
name: mcp-ecosystem
description: >-
  Provides operational instructions, commands, and troubleshooting runbooks for
  managing, testing, and authenticating Model Context Protocol (MCP) servers
  (Playwright, Supabase, Figma, Magic UI, GitHub, Inspector) in Antigravity IDE.
---

# MCP Ecosystem Operational Runbook

This skill outlines how to verify, authenticate, and debug Model Context Protocol (MCP) servers configured in Antigravity IDE for the **AniVerse** project.

---

## 1. Global MCP Configuration

The primary configuration file is located at:
`~/.gemini/config/mcp_config.json`

To inspect the current active configuration from PowerShell:
```powershell
Get-Content "$env:USERPROFILE\.gemini\config\mcp_config.json" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 2. Server Authentication & Credentials

Update the environment variable values in `~/.gemini/config/mcp_config.json` to enable authenticated features:

### Supabase (`supabase`)
- **Required**: `SUPABASE_ACCESS_TOKEN` (Personal access token from Supabase Dashboard > Account > Access Tokens)
- **Required**: `PROJECT_REF` (Your Supabase project ID, e.g. from `supabase status` or dashboard URL)
- **Capabilities**: Schema introspection, SQL query execution, RLS policy verification.

### GitHub (`github`)
- **Required**: `GITHUB_PERSONAL_ACCESS_TOKEN` (Classic PAT or fine-grained token with `repo` and `read:org` scopes)
- **Runtime**: Runs via Docker container `ghcr.io/github/github-mcp-server`.

### Figma Context (`figma-context`)
- **Required**: `FIGMA_API_KEY` (Generated in Figma Account Settings > Personal access tokens).
- **Capabilities**: Extracts layout frames, typography, colors, and design components.

### 21st.dev Magic (`magic-ui`)
- **Required**: `API_KEY` (Obtained from [21st.dev](https://21st.dev)).
- **Capabilities**: Natural language component generation, theme token synthesis.

---

## 3. Testing & Inspecting Servers

### A. Testing Playwright MCP
Microsoft's official Playwright MCP server provides automated browser actions:
```bash
npx -y @playwright/mcp@latest --help
```
When invoked by Antigravity IDE, Playwright can open browser sessions, click elements, fill forms, and take screenshots to validate AniVerse UI states.

### B. Launching the MCP Inspector
To interactively test, debug, and inspect all tool schemas, resources, and prompt endpoints:
```bash
npx -y @modelcontextprotocol/inspector@latest
```
Open `http://localhost:5173` to view the graphical inspector. You can attach any MCP server command (e.g. `npx -y @playwright/mcp@latest`) and trigger tools manually.

---

## 4. Troubleshooting MCP Issues

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `Command failed: npx` | Node.js not found in PATH | Ensure Node.js v18+ is installed and available in system PATH (`node -v`). |
| `Docker daemon not running` (GitHub server) | Docker Desktop is stopped | Start Docker Desktop or use a personal access token with the GitHub CLI instead. |
| `Unauthorized / 401` | Missing or expired token | Refresh the token in `~/.gemini/config/mcp_config.json` and restart the IDE session. |
| `Port conflict on 5173` | Inspector port already in use | Pass `--port <custom-port>` when executing `@modelcontextprotocol/inspector`. |
