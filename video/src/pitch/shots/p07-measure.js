// Ⅰ · S07 分寸与交还 (1:26–1:40, 14s)
//
// 三条现有的分寸（README 的"什么会停下来问老人"）：
//   普通操作直接执行 / 敏感操作交回本人（ask_person）/ 盲页面坐标点按每次任务问一次。
// 分级自主（后果 · 可逆性 · 置信度）标"拟研发"——README 里它仍是研发方向，不能当已完成讲。
// 收尾：一只手把红方块接走，"1 次交回"。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makeSet, distanceFor, INK_BG, GOOD, ATTENTION, PROBLEM } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, text, plate, tracked } from '../kit.js'

const ROWS = [
  ['普通操作　直接执行', '点击 / 输入 / 滚动 / 返回', '#1E8449'],
  ['敏感操作　交回本人', '付款 · 发送 · 验证码 → ask_person', '#C46A14'],
  ['盲页面坐标点按', '每次任务问老人一次，同意后不再重复', '#1A7F6B'],
]

export const shotMeasure = defineShot({
  name: 'measure',
  start: 86,
  duration: 14,

  subs: [
    [0.8, 4.4, '大部分事，它自己做完', 'Most of it, it does alone.'],
    [4.8, 8.2, '付款、发送、验证码——交回本人', 'Payment, sending, codes — handed back to him.'],
    [8.6, 11.4, '盲页面坐标点按，一次任务只问一遍', 'On a blind page it asks once per task, then stops asking.'],
    [11.8, 13.8, '更细的分级自主仍在研发', 'The finer graded model is still in development.'],
  ],
  sfx: [[0.6, 'tick'], [2.2, 'tick'], [3.8, 'tick'], [8.6, 'ding', { midi: 78 }], [11.8, 'soft']],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const rows = ROWS.map(([title, sub, color], i) => {
      const panel = makePanel(1.86, 0.40, 1100, (ctx, w, h) => {
        plate(ctx, 2, 2, w - 4, h - 4, { fill: 'rgba(16,22,27,0.94)', radius: 18, stroke: color + 'B0', lineWidth: 3 })
        ctx.fillStyle = color
        ctx.fillRect(2, 2, 9, h - 4)
        text(ctx, title, w * 0.055, h * 0.46, { size: h * 0.30, weight: 700, color: '#E8EEF2' })
        text(ctx, sub, w * 0.055, h * 0.80, { size: h * 0.20, weight: 500, color: 'rgba(160,178,190,0.95)' })
      })
      panel.position.set(-0.30, 0.62 - i * 0.50, 0.32)
      panel.material.opacity = 0
      group.add(panel)
      return panel
    })

    // 被接走的红方块 + 一只手（剪影，不做写实）
    const block = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshBasicMaterial({ color: PROBLEM, transparent: true, depthWrite: false, opacity: 0 }),
    )
    block.position.set(0.96, -0.30, 0.34)
    group.add(block)

    const hand = new THREE.Mesh(
      new THREE.PlaneGeometry(0.40, 0.34),
      new THREE.MeshBasicMaterial({ color: 0x3C4650, transparent: true, depthWrite: false, opacity: 0 }),
    )
    hand.position.set(1.30, -0.34, 0.33)
    hand.rotation.z = -0.18
    group.add(hand)

    const counter = makePill('1 次交回', {
      width: 0.86, height: 0.17, size: 34, color: '#F3C9C2', align: 'center',
      fill: 'rgba(34,18,16,0.92)', stroke: 'rgba(192,57,43,0.85)',
    })
    counter.position.set(1.14, 0.60, 0.34)
    counter.material.opacity = 0
    group.add(counter)

    // 拟研发角标：虚线感 + 低饱和，和已实现的东西区分开
    const wip = makePill('拟研发：分级自主（后果 · 可逆性 · 置信度）', {
      width: 2.30, height: 0.17, size: 30, color: '#B9A98C',
      fill: 'rgba(30,28,22,0.92)', stroke: 'rgba(140,124,92,0.85)',
    })
    wip.position.set(1.04, 0.92, 0.34)
    wip.material.opacity = 0
    group.add(wip)

    group.userData = { rows, block, hand, counter, wip }
    stage.userData.pitchMeasure = group
  },

  enter(stage) {
    const g = stage.userData.pitchMeasure
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchMeasure
    const { rows, block, hand, counter, wip } = g.userData

    // 镜头：自上而下平移，末尾停住
    const travel = ramp(local, 0, 10, EASE.inOut)
    const d = distanceFor(stage, 2.25, 0.88)
    stage.camera.position.set(-0.30 + 0.34 * travel, 0.30 - 0.26 * travel, d)
    stage.camera.lookAt(-0.24 + 0.30 * travel, 0.16 - 0.24 * travel, 0)

    for (let i = 0; i < rows.length; i++) {
      const k = ramp(local, 0.7 + i * 1.4, 0.9, EASE.out)
      rows[i].material.opacity = k * 0.98
      rows[i].position.x = -0.30 - (1 - k) * 0.16
    }

    // 红方块被一只手接走："交回"这个动作要有物理感
    const take = ramp(local, 9.6, 1.2, EASE.inOut)
    block.material.opacity = ramp(local, 8.6, 0.6, EASE.out) * (1 - take * 0.85)
    block.position.x = 0.96 + take * 0.26
    block.position.y = -0.30 + take * 0.06
    hand.material.opacity = ramp(local, 9.2, 0.9, EASE.out) * 0.98
    hand.position.x = 1.30 + (1 - take) * 0.18
    counter.material.opacity = ramp(local, 10.4, 0.8, EASE.out) * 0.95
    wip.material.opacity = ramp(local, 11.8, 0.9, EASE.out) * 0.95
  },

  teardown(stage) {
    const g = stage.userData.pitchMeasure
    if (g) g.visible = false
  },
})
