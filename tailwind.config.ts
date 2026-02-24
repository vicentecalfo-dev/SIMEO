import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './node_modules/@codeworker.br/govbr-tw-react/**/*.js'
	],
  prefix: "",
  theme: {
  	fontFamily: {
  		sans: ["Rawline", "Arial", "sans-serif"],
  	},
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			govbr: {
  				pure: {
  					'0': '#FFFFFF',
  					'100': '#000000'
  				},
  				gray: {
  					'2': '#F8F8F8',
  					'10': '#E6E6E6',
  					'20': '#CCCCCC',
  					'60': '#636363',
  					'80': '#333333'
  				},
  				blue: {
  					warm: {
  						'20': '#C5D4EB',
  						vivid: {
  							'10': '#D4E5FF',
  							'20': '#ADCDFF',
  							'50': '#0076D6',
  							'60': '#155BCB',
  							'70': '#1351B4',
  							'80': '#0C326F',
  							'90': '#071D41'
  						}
  					}
  				},
  				green: {
  					cool: {
  						vivid: {
  							'5': '#E3F5E1',
  							'10': '#DFEACD',
  							'50': '#168821'
  						}
  					}
  				},
  				yellow: {
  					vivid: {
  						'5': '#FFF5C2',
  						'10': '#FEE685',
  						'20': '#FFCD07'
  					}
  				},
  				red: {
  					vivid: {
  						'10': '#FDE0DB',
  						'20': '#F8B9C5',
  						'50': '#E52207'
  					}
  				}
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
