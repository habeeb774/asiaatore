const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Cairo', 'Tajawal', 'var(--font-sans)', ...defaultTheme.fontFamily.sans],
			},
			colors: {
				primary: "var(--color-primary)",
				secondary: "var(--color-secondary)",
				accent: "var(--color-accent)",
				muted: "var(--color-muted)",
				background: "var(--color-bg)",
				foreground: "var(--color-fg)",
				success: "var(--color-success)",
				warning: "var(--color-warning)",
				danger: "var(--color-danger)",
				ring: "var(--color-ring)"
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
	plugins: [require('tailwindcss-animate'), require('tailwindcss-rtl')],
}


