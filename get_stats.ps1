$word = New-Object -ComObject Word.Application
$word.Visible = $false
$file = Get-Item "Makalah_IEEE_Ketimpangan_Pembangunan_Indonesia.docx"
$doc = $word.Documents.Open($file.FullName)
$pages = $doc.ComputeStatistics(2)
$words = $doc.ComputeStatistics(0)
$doc.Close($false)
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Output "TOTAL_PAGES: $pages"
Write-Output "TOTAL_WORDS: $words"
