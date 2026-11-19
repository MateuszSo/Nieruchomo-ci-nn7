/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs',
    './public/js/**/*.js',
    './src/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Plus Jakarta Sans Fallback"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', '"Playfair Display Fallback"', 'Georgia', 'serif']
      },
      colors: {
        slate: {
          50: '#f5f7fb',
          100: '#ebf0f8',
          200: '#d7e1f0',
          300: '#bccce3',
          400: '#9db4d2',
          500: '#51698a',
          600: '#42597a',
          700: '#344f78',
          800: '#2c4c7e',
          900: '#223c66',
          950: '#162846'
        },
        amber: {
          50: '#fbf8ef',
          100: '#f5edd6',
          200: '#ead9a6',
          300: '#dfc373',
          400: '#d5b24d',
          500: '#caa23e',
          600: '#b58c28',
          700: '#826114',
          800: '#6c5011',
          900: '#58410e',
          950: '#362809'
        },
        brand: {
          dark: '#162846',
          navy: '#2c4c7e',
          gold: '#caa23e',
          goldLight: '#dfc373',
          cream: '#f5f7fb'
        }
      }
    }
  },
  plugins: []
};
