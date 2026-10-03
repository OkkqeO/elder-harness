// 项目片的唯一时间源。
//
// 结构（4:00 = 240.0s，15 镜）：
//   开头            0:00–0:15   15s   1 镜（序 · 开机）
//   Ⅰ 我们是什么    0:15–1:34   79s   5 镜
//   Ⅱ 我们能干什么  1:34–3:03   89s   5 镜
//   Ⅲ 为什么选择我们 3:03–4:00  57s   4 镜
//
// 与正片一样：画面与字幕都是 t 的纯函数，镜头声明自己的章标、字幕、音效与运动模糊预算，
// 表现层从这一份数据里取字幕和章标——所以文档、画面、cue 表不可能各说各话。

export const FPS = 60
export const WIDTH = 1920
export const HEIGHT = 1080

import { shotSpiral } from '../shots/01-spiral.js'
import { shotWhatWeAre } from './shots/p03-what-we-are.js'
import { shotListening } from './shots/p04-listening.js'
import { shotSeeing } from './shots/p05-seeing.js'
import { shotLoop } from './shots/p06-loop.js'
import { shotMeasure } from './shots/p07-measure.js'
import { shotTasks } from './shots/p08-tasks.js'
import { shotNotInTree } from './shots/p09-not-in-tree.js'
import { shotDangerous } from './shots/p10-dangerous.js'
import { shotHandBack } from './shots/p11-hand-back.js'
import { shotHearing } from './shots/p12-hearing.js'
import { shotNoHardware } from './shots/p13-no-hardware.js'
import { shotEvidence } from './shots/p14-evidence.js'
import { shotBoundary } from './shots/p15-boundary.js'
import { shotClose } from './shots/p16-close.js'

// 开头：正片原来的「序 · 开机」，放满它自己的 15 秒（片名 10.1s 落定、12.3s 开始化开、
// 15.0s 火花并回螺旋）。字幕只留英文副题——镜头自己已有一块居中的大字片名 + 中文副题，
// 字幕再写一遍"银龄智办"就是同一句话出现两次。
const shotOpening = {
  ...shotSpiral,
  subs: [[10.9, 14.2, '', 'A trustworthy cross-app assistant for older people.']],
}

// 各镜时长。原来 0:15–0:24 有一镜过场（另一条路：粒子聚成截图 + 编号网格），已删；
// 少掉的 9 秒按信息量分摊给九镜，每镜结尾多留一拍，总长仍是 4:00。
//
// 时长只决定镜头结尾停留多久——镜头内部的节拍、字幕、音效都是相对时间，不会被打乱；
// probe-cuts 会逐个切点检查"动画是否已经放完"，所以加长之后也不会把动画切在中间。
const DURATIONS = [
  15,  // 序 · 开机           0:00–0:15
  16,  // Ⅰ 我们是什么        0:15–0:31
  17,  // Ⅰ 听得进去          0:31–0:48
  17,  // Ⅰ 看得见页面        0:48–1:05
  15,  // Ⅰ 办事循环          1:05–1:20
  14,  // Ⅰ 分寸与交还        1:20–1:34
  17,  // Ⅱ 十三件事          1:34–1:51
  20,  // Ⅱ 树里没有的        1:51–2:11
  20,  // Ⅱ 危险的一步        2:11–2:31
  18,  // Ⅱ 省的是手脚        2:31–2:49
  14,  // Ⅱ 听得准            2:49–3:03
  13,  // Ⅲ 不换设备          3:03–3:16
  22,  // Ⅲ 不说没做到的      3:16–3:38
  13,  // Ⅲ 不越界            3:38–3:51
   9,  // Ⅲ 收束              3:51–4:00
]

const CUT = [
  shotOpening, shotWhatWeAre, shotListening, shotSeeing, shotLoop, shotMeasure,
  shotTasks, shotNotInTree, shotDangerous, shotHandBack, shotHearing,
  shotNoHardware, shotEvidence, shotBoundary, shotClose,
]

// 时间轴在一处铺开：每镜的 start 由前面各镜的时长累加而来。
// 增删镜头只需要改 DURATIONS，不必去动十几个镜头文件里的 start。
// （p01-unseen「空树」与 p02-another-way「像素成截图」两镜已不在片子里，文件保留备用。）
export const SHOTS = (() => {
  let t = 0
  return CUT.map((s, i) => {
    const o = { ...s, start: t, duration: DURATIONS[i] }
    t += DURATIONS[i]
    return o
  })
})()

export const DURATION = 240.0

/** The edit's voice, aggregated from what each shot declares about itself. */
export const FILM = (() => {
  const film = { duration: DURATION, chapters: [], subs: [], sfx: [], hits: [] }
  for (const s of SHOTS) {
    if (s.chapter) film.chapters.push({ ...s.chapter, start: s.start, end: s.end })
    for (const [a, b, zh, en] of s.subs ?? []) {
      film.subs.push({ a: s.start + a, b: s.start + b, zh, en })
    }
    for (const [t, name, o] of s.sfx ?? []) {
      film.sfx.push({ t: +(s.start + t).toFixed(4), name, ...(o ?? {}) })
    }
    for (const [t, k] of s.hits ?? []) film.hits.push({ t: s.start + t, k })
  }
  film.sfx.sort((a, b) => a.t - b.t)
  film.hits.sort((a, b) => a.t - b.t)
  return film
})()

/** The cue sheet the music script reads. */
export function cueSheet() {
  return FILM.sfx.map(c => ({ ...c }))
}

export function shotNamed(name) {
  const s = SHOTS.find(x => x.name === name)
  if (!s) throw new Error(`unknown shot: ${name} (have: ${SHOTS.map(x => x.name).join(', ')})`)
  return s
}

export function frameCount() { return Math.round(DURATION * FPS) }
