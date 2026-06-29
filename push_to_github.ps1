<#
push_to_github.ps1
Usage: Run this script from the project root. It will prompt for a GitHub PAT.
It will initialize git if needed, create a .gitignore, commit changes,
create a repo on GitHub (name default 'git-push' or you can change), add remote,
and push the main branch.

WARNING: Do not paste your PAT into chats. Revoke any tokens you've shared.
#>

Param(
    [string]$RepoName = 'git-push'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Running from: $(Get-Location)"

$secure = Read-Host -AsSecureString "Enter GitHub Personal Access Token (will not echo)"
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

function Ensure-GitInit {
    if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
        git init
        git config user.email "you@example.com"
        git config user.name "Your Name"
        Write-Host "Initialized git repository."
    } else {
        Write-Host "Git repository already initialized."
    }
}

function Ensure-Gitignore {
    if (-not (Test-Path .gitignore)) {
        $lines = @(
            "__pycache__/",
            "*.py[cod]",
            "env/",
            "venv/",
            ".env",
            ".vscode/",
            ".idea/",
            ".DS_Store",
            "*.egg-info/"
        )
        $lines | Out-File -Encoding utf8 .gitignore
        Write-Host "Created .gitignore"
    } else { Write-Host ".gitignore exists" }
}

function Commit-All {
    git add -A
    try { git commit -m "Initial commit"; Write-Host "Committed changes." } catch { Write-Host "No changes to commit." }
}

function Create-GitHubRepo {
    param($name)
    $body = @{ name = $name; description = "Pushed from local workspace"; private = $false } | ConvertTo-Json
    $resp = Invoke-RestMethod -Headers @{ Authorization = "token $token"; "User-Agent" = "powershell" } -Method Post -Uri "https://api.github.com/user/repos" -Body $body -ContentType "application/json"
    return $resp
}

try {
    Ensure-GitInit
    Ensure-Gitignore
    Commit-All

    Write-Host "Creating GitHub repo '$RepoName'..."
    try {
        $resp = Create-GitHubRepo -name $RepoName
    } catch {
        Write-Host "Failed to create repo named $RepoName. Trying with timestamp suffix..."
        $suffix = Get-Date -Format yyyyMMddHHmmss
        $RepoName = "${RepoName}-${suffix}"
        $resp = Create-GitHubRepo -name $RepoName
    }

    $clone = $resp.clone_url
    $html = $resp.html_url

    if (git remote get-url origin 2>$null) { git remote remove origin }
    git remote add origin $clone
    git branch -M main
    git push -u origin main

    Write-Host "Success. Repo URL: $html"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Details: $($_ | Out-String)"
    exit 1
}
