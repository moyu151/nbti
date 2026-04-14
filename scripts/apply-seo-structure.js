const fs = require("fs");
const vm = require("vm");

const filePath = "G:/work/code/nbti/assets/js/data.js";
const source = fs.readFileSync(filePath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.NBTI_DATA;

const seoMap = {
  XOS: { en: "Explorer", key: "why do I start things but don't finish" },
  XOC: { en: "Consistent Builder", key: "how to stay consistent with goals" },
  XSB: { en: "Human Observer", key: "why do I overanalyze people" },
  SOC: { en: "Social Catalyst", key: "am I an extrovert or just adaptive" },
  SEA: { en: "Emotional Radar", key: "why am I so sensitive to others" },
  SBC: { en: "High-Threshold Connector", key: "why is it hard for me to trust people" },
  CEC: { en: "Reliable Core", key: "why do I always take responsibility" },
  CBC: { en: "Order Keeper", key: "why do I need structure to feel safe" },
  BSO: { en: "Control Strategist", key: "why do I always calculate outcomes" },
  EAS: { en: "Emotional Drifter", key: "why does my mood change so fast" },
  EXS: { en: "Overthinker", key: "why do I overthink everything" },
  BXE: { en: "Defensive Type", key: "why do I protect myself first" },
  BXC: { en: "Solo Operator", key: "why do I prefer being alone" },
  BCS: { en: "Realist", key: "why do I always think about practical outcomes" },
  SACE: { en: "Adaptive Integrator", key: "what type of person adapts everywhere" },
  MXT: { en: "Multi-Version Type", key: "why do I feel like different versions of myself" },
  XEB: { en: "Unreadable Type", key: "why do people say I am hard to read" },
  "EAS+": { en: "Emotional Resonator", key: "why do I absorb emotions so easily" }
};

for (const t of data.types) {
  const cfg = seoMap[t.code] || { en: t.name, key: "personality type test" };
  t.seo = {
    title_en: `${cfg.en} Personality Type (${t.code}) - NBTI`,
    meta_description_en: `${cfg.en} (${t.code}) profile. ${cfg.key}. Take the NBTI personality test to understand how you actually function.`,
    intro_en: `If ${cfg.key.replace(/^why do i\s*/i, "").replace(/^am i\s*/i, "").replace(/^what type of person\s*/i, "").replace(/^how to\s*/i, "").replace(/^why is it\s*/i, "").replace(/^why do people say\s*/i, "").replace(/^why does\s*/i, "").replace(/^why am i\s*/i, "").replace(/^why do i\s*/i, "").trim()}, you might match the ${cfg.en} type.`,
    keywords: [
      "personality test",
      "what type of person am I",
      cfg.key,
      `${cfg.en.toLowerCase()} personality`,
      `${t.code.toLowerCase()} personality`
    ],
    faq: [
      {
        q: `Why does ${cfg.en.toLowerCase()} type feel this way?`,
        a: "Because behavior patterns are often strategy-based, not identity-fixed. NBTI maps the strategy currently used most often."
      },
      {
        q: `Can this ${cfg.en.toLowerCase()} result change over time?`,
        a: "Yes. Context, stress, relationships, and goals can shift your behavior pattern and therefore your type output."
      },
      {
        q: `What should ${cfg.en.toLowerCase()} type improve first?`,
        a: "Start with one friction point: execution rhythm, emotional boundary, or communication consistency."
      }
    ]
  };
}

fs.writeFileSync(filePath, `window.NBTI_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");
console.log("seo structure applied to all 18 types");
