# Runs automatically as a Claude Code "Stop" hook (see .claude/settings.json)
# every time a response finishes -- commits whatever changed during that
# turn, so nothing depends on remembering to ask for a commit. Deliberately
# tied to "end of turn" rather than "end of every single file edit": by the
# time a response finishes, whatever it changed has already been verified
# (type-checked, etc.), so this is the closest available proxy for "this is
# a settled, intentional change" without needing a human judgment call baked
# into a shell script. This does mean commits land at whatever granularity a
# turn happens to be, not a hand-curated one -- more, smaller commits than a
# person would choose, but everything really is backed up, which was the
# actual goal.
Set-Location -Path (Join-Path $PSScriptRoot "..")

$status = git status --porcelain
if (-not $status) {
    exit 0
}

$files = $status | ForEach-Object { $_.Substring(3).Trim() }
$shown = ($files | Select-Object -First 5) -join ', '
$remainder = $files.Count - 5
if ($remainder -gt 0) {
    $shown = "$shown, and $remainder more"
}

git add -A
git commit -m "Auto-checkpoint: $shown" -q
