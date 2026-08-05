#!/usr/bin/env bash
# Purpose: Free common dev ports safely on POSIX
set -euo pipefail

PORTS=(${HTTP_PORT:-3000} ${API_PORT:-3001} ${WS_PORT:-3002})

kill_by_port() {
  local p="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti tcp:"$p" || true)
  else
    pids=$(netstat -anp 2>/dev/null | awk -v port=":$p" '$0 ~ port && $0 ~ /LISTEN/ {print $7}' | cut -d/ -f1 || true)
  fi
  if [ -n "${pids}" ]; then
    echo "Killing PIDs on :$p -> $pids"
    kill $pids 2>/dev/null || true
    sleep 0.3
    for pid in $pids; do
      pkill -9 -P "$pid" 2>/dev/null || true
    done
  else
    echo "No listeners on :$p"
  fi
}

for port in "${PORTS[@]}"; do
  kill_by_port "$port"
done

# common frameworks
pkill -f "node.*(next|vite|webpack|parcel|express|nuxt)" 2>/dev/null || true
pkill -f "(uvicorn|gunicorn|django|flask)" 2>/dev/null || true

echo "Ports freed."
