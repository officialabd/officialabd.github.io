/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        linkedin_bg_color: '#0077b5',
        github_bg_color: '#313131',
        leetcode_bg_color: '#E7A41F'
      },
      blur: {
        xs: '2px',
      },
      fontFamily: {
        "Nunito": ['Nunito', "sans-serif"],
        "SourceCodePro": ['Source Code Pro', "monospace"],
        "Tektur": ['Tektur', "cursive"],
        "RobotoMono": ['Roboto Mono', "monospace"]
      },
    },
  },
  plugins: [],
}
