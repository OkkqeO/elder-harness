// Ⅱ · S12 听得准 (2:51–3:04, 13s)
//
// 语音这条链路是真机实测过的：ColorOS 系统里没有 RecognitionService，所以手机只负责
// 录音与播放，识别走自己的服务端（讯飞听写），上传 16 kHz 单声道 PCM。
// 右侧是电平与门限：门限 1400，实测人声 2300~5200，静音 900 ms 判定。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makePhone, makeSet, makeMirror, distanceFor, INK_BG, ATTENTION } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, text, plate, tracked } from '../kit.js'
import { paintHome } from '../ui.js'

const BARS = [0.62, 0.86, 0.72, 0.92, 0.58, 0.80, 0.66, 0.88]

export const shotHearing = defineShot({
  name: 'hearing',
  start: 171,
  duration: 13,

  subs: [
    [0.6, 4.4, '系统里没有识别服务，就自己接一条', 'The system has no recognition service, so we brought our own.'],
    [4.8, 8.4, '手机只录音，识别在服务端，16 kHz 单声道', 'The phone only records; recognition runs on our server.'],
    [8.8, 12.6, '门限 1400、静音 900 ms——参数是实测出来的', 'Threshold 1400, silence 900 ms — measured, not guessed.'],
  ],
  sfx: [[0.5, 'tap'], [2.2, 'tick'], [4.8, 'whoosh', { dur: 0.8 }], [8.8, 'chime', { midi: 79 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const phone = makePhone({ height: 1.42 })
    phone.position.set(-1.15, -0.04, 0)
    group.add(phone)
    group.add(makeMirror(phone, { floorY: -1.28, opacity: 0.08 }))

    const server = makePanel(0.92, 0.46, 760, (ctx, w, h) => {
      plate(ctx, 3, 3, w - 6, h - 6, { fill: 'rgba(12,17,21,0.95)', radius: 20, stroke: 'rgba(120,140,155,0.8)', lineWidth: 3 })
      text(ctx, '服务端识别', w / 2, h * 0.42, { size: h * 0.24, weight: 700, color: '#E8EEF2', align: 'center' })
      text(ctx, '16 kHz · 单声道 PCM', w / 2, h * 0.70, { size: h * 0.16, weight: 500, color: 'rgba(160,178,190,0.95)', align: 'center' })
      tracked(ctx, 'XUNFEI  DICTATION', w / 2, h * 0.88, { size: h * 0.10, color: 'rgba(120,140,155,0.8)', gap: 4, align: 'center' })
    })
    server.position.set(-0.14, 0.10, 0.32)
    server.material.opacity = 0
    group.add(server)

    const heard = makePill('“帮我看看快递到哪了”', {
      width: 1.24, height: 0.18, size: 34, color: '#E8F3EF', align: 'center',
      fill: 'rgba(16,32,28,0.94)', stroke: 'rgba(79,191,154,0.85)',
    })
    heard.position.set(0.60, 0.10, 0.32)
    heard.material.opacity = 0
    group.add(heard)

    // 电平表 + 门限线：门限 1400 落在实测人声 2300~5200 之下
    const meter = makePanel(1.02, 0.66, 520, (ctx, w, h) => {
      plate(ctx, 2, 2, w - 4, h - 4, { fill: 'rgba(14,20,24,0.94)', radius: 16, stroke: 'rgba(90,110,125,0.65)', lineWidth: 2 })
      const y0 = h * 0.86
      for (let i = 0; i < BARS.length; i++) {
        const bx = w * 0.10 + i * w * 0.105
        const bh = BARS[i] * h * 0.62
        ctx.fillStyle = i % 3 === 1 ? 'rgba(79,191,154,0.95)' : 'rgba(40,120,100,0.9)'
        ctx.fillRect(bx, y0 - bh, w * 0.065, bh)
      }
      // 门限线
      const ty = y0 - 0.27 * h * 0.62
      ctx.strokeStyle = 'rgba(196,106,20,0.95)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(w * 0.06, ty); ctx.lineTo(w * 0.94, ty); ctx.stroke()
    })
    meter.position.set(0.60, -0.52, 0.32)
    meter.material.opacity = 0
    group.add(meter)

    const thresh = makePill('门限 1400', {
      width: 0.72, height: 0.14, size: 28, color: '#F0C08A', fill: 'rgba(30,22,12,0.92)', stroke: 'rgba(196,106,20,0.85)',
    })
    thresh.position.set(1.02, -0.32, 0.32)
    thresh.material.opacity = 0
    group.add(thresh)

    const params = makePill('实测人声 2300~5200 · 静音 900 ms 判定', {
      width: 1.86, height: 0.15, size: 28, color: '#A9BCC7', fill: 'rgba(14,20,24,0.9)', stroke: 'rgba(90,110,125,0.6)',
    })
    params.position.set(0.86, 0.58, 0.32)
    params.material.opacity = 0
    group.add(params)

    group.userData = { phone, server, heard, meter, thresh, params }
    stage.userData.pitchHearing = group
  },

  enter(stage) {
    const g = stage.userData.pitchHearing
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchHearing
    const u = g.userData

    const k = ramp(local, 0, 10, EASE.inOut)
    const d = distanceFor(stage, 1.96, 0.88)
    stage.camera.position.set(-0.86 + 0.68 * k, 0.02, d)
    stage.camera.lookAt(-0.84 + 0.66 * k, -0.02, 0)

    const lit = ramp(local, 0.2, 0.9, EASE.out)
    u.phone.userData.setFrameOpacity(lit)
    u.phone.userData.surface.material.opacity = 0.12 + 0.88 * lit
    u.phone.userData.rim.material.opacity = 0.07 + 0.20 * lit
    if (!u.painted) {
      u.painted = true
      u.phone.userData.paint((ctx, w, h) => paintHome(ctx, w, h))
    }

    u.server.material.opacity = ramp(local, 1.6, 1.0, EASE.out) * 0.98
    u.server.position.x = -0.14 - (1 - ramp(local, 1.6, 1.0, EASE.out)) * 0.12
    u.heard.material.opacity = ramp(local, 4.4, 0.9, EASE.out) * 0.96
    u.meter.material.opacity = ramp(local, 6.2, 0.9, EASE.out) * 0.96
    u.thresh.material.opacity = ramp(local, 8.6, 0.8, EASE.out) * 0.96
    u.params.material.opacity = ramp(local, 9.4, 0.8, EASE.out) * 0.94
  },

  teardown(stage) {
    const g = stage.userData.pitchHearing
    if (g) g.visible = false
  },
})
