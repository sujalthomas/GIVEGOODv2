import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			display: ['var(--font-display)', 'Georgia', 'serif'],
  			body: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  		},
  		colors: {
  			primary: {
  				'50': 'var(--color-primary-50)',
  				'100': 'var(--color-primary-100)',
  				'200': 'var(--color-primary-200)',
  				'300': 'var(--color-primary-300)',
  				'400': 'var(--color-primary-400)',
  				'500': 'var(--color-primary-500)',
  				'600': 'var(--color-primary-600)',
  				'700': 'var(--color-primary-700)',
  				'800': 'var(--color-primary-800)',
  				'900': 'var(--color-primary-900)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': 'var(--color-secondary-50)',
  				'100': 'var(--color-secondary-100)',
  				'200': 'var(--color-secondary-200)',
  				'300': 'var(--color-secondary-300)',
  				'400': 'var(--color-secondary-400)',
  				'500': 'var(--color-secondary-500)',
  				'600': 'var(--color-secondary-600)',
  				'700': 'var(--color-secondary-700)',
  				'800': 'var(--color-secondary-800)',
  				'900': 'var(--color-secondary-900)',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': 'var(--color-accent-50)',
  				'100': 'var(--color-accent-100)',
  				'200': 'var(--color-accent-200)',
  				'300': 'var(--color-accent-300)',
  				'400': 'var(--color-accent-400)',
  				'500': 'var(--color-accent-500)',
  				'600': 'var(--color-accent-600)',
  				'700': 'var(--color-accent-700)',
  				'800': 'var(--color-accent-800)',
  				'900': 'var(--color-accent-900)',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'float': {
  				'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
  				'50%': { transform: 'translateY(-20px) rotate(2deg)' },
  			},
  			'marquee': {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' },
  			},
  			'marquee-reverse': {
  				'0%': { transform: 'translateX(-50%)' },
  				'100%': { transform: 'translateX(0)' },
  			},
  			'pulse-ring': {
  				'0%': { transform: 'scale(0.8)', opacity: '1' },
  				'100%': { transform: 'scale(2)', opacity: '0' },
  			},
  			'shine': {
  				'0%, 100%': { transform: 'translateX(-100%) rotate(45deg)' },
  				'50%': { transform: 'translateX(100%) rotate(45deg)' },
  			},
  		},
  		animation: {
  			'float': 'float 6s ease-in-out infinite',
  			'float-delayed': 'float 6s ease-in-out infinite 2s',
  			'float-slow': 'float 8s ease-in-out infinite',
  			'marquee': 'marquee 30s linear infinite',
  			'marquee-reverse': 'marquee-reverse 30s linear infinite',
  			'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
  			'shine': 'shine 3s ease-in-out infinite',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
