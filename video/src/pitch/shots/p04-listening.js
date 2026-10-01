// Ⅰ 我们是什么 · S04 听得进去 (0:39–0:55, 16s)
//
// 声音这一层：点一下开始，之后像打电话不像对讲机；它说话时老人插话，它立刻闭嘴；
// 每一步都念出来；20 秒没人说话自动关麦。
// 画面语言：橙 = 麦克风开着（老人的），绿 = 助手在说话。插话那一刻，助手的五条声纹
// 不是淡出，是塌成一条直线——这是全片的一个"记号"。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import {
  makePhone, makeSet, makeMirror, makeLabel, glowTexture, distanceFor,
  INK_BG, LAYER_UI, BRAND, ATTENTION,
} from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePill, makePanel, text, plate, tracked } from '../kit.js'
import { paintHome } from '../ui.js'

const BEATS = {
  light: 0.3,
  pills: [3.2, 4.7, 6.2],
  cut: 8.6, cutDur: 0.7,      // 插话：声纹塌平
}

// 步骤播报：右侧唯一的一组元素，竖直居中排在手机右边。
// 原来右下还有三条"像打电话 / 20 秒关麦 / 断网即不可用"——那三句字幕里已经说了，
// 画面上再列一遍就是同一句话说两次，而且把右下角塞满、和字幕带挤在一起，故去掉。
const PILLS = ['正在打开微信', '正在找到文件传输助手', '正在把文字填进去']

export const shotListening = defineShot({
  name: 'listening',
  start: 39,
  duration: 16,

  subs: [
    [0.8, 4.6, '点一下开始，之后像打电话，不像对讲机', 'One tap to start — then it is a call, not a walkie-talkie.'],
    [5.0, 8.4, '它说话时插话，它立刻闭嘴', 'Talk over it and it stops mid-sentence.'],
    [8.8, 12.4, '每一步都念出来，静下来 20 秒它自己关麦', 'Every step is spoken; twenty seconds of silence closes the mic.'],
  ],
  sfx: [[0.5, 'tap'], [0.7, 'click'], [3.2, 'tick'], [4.7, 'tick'], [6.2, 'tick'], [8.6, 'cut'], [10.4, 'chime', { midi: 79 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const phone = makePhone({ height: 1.24 })
    phone.position.set(-1.10, -0.02, 0)
    group.add(phone)
    group.add(makeMirror(phone, { floorY: -1.28, opacity: 0.10 }))

    // 声波环：三重，相位错开，从屏幕里荡出来
    const rings = []
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.516, 128),
        new THREE.MeshBasicMaterial({
          color: ATTENTION, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: 0, side: THREE.DoubleSide,
        }),
      )
      ring.position.set(-1.10, -0.02, 0.30)
      group.add(ring)
      rings.push(ring)
    }

    // 助手的五条声纹：放在手机上方。放在右侧会被步骤 pill 盖住（pill 横跨 x 0.29–1.63）。
    const voice = new THREE.Group()
    voice.position.set(-1.10, 0.70, 0.32)
    group.add(voice)
    const bars = []
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.030, 0.34),
        new THREE.MeshBasicMaterial({
          color: BRAND, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
        }),
      )
      bar.position.x = (i - 2) * 0.062
      voice.add(bar)
      bars.push(bar)
    }
    const voiceNote = makeLabel('助手在说话', { px: 24, weight: 500, color: '#7FD8BC', layer: LAYER_UI })
    voiceNote.position.set(0, -0.30, 0.02)
    voiceNote.material.opacity = 0
    voice.add(voiceNote)

    // 步骤播报：三条磨砂 pill，竖直居中在右侧
    const pills = PILLS.map((s, i) => {
      const p = makePill(s, {
        width: 1.38, height: 0.17, size: 34, color: '#EAF3F0',
        fill: 'rgba(24,34,38,0.86)', stroke: 'rgba(110,180,160,0.7)', dot: true, dotColor: '#5FD3AE',
      })
      p.position.set(0.44, 0.34 - i * 0.30, 0.34)
      p.material.opacity = 0
      group.add(p)
      return p
    })

    // 一条"音频电平"底板：让"在听"这件事有物理感
    const level = makePanel(1.10, 0.10, 900, (ctx, w, h) => {
      plate(ctx, 0, 0, w, h, { fill: 'rgba(255,255,255,0.06)', radius: h / 2, stroke: 'rgba(200,120,50,0.55)', lineWidth: 3 })
      tracked(ctx, 'MIC  OPEN', w * 0.035, h * 0.68, { size: h * 0.52, color: 'rgba(232,168,96,0.95)', gap: 4 })
    })
    level.position.set(-0.72, -1.02, 0.33)
    level.material.opacity = 0
    group.add(level)
    const levelFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.04, 0.055),
      new THREE.MeshBasicMaterial({ color: ATTENTION, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
    )
    levelFill.position.set(-0.72, -1.02, 0.335)
    group.add(levelFill)

    group.userData = { phone, rings, voice, bars, voiceNote, pills, level, levelFill }
    stage.userData.pitchListening = group
  },

  enter(stage) {
    const g = stage.userData.pitchListening
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchListening
    const { phone, rings, voice, bars, voiceNote, pills } = g.userData
    const B = BEATS

    // 手机只在画面左侧约 30%，右边留给播报与边界
    const VH = 1.24 / 0.60
    const WV = VH * 16 / 9
    const d = distanceFor(stage, VH, 1.0)
    const drift = 0.06 * Math.sin(ramp(local, 0, 16, EASE.inOut) * Math.PI)
    stage.camera.position.set(-1.10 + 0.20 * WV + drift, 0.02, d)
    stage.camera.lookAt(-1.10 + 0.20 * WV, -0.04, 0)

    const lit = ramp(local, B.light, 1.0, EASE.out)
    phone.userData.setFrameOpacity(lit)
    phone.userData.surface.material.opacity = 0.12 + 0.88 * lit
    phone.userData.rim.material.opacity = 0.07 + 0.20 * lit
    if (!g.userData.painted) {
      g.userData.painted = true
      phone.userData.paint((ctx, w, h) => paintHome(ctx, w, h))
    }

    // 声波环：相位错开地往外走；插话后相位反向（"收回去"）
    const cutK = ramp(local, B.cut, B.cutDur, EASE.out)
    for (let i = 0; i < rings.length; i++) {
      const speed = 2.4
      let phase = (local / speed + i / rings.length) % 1
      if (cutK > 0) phase = 1 - phase
      const r = 0.30 + phase * 1.15
      rings[i].scale.set(r / 0.5, r / 0.5, 1)
      const a = Math.sin(Math.PI * phase) * 0.5 * (1 - 0.75 * cutK)
      rings[i].material.opacity = a
      rings[i].material.color.setHex(cutK > 0.35 ? 0x39C39B : (i % 2 ? 0x39C39B : ATTENTION))
    }

    // 五条声纹：平常呼吸，插话那一刻塌成一条直线
    const vIn = ramp(local, 1.4, 1.0, EASE.out)
    for (let i = 0; i < bars.length; i++) {
      const breathe = 0.72 + 0.28 * Math.sin(local * 5.2 + i * 0.9)
      const h = 0.34 * breathe * (1 - cutK)
      bars[i].scale.set(1, Math.max(0.045, h) / 0.34, 1)
      bars[i].material.opacity = vIn * 0.85 * (1 - 0.35 * cutK)
      bars[i].material.color.setHex(cutK > 0.4 ? ATTENTION : BRAND)
      bars[i].position.y = 0
    }
    voiceNote.material.opacity = vIn * (1 - cutK) * 0.9
    voice.position.x = -1.10 + (1 - vIn) * 0.10

    // 三条步骤 pill：全部满亮（不把旧的压暗——三条要一样清楚）
    for (let i = 0; i < pills.length; i++) {
      const k = ramp(local, B.pills[i], 0.8, EASE.out)
      pills[i].material.opacity = k
      pills[i].position.x = 0.44 - (1 - k) * 0.18
      pills[i].scale.setScalar(1)
    }
  },

  teardown(stage) {
    const g = stage.userData.pitchListening
    if (g) g.visible = false
  },
})
