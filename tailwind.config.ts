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
        // shadcn/ui semantic tokens, mapped to the Lumo palette so
        // components copied into src/components/ui render on-brand.
        // Values come from CSS variables (src/app/globals.css) so a section
        // can switch to the dark set by adding the `dark` class.
        background: 'rgb(var(--ui-background) / <alpha-value>)',
        foreground: 'rgb(var(--ui-foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--ui-card) / <alpha-value>)',
          foreground: 'rgb(var(--ui-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--ui-muted) / <alpha-value>)',
          foreground: 'rgb(var(--ui-muted-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--ui-border) / <alpha-value>)',
        ring: 'rgb(var(--ui-ring) / <alpha-value>)',
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

