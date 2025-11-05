<#
  Simple PowerShell helper to interactively clone a template using the Node script.
  Usage: pwsh themes/install-template.ps1
  Prompts for template name and destination.
#>

Param()

Write-Host "Template installer - uses scripts/clone-template.js"
$template = Read-Host "Template name (e.g. my-store-template)"
if (-not $template) { Write-Host "No template specified. Exiting."; exit 1 }

$dest = Read-Host "Destination folder (empty for automated default)"
if (-not $dest) { $dest = "./$($template)-clone-$(Get-Date -UFormat %s)" }

Write-Host "Cloning $template -> $dest"
node ./scripts/clone-template.js --template $template --dest $dest

if ($LASTEXITCODE -eq 0) {
  Write-Host "Clone finished. You can now:"
  Write-Host "  cd $dest"
  Write-Host "  npm install"
  Write-Host "  Follow the README inside the cloned theme for preview commands."
}
