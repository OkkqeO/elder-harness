// Offline movie renderer, segmented so a 7500-frame run can survive a crash.
//
//   GL_BACKEND=vulkan node render/movie.mjs --fps 60 --seg 15
//
// frames.mjs renders a range in one browser session; that is fine for a few
// hundred frames and fragile for a whole cut. This relaunches the browser every
// `--seg` seconds of film and SKIPS frames already on disk, so a run is
// resumable: kill it, start it again, it picks up where it stopped.

import { launch } from './cdp.mjs'
import { serve } from './serve.mjs'
import { captureExpr, decodeDataURL } from './capture.mjs'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

const args = parseArgs(process.argv.slice(2))
const FPS = Number(args.fps ?? 60)
const SEG = Number(args.seg ?? 15)
const QUALITY = Number(args.quality ?? 92)
const OUT = join(ROOT, args.out ?? 'out/movie')
const PORT = Number(args.port ?? 9222)
const PAGE = args.page ?? 'index.html'

mkdirSync(OUT, { recursive: true })

// Ask the page for the cut length first, in a short-lived session of its own.
const info = await withBrowser(async ({ session, origin }) => {
  await session.send('Page.enable')
  await session.send('Runtime.enable')
  await session.send('Page.navigate', { url: origin + '/' + PAGE })
  await waitReady(session)
  return JSON.parse(await q(session, 'JSON.stringify(window.__film)'))
})

const t0 = Number(args.from ?? 0)
const t1 = Number(args.to ?? info.duration)
const first = Math.round(t0 * FPS)
const last = Math.round(t1 * FPS)
console.log(`film "${info.title}"  rendering ${t0}s..${t1}s @${FPS}fps = ${last - first} frames`)
console.log(`shots: ${info.shots.map(s => `${s.name}@${s.start}`).join('  ')}`)
console.log(`backend: ${process.env.GL_BACKEND || 'swiftshader'}   out: ${OUT}`)

const started = Date.now()
let written = 0
let skipped = 0

for (let segStart = first; segStart < last; segStart += Math.round(SEG * FPS)) {
  const segEnd = Math.min(last, segStart + Math.round(SEG * FPS))
  const pending = []
  for (let f = segStart; f < segEnd; f++) {
    const p = framePath(f)
    if (existsSync(p)) skipped++
    else pending.push(f)
  }
  if (!pending.length) continue

  let attempt = 0
  for (;;) {
    try {
      await withBrowser(async ({ session, origin }) => {
        await session.send('Page.enable')
        await session.send('Runtime.enable')
        await session.send('Page.navigate', { url: origin + '/' + PAGE })
        await waitReady(session)
        for (const f of pending) {
          const t = f / FPS
          const data = await q(session, captureExpr(t, 'jpeg', QUALITY))
          writeFileSync(framePath(f), decodeDataURL(data))
          written++
          if (written % 30 === 0 || written === 1) {
            const done = written + skipped
            const el = (Date.now() - started) / 1000
            const eta = el / done * (last - first - done)
            process.stdout.write(`\r  ${done}/${last - first}  ${(done / (last - first) * 100).toFixed(1)}%  ` +
              `${(done / el).toFixed(1)} fps  eta ${(eta / 60).toFixed(1)}min   `)
          }
          const err = await q(session, 'window.__error || ""').catch(() => '')
          if (err) throw new Error(`page error at t=${t.toFixed(2)}: ${err.split('\n')[0]}`)
        }
      })
      break
    } catch (e) {
      attempt++
      const left = pending.filter(f => !existsSync(framePath(f)))
      console.log(`\n  segment ${segStart}-${segEnd} failed (attempt ${attempt}): ${e.message}`)
      console.log(`  ${pending.length - left.length} frames landed before the failure; ${left.length} to go`)
      pending.length = 0
      pending.push(...left)
      if (!pending.length) break
      if (attempt >= 3) throw new Error(`segment ${segStart}-${segEnd} failed 3 times`)
      await sleep(2000)
    }
  }
}

process.stdout.write('\n')
console.log(`wrote ${written} frames, skipped ${skipped} (already on disk) in ${((Date.now() - started) / 60000).toFixed(1)} min`)

function framePath(f) { return join(OUT, `f${String(f).padStart(6, '0')}.jpg`) }

async function withBrowser(fn) {
  const server = await serve()
  const browser = await launch({ width: 1920, height: 1080, port: PORT })
  try {
    return await fn({ session: browser.session, origin: server.origin })
  } finally {
    await browser.close()
    await server.close()
  }
}

// A shot that throws keeps producing frames — black ones — and the run still
// "succeeds". Waiting for __ready and checking __error is the difference.
async function waitReady(session) {
  for (let i = 0; i < 1200; i++) {
    let ready = false
    try { ready = await q(session, 'window.__ready === true') } catch { }
    if (ready) return
    const err = await q(session, 'window.__error || ""').catch(() => '')
    if (err) throw new Error('page error: ' + err.split('\n')[0])
    await sleep(100)
  }
  throw new Error('page never became ready')
}

async function q(session, expr) {
  const r = await session.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) out[key] = true
    else { out[key] = isNaN(Number(next)) ? next : Number(next); i++ }
  }
  return out
}
