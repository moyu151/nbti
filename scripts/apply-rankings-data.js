const fs = require("fs");
const vm = require("vm");

const filePath = "G:/work/code/nbti/assets/js/data.js";
const source = fs.readFileSync(filePath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.NBTI_DATA;

const total = 128432;
const total7d = 11874;
const allShares = [
  ["XOS", 12.8, "↑ 2"],
  ["EXS", 11.3, "↑ 1"],
  ["SEA", 10.9, "↑ 3"],
  ["BXC", 8.9, "—"],
  ["SACE", 7.8, "↑ 1"],
  ["SOC", 7.2, "↓ 1"],
  ["XOC", 6.9, "—"],
  ["EAS+", 5.6, "NEW"],
  ["XSB", 5.1, "↓ 2"],
  ["MXT", 4.8, "↑ 2"],
  ["CEC", 4.5, "↓ 1"],
  ["BSO", 3.7, "↑ 1"],
  ["SBC", 3.4, "↑ 4"],
  ["EAS", 2.9, "↓ 2"],
  ["XEB", 1.9, "—"],
  ["BCS", 1.6, "—"],
  ["BXE", 0.5, "↓ 1"],
  ["CBC", 0.2, "↓ 1"]
];

const weekShares = [
  ["SEA", 13.2, "↑ 4"],
  ["XOS", 12.6, "↑ 1"],
  ["EXS", 11.7, "↓ 1"],
  ["SBC", 8.4, "↑ 6"],
  ["SOC", 7.9, "↑ 2"],
  ["SACE", 7.3, "—"],
  ["MXT", 6.2, "↑ 3"],
  ["EAS+", 6.0, "NEW"],
  ["XOC", 5.8, "↓ 2"],
  ["BXC", 4.9, "↓ 3"],
  ["XSB", 4.0, "↓ 1"],
  ["EAS", 3.1, "—"],
  ["BSO", 2.7, "↑ 1"],
  ["CEC", 2.3, "↓ 1"],
  ["XEB", 1.7, "—"],
  ["BCS", 1.1, "—"],
  ["BXE", 0.7, "↑ 1"],
  ["CBC", 0.4, "—"]
];

function buildRows(list, baseTotal) {
  const rows = list.map(([code, share, trend], idx) => {
    const type = data.types.find((t) => t.code === code);
    return {
      rank: idx + 1,
      type_name: type ? type.cardName || type.name : code,
      code,
      count: Math.round((baseTotal * share) / 100),
      share,
      trend
    };
  });
  const diff = baseTotal - rows.reduce((s, r) => s + r.count, 0);
  if (rows[0]) rows[0].count += diff;
  return rows;
}

data.rankingsData = {
  summary: {
    total_submissions: total,
    types_on_board: 18,
    types_total: 18,
    last_updated_at: "2026-04-14T20:35:00+08:00",
    today_new: 842
  },
  rankings: {
    all_time: buildRows(allShares, total),
    seven_day: buildRows(weekShares, total7d)
  },
  insights: {
    top_3: ["XOS", "EXS", "SEA"],
    rarest_3: ["CBC", "BXE", "BCS"],
    fastest_rising: "SBC",
    most_confused_pair: ["XOS", "MXT"]
  }
};

fs.writeFileSync(filePath, `window.NBTI_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");
console.log("rankingsData applied");
