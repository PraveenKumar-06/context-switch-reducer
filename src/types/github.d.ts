export interface GitHubWorkflow {
    id: number;
    name: string;
    path: string;
    state: string;
    html_url: string;
}

export interface GitHubWorkflowRun {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    workflow_id: number;
    html_url: string;
    created_at: string;
}

export interface GitHubWorkflowResponse {
    workflows: GitHubWorkflow[];
}

export interface GitHubWorkflowRunsResponse {
    workflow_runs: GitHubWorkflowRun[];
}