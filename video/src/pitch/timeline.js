// 项目片的唯一时间源。
//
// 结构（4:00 = 240.0s）：
//   开头            0:00–0:24   24s   2 镜
//   Ⅰ 我们是什么    0:24–1:40   76s   5 镜
//   Ⅱ 我们能干什么  1:40–3:04   84s   5 镜
//   Ⅲ 为什么选择我们 3:04–4:00  56s   4 镜
//
// 与正片一样：画面与字幕都是 t 的纯函数，镜头声明自己的章标、字幕、音效与运动模糊预算，
// 表现层从这一份数据里取字幕和章标——所以文档、画面、cue 表不可能各说各话。

export const FPS = 60
export const WIDTH = 1920
export const HEIGHT = 1080

import { shotSpiral } from '../shots/01-spiral.js'
import { shotAnotherWay } from './shots/p02-another-way.js'
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

// 开头用回正片原来的「序 · 开机」，**放满它自己的 15 秒**：这一镜的节拍表是
// 片名 10.1s 落定、12.3s 开始化开、15.0s 火花并回螺旋。13s 就切会把化开那一拍砍断，
// 看上去像卡了一下。所以给它完整 15 秒，第二镜相应压到 9 秒（它 7.7 秒就演完了），
// 后面 14 个镜头不动，总长仍是 4:00。
//
// 字幕改过：镜头自己已经有一块居中的大字片名 + 中文副题，字幕再写一遍"银龄智办"
// 就是同一句话说两次，所以这里只留英文副题。
const shotOpening = {
  ...shotSpiral,
  subs: [[10.9, 14.2, '', 'A trustworthy cross-app assistant for older people.']],
}

// 第二镜：让出 2 秒给序章。粒子/卡片/网格/编号/片名分别在第 2.5、2.7、4.4、5.5、7.7 秒收尾，
// 9 秒足够；第三条字幕本来就是把画面上的片名再念一遍，直接去掉。
const shotBridge = {
  ...shotAnotherWay,
  start: 15,
  duration: 9,
  subs: [
    [0.8, 4.2, '屏幕上的像素，是另一条路', 'The pixels are another way in.'],
    [4.6, 7.6, '截图加比例坐标，照样点得准', 'A screenshot and proportion coordinates aim just as well.'],
  ],
  sfx: [[0.5, 'whoosh', { dur: 1.2 }], [3.2, 'sparkle'], [4.6, 'tick'], [6.2, 'chime', { midi: 76 }]],
}

export const SHOTS = [
  shotOpening,     // 开头     0:00–0:15   （正片原镜头，完整 15s）
  shotBridge,      // 开头     0:15–0:24
  shotWhatWeAre,   // Ⅰ        0:24–0:39
  shotListening,   // Ⅰ        0:39–0:55
  shotSeeing,      // Ⅰ        0:55–1:11
  shotLoop,        // Ⅰ        1:11–1:26
  shotMeasure,     // Ⅰ        1:26–1:40
  shotTasks,       // Ⅱ        1:40–1:56
  shotNotInTree,   // Ⅱ        1:56–2:15
  shotDangerous,   // Ⅱ        2:15–2:34
  shotHandBack,    // Ⅱ        2:34–2:51
  shotHearing,     // Ⅱ        2:51–3:04
  shotNoHardware,  // Ⅲ        3:04–3:17
  shotEvidence,    // Ⅲ        3:17–3:38
  shotBoundary,    // Ⅲ        3:38–3:51
  shotClose,       // Ⅲ        3:51–4:00
]

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
