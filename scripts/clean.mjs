// Удаляет сгенерированные артефакты перед полной регенерацией (npm run spec:all).
import { rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

for (const dir of ['src/api-client', 'server/generated']) {
  rmSync(resolve(root, dir), { recursive: true, force: true })
}

console.log('Removed generated: src/api-client, server/generated')
