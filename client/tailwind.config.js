const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	darkMode: 'class',
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Cairo', 'Tajawal', 'var(--font-sans)', ...defaultTheme.fontFamily.sans],
				serif: ['Amiri', 'Noto Naskh Arabic', ...defaultTheme.fontFamily.serif],
			},
			colors: {
				primary: "var(--brand-primary)",
				primaryAlt: "var(--brand-primary-alt)",
				secondary: "var(--brand-secondary)",
				accent: "var(--brand-accent)",
				gradient: "var(--brand-gradient-primary)",
				ring: "var(--brand-ring)",
				muted: "var(--color-muted)",
				background: "var(--color-bg)",
				foreground: "var(--color-fg)",
				success: "var(--color-success)",
				warning: "var(--color-warning)",
				danger: "var(--color-danger)"
			},
			boxShadow: {
				card: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)",
				modal: "0 10px 25px rgba(0,0,0,0.15)"
			},
			borderRadius: {
				xl: "1rem"
			}
		}
	},
	plugins: [require('tailwindcss-animate')],
}


