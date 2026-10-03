# 《银龄智办》项目片 · 渲染文件与字幕

> 成片 **4:00.000**（240.0s）· 1920×1080 · 60fps · 15 镜 · 字幕 **50** 条
> 字幕与镜头时间由 `src/pitch/timeline.js` 聚合后导出（页面里的 `presentation.subs`），
> 不是手抄；文件体积现场统计。片源：`video/pitch.html` + `video/src/pitch/*`。

## 一、渲染用的文件都在哪儿

工作区：`D:\deepseek\elder-harness-video`（桌面那份仓库只有源码，没有 `out/` 与 `node_modules`）

### 1. 片源——被渲染的东西

| 路径 | 是什么 | 体积 |
|---|---|---|
| `pitch.html` | 项目片入口页（`__renderAt(t)` 在这里暴露） | 2.8 KB |
| `src/pitch/` | 时间轴 + 道具库 + 界面件 + 16 个镜头文件（19 个文件） | 116.5 KB |
| `src/stage.js` `src/props.js` `src/presentation.js` | 复用的引擎：舞台与后期、三维道具、章标与字幕表现层 | 74.3 KB |
| `src/shots/01-spiral.js` | 正片原来的「序 · 开机」，项目片开头直接引用 | 18.9 KB |
| `node_modules/` | 依赖（three 0.186.1 是唯一一个真正用到的） | 39.0 MB |

### 2. 渲染工具——`render/`

| 文件 | 作用 | 体积 |
|---|---|---|
| `bench.mjs` | 探测真实 GL 后端与吞吐量（Chromium 会静默退回 SwiftShader，必须看 renderer 字符串） | 2.6 KB |
| `capture.mjs` | 在页面内同步读 canvas（不用 Page.captureScreenshot） | 1.5 KB |
| `cdp.mjs` | 自写的极简 CDP 客户端（launch / navigate / evaluate / screenshot，GL 后端开关在这里） | 4.2 KB |
| `cues.mjs` | 导出音效打点表 cues.json（由页面生成，不是手写；music.py 读它做配乐） | 1.7 KB |
| `encode.mjs` | 原片自带的 ffmpeg 合成（含真机录屏键控位） | 4.1 KB |
| `frame.mjs` | 原片自带的单帧渲染 | 3.0 KB |
| `frames.mjs` | 原片自带的逐帧导出（区间 / 单镜 / 运动模糊） | 4.9 KB |
| `gl-probe.mjs` | 打一句 renderer 字符串，确认跑的是真 GPU 而不是 SwiftShader | 1.7 KB |
| `movie.mjs` | 整片分段渲染：每 N 秒换一次浏览器、跳过已存在的帧（断点续渲），单段失败重试 | 5.6 KB |
| `preview.mjs` | 实时预览：用 requestAnimationFrame 驱动同一个 __renderAt，所看即所得 | 0.9 KB |
| `probe-cuts.mjs` | 量每个切点前的运动量，判断动画是否被切在中间 | 3.1 KB |
| `probe-expr.mjs` | 渲染某一时刻后在页面里求值（查元素状态、导出数据） | 1.6 KB |
| `probe-offscreen.mjs` | 逐秒把可见物体的包围盒投影到 NDC，报出跑出画框的元素 | 4.1 KB |
| `serve.mjs` | 极简静态服务器（ES module 在 file:// 下会被 CORS 拦） | 1.7 KB |
| `shot-probe.mjs` | 只渲某一镜的几个时刻并报出页面错误（整段渲染会把异常吞成黑帧） | 1.6 KB |
| `stills.mjs` | 一次启动浏览器批量出静帧，--page 可切换片目 | 3.1 KB |

### 3. 渲染产物——`out/`

| 目录 / 文件 | 内容 | 体积 |
|---|---|---|
| `out/animatic/` | 动态分镜（4:00）的帧（7200 个文件） | 603.8 MB |
| `out/check-146.jpg` | 从成片里抽出来核对的帧 | 54.8 KB |
| `out/check-after-cut.jpg` | 从成片里抽出来核对的帧 | 47.2 KB |
| `out/check-grain.jpg` | 从成片里抽出来核对的帧 | 98.7 KB |
| `out/check-s03.jpg` | 从成片里抽出来核对的帧 | 72.9 KB |
| `out/check-s04.jpg` | 从成片里抽出来核对的帧 | 55.0 KB |
| `out/movie/` | 正片 125s 的帧 7500 张（7500 个文件） | 1982.6 MB |
| `out/pitch-full/` | 项目片母版帧 14400 张（f000000–f014399），成片由它编出（14400 个文件） | 2310.9 MB |
| `out/pitch-preview/` | 早期 71s 预览的帧（4260 个文件） | 844.6 MB |
| `out/stills/` | 逐轮自检渲的静帧（107 个文件） | 292.8 MB |
| `out/yinling-pitch-4min-1080p60.mp4` | 成片 | 110.0 MB |

### 4. 怎么重渲

```powershell
cd D:\deepseek\elder-harness-video
$env:CHROME_BIN='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$env:GL_BACKEND='vulkan'          # Intel Arc 上约 20 fps；默认的 swiftshader 只有 3.5 fps
node render/movie.mjs --page pitch.html --from 0 --to 240 --fps 60 --seg 12 --out out/pitch-full
ffmpeg -framerate 60 -i out/pitch-full/f%06d.jpg -vf "scale=in_range=full:out_range=tv" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 \
  -colorspace bt709 -color_range tv -movflags +faststart out/yinling-pitch-4min-1080p60.mp4
```

自检（改完任何一镜都建议跑）：

```powershell
node render/probe-offscreen.mjs --page pitch.html --step 3 --from 0 --to 240   # 有没有东西跑出画框
node render/probe-cuts.mjs --page pitch.html                                   # 切点前动画是否已放完
```

## 二、镜头与时间

| # | 章 | 镜头 | 文件名 | 起 | 止 | 时长 | 字幕 |
|---|---|---|---|---|---|---|---|
| 1 | 开头 | 序 · 开机 | `spiral` | 0:00.0 | 0:15.0 | 15s | 1 |
| 2 | Ⅰ | Ⅰ 我们是什么 | `what-we-are` | 0:15.0 | 0:31.0 | 16s | 3 |
| 3 | Ⅰ | Ⅰ 听得进去 | `listening` | 0:31.0 | 0:48.0 | 17s | 3 |
| 4 | Ⅰ | Ⅰ 看得见页面 | `seeing` | 0:48.0 | 1:05.0 | 17s | 4 |
| 5 | Ⅰ | Ⅰ 办事循环 | `loop` | 1:05.0 | 1:20.0 | 15s | 4 |
| 6 | Ⅰ | Ⅰ 分寸与交还 | `measure` | 1:20.0 | 1:34.0 | 14s | 4 |
| 7 | Ⅱ | Ⅱ 十三件事 | `tasks` | 1:34.0 | 1:51.0 | 17s | 4 |
| 8 | Ⅱ | Ⅱ 树里没有的 | `not-in-tree` | 1:51.0 | 2:11.0 | 20s | 4 |
| 9 | Ⅱ | Ⅱ 危险的一步 | `dangerous` | 2:11.0 | 2:31.0 | 20s | 4 |
| 10 | Ⅱ | Ⅱ 省的是手脚 | `hand-back` | 2:31.0 | 2:49.0 | 18s | 4 |
| 11 | Ⅱ | Ⅱ 听得准 | `hearing` | 2:49.0 | 3:03.0 | 14s | 3 |
| 12 | Ⅲ | Ⅲ 不换设备 | `no-hardware` | 3:03.0 | 3:16.0 | 13s | 3 |
| 13 | Ⅲ | Ⅲ 不说没做到的 | `evidence` | 3:16.0 | 3:38.0 | 22s | 4 |
| 14 | Ⅲ | Ⅲ 不越界 | `boundary` | 3:38.0 | 3:51.0 | 13s | 3 |
| 15 | Ⅲ | Ⅲ 收束 | `close` | 3:51.0 | 4:00.0 | 9s | 2 |

章标（画面左上角那块）：

| 章 | 中 | 英 | 起 | 止 |
|---|---|---|---|---|
| 序 | 开机 | COLD OPEN | 0:00.0 | 0:15.0 |
| Ⅰ | 我们是什么 | WHAT WE ARE | 0:15.0 | 0:39.0 |
| Ⅱ | 我们能干什么 | WHAT IT CAN DO | 1:34.0 | 1:56.0 |
| Ⅲ | 为什么选择我们 | WHY US | 3:03.0 | 3:17.0 |

> 章标只在**每章的第一镜**出现，随后把画面让给内容——所以上表的区间比章节本身短
> （例如 Ⅰ 从 0:15 一直到 1:34，章标只在 0:15–0:39 亮着）。章标由镜头自己在定义里声明，
> 表现层据此淡入淡出；要让它在整章都挂着，就给该章其余镜头补上同样的 `chapter` 字段。

## 三、字幕总表（50 条，全片全局时间）

| 全片 # | 时间 | 时长 | 镜 | 中文 | English |
|---|---|---|---|---|---|
| 1 | 0:10.9–0:14.2 | 3.3s | 序 · 开机 | — | A trustworthy cross-app assistant for older people. |
| 2 | 0:15.8–0:19.8 | 4.0s | Ⅰ 我们是什么 | 不做新手机，也不做新 App | Not a new phone, not a new app. |
| 3 | 0:20.2–0:24.4 | 4.2s | Ⅰ 我们是什么 | 它住在老人已经在用的那台手机里 | It lives in the phone he already owns. |
| 4 | 0:24.8–0:29.2 | 4.4s | Ⅰ 我们是什么 | 通用模型只决定下一步，约束由这一层管 | The model picks the next step; the constraints are ours. |
| 5 | 0:31.8–0:35.6 | 3.8s | Ⅰ 听得进去 | 点一下开始，之后像打电话，不像对讲机 | One tap to start — then it is a call, not a walkie-talkie. |
| 6 | 0:36.0–0:39.4 | 3.4s | Ⅰ 听得进去 | 它说话时插话，它立刻闭嘴 | Talk over it and it stops mid-sentence. |
| 7 | 0:39.8–0:43.4 | 3.6s | Ⅰ 听得进去 | 每一步都念出来，静下来 20 秒它自己关麦 | Every step is spoken; twenty seconds of silence closes the mic. |
| 8 | 0:48.8–0:52.8 | 4.0s | Ⅰ 看得见页面 | 能读的读树：一页 12306，抽出 102 个节点 | Read the tree when it is there: 102 nodes on one page. |
| 9 | 0:53.2–0:56.0 | 2.8s | Ⅰ 看得见页面 | 其中 58 个是模型能看见的控件 | Fifty-eight of them are controls the model can see. |
| 10 | 0:56.4–1:00.4 | 4.0s | Ⅰ 看得见页面 | 读不到的读像素：微信那一页只给一个节点 | Read the pixels when it is not: WeChat returns a single node. |
| 11 | 1:00.8–1:03.6 | 2.8s | Ⅰ 看得见页面 | 截图加比例坐标，点按前问老人一次 | A screenshot, proportion coordinates, and one ask before tapping. |
| 12 | 1:05.8–1:09.6 | 3.8s | Ⅰ 办事循环 | 看见、决定、动手、再看 | Look, decide, act, look again. |
| 13 | 1:10.0–1:13.6 | 3.6s | Ⅰ 办事循环 | 模型只决定下一步做什么 | The model only decides the next step. |
| 14 | 1:14.0–1:17.0 | 3.0s | Ⅰ 办事循环 | 每做完一步，新页面自动回灌 | After each step, the new page flows back in. |
| 15 | 1:17.4–1:19.6 | 2.2s | Ⅰ 办事循环 | 中途停下，再从同一段对话接着走 | Stop midway, and it resumes the same conversation. |
| 16 | 1:20.8–1:24.4 | 3.6s | Ⅰ 分寸与交还 | 大部分事，它自己做完 | Most of it, it does alone. |
| 17 | 1:24.8–1:28.2 | 3.4s | Ⅰ 分寸与交还 | 付款、发送、验证码——交回本人 | Payment, sending, codes — handed back to him. |
| 18 | 1:28.6–1:31.4 | 2.8s | Ⅰ 分寸与交还 | 盲页面坐标点按，一次任务只问一遍 | On a blind page it asks once per task, then stops asking. |
| 19 | 1:31.8–1:33.8 | 2.0s | Ⅰ 分寸与交还 | 更细的分级自主仍在研发 | The finer graded model is still in development. |
| 20 | 1:34.8–1:38.6 | 3.8s | Ⅱ 十三件事 | 13 件事，在真机上跑过 | Thirteen errands, run on a real phone. |
| 21 | 1:39.0–1:42.6 | 3.6s | Ⅱ 十三件事 | 短的 3 步 5 秒，长的 14 步 42 秒 | From three steps in five seconds to fourteen in forty-two. |
| 22 | 1:43.0–1:46.4 | 3.4s | Ⅱ 十三件事 | 其中两次的结论是「判定做不到」 | Twice, the honest answer was: it cannot be done. |
| 23 | 1:46.8–1:49.6 | 2.8s | Ⅱ 十三件事 | 橙色是交回本人，红色是正确拒绝 | Amber means handed back; red means correctly refused. |
| 24 | 1:51.8–1:56.0 | 4.2s | Ⅱ 树里没有的 | 喜鹊儿的课表，树里只有节次和日期 | In the timetable page, the tree holds only period numbers. |
| 25 | 1:56.4–2:01.0 | 4.6s | Ⅱ 树里没有的 | 一个课程名都没有——页面是自绘的 | Not one course name — the page draws its own text. |
| 26 | 2:01.4–2:05.8 | 4.4s | Ⅱ 树里没有的 | 答案只能在截图里，逐项核对 | The answer is only in the screenshot, checked line by line. |
| 27 | 2:06.2–2:09.6 | 3.4s | Ⅱ 树里没有的 | 3 步、7 秒，读到的和截图一致 | Three steps, seven seconds, and it matches the screenshot. |
| 28 | 2:11.8–2:16.0 | 4.2s | Ⅱ 危险的一步 | 有一类操作，它不碰 | There is a class of action it does not touch. |
| 29 | 2:16.4–2:20.6 | 4.2s | Ⅱ 危险的一步 | 拼多多下单会跳到第三方支付页 | One order flow jumps straight to a payment page. |
| 30 | 2:21.0–2:25.2 | 4.2s | Ⅱ 危险的一步 | 它在读不到控件的页面上取消支付，然后返回 | On a page it cannot read, it cancels the payment and goes back. |
| 31 | 2:25.6–2:29.6 | 4.0s | Ⅱ 危险的一步 | 付款、下单、转账、验证码——拒付词表命中 | Payment, orders, transfers, codes — the refusal list catches them. |
| 32 | 2:31.8–2:36.0 | 4.2s | Ⅱ 省的是手脚 | 关键一步，本人来按 | The last step is his to press. |
| 33 | 2:36.4–2:40.8 | 4.4s | Ⅱ 省的是手脚 | 金额、地址、点哪里——它逐条说清楚，然后停住 | It names the amount, the address, the button — then it stops. |
| 34 | 2:41.2–2:44.8 | 3.6s | Ⅱ 省的是手脚 | 一次 10 步的外卖，打扰 0 次 | Ten steps of takeaway, zero interruptions. |
| 35 | 2:45.2–2:47.6 | 2.4s | Ⅱ 省的是手脚 | 它省的是手脚，不是决定 | It saves his hands, never his decision. |
| 36 | 2:49.6–2:53.4 | 3.8s | Ⅱ 听得准 | 系统里没有识别服务，就自己接一条 | The system has no recognition service, so we brought our own. |
| 37 | 2:53.8–2:57.4 | 3.6s | Ⅱ 听得准 | 手机只录音，识别在服务端，16 kHz 单声道 | The phone only records; recognition runs on our server. |
| 38 | 2:57.8–3:01.6 | 3.8s | Ⅱ 听得准 | 门限 1400、静音 900 ms——参数是实测出来的 | Threshold 1400, silence 900 ms — measured, not guessed. |
| 39 | 3:03.6–3:07.6 | 4.0s | Ⅲ 不换设备 | 别的方案让老人换设备 | Others ask him to change devices. |
| 40 | 3:08.0–3:11.6 | 3.6s | Ⅲ 不换设备 | 我们不换手机、不装新应用、不改系统 | We change none of that: same phone, same apps, same system. |
| 41 | 3:12.0–3:15.4 | 3.4s | Ⅲ 不换设备 | 门槛越低，越可能真的用起来 | The lower the barrier, the more likely it is used. |
| 42 | 3:16.8–3:21.0 | 4.2s | Ⅲ 不说没做到的 | 有一类错最伤人：没办成，却说办成了 | The worst failure is a claim that is not true. |
| 43 | 3:21.4–3:25.8 | 4.4s | Ⅲ 不说没做到的 | 它先问自己三件事 | Before it says done, it asks itself three questions. |
| 44 | 3:26.2–3:31.4 | 5.2s | Ⅲ 不说没做到的 | 文字来源、时间锚点、改变类动作 | Where the words came from, when, and whether anything changed. |
| 45 | 3:31.8–3:36.6 | 4.8s | Ⅲ 不说没做到的 | 过不了闸，就只说「我没法确认」 | If it cannot pass, it only says: I cannot confirm it. |
| 46 | 3:38.6–3:42.6 | 4.0s | Ⅲ 不越界 | 角色决定能看到什么 | The role decides what can be seen. |
| 47 | 3:43.0–3:46.4 | 3.4s | Ⅲ 不越界 | 只有家人能给老人留话 | Only family can leave him a message. |
| 48 | 3:46.8–3:50.4 | 3.6s | Ⅲ 不越界 | 不做远程控制——远程协助正是要防的诈骗手法 | No remote control: screen sharing is the scam we defend against. |
| 49 | 3:51.6–3:55.2 | 3.6s | Ⅲ 收束 | 这些数字来自真机记录，不是估算 | These numbers come from real device runs. |
| 50 | 3:55.6–3:59.6 | 4.0s | Ⅲ 收束 | 银龄智办 · 可信跨应用助老智能体 | Yinling Zhiban — a trustworthy cross-app assistant. |


## 四、音效打点（72 个，供配乐脚本使用）

由 `node render/cues.mjs` 导出到 `cues.json`。每个镜头把自己的声音声明在画它的代码旁边，
所以画面和声音不可能各说各话。

| 全片 # | 时间 | 镜 | 音效 | 参数 |
|---|---|---|---|---|
| 1 | 0:01.0 | 序 · 开机 | `riser` | dur=5 |
| 2 | 0:06.5 | 序 · 开机 | `chime` | midi=76 |
| 3 | 0:12.3 | 序 · 开机 | `whoosh` | dur=1.6 |
| 4 | 0:15.5 | Ⅰ 我们是什么 | `whoosh` | dur=0.9 |
| 5 | 0:16.5 | Ⅰ 我们是什么 | `tick` | — |
| 6 | 0:17.7 | Ⅰ 我们是什么 | `tick` | — |
| 7 | 0:18.9 | Ⅰ 我们是什么 | `tick` | — |
| 8 | 0:21.2 | Ⅰ 我们是什么 | `chime` | midi=74 |
| 9 | 0:31.5 | Ⅰ 听得进去 | `tap` | — |
| 10 | 0:31.7 | Ⅰ 听得进去 | `click` | — |
| 11 | 0:34.2 | Ⅰ 听得进去 | `tick` | — |
| 12 | 0:35.7 | Ⅰ 听得进去 | `tick` | — |
| 13 | 0:37.2 | Ⅰ 听得进去 | `tick` | — |
| 14 | 0:39.6 | Ⅰ 听得进去 | `cut` | — |
| 15 | 0:41.4 | Ⅰ 听得进去 | `chime` | midi=79 |
| 16 | 0:48.6 | Ⅰ 看得见页面 | `whoosh` | dur=1 |
| 17 | 0:51.0 | Ⅰ 看得见页面 | `tick` | — |
| 18 | 0:56.0 | Ⅰ 看得见页面 | `rip` | — |
| 19 | 0:58.4 | Ⅰ 看得见页面 | `glass` | midi=84 |
| 20 | 1:00.8 | Ⅰ 看得见页面 | `ding` | midi=81 |
| 21 | 1:05.6 | Ⅰ 办事循环 | `whoosh` | dur=1 |
| 22 | 1:08.4 | Ⅰ 办事循环 | `tick` | — |
| 23 | 1:10.0 | Ⅰ 办事循环 | `ding` | midi=76 |
| 24 | 1:14.0 | Ⅰ 办事循环 | `loop` | — |
| 25 | 1:17.4 | Ⅰ 办事循环 | `chime` | midi=81 |
| 26 | 1:20.6 | Ⅰ 分寸与交还 | `tick` | — |
| 27 | 1:22.2 | Ⅰ 分寸与交还 | `tick` | — |
| 28 | 1:23.8 | Ⅰ 分寸与交还 | `tick` | — |
| 29 | 1:28.6 | Ⅰ 分寸与交还 | `ding` | midi=78 |
| 30 | 1:31.8 | Ⅰ 分寸与交还 | `soft` | — |
| 31 | 1:34.6 | Ⅱ 十三件事 | `whoosh` | dur=1 |
| 32 | 1:35.6 | Ⅱ 十三件事 | `tick` | — |
| 33 | 1:36.0 | Ⅱ 十三件事 | `tick` | — |
| 34 | 1:36.4 | Ⅱ 十三件事 | `tick` | — |
| 35 | 1:39.0 | Ⅱ 十三件事 | `sparkle` | — |
| 36 | 1:43.0 | Ⅱ 十三件事 | `ding` | midi=74 |
| 37 | 1:51.6 | Ⅱ 树里没有的 | `whoosh` | dur=1 |
| 38 | 1:56.4 | Ⅱ 树里没有的 | `rip` | — |
| 39 | 2:01.4 | Ⅱ 树里没有的 | `glass` | midi=84 |
| 40 | 2:06.2 | Ⅱ 树里没有的 | `ding` | midi=83 |
| 41 | 2:11.6 | Ⅱ 危险的一步 | `tick` | — |
| 42 | 2:14.0 | Ⅱ 危险的一步 | `tick` | — |
| 43 | 2:16.4 | Ⅱ 危险的一步 | `whoosh` | dur=0.8 |
| 44 | 2:21.0 | Ⅱ 危险的一步 | `cut` | — |
| 45 | 2:25.6 | Ⅱ 危险的一步 | `ding` | midi=72 |
| 46 | 2:31.6 | Ⅱ 省的是手脚 | `tap` | — |
| 47 | 2:36.4 | Ⅱ 省的是手脚 | `ding` | midi=79 |
| 48 | 2:41.2 | Ⅱ 省的是手脚 | `chime` | midi=83 |
| 49 | 2:45.2 | Ⅱ 省的是手脚 | `soft` | — |
| 50 | 2:49.5 | Ⅱ 听得准 | `tap` | — |
| 51 | 2:51.2 | Ⅱ 听得准 | `tick` | — |
| 52 | 2:53.8 | Ⅱ 听得准 | `whoosh` | dur=0.8 |
| 53 | 2:57.8 | Ⅱ 听得准 | `chime` | midi=79 |
| 54 | 3:03.5 | Ⅲ 不换设备 | `cut` | — |
| 55 | 3:07.6 | Ⅲ 不换设备 | `whoosh` | dur=0.9 |
| 56 | 3:12.0 | Ⅲ 不换设备 | `chime` | midi=81 |
| 57 | 3:16.6 | Ⅲ 不说没做到的 | `braam` | — |
| 58 | 3:21.4 | Ⅲ 不说没做到的 | `tick` | — |
| 59 | 3:22.6 | Ⅲ 不说没做到的 | `tick` | — |
| 60 | 3:23.8 | Ⅲ 不说没做到的 | `tick` | — |
| 61 | 3:27.0 | Ⅲ 不说没做到的 | `tick` | — |
| 62 | 3:28.2 | Ⅲ 不说没做到的 | `tick` | — |
| 63 | 3:29.4 | Ⅲ 不说没做到的 | `tick` | — |
| 64 | 3:31.8 | Ⅲ 不说没做到的 | `glass` | midi=78 |
| 65 | 3:34.0 | Ⅲ 不说没做到的 | `soft` | — |
| 66 | 3:38.5 | Ⅲ 不越界 | `whoosh` | dur=0.8 |
| 67 | 3:40.0 | Ⅲ 不越界 | `ding` | midi=76 |
| 68 | 3:43.0 | Ⅲ 不越界 | `tick` | — |
| 69 | 3:46.8 | Ⅲ 不越界 | `soft` | — |
| 70 | 3:51.4 | Ⅲ 收束 | `riser` | dur=1.4 |
| 71 | 3:53.2 | Ⅲ 收束 | `chime` | midi=81 |
| 72 | 3:55.8 | Ⅲ 收束 | `soft` | — |

