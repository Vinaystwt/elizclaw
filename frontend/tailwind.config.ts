import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f', surface: '#12121a', surfaceHover: '#1a1a25',
        border: '#2a2a3a', primary: '#6c5ce7', primaryHover: '#7c6cf7',
        accent: '#00cec9', success: '#00b894', warning: '#fdcb6e',
        error: '#e17055', text: '#e2e2e8', textMuted: '#8888a0',
      },
    },
  },
  plugins: [],
};
export default config;
