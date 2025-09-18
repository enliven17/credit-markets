$ErrorActionPreference = 'Stop'
$paths = @('src', 'README.md')
$include = '*.ts','*.tsx','*.md'
$enc = New-Object System.Text.UTF8Encoding($false)

Get-ChildItem -Recurse -Path $paths -Include $include | ForEach-Object {
  $p = $_.FullName
  $t = [System.IO.File]::ReadAllText($p)
  $u = $t -replace 'Flow Wager','Credit Predict' -replace 'FlowWager','Credit Predict'
  if ($u -ne $t) {
    [System.IO.File]::WriteAllText($p, $u, $enc)
    Write-Host "Updated: $p"
  }
}

Write-Host "Brand rename completed."

