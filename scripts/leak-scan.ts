// scripts/leak-scan.ts — build-time brand-leak gate.
// Fails the build if any FORBIDDEN_TERM appears in client-facing source.
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { FORBIDDEN_TERMS } from '../lib/translate'

const CLIENT_PATHS = ['app/view', 'app/api/client']
const ALLOW = ['forbidden_terms', 'isclean', 'assertclean'] // self-references in imports

function walk(dir: string): string[] {
  let out: string[] = []
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) out = out.concat(walk(p))
    else if (/\.(ts|tsx)$/.test(p)) out.push(p)
  }
  return out
}

let leaks = 0
for (const base of CLIENT_PATHS) {
  let files: string[] = []
  try {
    files = walk(base)
  } catch {
    continue
  }
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const lower = line.toLowerCase()
      if (ALLOW.some((a) => lower.includes(a))) return
      for (const term of FORBIDDEN_TERMS) {
        if (lower.includes(term)) {
          console.error(`LEAK ${file}:${i + 1} → "${term}"  |  ${line.trim()}`)
          leaks++
        }
      }
    })
  }
}

if (leaks > 0) {
  console.error(`\n❌ ${leaks} brand leak(s) in client code`)
  process.exit(1)
}
console.log('✅ No brand leaks in client-facing code')
process.exit(0)
