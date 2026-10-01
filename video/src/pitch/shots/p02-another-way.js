// 开头 · S02 另一条路 (0:13–0:24)
//
// 钩子的答案：树给不出东西，屏幕上还有像素。粒子从左侧（上一镜手机所在的位置）飞过来，
// 聚成一张截图；比例坐标网格叠上去，编号 k10 锁住一格。片名在右侧落定。
//
// 全部是 t 的纯函数：粒子的起点与终点在 build 时用 mulberry32 定死，每帧按同一个缓动重算。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import {
  makeSet, makeCard, makeLabel, glowTexture, mulberry32,
  distanceFor, ATTENTION, INK_BG, LAYER_UI,
} from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makeShotTexture } from '../ui.js'

// 时间不能留空档：上一镜在 0:13 结束，这里 0.12s 就得有东西在动，
// 否则剪到下一镜时会有一秒半的"空画面"（第一版就是这样）。
const BEATS = {
  gatherFrom: 0.12, gatherDur: 2.4,  // 像素聚成截图
  cardFrom: 1.5, cardDur: 1.2,       // 卡片显影
  gridFrom: 3.2, gridDur: 1.2,
  lockFrom: 4.6, lockDur: 0.9,
  markFrom: 6.2, markDur: 1.5,       // 片名
}

const N = 1600

export const shotAnotherWay = defineShot({
  name: 'another-way',
  start: 13,
  duration: 11,

  chapter: { num: '序', zh: '另一条路', en: 'ANOTHER WAY IN' },
  subs: [
    [0.9, 4.8, '屏幕上的像素，是另一条路', 'The pixels are another way in.'],
    [5.2, 8.6, '截图加比例坐标，照样点得准', 'A screenshot and proportion coordinates aim just as well.'],
    [9.0, 10.6, '银龄智办 · 可信跨应用助老智能体', 'Yinling Zhiban — a trustworthy cross-app assistant.'],
  ],
  sfx: [[0.5, 'whoosh', { dur: 1.2 }], [3.9, 'sparkle'], [5.5, 'tick'], [6.9, 'chime', { midi: 76 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    const cardX = -0.62
    const cardW = 1.02
    const cardH = 1.72

    // ---- 截图卡：从像素里显影出来 ----
    const cardGroup = new THREE.Group()
    cardGroup.position.set(cardX, 0.04, 0.34)
    group.add(cardGroup)

    const card = makeCard(cardW, cardH, 0.96)
    cardGroup.add(card)

    const cardLabel = makeLabel('截图', { px: 26, weight: 600, color: '#7A8A96', layer: LAYER_UI })
    cardLabel.position.set(0, cardH / 2 - 0.12, 0.003)
    cardGroup.add(cardLabel)

    // 截图内容 + 编号网格直接烘焙进卡面：additive 的网格叠在白卡上是看不见的
    // （原片 tree 镜头就吃了这个亏），画进纹理才有对比度。
    const shotMat = new THREE.MeshBasicMaterial({
      map: makeShotTexture({ lockIndex: 10 }), transparent: true, opacity: 0, depthWrite: false,
    })
    shotMat.toneMapped = false
    const shot = new THREE.Mesh(new THREE.PlaneGeometry(cardW * 0.90, cardH * 0.82), shotMat)
    shot.layers.set(LAYER_UI)
    shot.position.set(0, -0.05, 0.002)
    cardGroup.add(shot)

    // 锁住的那一格：一层会呼吸的橙光，位置对着纹理里 k10 的格子
    const lock = new THREE.Mesh(
      new THREE.PlaneGeometry(0.209, 0.267),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), color: ATTENTION, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0,
      }),
    )
    lock.position.set(-0.105, -0.05, 0.006)
    lock.renderOrder = 4
    cardGroup.add(lock)

    // ---- 粒子：起点散在左侧，终点落在卡片平面上 ----
    const rnd = mulberry32(20260930)
    const from = new Float32Array(N * 3)
    const to = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      // 起点必须落在画面里：从画外飞进来，前一秒半的画面就是空的
      from[i * 3 + 0] = -1.35 + rnd() * 1.15
      from[i * 3 + 1] = (rnd() - 0.5) * 1.9
      from[i * 3 + 2] = 0.15 + rnd() * 0.35
      // 终点：卡片上的一层规则采样（网格 + 抖动），看上去像"像素落在纸上"
      const gx = Math.floor(rnd() * 26)
      const gy = Math.floor(rnd() * 44)
      to[i * 3 + 0] = cardX - cardW / 2 + (gx + 0.5) / 26 * cardW + (rnd() - 0.5) * 0.004
      to[i * 3 + 1] = -0.04 - cardH / 2 + (gy + 0.5) / 44 * cardH + (rnd() - 0.5) * 0.004
      to[i * 3 + 2] = 0.35 + rnd() * 0.02
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(from.slice(), 3))
    const ptsMat = new THREE.PointsMaterial({
      size: 0.030, map: glowTexture(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, color: 0x7FE3D0, opacity: 0, sizeAttenuation: true,
    })
    const points = new THREE.Points(geo, ptsMat)
    points.frustumCulled = false
    group.add(points)

    // ---- 右侧：片名 ----
    const mark = new THREE.Group()
    mark.position.set(0.92, 0.10, 0.30)
    group.add(mark)

    const rule = new THREE.Mesh(
      new THREE.PlaneGeometry(0.007, 0.92),
      new THREE.MeshBasicMaterial({ color: 0xE2BD6B, transparent: true, depthWrite: false, opacity: 0 }),
    )
    rule.position.set(-0.92, 0.02, 0.01)
    mark.add(rule)

    const title = makeLabel('银龄智办', { px: 92, weight: 700, color: '#F6F7F8', layer: LAYER_UI })
    title.position.set(0, 0.16, 0.02)
    title.material.opacity = 0
    mark.add(title)

    const sub = makeLabel('可信跨应用助老智能体', { px: 34, weight: 500, color: '#9FB3BD', layer: LAYER_UI })
    sub.position.set(0, -0.26, 0.02)
    sub.material.opacity = 0
    mark.add(sub)

    const en = makeLabel('A TRUSTWORTHY CROSS-APP ASSISTANT', {
      px: 24, weight: 500, color: '#6E8290', layer: LAYER_UI, letterSpacing: 5,
    })
    en.position.set(0, -0.46, 0.02)
    en.material.opacity = 0
    mark.add(en)

    group.userData = { cardGroup, card, cardLabel, shot, lock, points, geo, from, to, mark, rule, title, sub, en }
    stage.userData.pitchAnotherWay = group
  },

  enter(stage) {
    const g = stage.userData.pitchAnotherWay
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchAnotherWay
    const { cardGroup, card, cardLabel, shot, lock, points, geo, from, to, mark, rule, title, sub, en } = g.userData
    const B = BEATS

    // 镜头：贴住卡片推进，末尾微微后拉把片名一起收进来
    const out = ramp(local, B.markFrom, 2.6, EASE.inOut)
    const d = distanceFor(stage, 2.10, 0.82) * (1.02 - 0.06 * out)
    const lookX = -0.62 + 0.42 * out
    stage.camera.position.set(lookX + 0.16, -0.02 + 0.05 * out, d)
    stage.camera.lookAt(lookX, -0.02, 0)

    // 粒子：左边飞来，落到卡上；卡片显影后粒子淡出
    const k = ramp(local, B.gatherFrom, B.gatherDur, EASE.inOut)
    const arr = geo.attributes.position.array
    for (let i = 0; i < N * 3; i++) arr[i] = from[i] + (to[i] - from[i]) * k
    geo.attributes.position.needsUpdate = true
    const fadeOut = ramp(local, B.cardFrom + 0.5, 1.8, EASE.inOut)
    points.material.opacity = (0.78 + 0.22 * k) * (1 - fadeOut)

    const cardK = ramp(local, B.cardFrom, B.cardDur, EASE.out)
    card.userData.plate.material.opacity = cardK
    shot.material.opacity = 0.96 * cardK
    cardLabel.material.opacity = cardK * 0.9
    cardGroup.scale.set(0.985 + 0.015 * cardK, 0.985 + 0.015 * cardK, 1)

    const lockK = ramp(local, B.lockFrom, B.lockDur, EASE.out)
    lock.material.opacity = lockK * (0.34 + 0.10 * Math.sin(local * 3.4))
    lock.scale.set(1, 1, 1)

    const markK = ramp(local, B.markFrom, B.markDur, EASE.out)
    rule.material.opacity = markK * 0.85
    rule.scale.set(1, 0.4 + 0.6 * markK, 1)
    title.material.opacity = markK
    title.position.x = -(1 - markK) * 0.14
    sub.material.opacity = ramp(local, B.markFrom + 0.35, B.markDur, EASE.out) * 0.95
    en.material.opacity = ramp(local, B.markFrom + 0.7, B.markDur, EASE.out) * 0.9
    mark.position.y = 0.10 - (1 - markK) * 0.05
  },

  teardown(stage) {
    const g = stage.userData.pitchAnotherWay
    if (g) g.visible = false
  },
})
