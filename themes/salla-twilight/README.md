# Salla Twilight Theme (Starter)

This is a minimal starter structure to begin building a Salla Twilight theme using Twig templates and the installed VS Code Twilight extension.

## Structure

- `templates/layouts/base.twig` — Base layout with header/footer includes
- `templates/index.twig` — Home page example
- `templates/partials/*` — Header/Footer partials
- `assets/css/theme.css` — Basic styling

## VS Code Setup

We already configured the workspace to:
- Treat `*.twig` as HTML for syntax highlighting and IntelliSense.
- Use `Salla.twilight-vscode-extension` as the default formatter for HTML/Twig.

## Next Steps

1. Login to Salla Partners (opens browser to authenticate):

   ```powershell
   salla login
   ```

2. Create a new theme using the Salla CLI (interactive):

   ```powershell
   # From the repository root or inside this folder
   salla theme create
   ```

3. Preview with a Demo Store (requires login):

   ```powershell
   salla theme preview
   ```

4. Once linked, replace the starter templates with the generated/required structure by the CLI or import an existing theme and iterate here.

## Notes

- Some CLI commands are interactive; use the integrated terminal. 
- If Marketplace downloads timeout, we installed the VSIX locally and associated `.twig` files already.
- For formatting-on-save in Twig, add this to `.vscode/settings.json`:

  ```json
  {
    "[html]": { "editor.formatOnSave": true }
  }
  ```
