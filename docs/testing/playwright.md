# Playwright MCP Server

This project now includes the Playwright MCP (Model Context Protocol) server for browser automation capabilities.

## Installation Status

✅ **Installed**: Playwright MCP server is ready to use

## Quick Start

### Basic Usage

```bash
# Run with default settings (headed mode)
npx @playwright/mcp@latest

# Run in headless mode
npx @playwright/mcp@latest --headless

# Run on specific port
npx @playwright/mcp@latest --port 3001
```

### Configuration

The `mcp-config.json` file contains default configuration settings:

- **Headed mode**: Browser window visible for debugging
- **Viewport**: 1280x720 pixels
- **Output directory**: `./playwright-output`
- **Trace saving**: Enabled for debugging

### Available Options

- `--headless`: Run browser in headless mode
- `--port <port>`: Specify port for SSE transport
- `--device <device>`: Emulate specific device (e.g., "iPhone 15")
- `--output-dir <path>`: Directory for output files
- `--save-trace`: Save Playwright trace for debugging
- `--viewport-size <size>`: Set browser viewport (e.g., "1920,1080")

### Integration with MCP Clients

The server provides browser automation capabilities through the Model Context Protocol, allowing AI assistants to:

- Navigate web pages
- Interact with page elements
- Take screenshots
- Extract page content
- Perform form submissions

### Requirements

- Node.js 18+ ✅ (Current: v22.18.0)
- Modern browser (Chrome/Chromium recommended)

### Troubleshooting

If you encounter issues:

1. Ensure Node.js version is 18 or higher
2. Check if port is available (default: varies)
3. Try running with `--no-sandbox` flag if needed
4. Use `--ignore-https-errors` for development sites

For more information, visit: https://github.com/microsoft/playwright-mcp
