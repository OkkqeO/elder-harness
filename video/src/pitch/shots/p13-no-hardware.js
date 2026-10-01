// Ⅲ 为什么选择我们 · S13 不换设备 (3:04–3:17, 13s)
//
// 分屏对照：左边是"别的方案"——机械臂、传感器、头显，要老人换设备、加门槛（调研里
// 慧眸灵擎就是靠机械臂在物理世界行动）；右边是我们：一台他已经在用的手机。
// 左半屏压暗、打叉，右半屏亮起、打勾。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makePhone, makeSet, makeMirror, distanceFor, INK_BG, GOOD, PROBLEM, ATTENTION } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePill, makePanel, text, plate } from '../kit.js'
import { paintHome } from '../ui.js'

export const shotNoHardware = defineShot({
  name: 'no-hardware',
  start: 184,
  duration: 13,

  chapter: { num: 'Ⅲ', zh: '为什么选择我们', en: 'WHY US' },
  subs: [
    [0.6, 4.6, '别的方案让老人换设备', 'Others ask him to change devices.'],
    [5.0, 8.6, '我们不换手机、不装新应用、不改系统', 'We change none of that: same phone, same apps, same system.'],
    [9.0, 12.4, '门槛越低，越可能真的用起来', 'The lower the barrier, the more likely it is used.'],
  ],
  sfx: [[0.5, 'cut'], [4.6, 'whoosh', { dur: 0.9 }], [9.0, 'chime', { midi: 81 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const left = makePanel(1.34, 1.20, 900, (ctx, w, h) => {
      plate(ctx, 2, 2, w - 4, h - 4, { fill: 'rgba(12,15,18,0.96)', radius: 20, stroke: 'rgba(90,100,110,0.5)', lineWidth: 2 })
      text(ctx, '别的方案', w * 0.08, h * 0.10, { size: h * 0.075, weight: 700, color: '#8D9AA5' })
      // 机械臂 + 传感器 + 头显：都画成剪影，不做写实
      ctx.fillStyle = 'rgba(58,66,74,0.95)'
      ctx.fillRect(w * 0.16, h * 0.30, w * 0.10, h * 0.42)
      ctx.fillRect(w * 0.16, h * 0.30, w * 0.44, h * 0.07)
      ctx.fillRect(w * 0.52, h * 0.30, w * 0.08, h * 0.20)
      ctx.beginPath(); ctx.arc(w * 0.60, h * 0.56, w * 0.06, 0, Math.PI * 2); ctx.fill()
      ctx.fillRect(w * 0.70, h * 0.42, w * 0.16, h * 0.10)
      text(ctx, '机械臂 · 传感器 · 头显', w * 0.08, h * 0.86, { size: h * 0.062, weight: 500, color: '#7D8892' })
      // 叉
      ctx.strokeStyle = 'rgba(192,57,43,0.95)'
      ctx.lineWidth = 9
      ctx.beginPath(); ctx.moveTo(w * 0.68, h * 0.16); ctx.lineTo(w * 0.88, h * 0.36); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(w * 0.88, h * 0.16); ctx.lineTo(w * 0.68, h * 0.36); ctx.stroke()
    })
    left.position.set(-0.82, 0.02, 0.32)
    left.material.opacity = 0
    group.add(left)

    const right = makePanel(1.34, 1.20, 900, (ctx, w, h) => {
      plate(ctx, 2, 2, w - 4, h - 4, { fill: 'rgba(14,26,24,0.94)', radius: 20, stroke: 'rgba(79,191,154,0.8)', lineWidth: 3 })
      text(ctx, '我们', w * 0.08, h * 0.10, { size: h * 0.075, weight: 700, color: '#CFE8DF' })
      plate(ctx, w * 0.30, h * 0.24, w * 0.40, h * 0.52, { fill: 'rgba(246,247,248,0.96)', radius: 22 })
      plate(ctx, w * 0.34, h * 0.27, w * 0.32, h * 0.46, { fill: 'rgba(232,236,238,0.9)', radius: 18 })
      ctx.beginPath(); ctx.arc(w * 0.50, h * 0.50, w * 0.10, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(196,106,20,0.95)'; ctx.fill()
      text(ctx, '老人已经在用的那部手机', w * 0.08, h * 0.88, { size: h * 0.062, weight: 600, color: '#8FE3C4' })
      ctx.strokeStyle = 'rgba(79,191,154,0.95)'
      ctx.lineWidth = 9
      ctx.beginPath(); ctx.moveTo(w * 0.70, h * 0.26); ctx.lineTo(w * 0.76, h * 0.33); ctx.lineTo(w * 0.89, h * 0.15); ctx.stroke()
    })
    right.position.set(0.82, 0.02, 0.32)
    right.material.opacity = 0
    group.add(right)

    const divider = new THREE.Mesh(
      new THREE.PlaneGeometry(0.004, 1.34),
      new THREE.MeshBasicMaterial({ color: 0x3A5763, transparent: true, depthWrite: false, opacity: 0 }),
    )
    divider.position.set(0, 0.02, 0.30)
    group.add(divider)

    const footer = makePill('不换手机 · 不装新应用 · 不改系统', {
      width: 2.10, height: 0.18, size: 36, color: '#E8F3EF', align: 'center',
      fill: 'rgba(14,26,24,0.95)', stroke: 'rgba(79,191,154,0.85)',
    })
    footer.position.set(0, 0.78, 0.34)
    footer.material.opacity = 0
    group.add(footer)

    group.userData = { left, right, divider, footer }
    stage.userData.pitchNoHardware = group
  },

  enter(stage) {
    const g = stage.userData.pitchNoHardware
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchNoHardware
    const { left, right, divider, footer } = g.userData

    const k = ramp(local, 0, 11, EASE.inOut)
    // 取景要装得下两块面板（各 1.34 宽、中心 ±0.82）：横向几乎不移动，否则左板会被切
    const d = distanceFor(stage, 1.74, 0.84)
    stage.camera.position.set(-0.06 + 0.14 * k, 0.02, d)
    stage.camera.lookAt(-0.04 + 0.12 * k, 0.0, 0)

    const lk = ramp(local, 0.5, 0.8, EASE.out)
    const rk = ramp(local, 4.6, 1.0, EASE.out)
    left.material.opacity = lk * 0.85
    left.position.x = -0.82 - (1 - lk) * 0.14
    right.material.opacity = rk * 0.98
    right.position.x = 0.82 + (1 - rk) * 0.14
    right.scale.set(0.97 + 0.03 * rk, 0.97 + 0.03 * rk, 1)
    divider.material.opacity = ramp(local, 1.4, 0.9, EASE.out) * 0.6
    footer.material.opacity = ramp(local, 9.0, 0.9, EASE.out) * 0.96
    footer.position.y = 0.78 - (1 - ramp(local, 9.0, 0.9, EASE.out)) * 0.05
  },

  teardown(stage) {
    const g = stage.userData.pitchNoHardware
    if (g) g.visible = false
  },
})
