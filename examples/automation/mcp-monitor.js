#!/usr/bin/env node

/**
 * MCP Monitor - Automatically restart problematic MCP servers (Scaffold-Ready)
 * 
 * This script monitors MCP server health and restarts them when they fail.
 * Run this in the background to keep your MCPs healthy.
 * 
 * This script is scaffold-ready and will work with any project type:
 * - Detects MCP configuration automatically
 * - Gracefully handles missing MCP configurations
 * - Provides helpful setup guidance
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MCPMonitor {
  constructor() {
    this.mcpConfigPath = path.join(__dirname, '..', '.cursor', 'mcp.json');
    this.logFile = path.join(__dirname, '..', 'artifacts', 'mcp-monitor.log');
    this.runningServers = new Map();
    this.restartCounts = new Map();
    this.maxRestarts = 3;
    this.checkInterval = 30000; // 30 seconds
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    
    // Ensure artifacts directory exists
    const artifactsDir = path.dirname(this.logFile);
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    
    fs.appendFileSync(this.logFile, logMessage);
  }

  async loadMCPConfig() {
    try {
      if (!fs.existsSync(this.mcpConfigPath)) {
        this.log('⚠️  MCP configuration not found. This is a scaffold template.');
        this.log('💡 To use MCP monitoring, create .cursor/mcp.json with your MCP server configurations.');
        this.log('📚 See docs/MCP_SETUP_GUIDE.md for setup instructions.');
        return {};
      }
      
      const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, 'utf8'));
      return config.mcpServers || {};
    } catch (error) {
      this.log(`Error loading MCP config: ${error.message}`);
      return {};
    }
  }

  async startMCPServer(name, config) {
    try {
      this.log(`Starting MCP server: ${name}`);
      
      const args = config.args || [];
      const env = { ...process.env, ...config.env };
      
      const server = spawn(config.command, args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      server.on('error', (error) => {
        this.log(`MCP server ${name} error: ${error.message}`);
        this.handleServerFailure(name, error.message);
      });

      server.on('exit', (code, signal) => {
        this.log(`MCP server ${name} exited with code ${code}, signal ${signal}`);
        if (code !== 0) {
          this.handleServerFailure(name, `Exited with code ${code}`);
        }
      });

      server.stdout.on('data', (data) => {
        this.log(`MCP ${name} stdout: ${data.toString().trim()}`);
      });

      server.stderr.on('data', (data) => {
        this.log(`MCP ${name} stderr: ${data.toString().trim()}`);
      });

      this.runningServers.set(name, server);
      this.log(`MCP server ${name} started successfully`);
      
      return server;
    } catch (error) {
      this.log(`Failed to start MCP server ${name}: ${error.message}`);
      this.handleServerFailure(name, error.message);
    }
  }

  handleServerFailure(name, reason) {
    const restartCount = this.restartCounts.get(name) || 0;
    
    if (restartCount >= this.maxRestarts) {
      this.log(`MCP server ${name} has failed ${restartCount} times. Giving up.`);
      return;
    }

    this.log(`MCP server ${name} failed: ${reason}. Restarting... (${restartCount + 1}/${this.maxRestarts})`);
    
    // Stop the current server
    const server = this.runningServers.get(name);
    if (server) {
      server.kill();
      this.runningServers.delete(name);
    }

    // Increment restart count
    this.restartCounts.set(name, restartCount + 1);

    // Restart after a delay
    setTimeout(async () => {
      const config = await this.loadMCPConfig();
      if (config[name]) {
        await this.startMCPServer(name, config[name]);
      }
    }, 5000); // 5 second delay
  }

  async startAllServers() {
    const config = await this.loadMCPConfig();
    
    if (Object.keys(config).length === 0) {
      this.log('No MCP servers configured. Monitor will run but no servers will be started.');
      this.log('💡 Add MCP server configurations to .cursor/mcp.json to enable monitoring.');
      return;
    }
    
    this.log(`Found ${Object.keys(config).length} MCP server configurations`);
    
    for (const [name, serverConfig] of Object.entries(config)) {
      if (serverConfig.command && serverConfig.args) {
        await this.startMCPServer(name, serverConfig);
        // Small delay between starts
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async monitor() {
    this.log('MCP Monitor started');
    
    // Start all servers initially
    await this.startAllServers();
    
    // Monitor every 30 seconds
    setInterval(async () => {
      this.log('Performing health check...');
      
      for (const [name, server] of this.runningServers) {
        if (server.killed || server.exitCode !== null) {
          this.log(`MCP server ${name} is not running. Restarting...`);
          this.handleServerFailure(name, 'Server not running');
        }
      }
    }, this.checkInterval);
  }

  stop() {
    this.log('Stopping MCP Monitor...');
    
    for (const [name, server] of this.runningServers) {
      this.log(`Stopping MCP server: ${name}`);
      server.kill();
    }
    
    this.runningServers.clear();
    this.log('MCP Monitor stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Shutting down gracefully...');
  if (global.mcpMonitor) {
    global.mcpMonitor.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Shutting down gracefully...');
  if (global.mcpMonitor) {
    global.mcpMonitor.stop();
  }
  process.exit(0);
});

// Start the monitor
if (require.main === module) {
  const monitor = new MCPMonitor();
  global.mcpMonitor = monitor;
  monitor.monitor().catch(console.error);
}

module.exports = MCPMonitor;
