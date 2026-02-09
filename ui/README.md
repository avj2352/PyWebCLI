# React XTerm App

A modern terminal emulator application built with React, TypeScript, and Vite, featuring xterm.js integration for a full-featured terminal experience in the browser.

## Features

- 🚀 **Fast Development**: Powered by Vite for lightning-fast HMR (Hot Module Replacement)
- 💻 **Terminal Emulator**: Full-featured terminal interface using [@xterm/xterm](https://www.npmjs.com/package/@xterm/xterm)
- 🔍 **Search Functionality**: Built-in terminal text search with @xterm/addon-search
- 🔗 **Web Links**: Automatic URL detection and clickable links with @xterm/addon-web-links
- 📐 **Responsive Layout**: Terminal auto-fitting with @xterm/addon-fit
- ⚡ **React 19**: Latest React features with React Compiler optimization
- 🎯 **TypeScript**: Full type safety and IntelliSense support
- 🎨 **Modern Tooling**: ESLint configuration with React-specific rules

## Tech Stack

- **React 19.2.0** - UI library with React Compiler for automatic optimization
- **TypeScript 5.9** - Type-safe development
- **Vite 7** - Next-generation build tool
- **xterm.js 6.0** - Terminal emulator component
- **ESLint 9** - Code quality and linting

## Getting Started

### Pre-requisite

This project is setup using Bun, to install bun follow these instructions

```bash
# using curl
curl -fsSL https://bun.sh/install | bash

# using npm
npm install -g bun

# using homebrew
brew install oven-sh/bun/bun

```
- To run the project, execute the following command: `bun run dev`
- To create a production build: `bun run build`
- To preview production build locally: `bun run preview`

## Why Bun?

This project uses Bun for several advantages:

- ⚡ **Ultra-fast**: Up to 4x faster package installation than npm
- 📦 **All-in-one**: Runtime, package manager, bundler, and test runner
- 🔒 **Built-in lockfile**: Binary lockfile for faster, more reliable installs
- 🎯 **Drop-in replacement**: Compatible with npm scripts and packages
- 💾 **Efficient**: Lower memory usage and disk space

### Bun vs npm/yarn

| Command | npm | Bun |
|---------|-----|-----|
| Install packages | `npm install` | `bun install` |
| Run script | `npm run dev` | `bun run dev` or `bun dev` |
| Add package | `npm install <pkg>` | `bun add <pkg>` |
| Add dev package | `npm install -D <pkg>` | `bun add -d <pkg>` |
| Remove package | `npm uninstall <pkg>` | `bun remove <pkg>` |
| Execute file | `node file.js` | `bun file.js` |

### Quick Tips

- **Shorter commands**: Bun allows shorthand - use `bun dev` instead of `bun run dev`
- **Run TypeScript directly**: Execute `.ts` files without compilation - `bun src/file.ts`
- **Package management**: Use `bun add`, `bun remove`, and `bun update` for dependencies
- **Upgrade Bun**: Keep Bun up to date with `bun upgrade`

### Troubleshooting

If you encounter issues:

1. **Clear cache**: `rm -rf node_modules bun.lockb && bun install`
2. **Update Bun**: `bun upgrade`
3. **Check compatibility**: Some packages may require Node.js-specific features
4. **Fallback to Node**: If needed, you can still use `npm` or `yarn` commands

