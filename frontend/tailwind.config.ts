import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F8FAF5',
        surface: '#FFFFFF',
        text: '#374151',
        brand: {
          primary: '#10B981',
          secondary: '#FB923C',
          accent: '#22D3EE',
        },
        dark: {
          bg: '#0F172A',
          surface: '#1E293B',
          text: '#E2E8F0',
        }
      },
    },
  },
  plugins: [],
};
export default config;