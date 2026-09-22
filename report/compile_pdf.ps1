$chrome = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
$htmlPath = (Resolve-Path "report\index.html").Path
$pdfPath = "$((Resolve-Path "report").Path)\ImagePro_Studio_Technical_Report.pdf"
$destPdf = "C:\Users\ZAINON\Desktop\ImagePro_Studio_Technical_Report.pdf"

Write-Host "Compiling PDF with Chrome: $chrome"
Write-Host "Source HTML: $htmlPath"
Write-Host "Output PDF: $pdfPath"

$fileUrl = "file:///$($htmlPath -replace '\\', '/')"

Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--no-sandbox", "--disable-gpu", "--print-to-pdf=`"$pdfPath`"", "`"$fileUrl`"" -Wait

Start-Sleep -Seconds 2

if (Test-Path $pdfPath) {
    Copy-Item -Path $pdfPath -Destination $destPdf -Force
    Write-Host "Successfully generated PDF!"
    Get-Item $pdfPath, $destPdf | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize
} else {
    Write-Error "Failed to generate PDF."
}
