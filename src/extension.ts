import * as vscode from 'vscode';
import { ContextSwitchSidebarProvider } from './ContextSwitchSidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new ContextSwitchSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'contextSwitchSidebar',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
    vscode.window.showInformationMessage('Context Switch Reducer is now active!');

}

export function deactivate() { }