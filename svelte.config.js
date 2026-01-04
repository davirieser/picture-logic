import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// TODO: Fix Headers in final deployment adapter.
		// https://svelte.dev/docs/kit/adapter-netlify#Netlify-alternatives-to-SvelteKit-functionality-_headers-and-_redirects
		adapter: adapter()
	}
};

export default config;
