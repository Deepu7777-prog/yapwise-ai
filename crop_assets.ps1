Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\deepu\Downloads\yapwise\frontend\public\yapwise_reference_concept.jpg"
$destDir = "C:\Users\deepu\Downloads\yapwise\frontend\public\assets\3d"

if (!(Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height
Write-Host "Source Image Size: $w x $h"

# 3 columns, 3 rows
$colW = [int]($w / 3)
$rowH = [int]($h / 3)

# 1. Screen 1: Login Hero Students (left portion of row 0, col 0)
$rectScreen1 = New-Object System.Drawing.Rectangle(0, 0, $colW, $rowH)
$bmpScreen1 = $bmp.Clone($rectScreen1, $bmp.PixelFormat)
$bmpScreen1.Save("$destDir\screen1_login_hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen1.Dispose()

# 2. Screen 2: Campus Hub Isometric (row 0, col 1)
$rectScreen2 = New-Object System.Drawing.Rectangle($colW, 0, $colW, $rowH)
$bmpScreen2 = $bmp.Clone($rectScreen2, $bmp.PixelFormat)
$bmpScreen2.Save("$destDir\screen2_campus_hub.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen2.Dispose()

# 3. Screen 3: Student Profile (row 0, col 2)
$rectScreen3 = New-Object System.Drawing.Rectangle(($colW * 2), 0, ($w - ($colW * 2)), $rowH)
$bmpScreen3 = $bmp.Clone($rectScreen3, $bmp.PixelFormat)
$bmpScreen3.Save("$destDir\screen3_profile_hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen3.Dispose()

# 4. Screen 4: Skill Assessment (row 1, col 0)
$rectScreen4 = New-Object System.Drawing.Rectangle(0, $rowH, $colW, $rowH)
$bmpScreen4 = $bmp.Clone($rectScreen4, $bmp.PixelFormat)
$bmpScreen4.Save("$destDir\screen4_assessment_hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen4.Dispose()

# 5. Screen 5: Career Roadmap (row 1, col 1)
$rectScreen5 = New-Object System.Drawing.Rectangle($colW, $rowH, $colW, $rowH)
$bmpScreen5 = $bmp.Clone($rectScreen5, $bmp.PixelFormat)
$bmpScreen5.Save("$destDir\screen5_roadmap_hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen5.Dispose()

# 6. Screen 6: AI Career Mentor (row 1, col 2)
$rectScreen6 = New-Object System.Drawing.Rectangle(($colW * 2), $rowH, ($w - ($colW * 2)), $rowH)
$bmpScreen6 = $bmp.Clone($rectScreen6, $bmp.PixelFormat)
$bmpScreen6.Save("$destDir\screen6_mentor_hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen6.Dispose()

# 7. Screen 7: Choose Speaking Character (row 2, col 0)
$rectScreen7 = New-Object System.Drawing.Rectangle(0, ($rowH * 2), $colW, ($h - ($rowH * 2)))
$bmpScreen7 = $bmp.Clone($rectScreen7, $bmp.PixelFormat)
$bmpScreen7.Save("$destDir\screen7_partners_hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen7.Dispose()

# 8. Screen 8: English Speaking Room (row 2, col 1)
$rectScreen8 = New-Object System.Drawing.Rectangle($colW, ($rowH * 2), $colW, ($h - ($rowH * 2)))
$bmpScreen8 = $bmp.Clone($rectScreen8, $bmp.PixelFormat)
$bmpScreen8.Save("$destDir\screen8_speaking_room.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen8.Dispose()

# 9. Screen 9: Session Complete Celebration (row 2, col 2)
$rectScreen9 = New-Object System.Drawing.Rectangle(($colW * 2), ($rowH * 2), ($w - ($colW * 2)), ($h - ($rowH * 2)))
$bmpScreen9 = $bmp.Clone($rectScreen9, $bmp.PixelFormat)
$bmpScreen9.Save("$destDir\screen9_celebration.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpScreen9.Dispose()

# Also crop individual character portraits for UI elements:
# Priya Student character (left 40% of Screen 3)
$cropPriya = New-Object System.Drawing.Rectangle(($colW * 2) + 20, 50, [int]($colW * 0.35), [int]($rowH * 0.85))
$bmpPriya = $bmp.Clone($cropPriya, $bmp.PixelFormat)
$bmpPriya.Save("$destDir\priya_student.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpPriya.Dispose()

# Female AI Mentor character (left 38% of Screen 6)
$cropMentor = New-Object System.Drawing.Rectangle(($colW * 2) + 20, $rowH + 50, [int]($colW * 0.35), [int]($rowH * 0.85))
$bmpMentor = $bmp.Clone($cropMentor, $bmp.PixelFormat)
$bmpMentor.Save("$destDir\mentor_avatar.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpMentor.Dispose()

# Student on Laptop (left 35% of Screen 4)
$cropLaptopBoy = New-Object System.Drawing.Rectangle(20, $rowH + 50, [int]($colW * 0.35), [int]($rowH * 0.85))
$bmpLaptopBoy = $bmp.Clone($cropLaptopBoy, $bmp.PixelFormat)
$bmpLaptopBoy.Save("$destDir\laptop_student.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpLaptopBoy.Dispose()

# Headphone Boy speaking (left 35% of Screen 8)
$cropHeadphoneBoy = New-Object System.Drawing.Rectangle($colW + 20, ($rowH * 2) + 50, [int]($colW * 0.35), [int]($rowH * 0.85))
$bmpHeadphoneBoy = $bmp.Clone($cropHeadphoneBoy, $bmp.PixelFormat)
$bmpHeadphoneBoy.Save("$destDir\speaking_student.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpHeadphoneBoy.Dispose()

# Celebrating Boy (left 45% of Screen 9)
$cropCelebBoy = New-Object System.Drawing.Rectangle(($colW * 2) + 20, ($rowH * 2) + 50, [int]($colW * 0.45), [int]($rowH * 0.85))
$bmpCelebBoy = $bmp.Clone($cropCelebBoy, $bmp.PixelFormat)
$bmpCelebBoy.Save("$destDir\celebration_student.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpCelebBoy.Dispose()

$bmp.Dispose()
Write-Host "All 9 screens and character assets extracted successfully to $destDir!"
