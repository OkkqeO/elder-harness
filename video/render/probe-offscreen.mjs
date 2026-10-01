// Which visible objects fall outside the frame, and when?
//
//   node render/probe-offscreen.mjs --page pitch.html --step 1
//
// Renders one frame per step, then projects every visible geometry's bounding box to NDC
// and reports anything crossing the frame edge. The "set" (floor/backdrop) is legitimately
// larger than the frame, so huge boxes are filtered out.

import { launch } from './cdp.mjs'
import { serve } from './serve.mjs'
import { captureExpr } from './capture.mjs'

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const PAGE = arg('page', 'index.html')
const STEP = Number(arg('step', 1))
const FROM = Number(arg('from', 0))
const TO = Number(arg('to', 240))

const PROBE = `(() => {
  const stage = window.__stage
  const cam = stage.camera
  const T = window.__THREE
  const v = new T.Vector3(), c = new T.Vector3()
  const box = new T.Box3()
  const out = []
  stage.scene.updateMatrixWorld(true)
  stage.scene.traverse((o) => {
    if (!o.geometry || !o.material) return
    let p = o, vis = true
    while (p) { if (p.visible === false) { vis = false; break } p = p.parent }
    if (!vis) return
    const m = Array.isArray(o.material) ? o.material[0] : o.material
    if (!(m.opacity > 0.06)) return
    o.geometry.computeBoundingBox && o.geometry.computeBoundingBox()
    const bb = o.geometry.boundingBox
    if (!bb) return
    const size = new T.Vector3(); bb.getSize(size)
    if (Math.max(size.x, size.y, size.z) > 4) return   // the set / backdrop
    box.copy(bb).applyMatrix4(o.matrixWorld)
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
      v.project(cam)
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y)
    }
    const over = Math.max(Math.abs(minX) - 1, Math.abs(maxX) - 1, Math.abs(minY) - 1, Math.abs(maxY) - 1)
    if (over > 0.01) {
      box.getCenter(c)
      // 地板以下的镜像（makeMirror 造的反射体）本来就该在画面外，不算越界
      if (c.y < -1.30) return
      out.push({ over: +over.toFixed(3), col: m.color ? m.color.getHexString() : '?',
        x: +c.x.toFixed(2), y: +c.y.toFixed(2), sx: +size.x.toFixed(2), sy: +size.y.toFixed(2),
        ndc: [+minX.toFixed(2), +maxX.toFixed(2), +minY.toFixed(2), +maxY.toFixed(2)] })
    }
  })
  out.sort((a, b) => b.over - a.over)
  return JSON.stringify(out.slice(0, 8))
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
  const shotAt = (t) => info.shots.filter(s => s.start <= t).pop()
  for (let t = FROM; t < TO; t += STEP) {
    await q(session, captureExpr(t, 'jpeg', 60))
    const list = JSON.parse(await q(session, PROBE))
    if (list.length) {
      const s = shotAt(t)
      console.log(`t=${String(t).padStart(3)}s  [${s ? s.name : '?'}]  ${list.length} 个越界`)
      for (const o of list.slice(0, 5)) {
        console.log(`    over=${o.over}  #${o.col}  world(${o.x},${o.y})  size(${o.sx}×${o.sy})  ndc x[${o.ndc[0]},${o.ndc[1]}] y[${o.ndc[2]},${o.ndc[3]}]`)
      }
    }
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
