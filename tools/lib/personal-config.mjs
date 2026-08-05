#!/usr/bin/env node

import os from 'node:os';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const personalDir = path.join(os.homedir(), '.cursor-personal');
const configPath = path.join(personalDir, 'config.json');

export function getPersonalConfigPath() {
  return configPath;
}

export function loadPersonalConfig() {
  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const raw = readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function savePersonalConfig(config) {
  if (!existsSync(personalDir)) {
    mkdirSync(personalDir, { recursive: true });
  }

  const sanitized = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  writeFileSync(configPath, JSON.stringify(sanitized, null, 2), 'utf8');
}
