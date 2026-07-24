import adapterNode from '@sveltejs/adapter-node';
import adapterNetlify from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { env } from 'node:process';

// Select adapter via ADAPTER env var (default: node for Docker/standalone).
// Set ADAPTER=netlify for Netlify deployments.
const adapter = env.ADAPTER === 'netlify' ? adapterNetlify() : adapterNode();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// TODO: Fix Headers in final deployment adapter.
		// https://svelte.dev/docs/kit/adapter-netlify#Netlify-alternatives-to-SvelteKit-functionality-_headers-and-_redirects
		adapter
	}
};

export default config;
