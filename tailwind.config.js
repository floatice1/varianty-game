/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display:  ['"Rubik Spray Paint"', 'system-ui', 'sans-serif'],
        graffiti: ['"Rubik Dirt"', 'system-ui', 'sans-serif'],
        sans:     ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        g: {
          bg:        'rgb(var(--g-bg) / <alpha-value>)',
          surface:   'rgb(var(--g-surface) / <alpha-value>)',
          card:      'rgb(var(--g-card) / <alpha-value>)',
          border:    'rgb(var(--g-border) / <alpha-value>)',
          accent:    'rgb(var(--g-accent) / <alpha-value>)',
          'accent-2':'rgb(var(--g-accent2) / <alpha-value>)',
          success:   'rgb(var(--g-success) / <alpha-value>)',
          danger:    'rgb(var(--g-danger) / <alpha-value>)',
          pink:      'rgb(var(--g-pink) / <alpha-value>)',
          text:      'rgb(var(--g-text) / <alpha-value>)',
          muted:     'rgb(var(--g-muted) / <alpha-value>)',
          dim:       'rgb(var(--g-dim) / <alpha-value>)',
        },
      },
      boxShadow: {
        'hard':          '4px 4px 0px #000000',
        'hard-sm':       '2px 2px 0px #000000',
        'hard-accent':   '4px 4px 0px rgba(212,255,0,0.35)',
        'hard-success':  '3px 3px 0px rgba(0,255,122,0.3)',
        'hard-danger':   '3px 3px 0px rgba(255,45,58,0.3)',
        'glow-sm':       '0 0 10px rgba(212,255,0,0.35)',
        'glow':          '0 0 24px rgba(212,255,0,0.5)',
        'glow-success':  '0 0 16px rgba(0,255,122,0.4)',
        'glow-danger':   '0 0 16px rgba(255,45,58,0.4)',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
