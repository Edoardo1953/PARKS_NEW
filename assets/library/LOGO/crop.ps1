Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem "c:\Users\Edoardo\.gemini\antigravity\scratch\PARKS_NEW\assets\library\LOGO\*.png"
foreach ($f in $files) {
    if ($f.Name -match "cropped") { continue }
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $w = [Math]::Floor($img.Width / 2)
    $h = $img.Height
    # Let's crop the left half, and chop off the top 20% (the title) and bottom 10%
    $cropTop = [Math]::Floor($h * 0.20)
    $cropBottom = [Math]::Floor($h * 0.10)
    $cropH = $h - $cropTop - $cropBottom
    
    $rect = New-Object System.Drawing.Rectangle(0, $cropTop, $w, $cropH)
    $bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $newName = $f.FullName -replace "\.png", "-cropped.png"
    $bmp.Save($newName, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Output "Cropped $newName"
}
