// Ⅲ · S16 收束 (3:51–4:00, 9s)
//
// 数据落定，落点独占一屏静止 1.5s：办成有证据，帮忙有分寸。
// 右下角保留拟研发角标——技能自学习 / 自进化在 README 里仍是研发方向，不能当成已完成。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makePhone, makeSet, makeMirror, distanceFor, INK_BG, ATTENTION, BRAND } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePill, makeDataStrip, makePanel, text, plate } from '../kit.js'
import { paintHome } from '../ui.js'

export const shotClose = defineShot({
  name: 'close',
  start: 231,
  duration: 9,

  subs: [
    [0.6, 4.2, '这些数字来自真机记录，不是估算', 'These numbers come from real device runs.'],
    [4.6, 8.6, '银龄智办 · 可信跨应用助老智能体', 'Yinling Zhiban — a trustworthy cross-app assistant.'],
  ],
  sfx: [[0.4, 'riser', { dur: 1.4 }], [2.2, 'chime', { midi: 81 }], [4.8, 'soft']],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const phone = makePhone({ height: 1.00 })
    phone.position.set(0, 0.40, 0)
    group.add(phone)
    group.add(makeMirror(phone, { floorY: -1.28, opacity: 0.10 }))

    const horizon = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.006),
      new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
    )
    horizon.position.set(0, -0.06, 0.20)
    group.add(horizon)

    const strip = makeDataStrip([
      ['真机任务', '13 条'], ['缓存命中', '第 1 步 93%'], ['回归校验', '73 + 20 项'], ['10 步外卖', '打扰 0 次'],
    ], { width: 2.62, height: 0.28 })
    strip.position.set(0, -0.30, 0.34)
    strip.material.opacity = 0
    group.add(strip)

    // 落点：占一屏，静止 1.5s。字幕不重复这句话（改由画面独占），避免同一句话出现两次
    const line = makePill('办成有证据，帮忙有分寸', {
      width: 2.62, height: 0.26, size: 54, color: '#F6F7F8', align: 'center',
      fill: 'rgba(14,20,24,0.0)',
    })
    line.position.set(0, -0.54, 0.34)
    line.material.opacity = 0
    group.add(line)

    const wip = makePill('拟研发：技能自学习 / 自进化', {
      width: 1.86, height: 0.15, size: 28, color: '#B9A98C',
      fill: 'rgba(30,28,22,0.92)', stroke: 'rgba(140,124,92,0.85)',
    })
    wip.position.set(0.90, 0.72, 0.34)
    wip.material.opacity = 0
    group.add(wip)

    group.userData = { phone, horizon, strip, line, wip }
    stage.userData.pitchClose = group
  },

  enter(stage) {
    const g = stage.userData.pitchClose
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchClose
    const u = g.userData

    // 最后一段：镜头稳住不动，让落点独占一屏
    const k = ramp(local, 0, 5, EASE.inOut)
    const d = distanceFor(stage, 2.00, 0.86) * (1.0 - 0.03 * k)
    stage.camera.position.set(0, 0.06 - 0.02 * k, d)
    stage.camera.lookAt(0, 0.04, 0)

    const lit = ramp(local, 0.3, 0.9, EASE.out)
    u.phone.userData.setFrameOpacity(lit)
    u.phone.userData.surface.material.opacity = 0.12 + 0.88 * lit
    u.phone.userData.rim.material.opacity = 0.07 + 0.20 * lit
    if (!u.painted) {
      u.painted = true
      u.phone.userData.paint((ctx, w, h) => paintHome(ctx, w, h, {
        button: '#1A7F6B', label: '我在', hint: '有事就说', status: '在呢',
      }))
    }

    u.horizon.material.opacity = ramp(local, 0.6, 1.4, EASE.out) * 0.85
    u.strip.material.opacity = ramp(local, 1.6, 0.9, EASE.out) * 0.96
    u.line.material.opacity = ramp(local, 3.0, 1.0, EASE.out) * 0.98
    u.line.position.y = -0.54 + (1 - ramp(local, 3.0, 1.0, EASE.out)) * 0.05
    u.wip.material.opacity = ramp(local, 4.4, 0.9, EASE.out) * 0.95
  },

  teardown(stage) {
    const g = stage.userData.pitchClose
    if (g) g.visible = false
  },
})
