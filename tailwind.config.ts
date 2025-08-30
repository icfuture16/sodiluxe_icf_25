import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A2845E',
          light: '#D3CCC3',
        },
        secondary: {
          DEFAULT: '#092C4C',
          light: '#C6CCD3',
        }
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
  // S'assurer que le plugin forms est correctement chargé
}
export default config
