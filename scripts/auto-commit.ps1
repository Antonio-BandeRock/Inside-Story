# Runs automatically as a Claude Code "Stop" hook (see .claude/settings.json)
# every time a response finishes. Two modes:
#
# - Default (no -Force): a time-gated safety net. Skips committing if fewer
#   than 15 minutes have passed since the last commit, even if there are
#   pending changes -- this fires on every single turn, so without the gate
#   it produced a new commit per turn, including mid-iteration tweaks (e.g.
#   the 7+ rounds it took to land on one tab color), which was more noise
#   than the "backed up" goal actually needed.
# - -Force: skips the time gate entirely. Used deliberately (by Claude,
#   from its own judgment about when a real checkpoint has been reached --
#   a feature finished and verified, not just another back-and-forth tweak)
#   rather than by this script's own logic, since "does this feel done and
#   good" isn't something a shell script can judge on its own.
#
# Either way, this only ever commits when something actually changed --
# never an empty commit.
param(
    [switch]$Force
)

Set-Location -Path (Join-Path $PSScriptRoot "..")

$status = git status --porcelain
if (-not $status) {
    exit 0
}

if (-not $Force) {
    $lastCommitEpoch = git log -1 --format=%ct 2>$null
    if ($lastCommitEpoch) {
        $lastCommitTime = [DateTimeOffset]::FromUnixTimeSeconds([int64]$lastCommitEpoch).UtcDateTime
        $elapsedMinutes = ((Get-Date).ToUniversalTime() - $lastCommitTime).TotalMinutes
        if ($elapsedMinutes -lt 15) {
            exit 0
        }
    }
}

$files = $status | ForEach-Object { $_.Substring(3).Trim() }
$shown = ($files | Select-Object -First 5) -join ', '
$remainder = $files.Count - 5
if ($remainder -gt 0) {
    $shown = "$shown, and $remainder more"
}

$label = if ($Force) { 'Checkpoint' } else { 'Auto-checkpoint' }
git add -A
git commit -m "${label}: $shown" -q
