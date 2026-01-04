import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [
		// https://github.com/Z3Prover/z3/issues/6768
		viteStaticCopy({
			targets: [
				{
					src: 'node_modules/z3-solver/build/z3-built.*',
					dest: ''
				}
			]
		}),
		{
			// Plugin code is from https://github.com/chaosprint/vite-plugin-cross-origin-isolation
			name: 'configure-response-headers',
			configureServer: (server) => {
				server.middlewares.use((req, res, next) => {
					switch (req.url) {
						case '/z3-built.wasm':
						case '/z3-built.js':
						case '/':
							res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
							res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
							next();
							break;
						default:
							next();
							break;
					}
				});
			}
		},
		tailwindcss(),
		sveltekit(),
		devtoolsJson()
	],

	test: {
		expect: { requireAssertions: true },

		projects: [
			{
				extends: './vite.config.ts',

				test: {
					name: 'client',

					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},

					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
