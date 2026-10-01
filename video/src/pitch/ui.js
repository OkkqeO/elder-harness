// 项目片共用的界面绘制。
//
// 两处要用同一页微信：S01 里它长在手机屏上（老人看到的），S02 里它变成截图卡上的
// "唯一答案来源"（机器能拿到的）。同一份绘制代码，保证两边逐像素是同一页。

import * as THREE from 'three'

/** 老人端首页：一屏一件事——一行状态、一个大圆按钮、一行提示、一行退路。 */
export function paintHome(ctx, w, h, { button = '#C46A14', label = '我在听', hint = '说完就好', status = '正在听…' } = {}) {
  ctx.fillStyle = '#F6F7F8'; ctx.fillRect(0, 0, w, h)

  // 状态行：一个圆点 + 一句话，就是全部状态
  ctx.beginPath()
  ctx.arc(w * 0.085, h * 0.062, w * 0.016, 0, Math.PI * 2)
  ctx.fillStyle = button
  ctx.fill()
  ctx.font = `600 ${Math.round(w * 0.062)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  ctx.fillStyle = '#17202A'
  ctx.fillText(status, w * 0.115, h * 0.076)

  // 大圆按钮：直径约占屏宽一半
  const cx = w / 2, cy = h * 0.40, r = w * 0.245
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(196,106,20,0.16)'; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = button; ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.font = `700 ${Math.round(w * 0.105)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  ctx.fillText(label, cx, cy + w * 0.038)
  ctx.textAlign = 'left'

  ctx.textAlign = 'center'
  ctx.font = `500 ${Math.round(w * 0.052)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  ctx.fillStyle = '#5D6D7E'
  ctx.fillText(hint, cx, h * 0.545)
  ctx.textAlign = 'left'

  // 退路：打字 / 请家人帮忙 / 给家人打电话
  ctx.font = `500 ${Math.round(w * 0.040)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  ctx.fillStyle = '#8A98A5'
  const words = ['打字', '请家人帮忙', '给家人打电话']
  const gap = w * 0.035
  const widths = words.map(t => ctx.measureText(t).width)
  const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1)
  let x = (w - total) / 2
  for (let i = 0; i < words.length; i++) {
    ctx.fillText(words[i], x, h * 0.945)
    x += widths[i] + gap
  }
}

/** 一页微信聊天：老人一眼就认得的那种界面。 */
export function paintWeChat(ctx, w, h) {
  ctx.fillStyle = '#EDEDED'; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#F7F7F7'; ctx.fillRect(0, 0, w, h * 0.075)
  ctx.fillStyle = '#17202A'
  ctx.font = `600 ${Math.round(w * 0.062)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('女儿', w / 2, h * 0.052)
  ctx.textAlign = 'left'

  const bubbles = [
    ['今天降温了，多穿点', false],
    ['好，我知道了', true],
    ['药吃了吗？', false],
    ['吃了，早上的', true],
    ['周末回来看你', false],
  ]
  ctx.font = `500 ${Math.round(w * 0.052)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  let y = h * 0.16
  const bh = h * 0.058
  for (const [text, mine] of bubbles) {
    const tw = ctx.measureText(text).width + w * 0.075
    const bx = mine ? w * 0.92 - tw : w * 0.04
    ctx.fillStyle = mine ? '#A8E0A0' : '#FFFFFF'
    const r = bh * 0.28
    ctx.beginPath()
    ctx.moveTo(bx + r, y)
    ctx.arcTo(bx + tw, y, bx + tw, y + bh, r)
    ctx.arcTo(bx + tw, y + bh, bx, y + bh, r)
    ctx.arcTo(bx, y + bh, bx, y, r)
    ctx.arcTo(bx, y, bx + tw, y, r)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#17202A'
    ctx.fillText(text, bx + w * 0.037, y + bh * 0.68)
    y += bh * 1.62
  }

  // 底部输入条：这一页在无障碍树里给不出任何可读控件
  ctx.fillStyle = '#F7F7F7'; ctx.fillRect(0, h * 0.925, w, h * 0.075)
  ctx.fillStyle = '#C9D2D8'; ctx.fillRect(w * 0.05, h * 0.944, w * 0.72, h * 0.036)
  ctx.fillStyle = '#8A98A5'
  ctx.font = `500 ${Math.round(w * 0.042)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  ctx.fillText('输入', w * 0.065, h * 0.970)
}

/**
 * 截图卡面：同一页微信 + 比例坐标网格 + 编号。
 *
 * 网格与编号直接画进纹理，不用叠加层——additive 的网格叠在白卡上等于没画
 * （原片 tree 镜头的网格就是这样被吃掉的）。
 */
export function makeShotTexture({ w = 640, h = 1060, cols = 4, rows = 5, lockIndex = 10 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // 截图里是那页微信，缩到卡面内
  const pad = Math.round(w * 0.045)
  ctx.save()
  ctx.translate(pad, pad)
  const sw = w - pad * 2
  const sh = h - pad * 2
  ctx.beginPath()
  ctx.rect(0, 0, sw, sh)
  ctx.clip()
  ctx.scale(sw / w, sh / h)
  paintWeChat(ctx, w, h)
  ctx.restore()

  // 比例坐标网格：CELL 数与编号，就是"另外一层编号"
  const cw = (w - pad * 2) / cols
  const ch = (h - pad * 2) / rows
  ctx.lineWidth = Math.max(1, w * 0.0022)
  ctx.strokeStyle = 'rgba(56,96,120,0.55)'
  for (let i = 0; i <= cols; i++) {
    const x = pad + i * cw
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke()
  }
  for (let j = 0; j <= rows; j++) {
    const y = pad + j * ch
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke()
  }

  ctx.font = `600 ${Math.round(w * 0.032)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const n = j * cols + i + 1
      const x = pad + i * cw + w * 0.014
      const y = pad + j * ch + h * 0.026
      if (n === lockIndex) continue
      ctx.fillStyle = 'rgba(70,100,120,0.66)'
      ctx.fillText('k' + n, x, y)
    }
  }

  // 锁住的那一格：attention 橙，编号加粗
  const li = (lockIndex - 1) % cols
  const lj = Math.floor((lockIndex - 1) / cols)
  const lx = pad + li * cw
  const ly = pad + lj * ch
  ctx.fillStyle = 'rgba(196,106,20,0.22)'
  ctx.fillRect(lx, ly, cw, ch)
  ctx.lineWidth = Math.max(2, w * 0.005)
  ctx.strokeStyle = 'rgba(196,106,20,0.95)'
  ctx.strokeRect(lx, ly, cw, ch)
  ctx.fillStyle = '#8A4A0E'
  ctx.font = `700 ${Math.round(w * 0.040)}px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`
  ctx.fillText('k' + lockIndex, lx + w * 0.016, ly + h * 0.034)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}
