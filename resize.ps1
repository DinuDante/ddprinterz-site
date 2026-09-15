Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\dines\Documents\DinuDante.com\assets\brand\logo.png')
$bmp = New-Object System.Drawing.Bitmap 128, 128
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.DrawImage($img, 0, 0, 128, 128)
$bmp.Save('C:\Users\dines\Documents\DinuDante.com\assets\brand\logo-small.png', [System.Drawing.Imaging.ImageFormat]::Png)
$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
