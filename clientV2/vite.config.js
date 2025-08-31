import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: 'index.html',
				play: 'play/index.html',
				lobby: 'lobby/index.html',
			},
		},
	},
});
