$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$cachePath = Join-Path $projectRoot '.cache'
New-Item -ItemType Directory -Force -Path $cachePath | Out-Null
$slugs = @('a-level-61-math1', 'a-level-62-math2', 'a-level-64-phy', 'a-level-65-chem', 'a-level-66-bio', 'a-level-70-soc', 'a-level-81-thai', 'a-level-82-eng')
Invoke-WebRequest 'https://www.mytcas.com/blueprint/' -OutFile (Join-Path $cachePath 'index.html')
foreach ($slug in $slugs) {
    Invoke-WebRequest "https://www.mytcas.com/blueprint/$slug/" -OutFile (Join-Path $cachePath "$slug.html")
    Write-Output "Fetched $slug"
}
# Import is deliberately separate: review changes before publishing refreshed data.
