$files = Get-ChildItem -Path 'uploads','client\public' -Recurse -Filter *.webp -File -ErrorAction SilentlyContinue
if ($files -and $files.Count -gt 0) {
  foreach ($f in $files) {
    git add -- "$($f.FullName)"
  }
  git commit -m 'chore(images): add generated WebP assets for uploads and public images'
} else {
  Write-Output 'No webp files found to add.'
}
Write-Output 'Done. Current git status:'
git status --porcelain --untracked-files=all
