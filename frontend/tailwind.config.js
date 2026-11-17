/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14231F',
        base: '#FAF7F2',
        sand: '#EFE7DA',
        clinic: {
          DEFAULT: '#1F4D3E',
          light: '#2E6B57',
          dark: '#12332A'
        },
        gold: '#C9974B',
        alert: '#C1523D'
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      },
      maxWidth: {
        content: '1180px'
      }
    }
  },
  plugins: []
};
