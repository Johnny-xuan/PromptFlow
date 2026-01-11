<p align="center">
  <img src="./Refined_Transparent_Icon.png" alt="PromptFlow Logo" width="120">
</p>

# PromptFlow

<p align="center">
  A lightweight prompt management tool with local Markdown storage, favorites/templates organization, AI-powered polishing, and global hotkey for instant access.
</p>

## Features

- **Local Markdown Storage** — Data stays on your machine, easy to backup and migrate
- **Favorites & Templates** — Organize prompts with tags and descriptions
- **AI Polishing** — Built-in presets to refine your prompts professionally
- **Global Hotkey** — Press `⌥ Space` (macOS) or `Ctrl+Space` (Windows/Linux) to summon from anywhere
- **Starter Templates** — 6 official templates included (Gemini, Claude Code, OpenAI GPT‑5.2)
- **Privacy First** — API Key stored locally only, never uploaded

## Quick Start

### Development
```bash
pnpm install
pnpm tauri dev
```

### Build
```bash
pnpm build
pnpm tauri build
```

Build artifacts are located in `src-tauri/target/release/bundle/` (.dmg for macOS, .exe for Windows).

## Data Location

- **Config & Data**: `~/Documents/PromptFlow/`
- **Backup**: Copy the entire `PromptFlow` directory
- **Migration**: Select the same directory on a new machine

## Permissions & Security

### macOS
Global hotkey requires Accessibility permission. You will be prompted on first use.

### API Key Storage
API Key is stored in plaintext in local `config.json`. It is **never uploaded**.  
Rotate your API Key periodically and avoid using on shared devices.

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Issues and Pull Requests are welcome.  
Recommended IDE: VS Code + Tauri + rust-analyzer.
