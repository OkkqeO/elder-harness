// Is anything still moving when the cut lands?
//
//   node render/probe-cuts.mjs --page pitch.html
//
// For every shot boundary, render two frames 1/60s apart at several offsets before the cut
// and measure the mean absolute pixel difference on a small downscale. A cut is "truncated"
// when the motion at the cut is still as large as the motion in the middle of the shot —
// the animation was still running when the picture changed.

import { launch } from './cdp.mjs'
import { serve } from './serve.mjs'

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const PAGE = arg('page', 'index.html')

// Render t and t+1/60 into a small canvas, return the mean abs difference (0..1).
const DIFF = (t) => `(() => {
  const stage = window.__stage
  const c = document.createElement('canvas')
  c.width = 160; c.height = 90
  const ctx = c.getContext('2d')
  const gl = document.querySelector('canvas')
  const snap = (tt) => {
    stage.renderAt(tt)
    ctx.drawImage(gl, 0, 0, c.width, c.height)
    return ctx.getImageData(0, 0, c.width, c.height).data
  }
  const a = snap(${Number(t).toFixed(4)})
  const b = snap(${Number(t + 1 / 60).toFixed(4)})
  let sum = 0
  for (let i = 0; i < a.length; i += 4) sum += Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2])
  return sum / (a.length / 4 * 3 * 255)
})()`

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
    if (!ready) await sleep(100)
  }
  if (!ready) throw new Error('not ready: ' + await q(session, 'window.__error || ""'))

  const info = JSON.parse(await q(session, 'JSON.stringify(window.__film)'))
  console.log(`film "${info.title}" ${info.duration}s`)
  console.log('cut at   shot            motion@-1.2s  -0.6s   -0.2s   -0.05s   (mean abs pixel diff / 255)')

  for (const s of info.shots) {
    const cut = s.start + s.duration   // __film.shots 只有 start/duration，没有 end
    if (cut >= info.duration) continue
    const at = [-1.2, -0.6, -0.2, -0.05]
    const vals = []
    for (const d of at) vals.push(await q(session, DIFF(cut + d)))
    const flag = vals[3] > 0.006 && vals[3] > vals[0] * 0.8 ? '  <-- 切点处仍在动' : ''
    console.log(`${String(cut).padStart(6)}s  ${s.name.padEnd(14)}  ` +
      vals.map(v => v.toFixed(4)).join('   ') + flag)
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
