// Render a list of absolute film times to named PNGs, reusing ONE browser.
//
//   node render/stills.mjs 3.0:spiral-coil 5.2:spiral-title 19.5:home-idle
//
// frames.mjs is built for ranges; when you just want to look at a shot, paying
// the browser launch cost once instead of once per still makes iteration quick.

import { launch } from './cdp.mjs'
import { serve } from './serve.mjs'
import { captureExpr, decodeDataURL } from './capture.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT = join(ROOT, 'out', 'stills')

const argv = process.argv.slice(2)
const pageArg = argv.indexOf('--page')
const PAGE = pageArg >= 0 ? argv[pageArg + 1] : 'index.html'
const rest = pageArg >= 0 ? argv.filter((a, i) => i !== pageArg && i !== pageArg + 1) : argv

const jobs = rest.map(a => {
  const i = a.indexOf(':')
  if (i < 0) throw new Error(`expected time:name, got "${a}"`)
  return { t: Number(a.slice(0, i)), name: a.slice(i + 1) }
})
if (!jobs.length) throw new Error('usage: node render/stills.mjs [--page pitch.html] <t>:<name> ...')

const server = await serve()
const browser = await launch({ width: 1920, height: 1080, port: Number(process.env.PORT || 9222) })
const { session } = browser
try {
  await session.send('Page.enable')
  await session.send('Runtime.enable')
  await session.send('Page.navigate', { url: server.origin + '/' + PAGE })

  let ready = false
  for (let i = 0; i < 1200 && !ready; i++) {
    try { ready = await q(session, 'window.__ready === true') } catch { }
    if (!ready) {
      const err = await q(session, 'window.__error || ""').catch(() => '')
      if (err) throw new Error('page error: ' + err.split('\n')[0])
      await sleep(100)
    }
  }
  if (!ready) throw new Error('page never became ready')

  const info = JSON.parse(await q(session, 'JSON.stringify(window.__film)'))
  console.log(`film "${info.title}" ${info.duration}s  shots: ${info.shots.map(s => `${s.name}@${s.start}`).join(' ')}`)

  mkdirSync(OUT, { recursive: true })
  for (const { t, name } of jobs) {
    const started = Date.now()
    // Twice: the first call enters the shot, the second reflects the settled state.
    await q(session, `window.__renderAt(${t})`)
    const png = decodeDataURL(await q(session, captureExpr(t, 'png')))
    const file = join(OUT, `${name}.png`)
    writeFileSync(file, png)
    const err = await q(session, 'window.__error || ""').catch(() => '')
    console.log(`t=${t}s -> ${file}  (${((Date.now() - started) / 1000).toFixed(1)}s)${err ? '  PAGE ERROR: ' + err.split('\n')[0] : ''}`)
  }
} finally {
  await browser.close()
  await server.close()
}

async function q(session, expr) {
  const r = await session.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
