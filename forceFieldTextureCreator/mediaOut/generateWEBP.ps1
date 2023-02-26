foreach($line in Get-Content .\images.txt) {
    $name = $line.Split(".")[0]
    ffmpeg -i ./original/$line -c:v libwebp "$name.webp"
}