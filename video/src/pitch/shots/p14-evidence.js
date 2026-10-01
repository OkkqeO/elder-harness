// Ⅲ · S14 不说没做到的 (3:17–3:38, 21s)
//
// 全片的重心：一句圆满的声明落在白卡上，三道机械闸门依次扫过——
//   引用的文字是不是这一轮打进去的 / 提到的时刻是不是早于开始办事 / 这一轮动过能改变外界的动作吗
// （core/src/main/kotlin/com/yinling/core/OutcomeCheck.kt 的 R1–R3）。
// 不过闸，卡片沿缝炸裂，只剩一句诚实的收尾。诚实的部分也要写清楚：机械层是下限，不是成功证明。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makeSet, makeCard, makeLabel, mulberry32, distanceFor, INK_BG, LAYER_UI, ATTENTION } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, makeGrating, text, plate, tracked } from '../kit.js'

const GATES = [
  ['R1', '文字来源', '这句话里的字，是这一轮打进去的吗？'],
  ['R2', '时间锚点', '提到的时刻，早于开始办事吗？'],
  ['R3', '改变类动作', '这一轮，动过能改变外界的动作吗？'],
]

export const shotEvidence = defineShot({
  name: 'evidence',
  start: 197,
  duration: 21,

  subs: [
    [0.8, 5.0, '有一类错最伤人：没办成，却说办成了', 'The worst failure is a claim that is not true.'],
    [5.4, 9.8, '它先问自己三件事', 'Before it says done, it asks itself three questions.'],
    [10.2, 15.4, '文字来源、时间锚点、改变类动作', 'Where the words came from, when, and whether anything changed.'],
    [15.8, 20.6, '过不了闸，就只说「我没法确认」', 'If it cannot pass, it only says: I cannot confirm it.'],
  ],
  sfx: [[0.6, 'braam'], [5.4, 'tick'], [6.6, 'tick'], [7.8, 'tick'], [11.0, 'tick'], [12.2, 'tick'],
    [13.4, 'tick'], [15.8, 'glass', { midi: 78 }], [18.0, 'soft']],
  mb: 4,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const claim = makePanel(2.06, 0.86, 1400, (ctx, w, h) => {
      plate(ctx, 3, 3, w - 6, h - 6, { fill: 'rgba(246,247,248,0.97)', radius: 22 })
      text(ctx, '已帮您把消息发出去了：', w * 0.05, h * 0.32, { size: h * 0.155, weight: 700, color: '#17202A' })
      text(ctx, '…时间是 17:37，发送成功', w * 0.05, h * 0.58, { size: h * 0.125, weight: 500, color: '#5D6D7E' })
      text(ctx, '（这一轮的真实动作：open_app / wait / tap_xy / screenshot）', w * 0.05, h * 0.82,
        { size: h * 0.090, weight: 500, color: '#8A98A5' })
    })
    claim.position.set(0.02, 0.36, 0.32)
    claim.material.opacity = 0
    group.add(claim)

    const gates = GATES.map(([id, name, q], i) => {
      const line = makeGrating({ width: 2.30, count: 1, color: 0xC46A14 })
      line.position.set(0, 0.02 - i * 0.30, 0.34)
      group.add(line)
      const p = makePanel(2.24, 0.22, 1200, (ctx, w, h) => {
        plate(ctx, 0, 0, w, h, { fill: 'rgba(18,14,10,0.92)', radius: 12, stroke: 'rgba(196,106,20,0.75)', lineWidth: 2 })
        text(ctx, id, w * 0.02, h * 0.68, { size: h * 0.44, weight: 700, color: '#E8A860' })
        text(ctx, name, w * 0.075, h * 0.68, { size: h * 0.42, weight: 700, color: '#F0D9B8' })
        text(ctx, q, w * 0.30, h * 0.68, { size: h * 0.40, weight: 500, color: 'rgba(214,196,180,0.95)' })
      })
      p.position.set(0.02, 0.12 - i * 0.28, 0.35)
      p.material.opacity = 0
      group.add(p)
      return { line, panel: p, at: 5.6 + i * 1.2 }
    })

    // 碎片：过不了闸，卡片沿缝炸开
    const rnd = mulberry32(20261001)
    const shards = []
    for (let i = 0; i < 26; i++) {
      const s = makePanel(0.22 + rnd() * 0.16, 0.14 + rnd() * 0.10, 120, (ctx, w, h) => {
        plate(ctx, 0, 0, w, h, { fill: 'rgba(246,247,248,0.92)', radius: 6 })
      })
      s.position.set(0.02, 0.36, 0.38)
      s.material.opacity = 0
      s.userData = { vx: (rnd() - 0.5) * 0.9, vy: (rnd() - 0.2) * 0.9, rot: (rnd() - 0.5) * 2.4, d: rnd() }
      group.add(s)
      shards.push(s)
    }

    const honest = makePill('我没法确认这件事真的办成了', {
      width: 2.10, height: 0.20, size: 40, color: '#F0C08A', align: 'center',
      fill: 'rgba(30,20,10,0.94)', stroke: 'rgba(196,106,20,0.9)',
    })
    honest.position.set(0.02, -0.34, 0.34)
    honest.material.opacity = 0
    group.add(honest)

    const next = makePill('接着办', {
      width: 0.72, height: 0.17, size: 34, color: '#CFE0E8', align: 'center',
      fill: 'rgba(16,22,27,0.92)', stroke: 'rgba(90,110,125,0.7)',
    })
    next.position.set(0.02, -0.62, 0.34)
    next.material.opacity = 0
    group.add(next)

    const checks = makePill('回归校验：73 项 JVM 检查 + 20 项服务端测试', {
      width: 2.10, height: 0.16, size: 30, color: '#A9BCC7',
      fill: 'rgba(14,20,24,0.92)', stroke: 'rgba(90,110,125,0.65)',
    })
    checks.position.set(0.02, -0.90, 0.34)
    checks.material.opacity = 0
    group.add(checks)

    const honestNote = makePill('机械层校验是下限，不是成功证明', {
      width: 1.86, height: 0.16, size: 30, color: '#D6B98A',
      fill: 'rgba(26,22,14,0.92)', stroke: 'rgba(150,124,80,0.8)',
    })
    honestNote.position.set(0.02, 0.76, 0.34)
    honestNote.material.opacity = 0
    group.add(honestNote)

    group.userData = { claim, gates, shards, honest, next, checks, honestNote }
    stage.userData.pitchEvidence = group
  },

  enter(stage) {
    const g = stage.userData.pitchEvidence
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchEvidence
    const u = g.userData

    const k = ramp(local, 0, 14, EASE.inOut)
    const d = distanceFor(stage, 1.62, 0.88) * (1.0 - 0.04 * k)
    stage.camera.position.set(0.10 - 0.16 * k, 0.10 - 0.06 * k, d)
    stage.camera.lookAt(0.02, 0.04 - 0.02 * k, 0)

    const claimK = ramp(local, 0.4, 1.0, EASE.out)
    const shatter = ramp(local, 15.8, 0.9, EASE.inOut)
    u.claim.material.opacity = claimK * (1 - shatter)
    u.claim.position.y = 0.36 - shatter * 0.04

    for (let i = 0; i < u.gates.length; i++) {
      const { line, panel, at } = u.gates[i]
      const gk = ramp(local, at, 0.5, EASE.out)
      const sweep = ramp(local, at, 1.1, EASE.inOut)
      line.userData.mat.opacity = gk * 0.9 * (1 - shatter * 0.4)
      line.position.y = 0.74 - sweep * 1.16
      panel.material.opacity = gk * 0.96 * (1 - shatter * 0.5)
      panel.position.x = 0.02 + (1 - gk) * 0.10
    }

    for (const s of u.shards) {
      const k2 = ramp(local, 15.8 + s.userData.d * 0.5, 2.2, EASE.out)
      s.material.opacity = k2 * 0.9 * (1 - ramp(local, 19.4, 1.4, EASE.inOut))
      s.position.x = 0.02 + s.userData.vx * k2
      s.position.y = 0.36 + s.userData.vy * k2
      s.rotation.z = s.userData.rot * k2
    }

    u.honest.material.opacity = ramp(local, 17.4, 1.0, EASE.out) * 0.97
    u.honest.position.y = -0.34 + (1 - ramp(local, 17.4, 1.0, EASE.out)) * 0.05
    u.next.material.opacity = ramp(local, 18.4, 0.9, EASE.out) * 0.95
    u.checks.material.opacity = ramp(local, 19.0, 0.9, EASE.out) * 0.94
    u.honestNote.material.opacity = ramp(local, 10.6, 1.0, EASE.out) * 0.95
  },

  teardown(stage) {
    const g = stage.userData.pitchEvidence
    if (g) g.visible = false
  },
})
