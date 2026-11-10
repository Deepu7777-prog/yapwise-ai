Add-Type -AssemblyName System.Drawing
$destDir = "C:\Users\deepu\Downloads\yapwise\frontend\public\assets\3d"

function Crop-File($sourceFile, $targetFile, $xRatio, $yRatio, $wRatio, $hRatio) {
    $src = [System.Drawing.Bitmap]::FromFile($sourceFile)
    $x = [int]($src.Width * $xRatio)
    $y = [int]($src.Height * $yRatio)
    $w = [int]($src.Width * $wRatio)
    $h = [int]($src.Height * $hRatio)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $src.Clone($rect, $src.PixelFormat)
    $cropped.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    $src.Dispose()
    Write-Host "Created $targetFile"
}

# 1. Login Hero Students
Crop-File "$destDir\screen1_login_hero.png" "$destDir\character_login_students.png" 0.0 0.15 0.55 0.85

# 2. Priya Student Portrait
Crop-File "$destDir\screen3_profile_hero.png" "$destDir\character_priya.png" 0.02 0.12 0.35 0.85

# 3. Laptop Student
Crop-File "$destDir\screen4_assessment_hero.png" "$destDir\character_laptop_boy.png" 0.02 0.20 0.35 0.78

# 4. Female AI Mentor
Crop-File "$destDir\screen6_mentor_hero.png" "$destDir\character_mentor_female.png" 0.02 0.12 0.38 0.85

# 5. Partner 1: Little Friend (Kid)
Crop-File "$destDir\screen7_partners_hero.png" "$destDir\partner_kid_friend.png" 0.05 0.30 0.28 0.65

# 6. Partner 2: English Coach (Woman)
Crop-File "$destDir\screen7_partners_hero.png" "$destDir\partner_english_coach.png" 0.36 0.30 0.28 0.65

# 7. Partner 3: Interview Coach (Man)
Crop-File "$destDir\screen7_partners_hero.png" "$destDir\partner_interview_coach.png" 0.67 0.30 0.28 0.65

# 8. Headphone Boy speaking
Crop-File "$destDir\screen8_speaking_room.png" "$destDir\character_headphone_boy.png" 0.02 0.20 0.35 0.78

# 9. Celebration Boy
Crop-File "$destDir\screen9_celebration.png" "$destDir\character_celebration_boy.png" 0.05 0.15 0.45 0.85
