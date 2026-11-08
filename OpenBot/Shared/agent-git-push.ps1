# Agent State Push Script
# Run after completing work to save state to GitHub

$ErrorActionPreference = 'Stop'
$RepoRoot = "C:\Users\TAUSHEF"
$AgentId = $env:AGENT_ID
$TaskResult = $env:AGENT_RESULT
$Status = $env:AGENT_STATUS

Write-Host "=== Pushing state for Agent: $AgentId ===" -ForegroundColor Cyan

# Update state file
$statePath = Join-Path $RepoRoot "OpenBot\Shared\agent-state.json"
$state = Get-Content $statePath -Raw | ConvertFrom-Json
$state.lastUpdated = (Get-Date).ToString("o")
$state.agents.$AgentId = @{
    status = $Status
    task = $env:AGENT_TASK
    result = $TaskResult
    lastActive = (Get-Date).ToString("o")
}
$state | ConvertTo-Json -Depth 10 | Set-Content $statePath

# Commit and push
git -C $RepoRoot add OpenBot/Shared/agent-state.json OpenBot/Shared/Leads/ OpenBot/Shared/Reports/ OpenBot/Shared/Data/ 2>$null
$commitMsg = "Agent $AgentId : $Status - $TaskResult"
git -C $RepoRoot commit -m $commitMsg 2>$null
$pushResult = git -C $RepoRoot push 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "State pushed to GitHub successfully!" -ForegroundColor Green
} else {
    Write-Host "Push result: $pushResult" -ForegroundColor Yellow
}