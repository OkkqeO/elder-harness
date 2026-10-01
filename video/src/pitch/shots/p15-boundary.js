// Ⅲ · S15 不越界 (3:38–3:51, 13s)
//
// 可信圈子：家人 / 社区网格员 / 邻居，三层可见范围，角色决定能看到什么（VISIBLE_KINDS）。
// 三条规矩：只有家人能给老人留话 · 不做远程控制 · 6 位配对码配对。
// 为什么不做远程控制要写在片子里：远程协助与屏幕共享正是我们要防的诈骗手法。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makeSet, makeLabel, distanceFor, INK_BG, LAYER_UI, BRAND } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePill, makePanel, text, plate } from '../kit.js'

const RINGS = [
  ['家人', '看全部', 0.86, '#4FBF9A'],
  ['社区网格员', '看求助与异常', 0.58, '#2E8F76'],
  ['邻居', '要上门时才看到', 0.30, '#276B5C'],
]
const DONTS = ['不做健康诊断', '不做 24 小时看护', '不做远程控制']

export const shotBoundary = defineShot({
  name: 'boundary',
  start: 218,
  duration: 13,

  subs: [
    [0.6, 4.6, '角色决定能看到什么', 'The role decides what can be seen.'],
    [5.0, 8.4, '只有家人能给老人留话', 'Only family can leave him a message.'],
    [8.8, 12.4, '不做远程控制——远程协助正是要防的诈骗手法', 'No remote control: screen sharing is the scam we defend against.'],
  ],
  sfx: [[0.5, 'whoosh', { dur: 0.8 }], [2.0, 'ding', { midi: 76 }], [5.0, 'tick'], [8.8, 'soft']],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const cx = -1.00, cy = 0.02
    const rings = RINGS.map(([name, scope, r, color], i) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r - 0.006, r, 128),
        new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
      )
      ring.position.set(cx, cy, 0.30 - i * 0.01)
      group.add(ring)
      // 三个圈层的说明竖排在右侧，不做成一横行——一横行里三条字必然互相压
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.018, 20),
        new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, opacity: 0 }),
      )
      dot.position.set(cx + 1.00, cy + 0.58 - i * 0.32, 0.36)
      group.add(dot)
      const label = makeLabel(name, { px: 32, weight: 600, color: '#D8F0E6', layer: LAYER_UI })
      label.position.set(cx + 1.06, cy + 0.58 - i * 0.32, 0.36)
      label.material.opacity = 0
      group.add(label)
      const scopeLabel = makeLabel(scope, { px: 22, weight: 500, color: '#8FB3A6', layer: LAYER_UI })
      scopeLabel.position.set(cx + 1.06, cy + 0.45 - i * 0.32, 0.36)
      scopeLabel.material.opacity = 0
      group.add(scopeLabel)
      return { ring, label, scopeLabel, dot, at: 0.8 + i * 0.9 }
    })

    // 中心的老人
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 32),
      new THREE.MeshBasicMaterial({ color: 0xF6F7F8, transparent: true, depthWrite: false, opacity: 0 }),
    )
    dot.position.set(cx, cy, 0.34)
    group.add(dot)

    // 磨砂罩：可能含隐私的内容被挡住
    const cover = makePanel(0.86, 0.52, 600, (ctx, w, h) => {
      plate(ctx, 2, 2, w - 4, h - 4, { fill: 'rgba(150,170,180,0.30)', radius: 16, stroke: 'rgba(190,210,220,0.6)', lineWidth: 2 })
      text(ctx, '磨砂罩：可能含隐私的内容', w * 0.06, h * 0.58, { size: h * 0.16, weight: 600, color: '#E8F1F5' })
      text(ctx, '姓名 · 住址 · 订单号 不进这个圈子', w * 0.06, h * 0.80, { size: h * 0.13, weight: 500, color: 'rgba(220,235,242,0.85)' })
    })
    cover.position.set(cx + 0.10, -0.66, 0.36)
    cover.material.opacity = 0
    group.add(cover)

    const donts = DONTS.map((s, i) => {
      const p = makePill(s, {
        width: 1.36, height: 0.17, size: 32, color: '#E4EAEE', align: 'center',
        fill: 'rgba(18,22,26,0.94)', stroke: 'rgba(120,136,148,0.75)',
      })
      p.position.set(1.06, 0.44 - i * 0.28, 0.34)
      p.material.opacity = 0
      group.add(p)
      return p
    })

    const rules = makePill('6 位配对码配对　·　家人留言经心跳回到手机', {
      width: 2.10, height: 0.16, size: 30, color: '#A9BCC7',
      fill: 'rgba(14,20,24,0.92)', stroke: 'rgba(90,110,125,0.65)',
    })
    rules.position.set(0.16, -0.84, 0.34)
    rules.material.opacity = 0
    group.add(rules)

    group.userData = { rings, dot, cover, donts, rules, cx, cy }
    stage.userData.pitchBoundary = group
  },

  enter(stage) {
    const g = stage.userData.pitchBoundary
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchBoundary
    const u = g.userData

    const k = ramp(local, 0, 10, EASE.inOut)
    const d = distanceFor(stage, 1.86, 0.86)
    stage.camera.position.set(-0.30 + 0.30 * k, 0.04, d)
    stage.camera.lookAt(-0.28 + 0.30 * k, -0.02, 0)

    u.dot.material.opacity = ramp(local, 0.4, 0.8, EASE.out) * 0.95
    for (let i = 0; i < u.rings.length; i++) {
      const r = u.rings[i]
      const a = ramp(local, r.at, 0.9, EASE.out)
      r.ring.material.opacity = a * 0.75
      r.label.material.opacity = a * 0.96
      r.scopeLabel.material.opacity = a * 0.9
      r.dot.material.opacity = a * 0.95
      r.ring.scale.setScalar(0.94 + 0.06 * a)
    }
    u.cover.material.opacity = ramp(local, 5.0, 0.9, EASE.out) * 0.96
    for (let i = 0; i < u.donts.length; i++) {
      const a = ramp(local, 8.6 + i * 0.30, 0.8, EASE.out)
      u.donts[i].material.opacity = a * 0.96
      u.donts[i].position.x = 1.06 + (1 - a) * 0.12
    }
    u.rules.material.opacity = ramp(local, 9.4, 0.9, EASE.out) * 0.94
  },

  teardown(stage) {
    const g = stage.userData.pitchBoundary
    if (g) g.visible = false
  },
})
