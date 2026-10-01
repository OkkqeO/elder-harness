// Ⅱ · S11 省的是手脚 (2:34–2:51, 17s)
//
// 交还本人这一步长什么样：美团结算页把金额、地址、点哪里说清楚后停住；QQ 填好后
// 请老人自己发送。右下角是那组实测数字——一次 10 步外卖任务：打扰 0 次、直接执行 9 次、
// 危险步骤 1 次被拒并交回（改造前约 9~12 次打扰）。status.md 实测。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makePhone, makeSet, makeMirror, distanceFor, INK_BG } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, makeDataStrip, text, plate } from '../kit.js'

export const shotHandBack = defineShot({
  name: 'hand-back',
  start: 154,
  duration: 17,

  subs: [
    [0.8, 5.0, '关键一步，本人来按', 'The last step is his to press.'],
    [5.4, 9.8, '金额、地址、点哪里——它逐条说清楚，然后停住', 'It names the amount, the address, the button — then it stops.'],
    [10.2, 13.8, '一次 10 步的外卖，打扰 0 次', 'Ten steps of takeaway, zero interruptions.'],
    [14.2, 16.6, '它省的是手脚，不是决定', 'It saves his hands, never his decision.'],
  ],
  sfx: [[0.6, 'tap'], [5.4, 'ding', { midi: 79 }], [10.2, 'chime', { midi: 83 }], [14.2, 'soft']],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    // 左：美团结算页（手机上），逐条念清
    const phoneA = makePhone({ height: 1.44 })
    phoneA.position.set(-1.05, -0.06, 0)
    group.add(phoneA)
    group.add(makeMirror(phoneA, { floorY: -1.28, opacity: 0.08 }))

    const lines = ['金额 ¥25.90', '地址 · 已选', '点「立即支付」'].map((s, i) => {
      const p = makePill(s, { width: 0.92, height: 0.15, size: 28, color: '#E8EEF2', fill: 'rgba(16,22,27,0.92)', stroke: 'rgba(90,110,125,0.7)' })
      p.position.set(-0.30, 0.36 - i * 0.22, 0.32)
      p.material.opacity = 0
      group.add(p)
      return p
    })

    // 中：QQ 输入框 + "请本人发送"
    const phoneB = makePhone({ height: 1.44 })
    phoneB.position.set(0.62, -0.06, 0)
    group.add(phoneB)
    group.add(makeMirror(phoneB, { floorY: -1.28, opacity: 0.08 }))

    const sendHint = makePill('请本人发送', {
      width: 0.86, height: 0.16, size: 30, color: '#F0D9B8', align: 'center',
      fill: 'rgba(30,22,12,0.94)', stroke: 'rgba(200,140,60,0.85)',
    })
    sendHint.position.set(1.26, -0.34, 0.32)
    sendHint.material.opacity = 0
    group.add(sendHint)

    const strip = makeDataStrip([
      ['打扰', '0 次', '#4FBF9A'], ['直接执行', '9 次', '#4FBF9A'], ['危险步骤', '1 次交回', '#D8913C'],
    ], { width: 1.86, height: 0.28 })
    strip.position.set(0.84, 0.56, 0.34)
    strip.material.opacity = 0
    group.add(strip)

    const note = makePill('改造前：同一步数约 9~12 次打扰', {
      width: 1.86, height: 0.15, size: 28, color: '#A9BCC7',
      fill: 'rgba(14,20,24,0.9)', stroke: 'rgba(90,110,125,0.6)',
    })
    note.position.set(0.84, 0.28, 0.34)
    note.material.opacity = 0
    group.add(note)

    group.userData = { phoneA, lines, phoneB, sendHint, strip, note }
    stage.userData.pitchHandBack = group
  },

  enter(stage) {
    const g = stage.userData.pitchHandBack
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchHandBack
    const u = g.userData

    const k = ramp(local, 0, 13, EASE.inOut)
    const d = distanceFor(stage, 1.92, 0.90)
    stage.camera.position.set(-0.76 + 0.96 * k, 0.02, d)
    stage.camera.lookAt(-0.74 + 0.94 * k, -0.04, 0)

    const paint = (p, rows, title) => {
      if (p.userData.__done) return
      p.userData.__done = true
      p.userData.paint((ctx, w, h) => {
        ctx.fillStyle = '#F6F7F8'; ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#17202A'
        ctx.font = `600 ${Math.round(w * 0.070)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
        ctx.fillText(title, w * 0.08, h * 0.10)
        rows.forEach((r, i) => {
          ctx.fillStyle = i === rows.length - 1 ? '#C46A14' : '#3D4A55'
          ctx.font = `${i === rows.length - 1 ? 700 : 500} ${Math.round(w * (i === rows.length - 1 ? 0.075 : 0.058))}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
          ctx.fillText(r, w * 0.08, h * (0.26 + i * 0.11))
        })
      })
    }

    const lit = ramp(local, 0.2, 1.0, EASE.out)
    paint(u.phoneA, ['订单：黄焖鸡米饭 1 人份微辣', '金额 ¥25.90', '地址 · 已选', '请您自己点「立即支付」'], '结算页')
    paint(u.phoneB, ['收件人：女儿', '内容：你好', '（已填好，等你按发送）'], 'QQ 发消息')
    for (const p of [u.phoneA, u.phoneB]) {
      p.userData.setFrameOpacity(lit)
      p.userData.surface.material.opacity = 0.12 + 0.88 * lit
      p.userData.rim.material.opacity = 0.07 + 0.20 * lit
    }

    for (let i = 0; i < u.lines.length; i++) {
      u.lines[i].material.opacity = ramp(local, 5.2 + i * 0.5, 0.7, EASE.out) * 0.96
      u.lines[i].position.x = -0.30 + (1 - ramp(local, 5.2 + i * 0.5, 0.7, EASE.out)) * 0.10
    }
    u.sendHint.material.opacity = ramp(local, 8.6, 0.8, EASE.out) * 0.96
    u.strip.material.opacity = ramp(local, 10.2, 0.9, EASE.out) * 0.97
    u.note.material.opacity = ramp(local, 11.6, 0.9, EASE.out) * 0.92
  },

  teardown(stage) {
    const g = stage.userData.pitchHandBack
    if (g) g.visible = false
  },
})
