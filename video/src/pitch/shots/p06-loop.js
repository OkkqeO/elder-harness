// Ⅰ · S06 办事循环 (1:11–1:26, 15s)
//
// 观察 → 规划 → 执行 → 回灌，一圈一圈。中心是通用模型（只决定下一步），
// 工具方块一次只出一个，执行完的新页面以一条细流回灌。中途停下再从同一段对话接着走。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makeSet, makeLabel, distanceFor, INK_BG, LAYER_UI, BRAND } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, text, tracked, plate } from '../kit.js'

const STEPS = ['观察', '规划', '执行', '回灌']
const TOOLS = ['tap', 'input_text', 'screenshot']

export const shotLoop = defineShot({
  name: 'loop',
  start: 71,
  duration: 15,

  subs: [
    [0.8, 4.6, '看见、决定、动手、再看', 'Look, decide, act, look again.'],
    [5.0, 8.6, '模型只决定下一步做什么', 'The model only decides the next step.'],
    [9.0, 12.0, '每做完一步，新页面自动回灌', 'After each step, the new page flows back in.'],
    [12.4, 14.6, '中途停下，再从同一段对话接着走', 'Stop midway, and it resumes the same conversation.'],
  ],
  sfx: [[0.6, 'whoosh', { dur: 1.0 }], [3.4, 'tick'], [5.0, 'ding', { midi: 76 }], [9.0, 'loop' ], [12.4, 'chime', { midi: 81 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    // 四个节拍：环上的四个节点
    const nodes = STEPS.map((s, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 2
      const x = Math.cos(a) * 0.95
      const y = Math.sin(a) * 0.72
      const pill = makePill(s, {
        width: 0.52, height: 0.19, size: 40, color: '#E8F3EF', align: 'center',
        fill: 'rgba(18,32,30,0.92)', stroke: 'rgba(79,191,154,0.85)',
      })
      pill.position.set(x, y, 0.30)
      pill.material.opacity = 0
      group.add(pill)
      return { pill, a, at: 0.8 + i * 0.55 }
    })

    // 环：一条虚线感的圆环（用 64 段细线拼）
    const links = []
    for (let i = 0; i < 64; i++) {
      const a0 = i / 64 * Math.PI * 2
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.006, 0.070),
        new THREE.MeshBasicMaterial({ color: 0x2E6B5C, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
      )
      m.position.set(Math.cos(a0) * 0.95, Math.sin(a0) * 0.72, 0.26)
      m.rotation.z = a0
      group.add(m)
      links.push(m)
    }

    // 中心：通用模型
    const core = makePanel(0.72, 0.46, 700, (ctx, w, h) => {
      plate(ctx, 3, 3, w - 6, h - 6, { fill: 'rgba(12,17,21,0.95)', radius: 22, stroke: 'rgba(120,140,155,0.8)', lineWidth: 3 })
      text(ctx, '通用模型', w / 2, h * 0.44, { size: h * 0.24, weight: 700, color: '#E8EEF2', align: 'center' })
      text(ctx, '只决定下一步', w / 2, h * 0.72, { size: h * 0.16, weight: 500, color: 'rgba(160,178,190,0.95)', align: 'center' })
    })
    core.position.set(0, 0.0, 0.30)
    core.material.opacity = 0
    group.add(core)

    // 工具方块：从中心沿切线飞出
    const tools = TOOLS.map((t, i) => {
      const p = makePill(t, {
        width: 0.86, height: 0.17, size: 36, color: '#0E1A18', align: 'center',
        fill: 'rgba(120,224,196,0.94)',
      })
      p.position.set(0, 0, 0.34)
      p.material.opacity = 0
      group.add(p)
      return p
    })

    const note = makePill('新页面自动回灌', {
      width: 1.18, height: 0.16, size: 32, color: '#9FD8C6',
      fill: 'rgba(14,22,20,0.9)', stroke: 'rgba(79,191,154,0.7)',
    })
    note.position.set(0, -0.88, 0.34)
    note.material.opacity = 0
    group.add(note)

    const resume = makePill('停下 → 从同一段对话接着走', {
      width: 1.86, height: 0.17, size: 34, color: '#F0D9B8',
      fill: 'rgba(28,22,12,0.92)', stroke: 'rgba(200,140,60,0.8)',
    })
    resume.position.set(0, -1.28, 0.34)
    resume.material.opacity = 0
    group.add(resume)

    group.userData = { nodes, links, core, tools, note, resume }
    stage.userData.pitchLoop = group
  },

  enter(stage) {
    const g = stage.userData.pitchLoop
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchLoop
    const { nodes, links, core, tools, note, resume } = g.userData

    // 镜头：绕环半圈，末尾轻微推近
    const orbit = ramp(local, 0, 15, EASE.inOut)
    const d = distanceFor(stage, 2.10, 0.86) * (1.0 - 0.05 * orbit)
    const ang = -0.42 + 0.62 * orbit
    stage.camera.position.set(Math.sin(ang) * d, 0.06 + 0.05 * orbit, Math.cos(ang) * d)
    stage.camera.lookAt(0, -0.04, 0)

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].pill.material.opacity = ramp(local, nodes[i].at, 0.9, EASE.out) * 0.95
      nodes[i].pill.position.x = Math.cos(nodes[i].a) * 0.95
      nodes[i].pill.position.y = Math.sin(nodes[i].a) * 0.72
    }
    for (let i = 0; i < links.length; i++) {
      links[i].material.opacity = ramp(local, 0.5 + i * 0.012, 1.0, EASE.out) * 0.55
    }
    core.material.opacity = ramp(local, 3.0, 1.0, EASE.out) * 0.98

    // 工具方块：一个接一个沿切线飞出，然后回到中心（回灌）
    for (let i = 0; i < tools.length; i++) {
      const at = 5.4 + i * 1.15
      const out = ramp(local, at, 0.55, EASE.out)
      const back = ramp(local, at + 0.75, 0.9, EASE.inOut)
      const a = -0.35 + i * 0.5
      // 最小半径 1.00：方块回灌时不能盖住中心的"通用模型"（面板半宽 0.36 + 药丸半宽 0.43）
      const r = 1.00 + out * 0.42 * (1 - back * 0.9)
      tools[i].position.set(Math.cos(a) * r, Math.sin(a) * r * 0.8, 0.34)
      tools[i].material.opacity = out * (1 - back * 0.55)
      tools[i].rotation.z = (1 - out) * -0.25
    }

    note.material.opacity = ramp(local, 9.0, 0.9, EASE.out) * 0.95
    resume.material.opacity = ramp(local, 12.4, 0.9, EASE.out) * 0.95
  },

  teardown(stage) {
    const g = stage.userData.pitchLoop
    if (g) g.visible = false
  },
})
