import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			includeAssets: ['favicon.svg', 'tabli.png', 'tabli_logo.svg'],
			manifest: {
				name: 'Tabli',
				short_name: 'Tabli',
				description: "Application de gestion d'exercices de théâtre",
				theme_color: '#0D6EFD',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait-primary',
				scope: './',
				start_url: './',
				icons: [
					{ src: 'tabli.png', sizes: '192x192', type: 'image/png' },
					{ src: 'tabli.png', sizes: '512x512', type: 'image/png' },
					{ src: 'tabli.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/i,
						handler: 'CacheFirst',
						options: { cacheName: 'google-fonts-cache' }
					}
				]
			}
		})
	],
	base: './'
});
