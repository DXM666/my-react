import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import replace from '@rollup/plugin-replace'

const distPath = path.resolve(__dirname, '../dist')

export default defineConfig({
    plugins: [
        react(),
        replace({
            __DEV__: true,
            preventAssignment: true
        })
    ],
    resolve: {
        alias: [
            {
                find: 'react',
                replacement: path.resolve(distPath, 'react/react.js')
            },
            {
                find: 'shared',
                replacement: path.resolve(distPath, 'shared/shared.js')
            }
        ]
    },
    root: path.resolve(__dirname, '../examples/demo'),
    optimizeDeps: {
        force: true
    }
})
