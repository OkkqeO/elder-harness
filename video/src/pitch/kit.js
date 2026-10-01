// 项目片的道具库。
//
// 与正片 props.js 的分工：props.js 管三维的东西（手机、卡片、粒子、光），这里管
// "要被读到的东西"——文字、数据、编号、光栅。全部走 2D canvas 烘焙成纹理，
// 理由与正片一致：中文字形不适合在着色器里做 SDF，而且烘焙出来的排版可以
// 和真机截图逐像素对照。
//
// 一条纪律：画进纹理的东西**不用 additive 混合**。additive 的白字叠在白卡上等于没画
// ——正片 tree 镜头的坐标网格就是这样被吃掉的。

import * as THREE from 'three'
import { LAYER_UI, roundRect } from '../props.js'

export const ZH = '"Noto Sans CJK SC", "Microsoft YaHei", sans-serif'
export const SERIF = '"Noto Serif CJK SC", "SimSun", serif'

/** 文字：统一在这里设置字体与颜色。 */
export function setFont(ctx, size, weight = 500, color = '#17202A', family = ZH) {
  ctx.font = `${weight} ${Math.round(size)}px ${family}`
  ctx.fillStyle = color
}

/** 一行字，自动居中或左对齐。 */
export function text(ctx, str, x, y, { size = 34, weight = 500, color = '#17202A', align = 'left', family = ZH } = {}) {
  setFont(ctx, size, weight, color, family)
  ctx.textAlign = align
  ctx.fillText(str, x, y)
  ctx.textAlign = 'left'
}

/** 间距字：英文小字用。 */
export function tracked(ctx, str, x, y, { size = 22, weight = 500, color = '#6E8290', gap = 6, align = 'left' } = {}) {
  setFont(ctx, size, weight, color)
  const chars = [...str]
  const widths = chars.map(c => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1)
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x
  ctx.textAlign = 'left'
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cx, y)
    cx += widths[i] + gap
  }
}

/** 圆角底：卡片、药丸、数据条共用。 */
export function plate(ctx, x, y, w, h, { fill = 'rgba(255,255,255,0.96)', radius = 26, stroke = null, lineWidth = 3 } = {}) {
  roundRect(ctx, x, y, w, h, radius)
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke() }
}

/**
 * 一块"要被读到"的面板：宽度是三维世界单位，纹理分辨率自己定。
 * draw(ctx, w, h) 里用上面的 text/plate 画内容。
 */
export function makePanel(width, height, px, draw, { layer = LAYER_UI } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = Math.max(2, Math.round(px * height / width))
  const ctx = canvas.getContext('2d')
  draw(ctx, canvas.width, canvas.height)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  mat.toneMapped = false
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat)
  mesh.layers.set(layer)
  mesh.userData.mat = mat
  return mesh
}

/** 药丸标签：一行字 + 圆角底，用在工具名、步骤、徽章上。 */
export function makePill(label, {
  width = null, height = 0.16, px = 512, size = 40, weight = 600,
  color = '#17202A', fill = 'rgba(255,255,255,0.94)', stroke = null, dot = null, dotColor = '#1A7F6B',
  align = 'left', family = ZH,
} = {}) {
  const w = width ?? height * 4.4
  return makePanel(w, height, px, (ctx, cw, ch) => {
    plate(ctx, 2, 2, cw - 4, ch - 4, { fill, radius: ch / 2, stroke })
    let x = cw * 0.06
    if (dot) {
      ctx.beginPath()
      ctx.arc(x + ch * 0.16, ch / 2, ch * 0.115, 0, Math.PI * 2)
      ctx.fillStyle = dotColor
      ctx.fill()
      x += ch * 0.42
    }
    text(ctx, label, align === 'center' ? cw / 2 : x, ch * 0.63, { size: ch * 0.42, weight, color, align, family })
  })
}

/**
 * 数据条：一排"标签 + 数字"，用于把实测数字落定。
 * items = [[label, value, color?], ...]
 */
export function makeDataStrip(items, { width = 2.4, height = 0.30, px = 1400 } = {}) {
  return makePanel(width, height, px, (ctx, cw, ch) => {
    plate(ctx, 0, 0, cw, ch, { fill: 'rgba(16,22,27,0.92)', radius: ch * 0.22, stroke: 'rgba(90,110,125,0.6)' })
    const step = cw / items.length
    for (let i = 0; i < items.length; i++) {
      const [k, v, col] = items[i]
      const cx = step * (i + 0.5)
      text(ctx, k, cx, ch * 0.40, { size: ch * 0.24, weight: 500, color: '#8FA3AD', align: 'center' })
      text(ctx, v, cx, ch * 0.78, { size: ch * 0.36, weight: 700, color: col || '#E8EEF2', align: 'center' })
      if (i) {
        ctx.strokeStyle = 'rgba(90,110,125,0.35)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(step * i, ch * 0.22)
        ctx.lineTo(step * i, ch * 0.78)
        ctx.stroke()
      }
    }
  })
}

/** 细密光栅：约束层的辨识度。叠在暗底上，用 additive 是安全的。 */
export function makeGrating({ width = 2.6, count = 3, gap = 0.34, color = 0xC46A14 } = {}) {
  const g = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
  })
  for (let i = 0; i < count; i++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.006), mat)
    line.position.y = (i - (count - 1) / 2) * gap
    g.add(line)
  }
  g.userData.mat = mat
  return g
}

/** 发光胶囊：树节点。 */
export function makeNodePlate(width = 0.5, color = 0x2E8F76) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * 0.26),
    new THREE.MeshBasicMaterial({
      color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
    }),
  )
  mesh.userData.mat = mesh.material
  return mesh
}
