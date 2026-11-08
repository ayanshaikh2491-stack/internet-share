# Agent Git Configuration
# Copy to agent workspace and run before any work

$ErrorActionPreference = 'Stop'
$RepoRoot = "C:\Users\TAUSHEF"
$AgentId = $env:AGENT_ID
$SharedDir = Join-Path $RepoRoot "OpenBot\Shared"

Write-Host "=== Git Setup for Agent: $AgentId ===" -ForegroundColor Cyan

# Ensure git identity
git -C $RepoRoot config user.name "OpenBot Agent ($AgentId)"
git -C $RepoRoot config user.email "agent-$AgentId@openbot.local"

# Pull latest shared state
Write-Host "Pulling latest state..." -ForegroundColor Yellow
try {
    $branch = (git -C $RepoRoot rev-parse --abbrev-ref HEAD).Trim()
    git -C $RepoRoot pull origin $branch 2>$null
    Write-Host "Pulled from $branch" -ForegroundColor Green
} catch {
    Write-Host "Pull skipped (no remote or up to date)" -ForegroundColor DarkYellow
}

# Load agent state
$statePath = Join-Path $SharedDir "agent-state.json"
if (Test-Path $statePath) {
    $state = Get-Content $statePath -Raw | ConvertFrom-Json
    $myState = $state.agents.$AgentId
    if ($myState) {
        Write-Host "Previous state: $($myState.status) - $($myState.task)" -ForegroundColor Magenta
    }
}

# Mark agent as active
$state.lastUpdated = (Get-Date).ToString("o")
$state.agents.$AgentId = @{
    status = "active"
    task = $env:AGENT_TASK
    lastActive = (Get-Date).ToString("o")
}
$state | ConvertTo-Json -Depth 10 | Set-Content $statePath

Write-Host "Agent $AgentId ready for work." -ForegroundColor Green
Write-Host "Shared state: $statePath" -ForegroundColor DarkGray