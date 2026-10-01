// Ⅱ · S10 危险的一步 (2:15–2:34, 19s)
//
// 三个真实案例并置，边框一律 problem 红：
//   拼多多下单 → App 直跳第三方支付，模型在盲页面上取消支付并返回（14 步 42s）
//   微信转账 → 判定做不到（6 步 18s）
//   支付宝付款码 → 正确拒绝，命中目标级拒付词表（3 步 6s）
// 底部一条：拒付词表覆盖的类别。全部来自 docs/status.md。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makePhone, makeSet, distanceFor, INK_BG, PROBLEM } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, text, plate, tracked } from '../kit.js'

const CASES = [
  ['拼多多 下单', '跳到第三方支付页', '在盲页面上取消支付并返回', '14 步 · 42s'],
  ['微信 转账', '判定做不到', '不做转账，并说明原因', '6 步 · 18s'],
  ['支付宝 付款码', '正确拒绝', '命中目标级拒付词表', '3 步 · 6s'],
]

export const shotDangerous = defineShot({
  name: 'dangerous',
  start: 135,
  duration: 19,

  subs: [
    [0.8, 5.0, '有一类操作，它不碰', 'There is a class of action it does not touch.'],
    [5.4, 9.6, '拼多多下单会跳到第三方支付页', 'One order flow jumps straight to a payment page.'],
    [10.0, 14.2, '它在读不到控件的页面上取消支付，然后返回', 'On a page it cannot read, it cancels the payment and goes back.'],
    [14.6, 18.6, '付款、下单、转账、验证码——拒付词表命中', 'Payment, orders, transfers, codes — the refusal list catches them.'],
  ],
  sfx: [[0.6, 'tick'], [3.0, 'tick'], [5.4, 'whoosh', { dur: 0.8 }], [10.0, 'cut'], [14.6, 'ding', { midi: 72 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const cards = CASES.map(([name, verdict, detail, meta], i) => {
      const x = -0.98 + i * 0.98
      const g = new THREE.Group()
      g.position.set(x, -0.06, 0.30)
      const panel = makePanel(0.86, 1.26, 760, (ctx, w, h) => {
        plate(ctx, 3, 3, w - 6, h - 6, { fill: 'rgba(18,14,14,0.94)', radius: 20, stroke: 'rgba(192,57,43,0.85)', lineWidth: 3 })
        ctx.fillStyle = '#C0392B'
        ctx.fillRect(3, 3, w - 6, 7)
        text(ctx, name, w * 0.07, h * 0.13, { size: h * 0.072, weight: 700, color: '#F2E4E0' })
        // 一台手机的轮廓：这一页读不到控件
        plate(ctx, w * 0.30, h * 0.24, w * 0.40, h * 0.34, { fill: 'rgba(60,66,72,0.55)', radius: 14, stroke: 'rgba(140,150,158,0.5)', lineWidth: 2 })
        plate(ctx, w * 0.34, h * 0.27, w * 0.32, h * 0.28, { fill: 'rgba(26,32,38,0.9)', radius: 10 })
        text(ctx, verdict, w * 0.07, h * 0.66, { size: h * 0.066, weight: 700, color: '#F08A78' })
        text(ctx, detail, w * 0.07, h * 0.75, { size: h * 0.050, weight: 500, color: 'rgba(214,196,190,0.92)' })
        text(ctx, meta, w * 0.07, h * 0.90, { size: h * 0.050, weight: 600, color: '#D8913C' })
      })
      g.add(panel)
      g.traverse(o => { if (o.material) o.material.opacity = 0 })
      group.add(g)
      return g
    })

    const banner = makePill('拒付词表：支付 · 下单 · 转账 · 发消息 · 验证码 · 身份认证 · 删除',
      { width: 2.62, height: 0.18, size: 32, color: '#F3C9C2', fill: 'rgba(34,16,14,0.94)', stroke: 'rgba(192,57,43,0.9)' })
    banner.position.set(0, 0.72, 0.34)
    banner.material.opacity = 0
    group.add(banner)

    const tag = makePill('人工闸门：ask_person　·　自动闸门：拒付词表', {
      width: 2.10, height: 0.16, size: 30, color: '#C9B6A8',
      fill: 'rgba(22,18,14,0.92)', stroke: 'rgba(150,120,90,0.7)',
    })
    tag.position.set(0, -0.72, 0.34)
    tag.material.opacity = 0
    group.add(tag)

    group.userData = { cards, banner, tag }
    stage.userData.pitchDangerous = group
  },

  enter(stage) {
    const g = stage.userData.pitchDangerous
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchDangerous
    const { cards, banner, tag } = g.userData

    // 三张卡要能同框比较：取景按整组宽度（约 2.9）算，横移只做小幅，否则外侧的卡会被切掉
    const k = ramp(local, 0, 15, EASE.inOut)
    const d = distanceFor(stage, 1.12, 0.62)
    stage.camera.position.set(-0.30 + 0.60 * k, 0.02, d)
    stage.camera.lookAt(-0.30 + 0.60 * k, -0.02, 0)

    for (let i = 0; i < cards.length; i++) {
      const a = ramp(local, 0.6 + i * 1.3, 0.9, EASE.out)
      cards[i].traverse(o => { if (o.material) o.material.opacity = a })
      cards[i].position.y = -0.06 - (1 - a) * 0.14
    }
    banner.material.opacity = ramp(local, 14.6, 0.9, EASE.out) * 0.96
    tag.material.opacity = ramp(local, 3.4, 0.9, EASE.out) * 0.94
  },

  teardown(stage) {
    const g = stage.userData.pitchDangerous
    if (g) g.visible = false
  },
})
