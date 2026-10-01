// Render one moment, then evaluate an arbitrary expression in the page.
//
//   node render/probe-expr.mjs --page pitch.html --t 11.9 --expr "window.__stage.camera.position.toArray()"

import { launch } from './cdp.mjs'
import { serve } from './serve.mjs'
import { captureExpr } from './capture.mjs'

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const PAGE = arg('page', 'index.html')
const T = Number(arg('t', 0))
const EXPR = arg('expr', 'window.__film.title')

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
  await q(session, captureExpr(T, 'jpeg', 60))
  console.log(await q(session, `JSON.stringify(${EXPR})`))
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
