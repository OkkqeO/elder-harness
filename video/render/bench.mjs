// Rough throughput probe: render N frames spread across the film, report fps.
//
//   GL_BACKEND=vulkan node render/bench.mjs 60
//
// The point is to answer "can I render the whole cut on this machine tonight",
// not to be precise: a run is only as fast as its slowest shot, so the samples
// are spread over the whole timeline instead of clustering at t=0.

import { launch } from './cdp.mjs'
import { serve } from './serve.mjs'
import { captureExpr } from './capture.mjs'

const N = Number(process.argv[2] || 40)
const server = await serve()
const browser = await launch({ width: 1920, height: 1080, port: Number(process.env.PORT || 9222) })
const { session } = browser
try {
  await session.send('Page.enable')
  await session.send('Runtime.enable')
  await session.send('Page.navigate', { url: server.origin + '/index.html' })
  let ready = false
  for (let i = 0; i < 1200 && !ready; i++) {
    try { ready = await q(session, 'window.__ready === true') } catch { }
    if (!ready) await sleep(100)
  }
  if (!ready) throw new Error('not ready: ' + await q(session, 'window.__error || ""'))

  const info = JSON.parse(await q(session, 'JSON.stringify(window.__film)'))
  const gl = await q(session, `(() => {
    const c = document.createElement('canvas')
    const g = c.getContext('webgl2') || c.getContext('webgl')
    const e = g.getExtension('WEBGL_debug_renderer_info')
    return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)
  })()`)
  console.log(`backend=${process.env.GL_BACKEND || 'swiftshader'}  renderer=${gl}`)

  // warm-up: the first frame compiles every shader in the film
  await q(session, captureExpr(1, 'jpeg', 90))
  const t0 = Date.now()
  const times = []
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) * info.duration / N
    const s = Date.now()
    await q(session, captureExpr(t, 'jpeg', 90))
    times.push(Date.now() - s)
  }
  const el = (Date.now() - t0) / 1000
  times.sort((a, b) => a - b)
  console.log(`${N} frames in ${el.toFixed(1)}s  =  ${(N / el).toFixed(1)} fps`)
  console.log(`per-frame ms: min ${times[0]}  median ${times[times.length >> 1]}  max ${times[times.length - 1]}`)
  console.log(`whole 125s cut @60fps would take ~${(7500 / (N / el) / 60).toFixed(0)} min`)
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
