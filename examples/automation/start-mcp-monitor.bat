@echo off
echo Starting MCP Monitor...
echo This will keep your MCP servers healthy and restart them when they fail.
echo Press Ctrl+C to stop.
echo.

cd /d "%~dp0.."
node scripts/mcp-monitor.js

pause
