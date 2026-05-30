import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            formats: ['es'],
            entry: 'src/main.ts',
        },
    },
    test: {
        reporters: [
            ['default', { summary: false }]
        ]
    },
})