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

        // Retrieve the excluded extensions setting
        const excludedExtensions: string[] = vscode.workspace
        .getConfiguration('ClipSnap')
        .get<string[]>('excludeExtensions', []);

        // Recursively gather all file URIs from the selection
        const allFileUris: vscode.Uri[] = [];
        for (const uri of uris) {
          const files = await getAllFilesRecursively(uri);
          allFileUris.push(...files);
        }

        // Filter files based on excluded extensions
        const filteredFileUris = allFileUris.filter((fileUri) => {
          const ext = path.extname(fileUri.fsPath).toLowerCase();
          return !excludedExtensions.includes(ext);
        });

        // If more than 10 files selected, ask the user if they want to proceed
        if (filteredFileUris.length > 10) {
          const choice = await vscode.window.showWarningMessage(
            `You have selected ${filteredFileUris.length} files. This could take a while. Continue?`,
            { modal: true },
            'Yes',
          );
          if (choice !== 'Yes') {
            vscode.window.showInformationMessage('Copy operation canceled by user.');
            return;
          }
        }

        // Run the file reading + snapshot building in a progress UI
        let snapshot = '';
        let canceled = false;

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Copying Snapshot...',
            cancellable: true
          },
          async (progress, token) => {
            progress.report({ increment: 0, message: 'Starting...' });

            // We'll increment by this amount after each file is processed
            const incrementPerFile = 100 / filteredFileUris.length;

            for (let i = 0; i < filteredFileUris.length; i++) {
              const fileUri = filteredFileUris[i];

              // Check if the user canceled via the progress UI
              if (token.isCancellationRequested) {
                canceled = true;
                break;
              }

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

                // Update progress message
                progress.report({
                  increment: incrementPerFile,
                  message: `Reading file: ${relativePath}`
                });

                // Read file contents
                const fileBytes = await vscode.workspace.fs.readFile(fileUri);
                const fileContent = new TextDecoder().decode(fileBytes);

                snapshot += `File: ${relativePath}\n`;
                snapshot += `Contents:\n${fileContent}\n`;
                snapshot += `---\n\n`;
              }
            }
          }
        );

        if (canceled) {
          vscode.window.showInformationMessage('Copy operation canceled.');
          return;
        }

        // Copy the snapshot to the clipboard if not canceled
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