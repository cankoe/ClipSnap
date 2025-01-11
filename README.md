# ClipSnap

A handy Visual Studio Code extension that quickly captures file paths and contents, then copies them straight to your clipboard. Perfect for quickly sharing snippets of code, logs, or just about any file text without manually copying each file individually.

## Features

- **Context Menu Integration**: Right-click on files or folders in the Explorer to copy a “snapshot” (path + contents) directly to your clipboard.
- **Multiple Selections**: Supports copying snapshots for multiple files/folders at once.
- **Recursive Folder Scan**: Recursively collects files in any selected folders, so you can grab all contents in a single command.
- **Path Relative to Workspace**: Automatically shows file paths relative to your current workspace (if available).

## Installation

1. **From the VS Code Marketplace** (recommended):
   1. Open the **Extensions** view in VS Code (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS).
   2. Search for `ClipSnap`.
   3. Click **Install**.

2. **From a VSIX package**:
   1. Download the latest `.vsix` file from the [Releases](#).
   2. In VS Code, open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run: `Extensions: Install from VSIX...`
   3. Select the downloaded `.vsix` file to complete installation.

3. **From source**:
   1. Clone this repository and open it in VS Code.
   2. Run `npm install` to install dependencies.
   3. Run `npm run compile` to build the extension.
   4. Press `F5` in VS Code to launch a new Extension Development Host.

## Usage

1. **Select items** in the Explorer (files or folders).
2. **Right-click** on one of the selected items.
3. Choose **“Copy Snapshot”**.
4. Wait for the notification—**“Snapshot copied to clipboard!”** 
5. Paste your snapshot anywhere (issue trackers, chat, documentation, LLMs, etc.)

Alternatively, you can use the **Command Palette**:
1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Search for **“Copy Snapshot”**.
3. Trigger the command to copy any selected files/folders (if none are selected, you’ll get an error message).

## Configuration

There are no special settings or configurations needed. Just install and go!

## Known Issues

- None so far! If you encounter any issues or have suggestions, please file a [GitHub Issue](#).

## Release Notes

### 0.0.4
- Adds setting `excludeExtensions` to exclude files with the extensions the user can define in vs code settings.

### 0.0.3
- Added Progress Bar.
- Added prompt to confirm if user selected >10 files.

### 0.0.2
- Initial public release.
- Added folder recursion to capture all files under a selected directory.
- Improved error handling for empty selections.

## Contributing

Contributions, suggestions, and improvements are welcome!
1. Fork the project.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request.

## License

This extension is licensed under the [MIT License](LICENSE).