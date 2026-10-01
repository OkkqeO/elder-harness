// 开头 · S01 看不见 (0:00–0:13)
//
// 全片的钩子：不是"AI 有多强"，而是"机器眼里的这一页几乎是空的"。
// 左边是老人手里那台手机（一页微信，真实排版），右边是从同一页抽出来的无障碍树——
// 只有一个节点，下面是三条空缺的层级骨架，外加三个计数器（树节点 1 / 收集 0 / 模型可见 0，
// 取自 status.md 的真机实测）。镜头先贴着手机，再向左横移，把右边那片"空"揭出来。

import * as THREE from 'three'
import { defineShot } from '../../stage.js'
import {
  makePhone, makeSet, makeMirror, makeLabel, glowTexture,
  distanceFor, setGroupOpacity, PROBLEM, INK_BG, LAYER_UI, TEXT_DIM,
} from '../../props.js'
import { EASE, ramp } from '../../ease.js'
import { paintWeChat } from '../ui.js'

const BEATS = {
  light: 0.2,          // 手机点亮
  revealFrom: 3.4,     // 开始横移揭示右侧
  revealDur: 4.6,
  countFrom: 8.2,      // 三个计数器依次落定
  countStep: 0.42,
  dim: 10.4,           // 手机压暗，注意力交给"空"
  dimDur: 1.5,
}

const COUNTERS = [
  ['树节点', '1'],
  ['收集', '0'],
  ['模型可见', '0'],
]

const PHONE_X = -0.66
const PHONE_H = 1.92

/** 四条发丝线围成一个"本该有节点"的空位。 */
function ghostBox(w, h, color = 0x2F4E5C) {
  const g = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, opacity: 0 })
  const t = 0.006
  const bars = [
    [w, t, 0, h / 2], [w, t, 0, -h / 2], [t, h, -w / 2, 0], [t, h, w / 2, 0],
  ]
  for (const [bw, bh, x, y] of bars) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), mat)
    m.position.set(x, y, 0)
    g.add(m)
  }
  g.userData.mat = mat
  return g
}

export const shotUnseen = defineShot({
  name: 'unseen',
  start: 0,
  duration: 13,

  chapter: { num: '序', zh: '看不见', en: 'THE PART NOBODY SEES' },
  subs: [
    [1.2, 4.8, '老人看得见的，机器看不见', 'What he can see, the machine cannot.'],
    [5.2, 9.6, '同一页微信，树里只给出一个节点', 'One WeChat page, and the tree returns a single node.'],
    [10.0, 12.4, '读不到，就办不了', 'What it cannot read, it cannot do.'],
  ],
  sfx: [[0.4, 'riser', { dur: 1.8 }], [3.4, 'whoosh', { dur: 1.0 }], [8.2, 'tick'], [8.6, 'tick'], [9.0, 'tick']],
  mb: 3,

  build(stage) {
    const group = new THREE.Group()
    group.visible = false
    stage.scene.add(group)

    group.add(makeSet())

    // ---- 左：老人手里的手机 ----
    const phone = makePhone({ height: PHONE_H })
    phone.position.set(PHONE_X, -0.06, 0)
    group.add(phone)
    group.add(makeMirror(phone, { floorY: -1.28, opacity: 0.10 }))

    // 压暗用的罩子：调低屏幕不透明度会让白屏透出黑机身、变成脏灰，
    // 所以改成在屏前压一层近黑，颜色是"暗下去"而不是"洗掉"。
    const shade = new THREE.Mesh(
      new THREE.PlaneGeometry(PHONE_H * 0.4543 * 0.955, PHONE_H * 0.972),
      new THREE.MeshBasicMaterial({ color: 0x0B1013, transparent: true, depthWrite: false, opacity: 0 }),
    )
    shade.position.set(PHONE_X, -0.06, 0.032)
    shade.layers.set(LAYER_UI)
    shade.renderOrder = 5
    group.add(shade)

    // ---- 右：同一页抽出来的树（几乎是空的）----
    const tree = new THREE.Group()
    tree.position.set(0.98, 0, 0)
    group.add(tree)

    const soloNode = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.16),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0x2E8F76, opacity: 0,
      }),
    )
    soloNode.position.set(0, 0.30, 0.30)
    tree.add(soloNode)

    const soloLabel = makeLabel('页面', { px: 34, weight: 500, color: '#D8FFF4', layer: LAYER_UI })
    soloLabel.position.set(0, 0.30, 0.36)
    soloLabel.material.opacity = 0
    tree.add(soloLabel)

    // 本该有三层节点的地方：只剩三个空位
    const ghosts = []
    for (let i = 0; i < 3; i++) {
      const box = ghostBox(0.52 - i * 0.05, 0.13)
      box.position.set(0, -0.06 - i * 0.22, 0.26)
      tree.add(box)
      ghosts.push(box)
    }

    const emptyNote = makeLabel('树里没有可读的文字', { px: 26, weight: 500, color: '#7C93A2', layer: LAYER_UI })
    emptyNote.position.set(0, -0.94, 0.34)
    emptyNote.material.opacity = 0
    tree.add(emptyNote)

    const counters = COUNTERS.map(([k, v], i) => {
      const g = new THREE.Group()
      g.position.set(-0.44 + i * 0.44, 0.94, 0.34)
      const key = makeLabel(k, { px: 22, weight: 500, color: TEXT_DIM, layer: LAYER_UI })
      key.position.y = 0.10
      const val = makeLabel(v, { px: 42, weight: 700, color: '#E2705F', layer: LAYER_UI })
      val.position.y = -0.10
      g.add(key, val)
      setGroupOpacity(g, 0)
      tree.add(g)
      return g
    })

    // ---- 中间：老人那侧 / 机器那侧 ----
    const divider = new THREE.Mesh(
      new THREE.PlaneGeometry(0.003, 2.2),
      new THREE.MeshBasicMaterial({ color: 0x3A5763, transparent: true, depthWrite: false, opacity: 0 }),
    )
    divider.position.set(0.14, 0, 0.2)
    group.add(divider)

    group.userData = { phone, shade, tree, soloNode, soloLabel, ghosts, emptyNote, counters, divider }
    stage.userData.pitchUnseen = group
  },

  enter(stage) {
    const g = stage.userData.pitchUnseen
    g.visible = true
    stage.renderer.setClearColor(INK_BG, 1)
  },

  update(stage, local, t) {
    const g = stage.userData.pitchUnseen
    const { phone, shade, tree, soloNode, soloLabel, ghosts, emptyNote, counters, divider } = g.userData
    const B = BEATS

    // 镜头：先贴着手机，再向左横移，把右边那片"空"揭出来
    const reveal = ramp(local, B.revealFrom, B.revealDur, EASE.inOut)
    const lookX = PHONE_X + 0.92 * reveal
    const d = distanceFor(stage, 2.20, 0.80) * (1.0 - 0.05 * ramp(local, 0, 13, EASE.inOut))
    stage.camera.position.set(lookX + 0.12 * (1 - reveal) - 0.04 * reveal, 0.06 - 0.10 * reveal, d)
    stage.camera.lookAt(lookX, -0.02, 0)

    // 手机点亮，末尾压暗
    const lit = ramp(local, B.light, 1.1, EASE.out)
    const dim = ramp(local, B.dim, B.dimDur, EASE.inOut)
    phone.userData.setFrameOpacity(lit)
    phone.userData.surface.material.opacity = 0.12 + 0.88 * lit
    phone.userData.rim.material.opacity = 0.07 + 0.20 * lit
    shade.material.opacity = dim * 0.62
    if (!g.userData.painted) {
      g.userData.painted = true
      phone.userData.paint((ctx, w, h) => paintWeChat(ctx, w, h))
    }

    // 树：唯一节点先亮，空位骨架随后浮出，最后计数器逐个落定
    const nodeK = ramp(local, 1.6, 1.4, EASE.out)
    soloNode.material.opacity = nodeK * 0.5
    soloLabel.material.opacity = nodeK * 0.95
    soloLabel.position.y = 0.30 - (1 - nodeK) * 0.10

    for (let i = 0; i < ghosts.length; i++) {
      ghosts[i].userData.mat.opacity = ramp(local, 3.0 + i * 0.22, 1.2, EASE.out) * 0.85
    }
    emptyNote.material.opacity = ramp(local, 4.6, 1.4, EASE.out) * 0.9

    for (let i = 0; i < counters.length; i++) {
      const k = ramp(local, B.countFrom + i * B.countStep, 0.7, EASE.out)
      setGroupOpacity(counters[i], k)
      counters[i].position.y = 0.94 + (1 - k) * 0.08
    }

    divider.material.opacity = ramp(local, B.revealFrom + 0.4, 1.2, EASE.out) * 0.55
    tree.position.x = 0.98 + (1 - reveal) * 0.10
  },

  teardown(stage) {
    const g = stage.userData.pitchUnseen
    if (g) g.visible = false
  },
})
