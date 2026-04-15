(function () {
  const STORAGE_KEY = "nbti_test_answers_v2";
  const ANSWER_MAP = { A: 4, B: 3, C: 2, D: 1 };

  function byCode(code) {
    const data = window.NBTI_DATA || {};
    const list = Array.isArray(data.types) ? data.types : [];
    return list.find((t) => t.code === code);
  }

  function bySlug(slug) {
    const data = window.NBTI_DATA || {};
    const list = Array.isArray(data.types) ? data.types : [];
    return list.find((t) => t.slug === slug);
  }

  function isEnSite() {
    const p = window.location.pathname || "/";
    return p === "/en" || p.startsWith("/en/");
  }

  function t(zh, en) {
    return isEnSite() ? en : zh;
  }

  function route(path) {
    return `${isEnSite() ? "/en" : ""}${path}`;
  }

  function hasCJK(text) {
    return /[\u4e00-\u9fff]/.test(String(text || ""));
  }

  const EN_TRAITS_BY_CODE = {
    XOS: ["Idea-rich", "Fast starter", "Novelty-driven"],
    XOC: ["Steady rhythm", "Consistent output", "Compounds over time"],
    XSB: ["Pattern observer", "Reads dynamics", "Speaks after scanning"],
    SOC: ["Starts interactions", "Energizes groups", "Not afraid of silence"],
    SEA: ["Detects shifts", "Emotion-aware", "Detail-sensitive"],
    SBC: ["Selective entry", "Clear thresholds", "Assesses before investing"],
    CEC: ["Reliable execution", "Can close loops", "Low error style"],
    CBC: ["Structure-first", "Rule-oriented", "Chaos-averse"],
    BSO: ["Reads the board", "Decodes motives", "Beyond surface"],
    EAS: ["Strong feelings", "Visible swings", "Expressive flow"],
    EXS: ["Loops in thought", "Self-recursive", "Gets deeper when stressed"],
    BXE: ["Defense-first", "Low exposure", "Hard to fully open"],
    BXC: ["Independent mode", "Low-frequency social", "Self-sufficient"],
    BCS: ["Value-oriented", "Return-focused", "Avoids waste"],
    SACE: ["Highly adaptive", "Easy to work with", "Context-compatible"],
    MXT: ["Multi-mode", "Context switcher", "Many active versions"],
    XEB: ["Reserved expression", "Complex inside", "Hard to decode"],
    "EAS+": ["Emotion amplifier", "Easy resonance", "Strongly affected"]
  };

  function displayTraits(type) {
    if (isEnSite()) {
      const preset = EN_TRAITS_BY_CODE[type.code];
      if (preset) return preset.slice(0, 3);
    }
    if (Array.isArray(type.cardTraits) && type.cardTraits.length) return type.cardTraits.slice(0, 3);
    if (Array.isArray(type.traits) && type.traits.length) return type.traits.slice(0, 3);
    return isEnSite() ? ["Trait 1", "Trait 2", "Trait 3"] : ["特征1", "特征2", "特征3"];
  }

  function codePath(code) {
    return route(`/result/${encodeURIComponent(code)}/`);
  }

  function scoreAnswer(answerKey, reverse) {
    const raw = ANSWER_MAP[answerKey] || 1;
    const normalized = (raw - 1) / 3;
    return reverse ? 1 - normalized : normalized;
  }

  function computeResult(answersById) {
    const dims = {};
    window.NBTI_DATA.dimensions.forEach((d) => {
      dims[d] = [];
    });

    window.NBTI_DATA.questions.forEach((q) => {
      const ans = answersById[q.id];
      if (!ans) {
        return;
      }
      dims[q.dim].push(scoreAnswer(ans, q.reverse));
    });

    const profile = {};
    window.NBTI_DATA.dimensions.forEach((d) => {
      const arr = dims[d];
      profile[d] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    });

    const scored = window.NBTI_DATA.types
      .map((type) => {
        let distance = 0;
        window.NBTI_DATA.dimensions.forEach((d) => {
          const w = window.NBTI_DATA.weights[d] || 1;
          distance += Math.abs((type.vector[d] || 0) - profile[d]) * w;
        });
        return { code: type.code, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const primary = scored[0];
    const secondary = scored[1];
    return {
      profile,
      primaryCode: primary.code,
      secondaryCode: secondary.distance - primary.distance < 0.12 ? secondary.code : null
    };
  }

  function parseTypeResultPayload() {
    const raw = localStorage.getItem("nbti_last_result_v2");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveResult(payload) {
    localStorage.setItem("nbti_last_result_v2", JSON.stringify(payload));
  }

  function trackEvent(eventName, meta) {
    try {
      const payload = {
        event: eventName,
        meta: meta || {},
        path: window.location.pathname,
        ts: new Date().toISOString()
      };
      window.NBTI_EVENTS = window.NBTI_EVENTS || [];
      window.NBTI_EVENTS.push(payload);

      const key = "nbti_event_log_v1";
      const old = JSON.parse(localStorage.getItem(key) || "[]");
      old.push(payload);
      const trimmed = old.slice(-500);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {
      // swallow tracking errors
    }
  }

  function setupTrackingDelegation() {
    document.addEventListener("click", (e) => {
      const node = e.target.closest("[data-track]");
      if (!node) return;
      const name = node.getAttribute("data-track") || "click";
      const meta = node.getAttribute("data-track-meta") || "";
      trackEvent(name, { meta });
    });
  }

  function renderHomePage() {
    const data = window.NBTI_DATA || {};
    const types = Array.isArray(data.types) ? data.types : [];

    const marqueeRoot = document.getElementById("home-type-marquee");
    if (marqueeRoot && types.length) {
      const cards = types
        .map((t) => {
          const title = `${t.cardName || t.name} ${t.code}`;
          const quote = t.cardHeadline || t.oneLiner || "";
          return `
            <a class="marquee-card" href="${route(`/types/${t.slug}/`)}" data-track="home_type_marquee_click" data-track-meta="${t.code}">
              <picture>
                <source srcset="/assets/types/${t.slug}.webp" type="image/webp" />
                <img src="/assets/types/${t.slug}.png" alt="${title}" loading="lazy" />
              </picture>
              <p class="marquee-title">${title}</p>
              <p class="marquee-quote">「${escapeHtml(quote)}」</p>
            </a>
          `;
        })
        .join("");
      marqueeRoot.innerHTML = `<div class="marquee-track">${cards}${cards}</div>`;
    }

    const insightRoot = document.getElementById("home-insight-random");
    if (insightRoot) {
      const pool = isEnSite()
        ? [
            {
              q: "Why do I overthink everything?",
              d: "The event is over, but your mind keeps replaying details in loops...",
              href: route("/insights/why-do-i-overthink-everything/"),
              meta: "overthink"
            },
            {
              q: "Why do I start fast but fail to finish?",
              d: "You launch with energy, then lose traction once it becomes repetitive...",
              href: route("/insights/why-do-i-start-things-but-dont-finish/"),
              meta: "start_finish"
            },
            {
              q: "Why do I feel like different versions of myself?",
              d: "You shift by context. It's not fake, it's adaptive patterning...",
              href: route("/insights/why-do-i-feel-like-different-versions-of-myself/"),
              meta: "multi_version"
            },
            {
              q: "Why can I chat well but rarely initiate?",
              d: "You are not bad at socializing. Initiation simply costs more energy...",
              href: route("/types/xsb/"),
              meta: "xsb"
            },
            {
              q: "Why do I always think there is a better way?",
              d: "While doing A, your attention starts evaluating B and C in parallel...",
              href: route("/types/xos/"),
              meta: "xos"
            },
            {
              q: "Why do I struggle with boundaries in relationships?",
              d: "You want to decline, but also want to avoid friction, then regret it later...",
              href: route("/types/sbc/"),
              meta: "sbc"
            }
          ]
        : [
        {
          q: "为什么我总在想太多？",
          d: "明明事情已经过去了，脑子却还在复盘细节，一层一层停不下来……",
          href: route("/insights/why-do-i-overthink-everything/"),
          meta: "overthink"
        },
        {
          q: "为什么我总是开头猛，后面断？",
          d: "刚开始的时候冲得很快，但一进入重复阶段就掉速，最后卡在半路……",
          href: route("/insights/why-do-i-start-things-but-dont-finish/"),
          meta: "start_finish"
        },
        {
          q: "为什么我像有好几个版本？",
          d: "在不同场景里像不同的人，这不是装，而是你在自动适配环境……",
          href: route("/insights/why-do-i-feel-like-different-versions-of-myself/"),
          meta: "multi_version"
        },
        {
          q: "为什么我能聊，但不想主动聊？",
          d: "不是不会社交，而是主动启动社交这件事对你来说成本很高……",
          href: route("/types/xsb/"),
          meta: "xsb"
        },
        {
          q: "为什么我总觉得还有更好的做法？",
          d: "手上在做 A，脑子已经在评估 B 和 C，注意力一直被新可能拉走……",
          href: route("/types/xos/"),
          meta: "xos"
        },
        {
          q: "为什么我总在关系里拉扯边界？",
          d: "想拒绝又怕关系变僵，最后先答应，事后再后悔……",
          href: route("/types/sbc/"),
          meta: "sbc"
        }
      ];
      const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      insightRoot.innerHTML = pick
        .map(
          (x) => `
          <a class="card" href="${x.href}" data-track="home_insights_click" data-track-meta="${x.meta}">
            <p><strong>${x.q}</strong></p>
            <p class="muted">${x.d}</p>
          </a>
        `
        )
        .join("");
    }

    const danmuRoot = document.getElementById("home-danmu-wall");
    if (danmuRoot && !danmuRoot.querySelector(".danmu-row")) {
      const comments = isEnSite()
        ? [
            "This is exactly me???",
            "I feel seen.",
            "Regret clicking this.",
            "Too real to ignore.",
            "Every question hit.",
            "How is this so accurate?",
            "It even caught my friction points.",
            "My friend got called out too.",
            "This explains my daily pattern.",
            "Now I want to share this.",
            "Even my relationship pattern was called out.",
            "This knows me better than me.",
            "I am not lazy, I really get stuck.",
            "I am definitely a starter chaos person.",
            "I thought I was the only one.",
            "Wild but true.",
            "Took it immediately.",
            "Stress pattern is spot on.",
            "Sent this to my friends.",
            "This is my daily life."
          ]
        : [
        "这不就是我？？？",
        "我被看透了",
        "后悔点进来",
        "别做，太真实了",
        "每一题都在戳我",
        "这个描述太准了",
        "救命，连卡点都说中了",
        "我朋友也是这个类型",
        "原来我一直是这样运转",
        "看完想立刻转发",
        "怎么连我关系模式都知道",
        "这比我自己还懂我",
        "我不是懒，是真的会卡住",
        "我就是那个开坑狂魔",
        "我以为只有我这样",
        "太离谱了但就是事实",
        "看完直接去测了",
        "居然连压力状态都一致",
        "我朋友看完也破防了",
        "这就是我的日常"
      ];
      const bubbles = comments.map((c) => `<span class="danmu-bubble">“${c}”</span>`).join("");
      danmuRoot.innerHTML = `
        <div class="danmu-row">${bubbles}${bubbles}</div>
        <div class="danmu-row reverse">${bubbles}${bubbles}</div>
      `;
    }
  }

  function renderTypeCard(type) {
    return `
      <article class="type-item">
        <picture>
          <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
          <img class="type-cover" src="/assets/types/${type.slug}.png" alt="${type.name} ${type.code} ${t("插图", "illustration")}" loading="lazy" />
        </picture>
        <div class="tag">${type.code}</div>
        <h3>${type.name}</h3>
        <p>${type.oneLiner}</p>
        <p class="muted">${displayTraits(type).join(" · ")}</p>
        <a class="btn ghost" href="${route(`/types/${type.slug}/`)}">${t("查看类型", "View Type")}</a>
      </article>
    `;
  }

  function withBreaks(text) {
    return String(text || "").replace(/\n/g, "<br /><br />");
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const CARD_EMOJI_MAP = {
    XOS: ["💡", "🌀", "⚡"],
    MXT: ["🧬", "🔀", "🎭"],
    XEB: ["🕶️", "🌫️", "🧩"],
    XOC: ["⚙️", "📦", "📈"],
    CEC: ["🧱", "🛠️", "✔️"],
    CBC: ["📏", "📎", "🧾"],
    SOC: ["📢", "🔥", "🎤"],
    SACE: ["🧴", "🪄", "🧩"],
    XSB: ["👁️", "📖", "🧠"],
    SEA: ["📡", "💭", "⚠️"],
    EAS: ["🌊", "🎢", "💫"],
    "EAS+": ["🔊", "💓", "🌪️"],
    SBC: ["🚧", "🔒", "🧠"],
    BSO: ["♟️", "🃏", "👁️"],
    BXE: ["🛡️", "🧊", "🚫"],
    BXC: ["🎧", "🌙", "🛸"],
    BCS: ["📊", "💰", "📉"],
    EXS: ["🫠", "🔁", "🌧️"]
  };

  const CARD_BG = "#F7F7F7";

  function cardPayload(type) {
    return {
      type_name: type.cardName || type.name,
      code: type.code,
      headline: type.cardHeadline || type.oneLiner || "",
      traits: displayTraits(type),
      emoji: CARD_EMOJI_MAP[type.code] || ["✨", "🧩", "⚡"],
      danmu: Array.isArray(type.danmu) ? type.danmu.slice(0, 4) : []
    };
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    const chars = String(text || "").replace(/\s+/g, "");
    const lines = [];
    let line = "";
    for (let i = 0; i < chars.length; i += 1) {
      const next = line + chars[i];
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
      } else {
        if (line) lines.push(line);
        line = chars[i];
      }
      if (lines.length >= maxLines) break;
    }
    if (lines.length < maxLines && line) lines.push(line);
    return lines.slice(0, maxLines);
  }

  function drawTemplateResult(ctx, payload, w, h) {
    const pad = 96;
    const contentW = w - pad * 2;
    ctx.fillStyle = CARD_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#111111";
    ctx.textBaseline = "top";

    ctx.fillStyle = "#fdfcf8";
    ctx.fillRect(56, 56, w - 112, h - 112);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 3;
    ctx.strokeRect(56, 56, w - 112, h - 112);
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(90, 182);
    ctx.lineTo(w - 90, 182);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(90, h - 280);
    ctx.lineTo(w - 90, h - 280);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#111111";
    ctx.font = "700 40px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(`${isEnSite() ? "NBTI Personality Type" : "NBTI 人格类型"} #${payload.code}`, pad, 104);

    ctx.font = "800 86px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(payload.type_name, pad, 218);

    ctx.font = "700 48px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    const headline = wrapLines(ctx, payload.headline, contentW - 20, 2);
    let y = 336;
    headline.forEach((line, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === headline.length - 1;
      const text = `${isFirst ? "「" : ""}${line}${isLast ? "」" : ""}`;
      ctx.fillText(text, pad, y);
      y += 64;
    });

    ctx.font = "600 34px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    let ty = y + 70;
    payload.traits.slice(0, 3).forEach((t, i) => {
      const emo = payload.emoji[i] || "✨";
      const tagText = `${emo} ${t}`;
      const tw = ctx.measureText(tagText).width;
      ctx.strokeStyle = "#c9c8c3";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, ty - 6, tw + 28, 52);
      ctx.fillStyle = "#111111";
      ctx.fillText(tagText, pad + 14, ty + 2);
      ty += 66;
    });

    const danmuSeed = payload.danmu && payload.danmu.length ? payload.danmu : isEnSite() ? ["This is me???", "Too real", "I feel seen", "Regret clicking"] : ["这不就是我？？？", "太真实了", "我被看透了", "后悔点进来"];
    const danmuText = `${danmuSeed.join("  ·  ")}`;
    ctx.font = "500 30px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#333333";
    const danmuLines = wrapLines(ctx, danmuText, contentW - 8, 2);
    danmuLines.forEach((line, idx) => {
      let finalLine = line;
      if (idx === danmuLines.length - 1 && danmuText.length > danmuLines.join("").length) {
        finalLine = `${line}…`;
      }
      ctx.fillText(finalLine, pad, ty + 24 + idx * 42);
    });

    const qrSize = 176;
    const qrX = w - pad - qrSize;
    const qrY = h - 236;
    ctx.font = "500 24px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(isEnSite() ? "Scan to visit" : "扫码访问", qrX + 34, qrY + qrSize + 10);

    ctx.font = "600 30px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#111111";
    ctx.fillText("https://nbti.dofun.fun/", pad, h - 214);
    ctx.font = "600 34px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(isEnSite() ? "— Take the test and find your type" : "—— 测测你是哪种人", pad, h - 162);
  }

  function drawTemplatePatch(ctx, payload, w, h) {
    const pad = 96;
    const contentW = w - pad * 2;
    ctx.fillStyle = CARD_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#111111";
    ctx.textBaseline = "top";

    ctx.font = "800 76px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(`${payload.type_name} ${payload.code}`, pad, 120);

    ctx.font = "700 54px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    const l1 = wrapLines(ctx, isEnSite() ? "Your biggest friction is not starting" : "你最容易卡住的不是开始", contentW, 1);
    const l2 = wrapLines(ctx, isEnSite() ? "it is sustaining" : "是持续", contentW, 1);
    const l3 = wrapLines(ctx, isEnSite() ? "You are not incapable" : "你不是做不到", contentW, 1);
    const l4 = wrapLines(ctx, isEnSite() ? "you get interrupted by new options" : "是会被新的东西带走", contentW, 1);
    ctx.fillText(l1[0], pad, 360);
    ctx.fillText(l2[0], pad, 440);
    ctx.fillText(l3[0], pad, 600);
    ctx.fillText(l4[0], pad, 680);

    ctx.font = "600 40px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText("—— NBTI", pad, h - 150);
  }

  function drawTemplateDanmu(ctx, payload, lines, w, h) {
    const pad = 96;
    ctx.fillStyle = CARD_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#111111";
    ctx.textBaseline = "top";

    ctx.font = "800 72px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(isEnSite() ? `${payload.type_name} common lines:` : `${payload.type_name}常见发言：`, pad, 130);

    ctx.font = "600 48px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    let y = 320;
    lines.slice(0, 3).forEach((line) => {
      const text = String(line || "").replace(/^["“]|["”]$/g, "");
      ctx.fillText(`“${text}”`, pad, y);
      y += 120;
    });

    ctx.font = "600 40px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText("—— NBTI", pad, h - 150);
  }

  async function drawShareCard(type, template) {
    const width = 1080;
    const height = 1440;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const payload = cardPayload(type);
    async function drawQrToCard() {
      const qrSize = 176;
      const qrX = width - 96 - qrSize;
      const qrY = height - 236;
      const loadImg = (src) =>
        new Promise((resolve, reject) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = src;
        });
      try {
        const img = await loadImg("/assets/icons/site-qr.png");
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      } catch (e) {
        try {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent("https://nbti.dofun.fun/")}`;
          const res = await fetch(qrUrl, { cache: "no-store" });
          const blob = await res.blob();
          const tmp = URL.createObjectURL(blob);
          const img = await loadImg(tmp);
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          URL.revokeObjectURL(tmp);
        } catch (e2) {
          // keep fallback frame
        }
      }
    }
    if (template === "patch") {
      drawTemplatePatch(ctx, payload, width, height);
    } else if (template === "danmu") {
      drawTemplateDanmu(ctx, payload, type.danmu || [], width, height);
    } else {
      drawTemplateResult(ctx, payload, width, height);
      await drawQrToCard();
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  function setupTestPage() {
    const holder = document.getElementById("test-app");
    if (!holder) return;

    const data = window.NBTI_DATA || {};
    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (!questions.length) {
      holder.innerHTML = `<article class="card">${t("测试数据未加载，请刷新页面。", "Test data not loaded. Please refresh.")}</article>`;
      return;
    }
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    let index = 0;
    let isNavigating = false;
    const answers = { ...saved };

    function goToNextQuestionOrResult(currentQuestion) {
      if (isNavigating) return;
      if (!answers[currentQuestion.id]) {
        alert(t("先选一个最像你的答案。", "Please select the option that fits you best."));
        return;
      }
      isNavigating = true;
      if (index < questions.length - 1) {
        index += 1;
        render();
        isNavigating = false;
        return;
      }
      const result = computeResult(answers);
      saveResult(result);
      window.location.href = codePath(result.primaryCode);
    }

    function answeredCount() {
      return Object.keys(answers).length;
    }

    function render() {
      const q = questions[index];
      const answered = answers[q.id];
      const percent = Math.round(((index + 1) / questions.length) * 100);
      const done = answeredCount();

      holder.innerHTML = `
        <div class="progress-wrap"><div class="progress" style="width:${percent}%"></div></div>
        <p class="muted">${t(`第 ${index + 1} / ${questions.length} 题 · 已完成 ${done} 题`, `Question ${index + 1} / ${questions.length} · Answered ${done}`)}</p>
        <section class="question-box">
          <div class="tag">${q.dim} ${t("维度", "Dimension")}</div>
          <h2>${q.text}</h2>
          <div class="answers" id="answers"></div>
        </section>
        <div class="cta-row">
          <button class="btn secondary" id="prevBtn" ${index === 0 ? "disabled" : ""}>${t("上一题", "Previous")}</button>
          <button class="btn ghost" id="nextBtn">${index === questions.length - 1 ? t("查看结果", "View Result") : t("下一题", "Next")}</button>
        </div>
      `;

      const answersBox = document.getElementById("answers");
      const options = q.options
        ? [
            { key: "A", text: q.options.A || t("完全是我", "Exactly me") },
            { key: "B", text: q.options.B || t("有点像", "Somewhat me") },
            { key: "C", text: q.options.C || t("不太像", "Not really me") },
            { key: "D", text: q.options.D || t("完全不是", "Not me at all") }
          ]
        : window.NBTI_DATA.answerOptions;

      options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = `option ${answered === opt.key ? "active" : ""}`;
        btn.textContent = `${opt.key}. ${opt.text}`;
        btn.addEventListener("click", () => {
          const currentIndex = index;
          answers[q.id] = opt.key;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
          render();
          window.setTimeout(() => {
            if (index !== currentIndex) return;
            goToNextQuestionOrResult(q);
          }, 120);
        });
        answersBox.appendChild(btn);
      });

      const prevBtn = document.getElementById("prevBtn");
      prevBtn.addEventListener("click", () => {
        if (index > 0) {
          index -= 1;
          render();
        }
      });

      const nextBtn = document.getElementById("nextBtn");
      nextBtn.addEventListener("click", () => {
        goToNextQuestionOrResult(q);
      });
    }

    render();
  }

  function renderResultPage() {
    const root = document.getElementById("result-app");
    if (!root) return;
    const code = root.getAttribute("data-code");
    const type = byCode(code);
    const payload = parseTypeResultPayload();
    const secondary = payload && payload.secondaryCode ? byCode(payload.secondaryCode) : null;

    if (!type) {
      root.innerHTML = `<p>${t("结果不存在，请重新测试。", "Result not found. Please take the test again.")}</p>`;
      return;
    }

    const shareText = isEnSite()
      ? `I got "${type.name} ${type.code}"\n\n${type.oneLiner}\n\n👉 Take the test: https://nbti.dofun.fun/en/`
      : `我是「${type.name} ${type.code}」\n\n${type.oneLiner}\n\n👉 来测测你是哪种人：https://nbti.dofun.fun/`;

    root.innerHTML = `
      <section class="card result-card-hero">
        <picture>
          <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
          <img class="hero-cover" src="/assets/types/${type.slug}.png" alt="${type.name} ${type.code} ${t("插图","illustration")}" />
        </picture>
        <div class="tag">${t("NBTI 结果", "NBTI Result")}</div>
        <h1>${type.name} ${type.code}</h1>
        <p class="lead">${type.oneLiner}</p>
        ${secondary ? `<p class="muted">${t("次人格倾向：", "Secondary tendency:")} ${secondary.name} ${secondary.code}</p>` : ""}
        ${
          type.danmu && type.danmu.length
            ? `
        <div class="danmu-wall result-danmu-wall">
          <div class="danmu-row">
            ${type.danmu.map((line) => `<span class="danmu-bubble">“${escapeHtml(line)}”</span>`).join("")}
            ${type.danmu.map((line) => `<span class="danmu-bubble">“${escapeHtml(line)}”</span>`).join("")}
          </div>
        </div>
        `
            : ""
        }
        <div class="cta-row">
          <button class="btn" id="saveResultCardBtn">${t("保存结果卡", "Save Result Card")}</button>
        </div>
      </section>
      <section class="section">
        <h2>${t("一句话破防总结", "One-line Core Hit")}</h2>
        <article class="card breakline-card">
          <p class="lead">${escapeHtml(isEnSite() && hasCJK(type.breakLine) ? type.oneLiner : type.breakLine || type.oneLiner)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("你的真实状态", "Your Real Pattern")}</h2>
        <article class="card">
          <ul class="bullet-list">
            ${
              (isEnSite() && (type.realState || []).some(hasCJK)
                ? [
                    "You may run multiple tracks in parallel instead of one strict line.",
                    "Your current plan can be interrupted by newer options.",
                    "You usually have momentum at the start, then need structure to sustain."
                  ]
                : type.realState || []
              )
                .map((x) => `<li>${escapeHtml(x)}</li>`)
                .join("")
            }
          </ul>
        </article>
      </section>
      <section class="section">
        <h2>${t("完整人格解析", "Full Profile")}</h2>
        <p><strong>${t("核心人格机制：", "Core mechanism:")}</strong>${withBreaks(type.mechanism)}</p>
        <p><strong>${t("别人眼里的你：", "How others see you:")}</strong>${withBreaks(type.outsideView)}</p>
        <p><strong>${t("你的强项：", "Your strengths:")}</strong>${withBreaks(type.strengths)}</p>
        <p><strong>${t("你的隐性 Bug：", "Your hidden bug:")}</strong>${withBreaks(type.hiddenBug)}</p>
        <p><strong>${t("关系模式：", "Relationship pattern:")}</strong>${withBreaks(type.relationMode)}</p>
        <p><strong>${t("职场 / 创作模式：", "Work / creative mode:")}</strong>${withBreaks(type.workMode)}</p>
        <p><strong>${t("压力状态：", "Stress mode:")}</strong>${withBreaks(type.stressMode)}</p>
        <p><strong>${t("成长建议：", "Growth advice:")}</strong>${withBreaks(type.growth)}</p>
        <p><strong>${t("NBTI 翻译成人话：", "In plain words:")}</strong>${withBreaks(type.humanTranslation)}</p>
      </section>
      <section class="section">
        <h2>${t("评论区引导", "Prompt to Reflect")}</h2>
        <article class="card">
          <p>${escapeHtml(type.commentPrompt || t("你是这个类型吗？评论区报类型👇", "Does this type feel like you?"))}</p>
          <p class="muted">${t("也可以留言：你这次是 A 选项多，还是 B 选项多？", "You can also share whether you picked more A or B answers.")}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("分享我的结果", "Share My Result")}</h2>
        <pre class="card" id="share-text">${shareText}</pre>
        <div class="cta-row">
          <button class="btn" id="copyShare">${t("复制分享文案", "Copy Share Text")}</button>
          <a class="btn secondary" href="${route("/test/")}">${t("再测一次", "Retake Test")}</a>
          <a class="btn ghost" href="${route(`/types/${type.slug}/`)}">${t("查看类型页", "View Type Page")}</a>
        </div>
      </section>
    `;

    const copyBtn = document.getElementById("copyShare");
    const saveResultCardBtn = document.getElementById("saveResultCardBtn");

    async function saveCard(btn, template, suffix) {
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = t("生成中...", "Generating...");
      try {
        const blob = await drawShareCard(type, template);
        if (!blob) throw new Error("blob");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nbti-${type.slug}-${suffix}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        trackEvent("card_download", { source: "result_page", template, code: type.code });
        btn.textContent = t("已保存", "Saved");
      } catch (e) {
        btn.textContent = t("保存失败", "Save failed");
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = oldText;
        }, 1200);
      }
    }

    saveResultCardBtn.addEventListener("click", () => saveCard(saveResultCardBtn, "result", "result"));

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        trackEvent("share_copy", { source: "result_page", code: type.code });
        copyBtn.textContent = t("已复制", "Copied");
      } catch (e) {
        alert(t("复制失败，请手动复制。", "Copy failed. Please copy manually."));
      }
    });
  }

  function renderTypeDetail() {
    const root = document.getElementById("type-detail-app");
    if (!root) return;
    const slug = root.getAttribute("data-slug");
    const type = bySlug(slug);
    if (!type) {
      root.innerHTML = `<p>${t("类型不存在。", "Type not found.")}</p>`;
      return;
    }

    const em = CARD_EMOJI_MAP[type.code] || ["✨", "🧩", "⚡"];
    const traits = displayTraits(type);
    const shareText = isEnSite()
      ? `I'm "${type.name} ${type.code}"\n\n${type.oneLiner}\n\nTake NBTI and find your pattern:\nhttps://nbti.dofun.fun/en/`
      : `我是「${type.name} ${type.code}」\n\n${type.oneLiner}\n\n👉 来测测你是哪种人：https://nbti.dofun.fun/`;
    const related = [...window.NBTI_DATA.types]
      .filter((t) => t.code !== type.code)
      .map((t) => {
        let distance = 0;
        window.NBTI_DATA.dimensions.forEach((d) => {
          distance += Math.abs((type.vector[d] || 0) - (t.vector[d] || 0));
        });
        return { type: t, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map((x) => x.type);
    document.title = `${type.cardName || type.name} ${type.code} - ${t("NBTI 类型详情", "NBTI Type Detail")}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        isEnSite()
          ? `${type.cardName || type.name} (${type.code}) type detail: why you operate this way, where you get stuck, and how to adjust.`
          : `${type.cardName || type.name}（${type.code}）类型详情：你为什么会这样、容易卡在哪、怎么调整更顺。`
      );
    }

    root.innerHTML = `
      <section class="type-hero-split">
        <article class="card type-hero-image">
          <picture>
            <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
            <img class="hero-cover" src="/assets/types/${type.slug}.png" alt="${type.name} ${type.code} ${t("插图", "illustration")}" />
          </picture>
        </article>
        <article class="card type-hero-copy">
          <p class="muted">NBTI REPORT #${type.code}</p>
          <h1>${type.cardName || type.name} ${type.code}</h1>
          <p class="lead">${escapeHtml(type.cardHeadline || type.oneLiner)}</p>
          <p class="traits-inline">${em[0]} ${escapeHtml(traits[0])} · ${em[1]} ${escapeHtml(traits[1])} · ${em[2]} ${escapeHtml(traits[2])}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("一句话破防", "One-line Core Hit")}</h2>
        <article class="card breakline-card">
          <p class="lead">${escapeHtml(isEnSite() && hasCJK(type.breakLine) ? type.oneLiner : type.breakLine || type.oneLiner)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("核心人格机制", "Core Mechanism")}</h2>
        <article class="card">
          <p>${withBreaks(type.mechanism)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("你的真实状态", "Your Real Pattern")}</h2>
        <article class="card">
          <ul class="bullet-list">
            ${
              (isEnSite() && (type.realState || []).some(hasCJK)
                ? [
                    `You usually start from an interesting angle before deciding the strict path.`,
                    `Your focus can be pulled by newer options even while current tasks are active.`,
                    `You are often switching between parallel tracks instead of running one line only.`
                  ]
                : type.realState || []
              )
                .map((x) => `<li>${escapeHtml(x)}</li>`)
                .join("")
            }
          </ul>
        </article>
      </section>
      <section class="section">
        <h2>${t("你的优势", "Your Strengths")}</h2>
        <article class="card">
          <p>${withBreaks(type.strengths)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("你的 Bug", "Your Bug")}</h2>
        <article class="card">
          <p>${withBreaks(type.hiddenBug)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("关系模式", "Relationship Pattern")}</h2>
        <article class="card">
          <p>${withBreaks(type.relationMode)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("职场 / 创作模式", "Work / Creative Mode")}</h2>
        <article class="card">
          <p>${withBreaks(type.workMode)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("压力状态", "Stress Mode")}</h2>
        <article class="card">
          <p>${withBreaks(type.stressMode)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("成长建议", "Growth Advice")}</h2>
        <article class="card">
          <p>${withBreaks(type.growth)}</p>
        </article>
      </section>
      <section class="section">
        <h2>${t("NBTI翻译成人话", "NBTI in Plain Words")}</h2>
        <article class="card">
          <p class="lead">${escapeHtml(type.humanTranslation || type.oneLiner)}</p>
        </article>
      </section>
      ${
        type.danmu && type.danmu.length
          ? `
      <section class="section">
        <h2>${t("这个类型常见弹幕", "Common Reactions for This Type")}</h2>
        <div class="card">${type.danmu.map((line) => `<p>“${line}”</p>`).join("")}</div>
      </section>
      `
          : ""
      }
      <section class="section">
        <h2>${t("相关性格", "Related Similarity")}</h2>
        <div class="grid related-grid">
          ${related
            .map((r) => {
              const re = CARD_EMOJI_MAP[r.code] || ["✨", "🧩", "⚡"];
              const rt = displayTraits(r);
              return `
                <a class="card related-card" href="${route(`/types/${r.slug}/`)}" data-track="type_related_click" data-track-meta="${type.code}->${r.code}">
                  <picture>
                    <source srcset="/assets/types/${r.slug}.webp" type="image/webp" />
                    <img class="type-cover" src="/assets/types/${r.slug}.png" alt="${r.name} ${r.code} ${t("插图", "illustration")}" loading="lazy" />
                  </picture>
                  <h3>${r.cardName || r.name}</h3>
                  <p>${escapeHtml(r.cardHeadline || r.oneLiner)}</p>
                  <p class="muted">${re[0]} ${escapeHtml(rt[0] || "")} · ${re[1]} ${escapeHtml(rt[1] || "")} · ${re[2]} ${escapeHtml(rt[2] || "")}</p>
                </a>
              `;
            })
            .join("")}
        </div>
      </section>
      <section class="section">
        <h2>${t("分享引导", "Share Prompt")}</h2>
        <article class="card">
          <p>${escapeHtml(type.commentPrompt || t("你是这种人吗？还是更像另一个版本的自己？", "Does this type feel like you, or are you closer to another mode?"))}</p>
          <p class="muted">${t("你可以生成专属人格卡，再发给朋友看看他们是哪种。", "Generate your card and send it to friends.")}</p>
        </article>
        <div class="cta-row">
          <button class="btn" id="typeSaveResultCardBtn">${t("👉 生成我的人格卡", "👉 Generate My Card")}</button>
          <button class="btn secondary" id="typeSaveDanmuCardBtn">${t("👉 生成弹幕卡", "👉 Generate Danmu Card")}</button>
          <button class="btn ghost" id="typeCopyShareBtn">${t("👉 发给朋友看看他们是哪种", "👉 Share with Friends")}</button>
          <a class="btn ghost" href="${route("/test/")}">${t("👉 去测试看看我的类型", "👉 Take the Test")}</a>
        </div>
      </section>
    `;

    const saveResultBtn = document.getElementById("typeSaveResultCardBtn");
    const saveDanmuBtn = document.getElementById("typeSaveDanmuCardBtn");
    const copyBtn = document.getElementById("typeCopyShareBtn");

    async function saveCard(btn, template, suffix) {
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = t("生成中...", "Generating...");
      try {
        const blob = await drawShareCard(type, template);
        if (!blob) throw new Error("blob");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nbti-${type.slug}-${suffix}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        trackEvent("card_download", { source: "type_detail", template, code: type.code });
        btn.textContent = t("已保存", "Saved");
      } catch (e) {
        btn.textContent = t("保存失败", "Save failed");
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = oldText;
        }, 1200);
      }
    }

    saveResultBtn.addEventListener("click", () => saveCard(saveResultBtn, "result", "result"));
    saveDanmuBtn.addEventListener("click", () => saveCard(saveDanmuBtn, "danmu", "danmu"));
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        trackEvent("share_copy", { source: "type_detail", code: type.code });
        copyBtn.textContent = t("已复制", "Copied");
        setTimeout(() => {
          copyBtn.textContent = t("👉 发给朋友看看他们是哪种", "👉 Share with Friends");
        }, 1200);
      } catch (e) {
        copyBtn.textContent = t("复制失败", "Copy failed");
      }
    });
  }

  function renderTypesPage() {
    const root = document.getElementById("types-list-app");
    if (!root) return;
    const filterBar = document.getElementById("types-filter-bar");

    const order = [
      "EXS",
      "XOS",
      "SEA",
      "BXC",
      "EAS+",
      "MXT",
      "SACE",
      "SOC",
      "XSB",
      "XOC",
      "CEC",
      "CBC",
      "BSO",
      "SBC",
      "BXE",
      "BCS",
      "XEB",
      "EAS"
    ];

    const rank = Object.fromEntries(order.map((code, i) => [code, i]));
    const sorted = [...window.NBTI_DATA.types].sort(
      (a, b) => (rank[a.code] ?? 999) - (rank[b.code] ?? 999)
    );

    const groups = {
      all: () => true,
      think: (t) => ["EXS", "XSB", "XEB", "SEA"].includes(t.code),
      multi: (t) => ["MXT", "XOS", "EAS+", "EAS"].includes(t.code),
      social: (t) => ["SOC", "SACE", "SEA", "SBC"].includes(t.code),
      steady: (t) => ["XOC", "CEC", "CBC", "BCS", "BXC"].includes(t.code)
    };

    function feedCard(type) {
      const em = CARD_EMOJI_MAP[type.code] || ["✨", "🧩", "⚡"];
      const ts = displayTraits(type);
      const quote = type.cardHeadline || type.oneLiner;
      return `
      <a class="feed-card" href="${route(`/types/${type.slug}/`)}" aria-label="${t(`查看 ${type.name} ${type.code}`, `View ${type.name} ${type.code}`)}" data-track="type_card_click" data-track-meta="${type.code}">
        <div class="feed-head">
          <div>
            <div class="tag">${type.code}</div>
            <h3>${type.cardName || type.name}</h3>
          </div>
          <picture class="feed-thumb-wrap">
            <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
            <img class="feed-thumb" src="/assets/types/${type.slug}.png" alt="${type.cardName || type.name} ${type.code}" loading="lazy" />
          </picture>
        </div>
        <p class="quote">「${escapeHtml(quote)}」</p>
        <p class="feed-traits">${em[0]} ${escapeHtml(ts[0] || "")} · ${em[1]} ${escapeHtml(ts[1] || "")} · ${em[2]} ${escapeHtml(ts[2] || "")}</p>
        <p class="feed-cta">${t("我有点像 →", "This feels like me →")}</p>
      </a>
      `;
    }

    let current = "all";
    function renderList() {
      root.innerHTML = sorted.filter(groups[current] || groups.all).map(feedCard).join("");
    }

    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const target = e.target.closest("[data-filter]");
        if (!target) return;
        current = target.getAttribute("data-filter") || "all";
        filterBar.querySelectorAll(".chip").forEach((n) => n.classList.remove("active"));
        target.classList.add("active");
        renderList();
      });
    }

    renderList();
  }

  function renderRankingsPage() {
    const root = document.getElementById("rankings-app");
    if (!root) return;

    const data = window.NBTI_DATA || {};
    const rd = data.rankingsData;
    if (!rd || !rd.rankings || !rd.rankings.all_time) {
      root.innerHTML = `<article class='card'>${t("排行榜数据暂未准备好。", "Ranking data is not ready yet.")}</article>`;
      return;
    }

    const fmtNum = (n) => Number(n || 0).toLocaleString(isEnSite() ? "en-US" : "zh-CN");
    const trendClass = (t) =>
      String(t || "").includes("↑") ? "up" : String(t || "").includes("↓") ? "down" : String(t || "") === "NEW" ? "new" : "flat";

    const state = { mode: "all_time" };

    function build(mode) {
      const rows = rd.rankings[mode] || rd.rankings.all_time;
      const top3 = rows.slice(0, 3);
      const fast = rows.find((x) => x.code === "SBC") || rows[0];

      const topCards = top3
        .map((r, i) => {
          const typeObj = byCode(r.code);
          const em = CARD_EMOJI_MAP[r.code] || ["✨", "🧩", "⚡"];
          const traits = typeObj ? displayTraits(typeObj) : (isEnSite() ? ["Trait 1", "Trait 2", "Trait 3"] : ["特征1", "特征2", "特征3"]);
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
          return `
          <article class="card top-rank-card">
            <p class="top-rank-medal muted">${medal} TOP ${i + 1}</p>
            <h3 class="top-rank-title">#${i + 1} ${r.type_name} ${r.code}</h3>
            ${
              typeObj
                ? `
            <picture class="top-rank-cover-wrap">
              <source srcset="/assets/types/${typeObj.slug}.webp" type="image/webp" />
              <img class="top-rank-cover" src="/assets/types/${typeObj.slug}.png" alt="${r.type_name} ${r.code}" loading="lazy" />
            </picture>
            `
                : ""
            }
            <p class="top-rank-quote">「${escapeHtml((typeObj && (typeObj.cardHeadline || typeObj.oneLiner)) || "")}」</p>
            <div class="top-rank-tags">
              <span class="mini-tag">${em[0]} ${traits[0]}</span>
              <span class="mini-tag">${em[1]} ${traits[1]}</span>
              <span class="mini-tag">${em[2]} ${traits[2]}</span>
            </div>
            <p class="top-rank-share"><strong>${t("当前占比：", "Current Share: ")}${r.share.toFixed(1)}%</strong></p>
            <button class="btn ghost rank-share-btn" data-code="${r.code}">${t("生成分享卡", "Generate Share Card")}</button>
          </article>
        `;
        })
        .join("");

      const tableRows = rows
        .map((r) => {
          const typeObj = byCode(r.code);
          const slug = typeObj ? typeObj.slug : "";
          return `
            <tr class="rank-row" data-slug="${slug}">
              <td>#${r.rank}</td>
              <td>${r.type_name}</td>
              <td>${r.code}</td>
              <td>${fmtNum(r.count)}</td>
              <td>${r.share.toFixed(1)}%</td>
              <td><span class="trend ${trendClass(r.trend)}">${r.trend}</span></td>
            </tr>
          `;
        })
        .join("");

      root.innerHTML = `
        <section class="section">
          <p class="muted">${t("这个榜单，来自所有完成测试的结果", "This board reflects all completed tests.")}</p>
          <div class="stats-grid">
            <article class="card"><p class="muted">${t("总提交数", "Total Submissions")}</p><h3>${fmtNum(rd.summary.total_submissions)}</h3></article>
            <article class="card"><p class="muted">${t("已上榜人格", "Types On Board")}</p><h3>${rd.summary.types_on_board} / ${rd.summary.types_total}</h3></article>
            <article class="card"><p class="muted">${t("最近更新", "Last Updated")}</p><h3>${isEnSite() ? "3 mins ago" : rd.summary.last_updated_label || "3分钟前"}</h3></article>
            <article class="card"><p class="muted">${t("今日新增", "Today New")}</p><h3>${fmtNum(rd.summary.today_new)}</h3></article>
          </div>
        </section>

        <section class="section">
          <h2>${t("TOP3 人格卡", "TOP3 Type Cards")}</h2>
          <div class="grid">${topCards}</div>
        </section>

        <section class="section">
          <div class="rank-head">
            <h2>${t("排行榜主榜", "Main Ranking")}</h2>
            <div class="filter-row">
              <button class="chip ${mode === "all_time" ? "active" : ""}" data-rmode="all_time" data-track="rankings_mode_switch" data-track-meta="all_time">${t("全部时间", "All Time")}</button>
              <button class="chip ${mode === "seven_day" ? "active" : ""}" data-rmode="seven_day" data-track="rankings_mode_switch" data-track-meta="seven_day">${t("最近7天", "Last 7 Days")}</button>
              <button class="chip ${mode === "today" ? "active" : ""}" data-rmode="today" data-track="rankings_mode_switch" data-track-meta="today">${t("今天", "Today")}</button>
            </div>
          </div>
          <p class="muted trend-legend"><span class="trend up">↑ ${t("上升", "Up")}</span> · <span class="trend down">↓ ${t("下降", "Down")}</span> · <span class="trend flat">— ${t("持平", "Flat")}</span> · <span class="trend new">NEW ${t("新上榜", "New")}</span></p>
          <div class="card rank-table-wrap">
            <table class="rank-table">
              <thead><tr><th>${t("排名", "Rank")}</th><th>${t("人格", "Type")}</th><th>${t("代码", "Code")}</th><th>${t("提交量", "Count")}</th><th>${t("占比", "Share")}</th><th>${t("趋势", "Trend")}</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <h2>${t("这批人，整体更像这样", "This cohort trends like this")}</h2>
          <article class="card">
            <p>${t("最容易对号入座的：脑洞玩家 / 内耗大师 / 情绪雷达", "Most relatable: Explorer / Overthinker / Emotion Radar")}</p>
            <p>${t("最少见的：稳定输出机 / 情绪共振体 / 现实派", "Rarest: Steady Producer / Resonance Amplifier / Realist")}</p>
            <p>${t("最近涨得最快：", "Fastest rising: ")}${fast.type_name} ${fast.trend}</p>
            <p>${t("最容易测混的两种：脑洞玩家 ↔ 多版本玩家；内耗大师 ↔ 情绪雷达", "Most confused pairs: Explorer ↔ Multi-Version; Overthinker ↔ Emotion Radar")}</p>
          </article>
        </section>

        <section class="section">
          <h2>${t("整体状态分布（7维平均）", "Overall Pattern Distribution (7 dimensions)")}</h2>
          <article class="card">
            <p>${t("探索倾向：偏高", "Exploration: high")}</p>
            <p>${t("情绪敏感：中高", "Emotional sensitivity: mid-high")}</p>
            <p>${t("执行稳定：中等偏低", "Execution stability: mid-low")}</p>
            <p>${t("社交驱动：分化明显", "Social drive: polarized")}</p>
            <p>${t("边界感：两极分布", "Boundary setting: bimodal")}</p>
            <p>${t("表达驱动：波动较大", "Expression drive: fluctuating")}</p>
            <p>${t("自我稳定：整体不稳定", "Self-stability: overall unstable")}</p>
          </article>
        </section>

        <section class="section">
          <h2>${t("榜单说明", "Board Notes")}</h2>
          <details class="card">
            <summary>${t("榜单说明", "Board Notes")}</summary>
            <p>${t("这个榜单，来自所有完成测试的结果。", "This board is built from all completed tests.")}</p>
            <p>${t("它反映的是当前这批人的状态分布，不是标准答案。", "It reflects this cohort distribution, not a universal standard.")}</p>
            <p>${t("每次刷新，这张榜都会变一点。", "Each refresh may change the board slightly.")}</p>
          </details>
          <p class="muted">${t("这是当前这批人的真实分布，不是标准答案。", "This is a cohort snapshot, not a final truth.")}</p>
        </section>

        <section class="section">
          <h2>${t("你在榜上哪一类？", "Where are you on this board?")}</h2>
          <p>${t("测完再看这张榜，会更像在看自己。", "Take the test, then come back to read yourself in context.")}</p>
          <div class="cta-row"><a class="btn" href="${route("/test/")}" data-track="rankings_cta_click" data-track-meta="bottom">${t("👉 我也去测一下", "👉 Take the Test")}</a></div>
        </section>
      `;

      root.querySelectorAll("[data-rmode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.mode = btn.getAttribute("data-rmode") || "all_time";
          build(state.mode);
        });
      });

      root.querySelectorAll(".rank-row").forEach((row) => {
        row.addEventListener("click", () => {
          const slug = row.getAttribute("data-slug");
          if (slug) {
            trackEvent("rankings_row_click", { slug });
            window.location.href = route(`/types/${slug}/`);
          }
        });
      });

      root.querySelectorAll(".rank-share-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const code = btn.getAttribute("data-code");
          const type = byCode(code || "");
          if (!type) return;
          const oldText = btn.textContent;
          btn.textContent = t("生成中...", "Generating...");
          btn.setAttribute("disabled", "disabled");
          try {
            const blob = await drawShareCard(type, "result");
            if (!blob) throw new Error("blob");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `nbti-${type.slug}-rank-top.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            trackEvent("card_download", { template: "result", source: "rankings_top", code: type.code });
            btn.textContent = t("已保存", "Saved");
          } catch (err) {
            btn.textContent = t("保存失败", "Save failed");
          } finally {
            setTimeout(() => {
              btn.textContent = oldText;
              btn.removeAttribute("disabled");
            }, 1200);
          }
        });
      });
    }

    build(state.mode);
  }

  function renderFaqPage() {
    const root = document.getElementById("faq-app");
    if (!root) return;
    const groups = isEnSite()
      ? [
          { key: "Test", id: "faq-test", title: "Test" },
          { key: "Results", id: "faq-result", title: "Results" },
          { key: "Rankings", id: "faq-rank", title: "Rankings" }
        ]
      : [
          { key: "测试问题", id: "faq-test", title: "测试问题" },
          { key: "结果问题", id: "faq-result", title: "结果问题" },
          { key: "排行榜问题", id: "faq-rank", title: "排行榜问题" }
        ];
    root.innerHTML = groups
      .map((g) => {
        const list = (window.NBTI_DATA.faq || []).filter((x) => (x.cat || groups[0].key) === g.key);
        return `
          <section id="${g.id}" class="section">
            <h2>${g.title}</h2>
            ${list.map((item) => `<article class="card"><h3>${item.q}</h3><p>${item.a}</p></article>`).join('<div style="height:10px"></div>')}
          </section>
        `;
      })
      .join("");
  }

  function hydrateYear() {
    const yearNodes = document.querySelectorAll("[data-year]");
    yearNodes.forEach((n) => {
      n.textContent = String(new Date().getFullYear());
    });
  }

  function initSiteIcons() {
    const head = document.head;
    if (!head) return;
    const links = [
      { rel: "icon", href: "/assets/icons/icon/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/assets/icons/icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/assets/icons/icon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { rel: "apple-touch-icon", href: "/assets/icons/icon/apple-touch-icon.png", sizes: "180x180" },
      { rel: "icon", href: "/assets/icons/icon/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", href: "/assets/icons/icon/icon-512.png", sizes: "512x512", type: "image/png" }
    ];
    links.forEach((cfg) => {
      let el = head.querySelector(`link[rel="${cfg.rel}"][href="${cfg.href}"]`);
      if (!el) {
        el = document.createElement("link");
        el.rel = cfg.rel;
        el.href = cfg.href;
        head.appendChild(el);
      }
      if (cfg.sizes) el.setAttribute("sizes", cfg.sizes);
      if (cfg.type) el.setAttribute("type", cfg.type);
    });
  }

  function getRuntimeConfig() {
    const defaults = {
      analytics: {
        enabled: true,
        gaId: "G-S0LDZZ4WET"
      },
      ads: {
        enabled: false,
        provider: "",
        slotIds: []
      }
    };
    const runtime = window.NBTI_RUNTIME_CONFIG || {};
    return {
      analytics: Object.assign({}, defaults.analytics, runtime.analytics || {}),
      ads: Object.assign({}, defaults.ads, runtime.ads || {})
    };
  }

  function initGoogleAnalytics() {
    const cfg = getRuntimeConfig().analytics;
    if (!cfg.enabled || !cfg.gaId) return;
    if (window.__nbtiGaInited) return;
    window.__nbtiGaInited = true;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", cfg.gaId);
  }

  function initAds() {
    const cfg = getRuntimeConfig().ads;
    if (!cfg.enabled || !cfg.provider) return;
    if (window.__nbtiAdsInited) return;
    window.__nbtiAdsInited = true;
    // Reserved for future ad provider bootstrap.
  }

  function injectLangSwitch() {
    const nav = document.querySelector(".topbar .nav");
    if (!nav || nav.querySelector(".lang-switch")) return;
    const path = window.location.pathname;
    const isEn = path === "/en" || path.startsWith("/en/");
    let zhPath = "/";
    let enPath = "/en/";

    if (isEn) {
      const raw = path.replace(/^\/en/, "") || "/";
      zhPath = raw.endsWith("/") ? raw : `${raw}/`;
      enPath = path.endsWith("/") ? path : `${path}/`;
    } else {
      zhPath = path.endsWith("/") ? path : `${path}/`;
      enPath = `/en${zhPath}`;
    }

    const wrapper = document.createElement("span");
    wrapper.className = "lang-switch";
    wrapper.innerHTML = `
      <a href="${zhPath}" class="${isEn ? "" : "active"}">中</a>
      <span>/</span>
      <a href="${enPath}" class="${isEn ? "active" : ""}">EN</a>
    `;
    nav.appendChild(wrapper);
  }

  function boot() {
    initSiteIcons();
    initGoogleAnalytics();
    initAds();
    setupTrackingDelegation();
    injectLangSwitch();
    hydrateYear();
    try {
      renderHomePage();
    } catch (e) {
      // Keep homepage usable even if dynamic blocks fail.
    }
    setupTestPage();
    renderResultPage();
    renderTypeDetail();
    renderTypesPage();
    renderRankingsPage();
    renderFaqPage();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
