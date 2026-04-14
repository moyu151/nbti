const fs = require("fs");
const vm = require("vm");

const filePath = "G:/work/code/nbti/assets/js/data.js";
const source = fs.readFileSync(filePath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.NBTI_DATA;

const copy = {
  XOS: { cardName: "脑洞玩家", cardHeadline: "你不是三分钟热度，你是热度太多，三分钟一个", cardTraits: ["想法很多", "开坑很快", "总被新东西吸引"] },
  XOC: { cardName: "稳定输出机", cardHeadline: "你不是靠灵感，你是可以一直做的人", cardTraits: ["节奏稳定", "持续产出", "越做越顺"] },
  XSB: { cardName: "人类观察者", cardHeadline: "你不是不说话，你是在看人类", cardTraits: ["观察细节", "看懂关系", "很少急着表达"] },
  SOC: { cardName: "社牛本牛", cardHeadline: "你不是爱聊天，你是让场子活着的人", cardTraits: ["主动开局", "带动气氛", "不怕冷场"] },
  SEA: { cardName: "情绪雷达", cardHeadline: "你不是敏感，你是提前感觉到了", cardTraits: ["捕捉变化", "读懂情绪", "细节很重"] },
  SBC: { cardName: "高门槛玩家", cardHeadline: "你不是冷，是你不想乱投入", cardTraits: ["有筛选", "不轻易进入", "先判断再靠近"] },
  CEC: { cardName: "靠谱本体", cardHeadline: "你不是普通，你是最后兜底的人", cardTraits: ["稳定执行", "能收住事", "不容易出错"] },
  CBC: { cardName: "秩序控", cardHeadline: "你不是死板，你是世界必须有结构", cardTraits: ["讲逻辑", "要规则", "讨厌混乱"] },
  BSO: { cardName: "控盘选手", cardHeadline: "你不是心机，你是看得太清楚", cardTraits: ["看局", "拆动机", "不信表面"] },
  EAS: { cardName: "情绪流动体", cardHeadline: "你不是情绪多，你是情绪会流动", cardTraits: ["感受强", "波动明显", "很容易表达"] },
  EXS: { cardName: "内耗大师", cardHeadline: "你不是想太多，你是停不下来", cardTraits: ["反复思考", "自我循环", "越想越深"] },
  BXE: { cardName: "高防御体质", cardHeadline: "你不是冷淡，你是习惯先保护自己", cardTraits: ["防御优先", "不轻易暴露", "很难完全放开"] },
  BXC: { cardName: "单机玩家", cardHeadline: "你不是孤独，你是默认单机模式", cardTraits: ["独立运行", "低频社交", "自己就够"] },
  BCS: { cardName: "现实派", cardHeadline: "你不是冷血，你是优先看结果", cardTraits: ["重价值", "看回报", "少浪费"] },
  SACE: { cardName: "万金油", cardHeadline: "你不是普通，你是哪都能用", cardTraits: ["适配强", "很好相处", "环境兼容"] },
  MXT: { cardName: "多版本玩家", cardHeadline: "你不是多变，你是有多个版本", cardTraits: ["灵活切换", "适配环境", "状态很多"] },
  XEB: { cardName: "看不透的人", cardHeadline: "你不是复杂，你是没说完", cardTraits: ["表达克制", "内部复杂", "不容易读懂"] },
  "EAS+": { cardName: "情绪共振体", cardHeadline: "你不是情绪化，你是会放大情绪", cardTraits: ["情绪放大", "容易共鸣", "会被带动"] }
};

for (const t of data.types) {
  const cfg = copy[t.code];
  if (cfg) {
    t.cardName = cfg.cardName;
    t.cardHeadline = cfg.cardHeadline;
    t.cardTraits = cfg.cardTraits;
  }
}

fs.writeFileSync(filePath, `window.NBTI_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");
console.log("applied 18-type share card copy");
