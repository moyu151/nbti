const fs = require("fs");
const vm = require("vm");

const filePath = "G:/work/code/nbti/assets/js/data.js";
const source = fs.readFileSync(filePath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.NBTI_DATA;

const allTime = [
  [1, "脑洞玩家", "XOS", 16422, 12.8, "↑2"],
  [2, "内耗大师", "EXS", 14531, 11.3, "—"],
  [3, "情绪雷达", "SEA", 12321, 9.6, "↑1"],
  [4, "单机玩家", "BXC", 11204, 8.7, "↓1"],
  [5, "社牛本牛", "SOC", 9842, 7.7, "↑3"],
  [6, "看不透的人", "XEB", 8965, 7.0, "—"],
  [7, "情绪流动体", "EAS", 7980, 6.2, "↑2"],
  [8, "多版本玩家", "MXT", 7102, 5.5, "↓2"],
  [9, "万金油", "SACE", 6844, 5.3, "—"],
  [10, "人类观察者", "XSB", 6201, 4.8, "↑1"],
  [11, "高门槛玩家", "SBC", 5933, 4.6, "↑4"],
  [12, "高防御体质", "BXE", 5420, 4.2, "↓3"],
  [13, "靠谱本体", "CEC", 4988, 3.9, "—"],
  [14, "秩序控", "CBC", 4102, 3.2, "↓1"],
  [15, "控盘选手", "BSO", 3876, 3.0, "↑2"],
  [16, "现实派", "BCS", 3211, 2.5, "—"],
  [17, "情绪共振体", "EAS+", 2876, 2.2, "NEW"],
  [18, "稳定输出机", "XOC", 2512, 2.0, "↓2"]
].map(([rank, type_name, code, count, share, trend]) => ({ rank, type_name, code, count, share, trend }));

const sevenDay = [
  [1, "高门槛玩家", "SBC", 1188, 10.0, "↑4"],
  [2, "脑洞玩家", "XOS", 1402, 11.8, "↑1"],
  [3, "内耗大师", "EXS", 1297, 10.9, "—"],
  [4, "情绪雷达", "SEA", 1128, 9.5, "↑1"],
  [5, "社牛本牛", "SOC", 936, 7.9, "↑2"],
  [6, "多版本玩家", "MXT", 832, 7.0, "↑1"],
  [7, "单机玩家", "BXC", 796, 6.7, "↓2"],
  [8, "万金油", "SACE", 772, 6.5, "—"],
  [9, "看不透的人", "XEB", 689, 5.8, "—"],
  [10, "情绪流动体", "EAS", 642, 5.4, "↑1"],
  [11, "人类观察者", "XSB", 594, 5.0, "—"],
  [12, "高防御体质", "BXE", 523, 4.4, "↓1"],
  [13, "靠谱本体", "CEC", 475, 4.0, "—"],
  [14, "秩序控", "CBC", 404, 3.4, "↓1"],
  [15, "控盘选手", "BSO", 380, 3.2, "↑2"],
  [16, "现实派", "BCS", 297, 2.5, "—"],
  [17, "情绪共振体", "EAS+", 249, 2.1, "NEW"],
  [18, "稳定输出机", "XOC", 238, 2.0, "↓1"]
].map(([rank, type_name, code, count, share, trend]) => ({ rank, type_name, code, count, share, trend }));

const today = [
  [1, "高门槛玩家", "SBC", 142, 12.1, "↑4"],
  [2, "脑洞玩家", "XOS", 139, 11.9, "↑1"],
  [3, "情绪雷达", "SEA", 121, 10.3, "↑2"],
  [4, "内耗大师", "EXS", 116, 9.9, "—"],
  [5, "社牛本牛", "SOC", 96, 8.2, "↑3"],
  [6, "多版本玩家", "MXT", 88, 7.5, "↑1"],
  [7, "万金油", "SACE", 79, 6.7, "—"],
  [8, "单机玩家", "BXC", 74, 6.3, "↓2"],
  [9, "看不透的人", "XEB", 68, 5.8, "—"],
  [10, "情绪流动体", "EAS", 61, 5.2, "↑1"],
  [11, "人类观察者", "XSB", 56, 4.8, "—"],
  [12, "高防御体质", "BXE", 52, 4.4, "↓1"],
  [13, "靠谱本体", "CEC", 46, 3.9, "—"],
  [14, "秩序控", "CBC", 38, 3.2, "↓1"],
  [15, "控盘选手", "BSO", 35, 3.0, "↑2"],
  [16, "现实派", "BCS", 31, 2.6, "—"],
  [17, "情绪共振体", "EAS+", 27, 2.3, "NEW"],
  [18, "稳定输出机", "XOC", 24, 2.0, "↓1"]
].map(([rank, type_name, code, count, share, trend]) => ({ rank, type_name, code, count, share, trend }));

data.rankingsData = {
  summary: {
    total_submissions: 128432,
    types_on_board: 18,
    types_total: 18,
    last_updated_label: "3分钟前",
    today_new: 842
  },
  rankings: {
    all_time: allTime,
    seven_day: sevenDay,
    today
  },
  insights: {
    top_3: ["XOS", "EXS", "SEA"],
    rarest_3: ["XOC", "EAS+", "BCS"],
    fastest_rising: "SBC",
    most_confused_pairs: [
      ["XOS", "MXT"],
      ["EXS", "SEA"]
    ]
  }
};

fs.writeFileSync(filePath, `window.NBTI_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");
console.log("applied final rankings page data");
