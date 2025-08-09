import * as vscode from 'vscode';
import { getWebviewContent } from './templates/webview';


export class ContextSwitchSidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _disposables: vscode.Disposable[] = [];

    constructor(private readonly extensionUri: vscode.Uri) { }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
            // Enable CORS for GitHub API
            enableForms: true,
            enableCommandUris: true
        };

        // Set content security policy
        const nonce = this.getNonce();
        setTimeout(() => {
            if (this._view) {
                this._view.webview.html = getWebviewContent(nonce);
            }
        }, 0);
        webviewView.onDidDispose(() => {
            this._disposables.forEach(d => d.dispose());
        });
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}