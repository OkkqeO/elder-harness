// Ⅰ 我们是什么 · S03 (0:24–0:39, 15s)
//
// 一句话：不是新手机，也不是新 App——它住在老人已经在用的那台手机里。
// 左边是那台手机，中间三层玻璃（页面层 / 抽象层 / 约束层），右边是通用模型。
// 镜头从左往右横移，把三层依次揭出来；最后停在"模型只决定下一步"上。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import {
  makePhone, makeSet, makeMirror, makeLabel, distanceFor,
  INK_BG, LAYER_UI, BRAND, ATTENTION, GOOD, TEXT_DIM,
} from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, text, tracked, plate, makePill } from '../kit.js'
import { paintHome } from '../ui.js'

// 三层不做成同一位置的叠片：正对镜头时它们会糊成一团字。改成左下到右上的阶梯，
// 既有"层"的前后关系，又各自读得清。横向位置要给左边的手机让路——
// 手机占 x ∈ [-1.35, -0.75]，第一张卡从 -0.58 起，两者不重叠。
const LAYERS = [
  { title: '页面层', sub: '与手机同排版', color: '#7FBED2', x: -0.24, y: 0.22, z: 0.10, at: 1.5 },
  { title: '抽象层', sub: '机器的页面结构', color: '#4FBF9A', x: 0.24, y: 0.00, z: 0.24, at: 2.7 },
  { title: '约束层', sub: '分级 · 校验 · 交还', color: '#D8913C', x: 0.72, y: -0.22, z: 0.38, at: 3.9 },
]

export const shotWhatWeAre = defineShot({
  name: 'what-we-are',
  start: 24,
  duration: 15,

  chapter: { num: 'Ⅰ', zh: '我们是什么', en: 'WHAT WE ARE' },
  subs: [
    [0.8, 4.8, '不做新手机，也不做新 App', 'Not a new phone, not a new app.'],
    [5.2, 9.4, '它住在老人已经在用的那台手机里', 'It lives in the phone he already owns.'],
    [9.8, 14.2, '通用模型只决定下一步，约束由这一层管', 'The model picks the next step; the constraints are ours.'],
  ],
  sfx: [[0.5, 'whoosh', { dur: 0.9 }], [1.5, 'tick'], [2.7, 'tick'], [3.9, 'tick'], [6.2, 'chime', { midi: 74 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    // ---- 左：老人已经在用的手机 ----
    const phone = makePhone({ height: 1.30 })
    phone.position.set(-0.95, -0.06, 0)
    group.add(phone)
    group.add(makeMirror(phone, { floorY: -1.28, opacity: 0.09 }))

    // ---- 中：三层玻璃 ----
    const panes = LAYERS.map((L) => {
      const g = new THREE.Group()
      g.position.set(L.x, L.y, L.z)
      g.rotation.y = -0.10
      const panel = makePanel(0.68, 0.42, 760, (ctx, w, h) => {
        plate(ctx, 3, 3, w - 6, h - 6, { fill: 'rgba(255,255,255,0.055)', radius: 24, stroke: L.color + 'AA', lineWidth: 3 })
        // 左侧一条色带：三层的颜色就是它们的身份
        ctx.fillStyle = L.color
        ctx.fillRect(3, 3, 9, h - 6)
        text(ctx, L.title, w * 0.095, h * 0.42, { size: h * 0.26, weight: 700, color: L.color })
        text(ctx, L.sub, w * 0.095, h * 0.74, { size: h * 0.145, weight: 500, color: 'rgba(222,232,238,0.72)' })
      })
      g.add(panel)
      g.traverse(o => { if (o.material) o.material.opacity = 0 })
      group.add(g)
      return g
    })

    // ---- 右：通用模型 ----
    const model = new THREE.Group()
    model.position.set(1.52, 0.0, 0.30)
    const modelPanel = makePanel(0.76, 0.52, 700, (ctx, w, h) => {
      plate(ctx, 3, 3, w - 6, h - 6, { fill: 'rgba(12,17,21,0.94)', radius: 24, stroke: 'rgba(120,140,155,0.75)', lineWidth: 3 })
      text(ctx, '通用模型', w / 2, h * 0.44, { size: h * 0.26, weight: 700, color: '#E8EEF2', align: 'center' })
      text(ctx, '只决定下一步', w / 2, h * 0.72, { size: h * 0.175, weight: 500, color: 'rgba(160,178,190,0.95)', align: 'center' })
      tracked(ctx, 'CLOUD  PLANNER', w / 2, h * 0.90, { size: h * 0.10, color: 'rgba(120,140,155,0.8)', gap: 4, align: 'center' })
    })
    model.add(modelPanel)
    model.traverse(o => { if (o.material) o.material.opacity = 0 })
    group.add(model)

    // ---- 连线：手机 → 三层 → 模型 ----
    const wires = []
    const wireMat = () => new THREE.MeshBasicMaterial({
      color: 0x3E7F6E, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
    })
    for (const [x0, x1, y] of [[-0.74, -0.60, 0.02], [1.06, 1.14, -0.06]]) {
      const w = Math.abs(x1 - x0)
      const wire = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(w, 0.02), 0.004), wireMat())
      wire.position.set((x0 + x1) / 2, y, 0.18)
      group.add(wire)
      wires.push(wire)
    }

    const footer = makePill('不换手机 · 不装新应用 · 不改系统', {
      width: 1.72, height: 0.17, size: 34, color: '#CFE0E8',
      fill: 'rgba(16,22,27,0.9)', stroke: 'rgba(90,110,125,0.7)',
    })
    footer.position.set(0.0, 0.76, 0.34)
    footer.material.opacity = 0
    group.add(footer)

    group.userData = { phone, panes, model, wires, footer }
    stage.userData.pitchWhatWeAre = group
  },

  enter(stage) {
    const g = stage.userData.pitchWhatWeAre
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchWhatWeAre
    const { phone, panes, model, wires, footer } = g.userData

    // 镜头：从手机起，向右横移，末尾轻微推近模型
    // 构图约定：手机只占画面左侧约 30%（宽约 15%），右边留给要讲的东西。
    // 取景高度 V_h = 手机高/0.60，视线中心放在手机右侧 0.2·V_h·16/9 处。
    const travel = ramp(local, 0.2, 9.5, EASE.inOut)
    const VH = 1.30 / 0.60
    const WV = VH * 16 / 9
    const lookX = -0.95 + 0.20 * WV + 0.34 * travel
    const d = distanceFor(stage, VH, 1.0)
    stage.camera.position.set(lookX - 0.22 * WV * 0.5, 0.06 - 0.04 * travel, d)
    stage.camera.lookAt(lookX, -0.02, 0)

    const lit = ramp(local, 0.3, 1.0, EASE.out)
    phone.userData.setFrameOpacity(lit)
    phone.userData.surface.material.opacity = 0.12 + 0.88 * lit
    phone.userData.rim.material.opacity = 0.07 + 0.20 * lit
    if (!g.userData.painted) {
      g.userData.painted = true
      phone.userData.paint((ctx, w, h) => paintHome(ctx, w, h))
    }

    for (let i = 0; i < panes.length; i++) {
      const L = LAYERS[i]
      const k = ramp(local, L.at, 1.2, EASE.out)
      panes[i].traverse(o => { if (o.material) o.material.opacity = k })
      panes[i].position.x = L.x - (1 - k) * 0.14
      panes[i].position.y = L.y - (1 - k) * 0.04
    }

    const mk = ramp(local, 6.2, 1.3, EASE.out)
    model.traverse(o => { if (o.material) o.material.opacity = mk })
    model.position.x = 1.52 + (1 - mk) * 0.18

    for (let i = 0; i < wires.length; i++) {
      wires[i].material.opacity = ramp(local, 5.2 + i * 0.25, 0.9, EASE.out) * 0.7
    }

    footer.material.opacity = ramp(local, 11.6, 1.4, EASE.out) * 0.95
    footer.position.y = 0.76 - (1 - ramp(local, 11.6, 1.4, EASE.out)) * 0.05
  },

  teardown(stage) {
    const g = stage.userData.pitchWhatWeAre
    if (g) g.visible = false
  },
})
