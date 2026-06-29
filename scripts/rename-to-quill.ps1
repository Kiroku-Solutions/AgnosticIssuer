$root = 'T:\Kiroku\AgnosticIssuer'
$excludeDirs = @('.git', 'node_modules', '.svelte-kit', 'build', 'coverage', '.mavis', '.kiroku-ai', '.agent', '.gemini', '.vscode', '.github')
$extensions = @('.ts', '.svelte', '.js', '.mjs', '.cjs', '.json', '.md', '.css', '.html', '.svg', '.toml', '.yml', '.yaml')
$namedFiles = @('AGENTS.md', 'README.md', 'GEMINI.md', 'PRODUCT.md', '_headers', '_redirects')

function Should-Skip($path, $excludeDirs) {
  foreach ($d in $excludeDirs) {
    if ($path -match ('[/\\]' + [regex]::Escape($d) + '($|/|\\)')) { return $true }
  }
  return $false
}

$files = Get-ChildItem -Path $root -Recurse -File -Force |
  Where-Object { -not (Should-Skip $_.FullName $excludeDirs) } |
  Where-Object { $extensions -contains $_.Extension -or $namedFiles -contains $_.Name }

$totalChanged = 0
$report = @()
foreach ($f in $files) {
  $content = [System.IO.File]::ReadAllText($f.FullName)
  $original = $content
  # Order matters: most specific patterns first
  $content = $content -replace 'nomad-md-folder', 'quill-md-folder'
  $content = $content -replace 'nomad-md-handle', 'quill-md-handle'
  $content = $content -replace 'nomad-md', 'quill-md'
  $content = $content -replace '\.nomad\.md', '.quill.md'
  $content = $content -replace 'nomad\.md', 'quill.md'
  $content = $content -replace '\bnomad\b', 'quill'
  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    $totalChanged++
    $report += $f.FullName.Substring($root.Length + 1)
  }
}
Write-Host "Files changed: $totalChanged"
Write-Host "---"
$report | Sort-Object | ForEach-Object { Write-Host $_ }
