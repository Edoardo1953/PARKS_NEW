# ============================================================
# PARKS - Server Locale (Porta 8080)
# Avvia: Click Destro > Esegui con PowerShell
# Browser: http://localhost:8080/user/homepage.html
# ============================================================

$port = 8080
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  *** PARKS App - Server Avviato! ***" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Apri il browser su: " -NoNewline
Write-Host "http://localhost:$port/user/homepage.html" -ForegroundColor Green
Write-Host ""
Write-Host "  Premi CTRL+C per fermare il server." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$port/user/homepage.html"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css"
    ".js"   = "application/javascript; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff2"= "font/woff2"
    ".woff" = "font/woff"
    ".ttf"  = "font/ttf"
    ".json" = "application/json"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # No-cache per garantire file aggiornati
        $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
        $response.Headers.Add("Pragma", "no-cache")
        $response.Headers.Add("Expires", "0")

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/user/homepage.html" }

        $filePath = Join-Path $root $urlPath.TrimStart("/").Replace("/", "\")

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 - File non trovato</h1><p>" + $filePath + "</p>")
            $response.ContentType = "text/html"
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Ignora errori di chiusura socket
    }
}
