# download-libs.ps1
# Run this from inside aaron-portfolio/ folder:
#   PowerShell -ExecutionPolicy Bypass -File download-libs.ps1

$libs = @{
    "libs/gsap.min.js"            = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
    "libs/ScrollTrigger.min.js"   = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
    "libs/three.min.js"           = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    "libs/OBJLoader.js"           = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"
}

New-Item -ItemType Directory -Force -Path "libs" | Out-Null

foreach ($dest in $libs.Keys) {
    $url = $libs[$dest]
    Write-Host "Downloading $dest ..." -NoNewline
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
        $size = (Get-Item $dest).Length
        Write-Host " OK ($([math]::Round($size/1KB)) KB)" -ForegroundColor Green
    } catch {
        Write-Host " FAILED: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! Refresh your browser." -ForegroundColor Cyan
