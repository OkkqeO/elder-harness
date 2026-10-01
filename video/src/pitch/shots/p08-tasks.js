// Ⅱ 我们能干什么 · S08 十三件事 (1:40–1:56, 16s)
//
// 任务墙：13 条真机任务，每条带步数与秒数。全部来自 docs/status.md 的真机实测
// （设备 OnePlus PLC110 / Android 16 / 1272×2800），其中两条是"正确判定做不到"。
// 整面墙画进一张纹理——13 条文字不需要 13 个三维对象。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makeSet, distanceFor, INK_BG } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, makeDataStrip, text, plate, tracked } from '../kit.js'

const TASKS = [
  ['喜鹊儿 看课表', '3 步 · 7s', '#4FBF9A'],
  ['美团 点外卖', '10 步 · 28s', '#4FBF9A'],
  ['微信 填消息', '7 步 · 16s', '#4FBF9A'],
  ['QQ 发消息', '3 步 · 5s', '#4FBF9A'],
  ['12306 查车票', '13 步 · 75s', '#4FBF9A'],
  ['拼多多 查快递', '6 步 · 18s', '#4FBF9A'],
  ['系统设置 调字体', '6 步 · 20s', '#4FBF9A'],
  ['B站 总结动态', '9 步 · 22s', '#4FBF9A'],
  ['美团 走到结算页', '4 步 · 20s', '#D8913C'],
  ['拼多多 下单', '14 步 · 42s', '#D8913C'],
  ['微信 转账', '6 步 · 18s', '#E2705F'],
  ['支付宝 付款码', '3 步 · 6s', '#E2705F'],
  ['美团 目标不具体', '3 步 · 7s', '#7FBED2'],
]

export const shotTasks = defineShot({
  name: 'tasks',
  start: 100,
  duration: 16,

  chapter: { num: 'Ⅱ', zh: '我们能干什么', en: 'WHAT IT CAN DO' },
  subs: [
    [0.8, 4.6, '13 件事，在真机上跑过', 'Thirteen errands, run on a real phone.'],
    [5.0, 8.6, '短的 3 步 5 秒，长的 14 步 42 秒', 'From three steps in five seconds to fourteen in forty-two.'],
    [9.0, 12.4, '其中两次的结论是「判定做不到」', 'Twice, the honest answer was: it cannot be done.'],
    [12.8, 15.6, '橙色是交回本人，红色是正确拒绝', 'Amber means handed back; red means correctly refused.'],
  ],
  sfx: [[0.6, 'whoosh', { dur: 1.0 }], [1.6, 'tick'], [2.0, 'tick'], [2.4, 'tick'], [5.0, 'sparkle'], [9.0, 'ding', { midi: 74 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const wall = makePanel(2.62, 1.22, 1800, (ctx, w, h) => {
      const cols = 3
      const rows = Math.ceil(TASKS.length / cols)
      const cw = w / cols
      const ch = h / rows
      for (let i = 0; i < TASKS.length; i++) {
        const [name, meta, color] = TASKS[i]
        const cx = (i % cols) * cw
        const cy = Math.floor(i / cols) * ch
        plate(ctx, cx + 8, cy + 6, cw - 16, ch - 12, {
          fill: 'rgba(16,22,27,0.92)', radius: 14, stroke: color + '90', lineWidth: 2,
        })
        ctx.fillStyle = color
        ctx.fillRect(cx + 8, cy + 6, 6, ch - 12)
        text(ctx, name, cx + cw * 0.075, cy + ch * 0.46, { size: ch * 0.30, weight: 700, color: '#E8EEF2' })
        text(ctx, meta, cx + cw * 0.075, cy + ch * 0.78, { size: ch * 0.22, weight: 500, color: color })
      }
    })
    wall.position.set(0, 0.10, 0.32)
    wall.material.opacity = 0
    group.add(wall)

    const strip = makePill('设备 OnePlus PLC110 · Android 16 · 1272×2800 · 记录 2026-09-29',
      { width: 2.36, height: 0.16, size: 28, color: '#A9BCC7', fill: 'rgba(14,20,24,0.9)', stroke: 'rgba(90,110,125,0.6)' })
    strip.position.set(0, 0.62, 0.34)
    strip.material.opacity = 0
    group.add(strip)

    const legend = makePill('绿＝直接执行 · 橙＝交回本人 · 红＝正确拒绝 / 判定做不到 · 蓝＝反问',
      { width: 2.36, height: 0.16, size: 28, color: '#A9BCC7', fill: 'rgba(14,20,24,0.9)', stroke: 'rgba(90,110,125,0.6)' })
    legend.position.set(0, 0.70, 0.34)
    legend.material.opacity = 0
    group.add(legend)

    group.userData = { wall, strip, legend }
    stage.userData.pitchTasks = group
  },

  enter(stage) {
    const g = stage.userData.pitchTasks
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchTasks
    const { wall, strip, legend } = g.userData

    // 镜头：从下往上托起任务墙，再缓缓后拉（13 条要一次看完）
    const rise = ramp(local, 0, 9, EASE.inOut)
    // 取景按任务墙自己的高度（1.22），边上留一点余量——2.62 宽的墙刚好顶到画框两侧
    const d = distanceFor(stage, 1.42, 0.78) * (1.0 + 0.03 * rise)
    stage.camera.position.set(0, -0.16 + 0.26 * rise, d)
    stage.camera.lookAt(0, -0.04 + 0.16 * rise, 0)

    const k = ramp(local, 0.4, 1.2, EASE.out)
    wall.material.opacity = k
    wall.position.y = 0.10 - (1 - k) * 0.16
    strip.material.opacity = ramp(local, 12.8, 0.9, EASE.out) * 0.95
    legend.material.opacity = ramp(local, 8.6, 0.9, EASE.out) * 0.95
    legend.position.y = 0.70 + (1 - ramp(local, 8.6, 0.9, EASE.out)) * 0.05
  },

  teardown(stage) {
    const g = stage.userData.pitchTasks
    if (g) g.visible = false
  },
})
