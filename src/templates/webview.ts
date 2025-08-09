export const getWebviewContent = (nonce: string): string => {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https://api.github.com;">
            <title>Context Switch Reducer</title>
            <style>
                body {
                    padding: 10px;
                }
                .refresh-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    cursor: pointer;
                    margin-bottom: 10px;
                }
                .refresh-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .last-updated {
                    font-size: 0.8em;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 10px;
                }
                .workflow-item {
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 1px solid var(--vscode-widget-border);
                }
                .repo-selector {
                    margin-bottom: 15px;
                }
                .repo-selector input {
                    padding: 5px;
                    margin-right: 5px;
                }
            </style>
        </head>
        <body>
            <h2>GitHub Actions Status</h2>
            <div class="repo-selector">
                <input type="text" id="repoInput" placeholder="owner/repo" value="vercel/next.js">
                <button class="refresh-button" onclick="updateRepo()">Set Repository</button>
            </div>
            <button class="refresh-button" onclick="manualRefresh()">Refresh</button>
            <div class="last-updated" id="lastUpdated"></div>
            <div id="loading">Loading...</div>
            <ul id="actions"></ul>

            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                const REFRESH_INTERVAL = 30000;
                const cache = new Map();
                const CACHE_DURATION = 60000;
                let currentRepo = 'vercel/next.js';
                let lastDataHash = '';

                async function fetchWithCache(url) {
                    const now = Date.now();
                    if (cache.has(url)) {
                        const { data, timestamp } = cache.get(url);
                        if (now - timestamp < CACHE_DURATION) {
                            return data;
                        }
                    }
                    
                    const response = await fetch(url);
                    const data = await response.json();
                    cache.set(url, { data, timestamp: now });
                    return data;
                }

                async function fetchActions() {
                    try {
                        document.getElementById('loading').style.display = 'block';
                        
                        const [workflows, runs] = await Promise.all([
                            fetchWithCache(\`https://api.github.com/repos/\${currentRepo}/actions/workflows\`),
                            fetchWithCache(\`https://api.github.com/repos/\${currentRepo}/actions/runs\`)
                        ]);

                        const dataHash = JSON.stringify({ workflows, runs });
                        if (lastDataHash === dataHash) {
                            document.getElementById('loading').style.display = 'none';
                            return;
                        }
                        lastDataHash = dataHash;

                        document.getElementById('loading').style.display = 'none';
                        const list = document.getElementById('actions');
                        list.innerHTML = '';
                        
                        if (runs.workflow_runs?.length) {
                            runs.workflow_runs.slice(0, 5).forEach((run) => {
                                const workflow = workflows.workflows?.find(w => w.id === run.workflow_id);
                                const li = document.createElement('li');
                                li.innerHTML = \`
                                    <div class="workflow-item">
                                        <strong>\${workflow?.name || run.name}</strong>
                                        <div>Status: \${run.status || 'unknown'}</div>
                                        <div>Conclusion: \${run.conclusion || 'pending'}</div>
                                        <div>Started: \${new Date(run.created_at).toLocaleString()}</div>
                                        <div><a href="\${run.html_url}" target="_blank">View on GitHub</a></div>
                                    </div>
                                \`;
                                list.appendChild(li);
                            });
                        } else {
                            list.innerHTML = '<li>No workflow runs found</li>';
                        }

                        document.getElementById('lastUpdated').textContent = 
                            'Last updated: ' + new Date().toLocaleTimeString();

                    } catch (error) {
                        console.error(error);
                        document.getElementById('loading').textContent = 
                            'Error: ' + (error.message || 'Unknown error');
                    }
                }

                const throttledFetch = (() => {
                    let lastCall = 0;
                    const MIN_INTERVAL = 5000;
                    
                    return () => {
                        const now = Date.now();
                        if (now - lastCall >= MIN_INTERVAL) {
                            lastCall = now;
                            fetchActions();
                        }
                    };
                })();

                function updateRepo() {
                    const newRepo = document.getElementById('repoInput').value;
                    if (newRepo && newRepo.includes('/')) {
                        currentRepo = newRepo;
                        cache.clear();
                        fetchActions();
                    }
                }

                function manualRefresh() {
                    throttledFetch();
                }

                // Initial fetch
                fetchActions();
                setInterval(throttledFetch, REFRESH_INTERVAL);
            </script>
        </body>
        </html>`;
};