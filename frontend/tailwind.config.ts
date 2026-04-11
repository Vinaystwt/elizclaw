import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        'danger-dim': 'var(--danger-dim)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        glow: 'var(--shadow-glow)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
