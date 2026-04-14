const fs = require("fs");
const vm = require("vm");

const filePath = "G:/work/code/nbti/assets/js/data.js";
const source = fs.readFileSync(filePath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.NBTI_DATA;

const plus = {
  XOS: {
    breakLine: "你不是没执行力，你是被新鲜感不断截胡。",
    realState: [
      "同时想做几件事，脑内并行开很多线程。",
      "A 还没做完，B 的新想法已经开始抢注意力。",
      "明明有计划，但计划经常输给更新鲜的方向。"
    ],
    commentPrompt: "你是这个类型吗？评论区报你的类型👇"
  },
  XOC: {
    breakLine: "你不是慢，你是先把事情做成再说。",
    realState: [
      "会先拆目标，再按节奏推进。",
      "临时变化出现时先重排，而不是推翻重来。",
      "别人靠冲劲，你靠稳定交付。"
    ],
    commentPrompt: "你更像 XOC 还是别的类型？评论区聊聊👇"
  },
  XSB: {
    breakLine: "你不是不合群，你是先看清再参与。",
    realState: [
      "先观察局势和细节，再决定是否出手。",
      "经常能提前看见别人没注意到的风险。",
      "想法很多，但表达常常晚于判断。"
    ],
    commentPrompt: "你也是“先观察后行动”型吗？👇"
  },
  SOC: {
    breakLine: "你不是爱表现，你是天然会点亮场子。",
    realState: [
      "冷场时会本能地接话和破冰。",
      "互动越顺，能量越高。",
      "社交多的时候很亮，结束后容易透支。"
    ],
    commentPrompt: "社牛本牛集合，评论区报到👇"
  },
  SEA: {
    breakLine: "你不是想太多，你是情绪雷达过于灵敏。",
    realState: [
      "别人语气一变就能捕捉到信号。",
      "经常先感受关系温度，再决定怎么说。",
      "容易在不知不觉中承担他人的情绪负荷。"
    ],
    commentPrompt: "你会不会也经常“先感受到再反应”？👇"
  },
  SBC: {
    breakLine: "你不是难接近，你是把信任门槛设得很清楚。",
    realState: [
      "能互动，但不会快速交底。",
      "关系投入前会先评估稳定性。",
      "边界清楚时才会持续靠近。"
    ],
    commentPrompt: "你是慢热高门槛型吗？评论区说说👇"
  },
  CEC: {
    breakLine: "你不是控制欲强，你是对结果太负责。",
    realState: [
      "接到任务会自动进入推进模式。",
      "答应的事会默认自己兜到底。",
      "常常外表稳定，内在负荷很高。"
    ],
    commentPrompt: "靠谱本体在吗？报个类型👇"
  },
  CBC: {
    breakLine: "你不是古板，你是在替系统省混乱成本。",
    realState: [
      "先定规则，再开始执行。",
      "对边界和标准异常敏感。",
      "变化过快时会先收紧控制。"
    ],
    commentPrompt: "你也是秩序控吗？评论区见👇"
  },
  BSO: {
    breakLine: "你不是算计，你是习惯先看博弈结构。",
    realState: [
      "做决定前会先看变量和筹码。",
      "不轻易表态，但出手通常有效。",
      "关键时刻更重时机而不是情绪。"
    ],
    commentPrompt: "你做决定也会先看牌面吗？👇"
  },
  EAS: {
    breakLine: "你不是不稳定，你是情绪和环境同步太快。",
    realState: [
      "状态随场域变化明显。",
      "有感觉时输出很猛，没感觉时很难推。",
      "容易出现“爆发-回撤”的节奏。"
    ],
    commentPrompt: "你也会有这种波形状态吗？👇"
  },
  EXS: {
    breakLine: "你不是矫情，你是脑内循环没有停止键。",
    realState: [
      "小事也会反复复盘和推演。",
      "常在“想透再做”和“先做再调”间拉扯。",
      "知道自己在内耗，但很难立刻停下。"
    ],
    commentPrompt: "内耗大师在吗？评论区抱团👇"
  },
  BXE: {
    breakLine: "你不是冷淡，你是先保护自己再开放。",
    realState: [
      "会本能先确认边界和安全。",
      "遇到压力时优先收缩表达。",
      "多数问题倾向先自己扛。"
    ],
    commentPrompt: "你也属于高防御体质吗？👇"
  },
  BXC: {
    breakLine: "你不是社恐，你是单机模式效率更高。",
    realState: [
      "独处时更容易进入深度专注。",
      "能长时间单线程推进任务。",
      "协作里最大问题是同步偏少。"
    ],
    commentPrompt: "单机玩家来集合，报类型👇"
  },
  BCS: {
    breakLine: "你不是保守，你是在给未来做风险兜底。",
    realState: [
      "下决定前会先算成本和回报。",
      "更偏好可持续而非短期刺激。",
      "高压下会明显转向保守策略。"
    ],
    commentPrompt: "现实派会这样吗？评论区聊👇"
  },
  SACE: {
    breakLine: "你不是没个性，你是高兼容协作中枢。",
    realState: [
      "能快速切换沟通方式对齐不同人。",
      "经常补位，保证团队不断线。",
      "容易在顾全大局时忽略自己负荷。"
    ],
    commentPrompt: "万金油选手，评论区报到👇"
  },
  MXT: {
    breakLine: "你不是人设多，你是场景切换能力太强。",
    realState: [
      "不同场景会自动调用不同版本。",
      "适配力强，但频繁切换会疲劳。",
      "偶尔会出现“我到底哪个版本”疑问。"
    ],
    commentPrompt: "你也是多版本玩家吗？👇"
  },
  XEB: {
    breakLine: "你不是难懂，你是把大部分过程都放在后台。",
    realState: [
      "输入很多，输出克制。",
      "通常先在内部跑完逻辑再开口。",
      "深度很高，但可见度偏低。"
    ],
    commentPrompt: "看不透的人，评论区报类型👇"
  },
  "EAS+": {
    breakLine: "你不是戏多，你是情绪共振强度太高。",
    realState: [
      "能快速感到场域情绪并被放大。",
      "正向时感染力极强，负向时消耗也快。",
      "需要主动抽离才能避免长期过载。"
    ],
    commentPrompt: "情绪共振体在吗？评论区集合👇"
  }
};

for (const t of data.types) {
  const x = plus[t.code];
  if (x) Object.assign(t, x);
  if (!t.breakLine) t.breakLine = t.oneLiner;
  if (!t.realState || !Array.isArray(t.realState) || t.realState.length < 3) {
    t.realState = [
      "你会在关键场景里表现出明显的个人节奏。",
      "你并不是没能力，而是有自己独特的运行方式。",
      "当环境不匹配时，你的状态会明显波动。"
    ];
  }
  if (!t.commentPrompt) t.commentPrompt = "你是这个类型吗？评论区报类型👇";
}

fs.writeFileSync(filePath, `window.NBTI_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");
console.log("enhanced result-page fields for all types");
