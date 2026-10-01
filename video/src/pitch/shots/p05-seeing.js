// Ⅰ 我们是什么 · S05 看得见页面 (0:55–1:11, 16s)
//
// 两段对照，中间是一次硬切：
//   前半：一页 12306，树里抽出 102 个节点、58 个可见控件——"能读的读树"
//   后半：一页微信，树里只有 1 个节点、0 个可读文字——"读不到的读像素"，
//         于是抽出截图，叠上比例坐标与编号，点按前问老人一次。
// 数字全部来自 status.md 的页面覆盖率实测。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import {
  makePhone, makeSet, makeMirror, makeLabel, glowTexture, mulberry32, distanceFor,
  INK_BG, LAYER_UI, ATTENTION, GOOD,
} from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { makeDataStrip, makePanel, text, plate, tracked, makeNodePlate, makePill } from '../kit.js'
import { paintWeChat, makeShotTexture } from '../ui.js'

const CUT = 8.0       // 切点：树 → 像素

export const shotSeeing = defineShot({
  name: 'seeing',
  start: 55,
  duration: 16,

  subs: [
    [0.8, 4.8, '能读的读树：一页 12306，抽出 102 个节点', 'Read the tree when it is there: 102 nodes on one page.'],
    [5.2, 8.0, '其中 58 个是模型能看见的控件', 'Fifty-eight of them are controls the model can see.'],
    [8.4, 12.4, '读不到的读像素：微信那一页只给一个节点', 'Read the pixels when it is not: WeChat returns a single node.'],
    [12.8, 15.6, '截图加比例坐标，点按前问老人一次', 'A screenshot, proportion coordinates, and one ask before tapping.'],
  ],
  sfx: [[0.6, 'whoosh', { dur: 1.0 }], [3.0, 'tick'], [8.0, 'rip'], [10.4, 'glass', { midi: 84 }], [12.8, 'ding', { midi: 81 }]],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)
    group.add(makeSet())
    group.userData = {}
    stage.userData.pitchSeeing = group

    // ================= 前半：树读得出来（12306） =================
    const treeScene = new THREE.Group()
    treeScene.position.set(0.10, -0.02, 0)
    group.add(treeScene)

    const rnd = mulberry32(12306)
    const plates = []
    const links = []
    const cols = 6, rows = 8
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rnd() < 0.18) continue
        const x = (c - (cols - 1) / 2) * 0.30 + (rnd() - 0.5) * 0.05
        const y = 0.72 - r * 0.19 + (rnd() - 0.5) * 0.03
        const w = 0.16 + rnd() * 0.20
        // 58/102 是模型能看见的控件：亮的是看得见的，暗的是收集到却没读出来的
        const visible = rnd() < 0.57
        const plate = makeNodePlate(w, visible ? 0x4FBF9A : 0x27564C)
        plate.userData.visibleToModel = visible
        plate.position.set(x, y, 0.28 + rnd() * 0.06)
        treeScene.add(plate)
        plates.push({ mesh: plate, x, y, delay: r * 0.055 + c * 0.022, w })
        if (c > 0 && rnd() < 0.55) {
          const link = new THREE.Mesh(
            new THREE.PlaneGeometry(0.16, 0.0035),
            new THREE.MeshBasicMaterial({ color: 0x2F7F68, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
          )
          link.position.set(x - 0.15, y, 0.26)
          treeScene.add(link)
          links.push({ mesh: link, delay: r * 0.055 + c * 0.022 + 0.08 })
        }
      }
    }

    const treeStrip = makeDataStrip([['12306 树节点', '102'], ['收集', '64'], ['模型可见', '58', '#8FE3C4']], {
      width: 2.20, height: 0.28,
    })
    treeStrip.position.set(0.05, 0.92, 0.34)
    treeStrip.material.opacity = 0
    treeScene.add(treeStrip)

    const treeTitle = makePill('一页火车票查询', {
      width: 1.30, height: 0.17, size: 34, color: '#CFE8DF',
      fill: 'rgba(16,24,22,0.9)', stroke: 'rgba(80,170,145,0.75)', dot: true, dotColor: '#4FBF9A',
    })
    treeTitle.position.set(-1.02, -0.44, 0.34)
    treeTitle.material.opacity = 0
    treeScene.add(treeTitle)

    // ================= 后半：树给不出东西（微信） =================
    const blindScene = new THREE.Group()
    blindScene.position.set(0.10, -0.02, 0)
    blindScene.visible = false
    group.add(blindScene)

    const phone = makePhone({ height: 1.55 })
    phone.position.set(-1.05, -0.02, 0)
    blindScene.add(phone)
    blindScene.add(makeMirror(phone, { floorY: -1.28, opacity: 0.09 }))

    const solo = makeNodePlate(0.52, 0x2E8F76)
    solo.position.set(-0.42, 0.30, 0.30)
    blindScene.add(solo)

    const soloLabel = makeLabel('页面', { px: 30, weight: 500, color: '#D8FFF4', layer: LAYER_UI })
    soloLabel.position.set(-0.42, 0.30, 0.36)
    soloLabel.material.opacity = 0
    blindScene.add(soloLabel)

    // 截图卡：与 S02 同一张纹理（同一页微信 + k1–k20 编号）
    const shotMat = new THREE.MeshBasicMaterial({
      map: makeShotTexture({ lockIndex: 10 }), transparent: true, opacity: 0, depthWrite: false,
    })
    shotMat.toneMapped = false
    const shotCard = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.16), shotMat)
    shotCard.layers.set(LAYER_UI)
    shotCard.position.set(0.86, -0.08, 0.34)
    blindScene.add(shotCard)

    const shotGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.19),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), color: ATTENTION, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0,
      }),
    )
    shotGlow.position.set(0.78, -0.17, 0.35)
    blindScene.add(shotGlow)

    const blindStrip = makeDataStrip([['微信 树节点', '1', '#E2705F'], ['收集', '0', '#E2705F'], ['模型可见', '0', '#E2705F']], {
      width: 2.20, height: 0.28,
    })
    blindStrip.position.set(0.05, 0.92, 0.34)
    blindStrip.material.opacity = 0
    blindScene.add(blindStrip)

    const askChip = makePill('坐标点按：先问老人一次，同意后不再重复', {
      width: 2.10, height: 0.16, size: 32, color: '#F0D9B8',
      fill: 'rgba(28,20,10,0.9)', stroke: 'rgba(200,140,60,0.8)',
    })
    askChip.position.set(0.10, 0.64, 0.34)
    askChip.material.opacity = 0
    blindScene.add(askChip)

    Object.assign(group.userData, {
      treeScene, plates, links, treeStrip, treeTitle,
      blindScene, phone, solo, soloLabel, shotCard, shotGlow, blindStrip, askChip,
    })
  },

  enter(stage) {
    const g = stage.userData.pitchSeeing
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
    g.userData.blindScene.visible = false
  },

  update(stage, local, t) {
    const g = stage.userData.pitchSeeing
    const u = g.userData
    const before = local < CUT

    // 镜头：前半缓缓后拉看整棵树，切点后推近到微信那一页
    if (before) {
      const k = ramp(local, 0, CUT, EASE.inOut)
      const d = distanceFor(stage, 2.30, 0.86) * (1.06 - 0.08 * k)
      stage.camera.position.set(0.22 - 0.10 * k, 0.10 - 0.06 * k, d)
      stage.camera.lookAt(0.06, -0.02, 0)
    } else {
      // 后半有手机：手机只占左侧约 30%
      const k = ramp(local, CUT, 16 - CUT, EASE.inOut)
      const VH = 1.55 / 0.60
      const WV = VH * 16 / 9
      const lookX = -1.05 + 0.20 * WV + 0.16 * k
      const d = distanceFor(stage, VH, 1.0)
      stage.camera.position.set(lookX - 0.06, 0.02, d)
      stage.camera.lookAt(lookX, -0.04, 0)
    }

    // ---- 前半 ----
    u.treeScene.visible = before
    if (before) {
      for (const p of u.plates) {
        const k = ramp(local, 0.5 + p.delay, 0.9, EASE.out)
        p.mesh.userData.mat.opacity = k * (p.mesh.userData.visibleToModel ? 0.72 : 0.16)
        p.mesh.position.y = p.y - (1 - k) * 0.10
      }
      for (const l of u.links) {
        l.mesh.material.opacity = ramp(local, 0.5 + l.delay, 0.9, EASE.out) * 0.42
      }
      u.treeStrip.material.opacity = ramp(local, 4.6, 1.0, EASE.out)
      u.treeTitle.material.opacity = ramp(local, 0.6, 0.9, EASE.out)
    }

    // ---- 后半 ----
    u.blindScene.visible = !before
    if (!before) {
      const lt = local - CUT
      const lit = ramp(lt, 0.2, 0.9, EASE.out)
      u.phone.userData.setFrameOpacity(lit)
      u.phone.userData.surface.material.opacity = 0.12 + 0.88 * lit
      u.phone.userData.rim.material.opacity = 0.07 + 0.20 * lit
      if (!u.painted) {
        u.painted = true
        u.phone.userData.paint((ctx, w, h) => paintWeChat(ctx, w, h))
      }
      const nodeK = ramp(lt, 0.7, 1.0, EASE.out)
      u.solo.userData.mat.opacity = nodeK * 0.45
      u.soloLabel.material.opacity = nodeK * 0.95
      u.blindStrip.material.opacity = ramp(lt, 1.6, 0.9, EASE.out)

      const cardK = ramp(lt, 2.6, 1.3, EASE.out)
      u.shotCard.material.opacity = cardK
      u.shotCard.position.x = 0.86 + (1 - cardK) * 0.24
      u.shotGlow.material.opacity = ramp(lt, 4.0, 0.8, EASE.out) * (0.35 + 0.10 * Math.sin(lt * 3.4))
      u.shotGlow.position.x = u.shotCard.position.x - 0.08
      u.askChip.material.opacity = ramp(lt, 5.0, 1.0, EASE.out)
    }
  },

  teardown(stage) {
    const g = stage.userData.pitchSeeing
    if (g) g.visible = false
  },
})
