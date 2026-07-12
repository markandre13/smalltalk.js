import { defineConfig } from 'vite';
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    build: {
        lib: {
            formats: ['es'],
            entry: 'src/main.ts',
        },
    },
    test: {
        environment: "node",
        browser: {
            provider: playwright(),
            enabled: true,
            instances: [
                { browser: 'chromium', headless: true },
            ],
        },
        hideSkippedTests: true,
        reporters: [
            ['tree', { summary: false }]
        ]
    },
})