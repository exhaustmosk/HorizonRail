/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Cabinet Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        accent: {
          violet: 'var(--accent-violet)',
          glow: 'var(--accent-glow)',
          teal: 'var(--accent-teal)',
          amber: 'var(--accent-amber)',
          red: 'var(--accent-red)',
          blue: 'var(--accent-blue)',
        },
        'bg-card': 'var(--bg-card)',
      },
    },
  },
  plugins: [],
}
