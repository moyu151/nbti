(function () {
  const STORAGE_KEY = "nbti_test_answers_v2";
  const ANSWER_MAP = { A: 4, B: 3, C: 2, D: 1 };

  function byCode(code) {
    return window.NBTI_DATA.types.find((t) => t.code === code);
  }

  function bySlug(slug) {
    return window.NBTI_DATA.types.find((t) => t.slug === slug);
  }

  function codePath(code) {
    return `/result/${encodeURIComponent(code)}/`;
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

  function applyUnifiedSiteChrome() {
    const navHtml = `
      <a href="/test/">测试</a>
      <a href="/types/">类型</a>
      <a href="/rankings/">热度榜</a>
      <a href="/insights/why-do-i-overthink-everything/">洞察</a>
      <a href="/faq/">FAQ</a>
      <a href="/about/">关于</a>
    `;

    document.querySelectorAll(".topbar").forEach((bar) => {
      const nav = bar.querySelector(".nav");
      if (nav) nav.innerHTML = navHtml;
    });

    const main = document.querySelector(".site-wrap");
    if (!main) return;
    let footer = main.querySelector(".footer");
    if (!footer) {
      footer = document.createElement("footer");
      footer.className = "footer";
      main.appendChild(footer);
    }
    footer.innerHTML = `
      <p>NBTI V2.0 · 纯静态版 · <span data-year></span></p>
      <p><a href="/privacy/">隐私</a> · <a href="/faq/">FAQ</a> · <a href="/test/">进入测试</a></p>
    `;
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

  function renderTypeCard(type) {
    return `
      <article class="type-item">
        <picture>
          <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
          <img class="type-cover" src="/assets/types/${type.slug}.png" alt="${type.name} ${type.code} 插图" loading="lazy" />
        </picture>
        <div class="tag">${type.code}</div>
        <h3>${type.name}</h3>
        <p>${type.oneLiner}</p>
        <p class="muted">${type.traits.join(" · ")}</p>
        <a class="btn ghost" href="/types/${type.slug}/">查看类型</a>
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
      traits: Array.isArray(type.cardTraits)
        ? type.cardTraits.slice(0, 3)
        : Array.isArray(type.traits)
          ? type.traits.slice(0, 3)
          : [],
      emoji: CARD_EMOJI_MAP[type.code] || ["✨", "🧩", "⚡"]
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

    ctx.font = "700 42px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(`NBTI REPORT #${payload.code}`, pad, 96);

    ctx.font = "800 88px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(payload.type_name, pad, 190);

    ctx.font = "700 52px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    const headline = wrapLines(ctx, payload.headline, contentW - 24, 2);
    let y = 330;
    ctx.fillText("「", pad, y);
    y += 8;
    headline.forEach((line) => {
      ctx.fillText(line, pad + 46, y);
      y += 68;
    });
    ctx.fillText("」", pad + 10, y + 8);

    ctx.font = "600 40px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    const dividerY = y + 90;
    ctx.fillText("——————", pad, dividerY);

    ctx.font = "600 44px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    let ty = dividerY + 90;
    payload.traits.slice(0, 3).forEach((t, i) => {
      const emo = payload.emoji[i] || "✨";
      ctx.fillText(`${emo} ${t}`, pad, ty);
      ty += 82;
    });

    ctx.font = "600 40px Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText("—— 测测你是哪种人", pad, h - 140);
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
    const l1 = wrapLines(ctx, "你最容易卡住的不是开始", contentW, 1);
    const l2 = wrapLines(ctx, "是持续", contentW, 1);
    const l3 = wrapLines(ctx, "你不是做不到", contentW, 1);
    const l4 = wrapLines(ctx, "是会被新的东西带走", contentW, 1);
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
    ctx.fillText(`${payload.type_name}常见发言：`, pad, 130);

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
    if (template === "patch") {
      drawTemplatePatch(ctx, payload, width, height);
    } else if (template === "danmu") {
      drawTemplateDanmu(ctx, payload, type.danmu || [], width, height);
    } else {
      drawTemplateResult(ctx, payload, width, height);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  function setupTestPage() {
    const holder = document.getElementById("test-app");
    if (!holder) return;

    const questions = window.NBTI_DATA.questions;
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    let index = 0;
    const answers = { ...saved };

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
        <p class="muted">第 ${index + 1} / ${questions.length} 题 · 已完成 ${done} 题</p>
        <section class="question-box">
          <div class="tag">${q.dim} 维度</div>
          <h2>${q.text}</h2>
          <div class="answers" id="answers"></div>
        </section>
        <div class="cta-row">
          <button class="btn secondary" id="prevBtn" ${index === 0 ? "disabled" : ""}>上一题</button>
          <button class="btn ghost" id="nextBtn">${index === questions.length - 1 ? "查看结果" : "下一题"}</button>
        </div>
      `;

      const answersBox = document.getElementById("answers");
      const options = q.options
        ? [
            { key: "A", text: q.options.A || "完全是我" },
            { key: "B", text: q.options.B || "有点像" },
            { key: "C", text: q.options.C || "不太像" },
            { key: "D", text: q.options.D || "完全不是" }
          ]
        : window.NBTI_DATA.answerOptions;

      options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = `option ${answered === opt.key ? "active" : ""}`;
        btn.textContent = `${opt.key}. ${opt.text}`;
        btn.addEventListener("click", () => {
          answers[q.id] = opt.key;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
          render();
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
        if (!answers[q.id]) {
          alert("先选一个最像你的答案。");
          return;
        }
        if (index < questions.length - 1) {
          index += 1;
          render();
          return;
        }
        const result = computeResult(answers);
        saveResult(result);
        window.location.href = codePath(result.primaryCode);
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
      root.innerHTML = "<p>结果不存在，请重新测试。</p>";
      return;
    }

    const shareText = `我是「${type.name} ${type.code}」\n\n${type.oneLiner}\n\n👉 来测测你是哪种人`;

    root.innerHTML = `
      <section class="card result-card-hero">
        <picture>
          <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
          <img class="hero-cover" src="/assets/types/${type.slug}.png" alt="${type.name} ${type.code} 插图" />
        </picture>
        <div class="tag">NBTI 结果</div>
        <h1>${type.name} ${type.code}</h1>
        <p class="lead">${type.oneLiner}</p>
        ${secondary ? `<p class="muted">次人格倾向：${secondary.name} ${secondary.code}</p>` : ""}
        <div class="cta-row">
          <button class="btn" id="saveResultCardBtn">保存结果卡</button>
          <button class="btn secondary" id="savePatchCardBtn">保存补刀卡</button>
          <button class="btn ghost" id="saveDanmuCardBtn">保存弹幕卡</button>
        </div>
      </section>
      <section class="section">
        <h2>一句话破防总结</h2>
        <article class="card breakline-card">
          <p class="lead">${escapeHtml(type.breakLine || type.oneLiner)}</p>
        </article>
      </section>
      <section class="section">
        <h2>你的真实状态</h2>
        <article class="card">
          <ul class="bullet-list">
            ${(type.realState || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}
          </ul>
        </article>
      </section>
      <section class="section">
        <h2>完整人格解析</h2>
        <p><strong>核心人格机制：</strong>${withBreaks(type.mechanism)}</p>
        <p><strong>别人眼里的你：</strong>${withBreaks(type.outsideView)}</p>
        <p><strong>你的强项：</strong>${withBreaks(type.strengths)}</p>
        <p><strong>你的隐性 Bug：</strong>${withBreaks(type.hiddenBug)}</p>
        <p><strong>关系模式：</strong>${withBreaks(type.relationMode)}</p>
        <p><strong>职场 / 创作模式：</strong>${withBreaks(type.workMode)}</p>
        <p><strong>压力状态：</strong>${withBreaks(type.stressMode)}</p>
        <p><strong>成长建议：</strong>${withBreaks(type.growth)}</p>
        <p><strong>NBTI 翻译成人话：</strong>${withBreaks(type.humanTranslation)}</p>
      </section>
      ${
        type.danmu && type.danmu.length
          ? `
      <section class="section">
        <h2>这个类型常见弹幕</h2>
        <div class="card">${type.danmu.map((line) => `<p>“${line}”</p>`).join("")}</div>
      </section>
      `
          : ""
      }
      <section class="section">
        <h2>评论区引导</h2>
        <article class="card">
          <p>${escapeHtml(type.commentPrompt || "你是这个类型吗？评论区报类型👇")}</p>
          <p class="muted">也可以留言：你这次是 A 选项多，还是 B 选项多？</p>
        </article>
      </section>
      <section class="section">
        <h2>分享区</h2>
        <pre class="card" id="share-text">${shareText}</pre>
        <div class="cta-row">
          <button class="btn" id="copyShare">复制分享文案</button>
          <a class="btn secondary" href="/test/">再测一次</a>
          <a class="btn ghost" href="/types/${type.slug}/">查看类型页</a>
        </div>
      </section>
    `;

    const copyBtn = document.getElementById("copyShare");
    const saveResultCardBtn = document.getElementById("saveResultCardBtn");
    const savePatchCardBtn = document.getElementById("savePatchCardBtn");
    const saveDanmuCardBtn = document.getElementById("saveDanmuCardBtn");

    async function saveCard(btn, template, suffix) {
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "生成中...";
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
        btn.textContent = "已保存";
      } catch (e) {
        btn.textContent = "保存失败";
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = oldText;
        }, 1200);
      }
    }

    saveResultCardBtn.addEventListener("click", () => saveCard(saveResultCardBtn, "result", "result"));
    savePatchCardBtn.addEventListener("click", () => saveCard(savePatchCardBtn, "patch", "patch"));
    saveDanmuCardBtn.addEventListener("click", () => saveCard(saveDanmuCardBtn, "danmu", "danmu"));

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        trackEvent("share_copy", { source: "result_page", code: type.code });
        copyBtn.textContent = "已复制";
      } catch (e) {
        alert("复制失败，请手动复制。");
      }
    });
  }

  function renderTypeDetail() {
    const root = document.getElementById("type-detail-app");
    if (!root) return;
    const slug = root.getAttribute("data-slug");
    const type = bySlug(slug);
    if (!type) {
      root.innerHTML = "<p>类型不存在。</p>";
      return;
    }

    const em = CARD_EMOJI_MAP[type.code] || ["✨", "🧩", "⚡"];
    const traits = Array.isArray(type.cardTraits)
      ? type.cardTraits.slice(0, 3)
      : Array.isArray(type.traits)
        ? type.traits.slice(0, 3)
        : ["特征1", "特征2", "特征3"];
    const shareText = `我是「${type.name} ${type.code}」\n\n${type.oneLiner}\n\n👉 来测测你是哪种人`;
    document.title = `${type.cardName || type.name} ${type.code} - NBTI 类型详情`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute("content", `${type.cardName || type.name}（${type.code}）类型详情：你为什么会这样、容易卡在哪、怎么调整更顺。`);
    }

    root.innerHTML = `
      <section class="card type-report-card">
        <p class="muted">NBTI REPORT #${type.code}</p>
        <h1>${type.cardName || type.name}</h1>
        <p class="lead">${escapeHtml(type.cardHeadline || type.oneLiner)}</p>
        <p class="traits-inline">${em[0]} ${escapeHtml(traits[0])} · ${em[1]} ${escapeHtml(traits[1])} · ${em[2]} ${escapeHtml(traits[2])}</p>
      </section>
      <section class="section">
        <h2>一句话破防</h2>
        <article class="card breakline-card">
          <p class="lead">${escapeHtml(type.breakLine || type.oneLiner)}</p>
        </article>
      </section>
      <section class="section">
        <h2>核心人格机制</h2>
        <article class="card">
          <p>${withBreaks(type.mechanism)}</p>
        </article>
      </section>
      <section class="section">
        <h2>你的真实状态</h2>
        <article class="card">
          <ul class="bullet-list">
            ${(type.realState || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}
          </ul>
        </article>
      </section>
      <section class="section">
        <h2>你的优势</h2>
        <article class="card">
          <p>${withBreaks(type.strengths)}</p>
        </article>
      </section>
      <section class="section">
        <h2>你的 Bug</h2>
        <article class="card">
          <p>${withBreaks(type.hiddenBug)}</p>
        </article>
      </section>
      <section class="section">
        <h2>关系模式</h2>
        <article class="card">
          <p>${withBreaks(type.relationMode)}</p>
        </article>
      </section>
      <section class="section">
        <h2>职场 / 创作模式</h2>
        <article class="card">
          <p>${withBreaks(type.workMode)}</p>
        </article>
      </section>
      <section class="section">
        <h2>压力状态</h2>
        <article class="card">
          <p>${withBreaks(type.stressMode)}</p>
        </article>
      </section>
      <section class="section">
        <h2>成长建议</h2>
        <article class="card">
          <p>${withBreaks(type.growth)}</p>
        </article>
      </section>
      ${
        type.danmu && type.danmu.length
          ? `
      <section class="section">
        <h2>这个类型常见弹幕</h2>
        <div class="card">${type.danmu.map((line) => `<p>“${line}”</p>`).join("")}</div>
      </section>
      `
          : ""
      }
      <section class="section">
        <h2>FAQ（搜索问题）</h2>
        <article class="card">
          <p><strong>这个类型会变化吗？</strong><br />会。状态、关系和环境变化时，结果也可能变化。</p>
          <p><strong>这个类型最容易卡在哪？</strong><br />通常卡在你最常用的行为策略被过度使用的时候。</p>
          <p><strong>先从哪里开始调整？</strong><br />先改一个最常见卡点：执行节奏、情绪边界或表达方式。</p>
        </article>
      </section>
      <section class="section">
        <h2>分享引导</h2>
        <article class="card">
          <p>${escapeHtml(type.commentPrompt || "你是这种人吗？还是更像另一个版本的自己？")}</p>
          <p class="muted">你可以生成专属人格卡，再发给朋友看看他们是哪种。</p>
        </article>
        <div class="cta-row">
          <button class="btn" id="typeSaveResultCardBtn">👉 生成我的人格卡</button>
          <button class="btn secondary" id="typeSaveDanmuCardBtn">👉 生成弹幕卡</button>
          <button class="btn ghost" id="typeCopyShareBtn">👉 发给朋友看看他们是哪种</button>
          <a class="btn ghost" href="/test/">👉 去测试看看我的类型</a>
        </div>
      </section>
    `;

    const saveResultBtn = document.getElementById("typeSaveResultCardBtn");
    const saveDanmuBtn = document.getElementById("typeSaveDanmuCardBtn");
    const copyBtn = document.getElementById("typeCopyShareBtn");

    async function saveCard(btn, template, suffix) {
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "生成中...";
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
        btn.textContent = "已保存";
      } catch (e) {
        btn.textContent = "保存失败";
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
        copyBtn.textContent = "已复制";
        setTimeout(() => {
          copyBtn.textContent = "👉 发给朋友看看他们是哪种";
        }, 1200);
      } catch (e) {
        copyBtn.textContent = "复制失败";
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
      const ts = Array.isArray(type.cardTraits) ? type.cardTraits.slice(0, 3) : type.traits.slice(0, 3);
      const quote = type.cardHeadline || type.oneLiner;
      return `
      <a class="feed-card" href="/types/${type.slug}/" aria-label="查看 ${type.name} ${type.code}" data-track="type_card_click" data-track-meta="${type.code}">
        <div class="tag">${type.code}</div>
        <h3>${type.cardName || type.name}</h3>
        <p class="quote">「${escapeHtml(quote)}」</p>
        <p class="feed-traits">${em[0]} ${escapeHtml(ts[0] || "")} · ${em[1]} ${escapeHtml(ts[1] || "")} · ${em[2]} ${escapeHtml(ts[2] || "")}</p>
        <p class="feed-cta">我有点像 →</p>
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

    const rd = window.NBTI_DATA.rankingsData;
    if (!rd || !rd.rankings || !rd.rankings.all_time) {
      root.innerHTML = "<article class='card'>排行榜数据暂未准备好。</article>";
      return;
    }

    const fmtNum = (n) => Number(n || 0).toLocaleString("zh-CN");
    const trendClass = (t) =>
      String(t || "").includes("↑") ? "up" : String(t || "").includes("↓") ? "down" : String(t || "") === "NEW" ? "new" : "flat";

    const state = { mode: "all_time" };

    function build(mode) {
      const rows = rd.rankings[mode] || rd.rankings.all_time;
      const top3 = rows.slice(0, 3);
      const fast = rows.find((x) => x.code === "SBC") || rows[0];

      const topCards = top3
        .map((r, i) => {
          const t = byCode(r.code);
          const em = CARD_EMOJI_MAP[r.code] || ["✨", "🧩", "⚡"];
          const traits = t && Array.isArray(t.cardTraits) ? t.cardTraits.slice(0, 3) : ["特征1", "特征2", "特征3"];
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
          return `
          <article class="card top-rank-card">
            <p class="muted">${medal} TOP ${i + 1}</p>
            <h3>#${i + 1} ${r.type_name} ${r.code}</h3>
            <p>「${escapeHtml((t && (t.cardHeadline || t.oneLiner)) || "")}」</p>
            <p class="muted">${em[0]} ${traits[0]} · ${em[1]} ${traits[1]} · ${em[2]} ${traits[2]}</p>
            <p><strong>当前占比：${r.share.toFixed(1)}%</strong></p>
            <button class="btn ghost rank-share-btn" data-code="${r.code}">生成分享卡</button>
          </article>
        `;
        })
        .join("");

      const tableRows = rows
        .map((r) => {
          const t = byCode(r.code);
          const slug = t ? t.slug : "";
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
          <p class="muted">这个榜单，来自所有完成测试的结果</p>
          <div class="stats-grid">
            <article class="card"><p class="muted">总提交数</p><h3>${fmtNum(rd.summary.total_submissions)}</h3></article>
            <article class="card"><p class="muted">已上榜人格</p><h3>${rd.summary.types_on_board} / ${rd.summary.types_total}</h3></article>
            <article class="card"><p class="muted">最近更新</p><h3>${rd.summary.last_updated_label || "3分钟前"}</h3></article>
            <article class="card"><p class="muted">今日新增</p><h3>${fmtNum(rd.summary.today_new)}</h3></article>
          </div>
        </section>

        <section class="section">
          <h2>TOP3 人格卡</h2>
          <div class="grid">${topCards}</div>
        </section>

        <section class="section">
          <div class="rank-head">
            <h2>排行榜主榜</h2>
            <div class="filter-row">
              <button class="chip ${mode === "all_time" ? "active" : ""}" data-rmode="all_time" data-track="rankings_mode_switch" data-track-meta="all_time">全部时间</button>
              <button class="chip ${mode === "seven_day" ? "active" : ""}" data-rmode="seven_day" data-track="rankings_mode_switch" data-track-meta="seven_day">最近7天</button>
              <button class="chip ${mode === "today" ? "active" : ""}" data-rmode="today" data-track="rankings_mode_switch" data-track-meta="today">今天</button>
            </div>
          </div>
          <p class="muted trend-legend"><span class="trend up">↑ 上升</span> · <span class="trend down">↓ 下降</span> · <span class="trend flat">— 持平</span> · <span class="trend new">NEW 新上榜</span></p>
          <div class="card rank-table-wrap">
            <table class="rank-table">
              <thead><tr><th>排名</th><th>人格</th><th>代码</th><th>提交量</th><th>占比</th><th>趋势</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <h2>这批人，整体更像这样</h2>
          <article class="card">
            <p>最容易对号入座的：脑洞玩家 / 内耗大师 / 情绪雷达</p>
            <p>最少见的：稳定输出机 / 情绪共振体 / 现实派</p>
            <p>最近涨得最快：${fast.type_name} ${fast.trend}</p>
            <p>最容易测混的两种：脑洞玩家 ↔ 多版本玩家；内耗大师 ↔ 情绪雷达</p>
          </article>
        </section>

        <section class="section">
          <h2>整体状态分布（7维平均）</h2>
          <article class="card">
            <p>探索倾向：偏高</p>
            <p>情绪敏感：中高</p>
            <p>执行稳定：中等偏低</p>
            <p>社交驱动：分化明显</p>
            <p>边界感：两极分布</p>
            <p>表达驱动：波动较大</p>
            <p>自我稳定：整体不稳定</p>
          </article>
        </section>

        <section class="section">
          <h2>榜单说明</h2>
          <details class="card">
            <summary>榜单说明</summary>
            <p>这个榜单，来自所有完成测试的结果。</p>
            <p>它反映的是当前这批人的状态分布，不是标准答案。</p>
            <p>每次刷新，这张榜都会变一点。</p>
          </details>
          <p class="muted">这是当前这批人的真实分布，不是标准答案。</p>
        </section>

        <section class="section">
          <h2>你在榜上哪一类？</h2>
          <p>测完再看这张榜，会更像在看自己。</p>
          <div class="cta-row"><a class="btn" href="/test/" data-track="rankings_cta_click" data-track-meta="bottom">👉 我也去测一下</a></div>
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
            window.location.href = `/types/${slug}/`;
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
          btn.textContent = "生成中...";
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
            btn.textContent = "已保存";
          } catch (err) {
            btn.textContent = "保存失败";
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
    root.innerHTML = window.NBTI_DATA.faq
      .map((item) => `<article class="card"><h3>${item.q}</h3><p>${item.a}</p></article>`)
      .join('<div style="height:10px"></div>');
  }

  function hydrateYear() {
    const yearNodes = document.querySelectorAll("[data-year]");
    yearNodes.forEach((n) => {
      n.textContent = String(new Date().getFullYear());
    });
  }

  function boot() {
    applyUnifiedSiteChrome();
    setupTrackingDelegation();
    hydrateYear();
    setupTestPage();
    renderResultPage();
    renderTypeDetail();
    renderTypesPage();
    renderRankingsPage();
    renderFaqPage();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
