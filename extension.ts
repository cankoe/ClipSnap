import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.copySnapshot',
    async (clickedItem: vscode.Uri, selectedItems?: vscode.Uri[]) => {
      try {
        // VS Code will pass in:
        //   clickedItem: The resource (file/folder) that was right-clicked
        //   selectedItems: An array of all items currently selected in the Explorer
        //
        // If the user triggered the command from the Command Palette (no right-click),
        // these might be undefined. We'll handle that gracefully.

        // Consolidate any URIs from the Explorer
        const uris = selectedItems && selectedItems.length > 0
          ? selectedItems
          : (clickedItem ? [clickedItem] : []);

        if (!uris || uris.length === 0) {
          vscode.window.showErrorMessage(
            'No files or folders selected. Please right-click in the Explorer or select items before running this command.'
          );
          return;
        }

        // Recursively gather all file URIs from the selection
        const allFileUris: vscode.Uri[] = [];
        for (const uri of uris) {
          const files = await getAllFilesRecursively(uri);
          allFileUris.push(...files);
        }

        // Build the snapshot text
        let snapshot = '';
        for (const fileUri of allFileUris) {
          // Only process if it’s actually a file (not a folder)
          const stat = await vscode.workspace.fs.stat(fileUri);
          if (stat.type === vscode.FileType.File) {
            // Determine relative path from the workspace folder
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
            const rootPath = workspaceFolder?.uri.fsPath;
            let relativePath: string;

            if (rootPath) {
              // Make the path relative to the root
              relativePath = path.relative(rootPath, fileUri.fsPath);
            } else {
              // If there's no workspace, just use the full absolute path
              relativePath = fileUri.fsPath;
            }

            // Read the file contents
            const fileBytes = await vscode.workspace.fs.readFile(fileUri);
            const fileContent = new TextDecoder().decode(fileBytes);

            snapshot += `File: ${relativePath}\n`;
            snapshot += `Contents:\n${fileContent}\n`;
            snapshot += `---\n\n`;
          }
        }

        // Copy the snapshot to the clipboard
        await vscode.env.clipboard.writeText(snapshot);

        vscode.window.showInformationMessage('Snapshot copied to clipboard!');
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to copy snapshot: ${err.message || err}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

/**
 * Recursively collects all files under the given URI.
 * If the URI is a single file, return just that file.
 * If the URI is a folder, walk its contents.
 */
async function getAllFilesRecursively(uri: vscode.Uri): Promise<vscode.Uri[]> {
  const result: vscode.Uri[] = [];

  const stat = await vscode.workspace.fs.stat(uri);
  if (stat.type === vscode.FileType.File) {
    // Single file
    result.push(uri);
  } else if (stat.type === vscode.FileType.Directory) {
    // Walk the directory
    const entries = await vscode.workspace.fs.readDirectory(uri);
    for (const [name, fileType] of entries) {
      const childUri = vscode.Uri.joinPath(uri, name);
      if (fileType === vscode.FileType.File) {
        result.push(childUri);
      } else if (fileType === vscode.FileType.Directory) {
        // Recursively process subfolders
        const subFiles = await getAllFilesRecursively(childUri);
        result.push(...subFiles);
      }
    }
  }

  return result;
}

export function deactivate() {}