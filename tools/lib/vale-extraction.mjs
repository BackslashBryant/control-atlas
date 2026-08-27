export function valeExtractionCommand(platform, archivePath, installDir) {
  if (platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${installDir}' -Force`,
      ],
    };
  }
  return {
    command: 'tar',
    args: [
      '--extract',
      '--gzip',
      '--file',
      archivePath,
      '--no-same-owner',
      '--directory',
      installDir,
    ],
  };
}
