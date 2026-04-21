import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    borderRadius: {
      none: '0',
      DEFAULT: '0',
    },
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans TC"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        accent: {
          DEFAULT: '#f97316',
          primary: '#f97316',
          secondary: '#14b8a6',
          tertiary: '#7c3aed',
        },
      },
      fontSize: {
        h1: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h3: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        small: ['0.8125rem', { lineHeight: '1.25rem' }],
        caption: ['0.75rem', { lineHeight: '1rem' }],
      },
      spacing: {
        section: '3rem',
        'section-lg': '4rem',
      },
    },
  },
}
