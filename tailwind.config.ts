import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '390px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        lumo: {
          noche: '#1B2130',
          ambar: '#F2A33A',
          brillo: '#FFD27A',
          arena: '#FFF7EC',
          pizarra: '#5B6375',
          niebla: '#E6E8EE',
        },
      },
      fontFamily: {
        heading: ['var(--font-bricolage)', 'sans-serif'],
        sans: ['var(--font-figtree)', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};

export default config;

