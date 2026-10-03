// Ⅱ · S09 树里没有的 (1:56–2:15, 19s)
//
// 喜鹊儿课表：无障碍树里只有"第 1-2 节"这种节次数字和日期表头，**一个课程名都没有**
// （页面是自绘 / WebView）。唯一的答案来源是截图——逐项核对后给出结论（3 步 7 秒）。
// 数字来自 docs/status.md。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import { makePhone, makeSet, makeMirror, makeLabel, glowTexture, distanceFor, INK_BG, LAYER_UI, GOOD, PROBLEM } from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makePanel, makePill, makeDataStrip, text, plate } from '../kit.js'

const ROWS = [['第 1-2 节', '离散数学'], ['第 3-4 节', '计算机操作基础'], ['第 5-6 节', '大学英语'],
  ['第 1-2 节', '离散数学'], ['第 3-4 节', '计算机操作基础'], ['第 5-6 节', '大学英语']]

export const shotNotInTree = defineShot({
  name: 'not-in-tree',
  start: 116,
  duration: 19,

  subs: [
    [0.8, 5.0, '喜鹊儿的课表，树里只有节次和日期', 'In the timetable page, the tree holds only period numbers.'],
    [5.4, 10.0, '一个课程名都没有——页面是自绘的', 'Not one course name — the page draws its own text.'],
    [10.4, 14.8, '答案只能在截图里，逐项核对', 'The answer is only in the screenshot, checked line by line.'],
    [15.2, 18.6, '3 步、7 秒，读到的和截图一致', 'Three steps, seven seconds, and it matches the screenshot.'],
  ],
  sfx: [[0.6, 'whoosh', { dur: 1.0 }], [5.4, 'rip'], [10.4, 'glass', { midi: 84 }], [15.2, 'ding', { midi: 83 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())

    // 左：手机上的课表（课程名画在屏幕上，但树里没有）
    const phone = makePhone({ height: 1.60 })
    phone.position.set(-1.02, -0.02, 0)
    group.add(phone)
    group.add(makeMirror(phone, { floorY: -1.28, opacity: 0.09 }))

    // 中：树给出的东西——只有节次，右侧一列空位
    const tree = new THREE.Group()
    tree.position.set(-0.06, 0.08, 0.30)
    group.add(tree)
    const nodes = []
    for (let i = 0; i < 6; i++) {
      const y = 0.48 - i * 0.19
      const left = new THREE.Mesh(
        new THREE.PlaneGeometry(0.30, 0.11),
        new THREE.MeshBasicMaterial({ color: 0x4FBF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
      )
      left.position.set(0, y, 0)
      tree.add(left)
      const ghost = new THREE.Mesh(
        new THREE.PlaneGeometry(0.38, 0.11),
        new THREE.MeshBasicMaterial({ color: 0x27564C, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
      )
      ghost.position.set(0.40, y, 0)
      tree.add(ghost)
      nodes.push({ left, ghost, y })
    }
    // 树只给出节次，课程名那一列是空的。空位本身 + 顶部的数据条（课程名节点 0）
    // 已经把这件事说清了，不再另加一行"课程名：树里没有"的文字标注。
    const treeStrip = makeDataStrip([['节次节点', '6'], ['课程名节点', '0', '#E2705F']], { width: 1.30, height: 0.26 })
    treeStrip.position.set(0.10, 0.76, 0.32)
    treeStrip.material.opacity = 0
    group.add(treeStrip)

    // 右：截图卡——卡面就是那页课表（同一份行数据），核对打勾叠在上面
    const shotCard = makePanel(0.66, 1.06, 600, (ctx, w, h) => {
      plate(ctx, 0, 0, w, h, { fill: 'rgba(246,247,248,0.97)', radius: 16 })
      text(ctx, '截图', w * 0.075, h * 0.075, { size: h * 0.048, weight: 700, color: '#5D6D7E' })
      for (let i = 0; i < 6; i++) {
        const y = h * (0.17 + i * 0.115)
        text(ctx, ROWS[i][0], w * 0.075, y, { size: h * 0.046, weight: 500, color: '#8A98A5' })
        text(ctx, ROWS[i][1], w * 0.40, y, { size: h * 0.050, weight: 600, color: '#3D4A55' })
      }
      // 比例坐标网格：截图上的"另一层编号"
      ctx.strokeStyle = 'rgba(56,96,120,0.45)'
      ctx.lineWidth = 1.5
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(w * i / 4, 0); ctx.lineTo(w * i / 4, h); ctx.stroke()
      }
      for (let j = 1; j < 6; j++) {
        ctx.beginPath(); ctx.moveTo(0, h * j / 6); ctx.lineTo(w, h * j / 6); ctx.stroke()
      }
    })
    shotCard.position.set(1.14, -0.02, 0.32)
    shotCard.material.opacity = 0
    group.add(shotCard)

    const ticks = []
    for (let i = 0; i < 6; i++) {
      const t = makePanel(0.66, 0.15, 420, (ctx, w, h) => {
        plate(ctx, 1, 1, w - 2, h - 2, { fill: 'rgba(14,20,24,0.9)', radius: 10, stroke: 'rgba(30,132,73,0.85)', lineWidth: 2 })
        text(ctx, ROWS[i][1], w * 0.055, h * 0.68, { size: h * 0.44, weight: 600, color: '#E8EEF2' })
        text(ctx, '✓', w * 0.93, h * 0.68, { size: h * 0.52, weight: 700, color: '#4FBF9A', align: 'right' })
      })
      t.position.set(1.14, 0.46 - i * 0.19, 0.34)
      t.material.opacity = 0
      group.add(t)
      ticks.push(t)
    }

    group.userData = { phone, nodes, treeStrip, shotCard, ticks }
    stage.userData.pitchNotInTree = group
  },

  enter(stage) {
    const g = stage.userData.pitchNotInTree
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchNotInTree
    const u = g.userData

    const k = ramp(local, 0, 19, EASE.inOut)
    const d = distanceFor(stage, 1.95, 0.86) * (1.0 - 0.04 * k)
    stage.camera.position.set(-0.55 + 0.85 * k, 0.03 - 0.02 * k, d)
    stage.camera.lookAt(-0.52 + 0.86 * k, -0.02, 0)

    const lit = ramp(local, 0.3, 1.0, EASE.out)
    u.phone.userData.setFrameOpacity(lit)
    u.phone.userData.surface.material.opacity = 0.12 + 0.88 * lit
    u.phone.userData.rim.material.opacity = 0.07 + 0.20 * lit
    if (!u.painted) {
      u.painted = true
      u.phone.userData.paint((ctx, w, h) => {
        ctx.fillStyle = '#F6F7F8'; ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#17202A'
        ctx.font = `600 ${Math.round(w * 0.068)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
        ctx.fillText('我的课程', w * 0.07, h * 0.085)
        for (let i = 0; i < 6; i++) {
          const y = h * (0.20 + i * 0.10)
          ctx.fillStyle = '#8A98A5'
          ctx.font = `500 ${Math.round(w * 0.050)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
          ctx.fillText(ROWS[i][0], w * 0.07, y)
          ctx.fillStyle = '#3D4A55'
          ctx.font = `500 ${Math.round(w * 0.054)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
          ctx.fillText(ROWS[i][1], w * 0.42, y)
        }
      })
    }

    // 树：只有节次，课程名那一列是空的
    for (let i = 0; i < u.nodes.length; i++) {
      const a = ramp(local, 0.9 + i * 0.16, 0.8, EASE.out)
      u.nodes[i].left.material.opacity = a * 0.60
      u.nodes[i].ghost.material.opacity = ramp(local, 6.0 + i * 0.14, 0.8, EASE.out) * 0.34
    }
    u.treeStrip.material.opacity = ramp(local, 5.6, 0.9, EASE.out) * 0.95

    // 截图卡 + 逐项核对
    const cardK = ramp(local, 10.0, 1.2, EASE.out)
    u.shotCard.material.opacity = cardK
    u.shotCard.position.x = 1.14 + (1 - cardK) * 0.24
    for (let i = 0; i < u.ticks.length; i++) {
      const a = ramp(local, 12.0 + i * 0.30, 0.6, EASE.out)
      u.ticks[i].material.opacity = a * 0.98
      u.ticks[i].position.x = u.shotCard.position.x
    }
  },

  teardown(stage) {
    const g = stage.userData.pitchNotInTree
    if (g) g.visible = false
  },
})
