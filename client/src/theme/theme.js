// Minimal theme tokens and helper to apply theme variables to :root
export const defaultTheme = {
  ui_button_radius: '10px',
  ui_button_shadow: '0 8px 20px rgba(105,190,60,0.12)',
  ui_input_radius: '10px',
  ui_font_family: "'Cairo', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  ui_base_font_size: '14px',
  ui_spacing_scale: '1',
  ui_theme_default: 'light'
};

export function applyThemeVars(theme = {}) {
  const root = document.documentElement;
  const entries = Object.entries({ ...defaultTheme, ...(theme || {}) });
  entries.forEach(([k, v]) => {
    const cssKey = `--${k.replace(/_/g, '-')}`; // map ui_button_radius -> --ui-button-radius
    root.style.setProperty(cssKey, v == null ? '' : String(v));
  });
}

export default { defaultTheme, applyThemeVars };
