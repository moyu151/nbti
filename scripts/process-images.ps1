Add-Type -AssemblyName System.Drawing
$src='G:\one\OneDrive\Desktop\images'
$dst='G:\work\code\nbti\assets\types'
New-Item -ItemType Directory -Force -Path $dst | Out-Null

$map = @{
  'bcs.png'='bcs.png';
  'bso.png'='bso.png';
  'bxc.png'='bxc.png';
  'bxe.png'='bxe.png';
  'cbc.png'='cbc.png';
  'cec.png'='cec.png';
  'eas.png'='eas.png';
  'easp.png'='eas-plus.png';
  'exs.png'='exs.png';
  'mxt.png'='mxt.png';
  'sace.png'='sace.png';
  'sbc.png'='sbc.png';
  'sea.png'='sea.png';
  'soc.png'='soc.png';
  'xeb.png'='xeb.png';
  'xoc.png'='xoc.png';
  'xos.png'='xos.png';
  'xsb.png'='xsb.png'
}

foreach($k in $map.Keys){
  $inPath = Join-Path $src $k
  if(-not (Test-Path -LiteralPath $inPath)){ continue }

  $img = [System.Drawing.Image]::FromFile($inPath)
  $side = [Math]::Min($img.Width, $img.Height)
  $x = [Math]::Floor(($img.Width - $side)/2)
  $y = [Math]::Floor(($img.Height - $side)/2)

  $targetSize = 400
  $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$targetSize,$targetSize)), (New-Object System.Drawing.Rectangle($x,$y,$side,$side)), [System.Drawing.GraphicsUnit]::Pixel)

  $outPath = Join-Path $dst $map[$k]
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Output (Split-Path $outPath -Leaf)
}
