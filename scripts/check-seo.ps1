$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$pages = @(
    'index.html',
    'save-window-layout-windows-11.html',
    'open-multiple-apps-at-once-windows-11.html',
    'windows-virtual-desktop-alternative.html',
    'windows-workspace-hotkeys.html',
    'privacy.html',
    'terms.html',
    'refund.html'
)
$errors = [System.Collections.Generic.List[string]]::new()
$titles = @{}
$descriptions = @{}

function Add-Error([string]$message) { $errors.Add($message) }

foreach ($page in $pages) {
    $path = Join-Path $root $page
    if (-not (Test-Path -LiteralPath $path)) { Add-Error "$page is missing"; continue }
    $html = Get-Content -Raw -LiteralPath $path

    $titleMatches = [regex]::Matches($html, '<title>(.*?)</title>', 'Singleline')
    $descriptionMatches = [regex]::Matches($html, '<meta\s+name="description"\s+content="([^"]+)"', 'IgnoreCase')
    $canonicalMatches = [regex]::Matches($html, '<link\s+rel="canonical"\s+href="([^"]+)"', 'IgnoreCase')
    $h1Matches = [regex]::Matches($html, '<h1\b', 'IgnoreCase')

    if ($titleMatches.Count -ne 1) { Add-Error "$page must have one title" }
    if ($descriptionMatches.Count -ne 1) { Add-Error "$page must have one meta description" }
    if ($canonicalMatches.Count -ne 1) { Add-Error "$page must have one canonical URL" }
    if ($h1Matches.Count -ne 1) { Add-Error "$page must have one H1" }

    if ($titleMatches.Count -eq 1) {
        $title = $titleMatches[0].Groups[1].Value
        if ($titles.ContainsKey($title)) { Add-Error "$page duplicates the title in $($titles[$title])" } else { $titles[$title] = $page }
    }
    if ($descriptionMatches.Count -eq 1) {
        $description = $descriptionMatches[0].Groups[1].Value
        if ($descriptions.ContainsKey($description)) { Add-Error "$page duplicates the description in $($descriptions[$description])" } else { $descriptions[$description] = $page }
    }

    foreach ($script in [regex]::Matches($html, '<script\s+type="application/ld\+json">(.*?)</script>', 'Singleline,IgnoreCase')) {
        try { $null = $script.Groups[1].Value | ConvertFrom-Json } catch { Add-Error "$page contains invalid JSON-LD: $($_.Exception.Message)" }
    }

    foreach ($link in [regex]::Matches($html, '(?<!:)href="([^"]+)"', 'IgnoreCase')) {
        $href = $link.Groups[1].Value
        if ($href -match '^(https?:|mailto:|#)') { continue }
        $local = ($href -split '#')[0] -replace '\?.*$',''
        if (-not $local) { continue }
        if (-not (Test-Path -LiteralPath (Join-Path $root $local))) { Add-Error "$page links to missing $local" }
    }
}

foreach ($page in $pages[0..4]) {
    $html = Get-Content -Raw -LiteralPath (Join-Path $root $page)
    if ($html -notmatch 'assets/analytics-events\.js') { Add-Error "$page is missing conversion tracking" }
}

try { [xml]$sitemap = Get-Content -Raw -LiteralPath (Join-Path $root 'sitemap.xml') } catch { Add-Error "sitemap.xml is invalid XML: $($_.Exception.Message)" }
$sitemapUrls = @($sitemap.urlset.url.loc)
foreach ($page in $pages[0..4]) {
    $expected = if ($page -eq 'index.html') { 'https://suko.pro/' } else { "https://suko.pro/$page" }
    if ($expected -notin $sitemapUrls) { Add-Error "sitemap.xml is missing $expected" }
}

$robots = Get-Content -Raw -LiteralPath (Join-Path $root 'robots.txt')
if ($robots -match 'Disallow:\s*/share/' -or $robots -match 'Disallow:\s*/Workspace') { Add-Error 'robots.txt blocks an archived noindex page' }

if ($errors.Count) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "SEO checks passed for $($pages.Count) pages."
