const http = require('http')
const fs = require('fs')
const path = require('path')

// MCP Server configuration
const MCP_SERVER_URL = 'http://localhost:3001/mcp'

// Function to send MCP request
function sendMCPRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: method,
      params: params,
    })

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(postData),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          resolve(response)
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

// Main function to take screenshot
async function takeScreenshot() {
  try {
    console.log('🚀 Starting screenshot process...')

    // Initialize MCP connection
    console.log('📡 Connecting to MCP server...')
    const initResponse = await sendMCPRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
      clientInfo: {
        name: 'screenshot-client',
        version: '1.0.0',
      },
    })

    console.log('✅ MCP connection established')

    // List available tools
    console.log('🔍 Getting available tools...')
    const toolsResponse = await sendMCPRequest('tools/list')
    console.log('Available tools:', toolsResponse.result?.tools?.map((t) => t.name) || [])

    // Navigate to Google
    console.log('🌐 Navigating to google.com...')
    const navigateResponse = await sendMCPRequest('tools/call', {
      name: 'playwright_navigate',
      arguments: {
        url: 'https://google.com',
      },
    })

    console.log('Navigation result:', navigateResponse)

    // Wait a moment for page to load
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Take screenshot
    console.log('📸 Taking screenshot...')
    const screenshotResponse = await sendMCPRequest('tools/call', {
      name: 'playwright_screenshot',
      arguments: {
        name: 'google-homepage-screenshot.png',
      },
    })

    console.log('Screenshot result:', screenshotResponse)

    console.log('✅ Screenshot process completed!')
    console.log('📁 Check the playwright-output directory for the screenshot file.')
  } catch (error) {
    console.error('❌ Error taking screenshot:', error)
  }
}

// Run the screenshot function
takeScreenshot()
