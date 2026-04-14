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
      window.NBTI_DATA.answerOptions.forEach((opt) => {
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
      <section class="card">
        <picture>
          <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
          <img class="hero-cover" src="/assets/types/${type.slug}.png" alt="${type.name} ${type.code} 插图" />
        </picture>
        <div class="tag">NBTI 结果</div>
        <h1>${type.name} ${type.code}</h1>
        <p class="lead">${type.oneLiner}</p>
        ${secondary ? `<p class="muted">次人格倾向：${secondary.name} ${secondary.code}</p>` : ""}
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
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareText);
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

    root.innerHTML = `
      <section class="card">
        <picture>
          <source srcset="/assets/types/${type.slug}.webp" type="image/webp" />
          <img class="hero-cover" src="/assets/types/${type.slug}.png" alt="${type.name} ${type.code} 插图" />
        </picture>
        <div class="tag">${type.code}</div>
        <h1>${type.name}</h1>
        <p class="lead">${type.oneLiner}</p>
        <p>${type.mechanism}</p>
      </section>
      <section class="section">
        <h2>行为分析</h2>
        <p><strong>别人眼里的你：</strong>${withBreaks(type.outsideView)}</p>
        <p><strong>关系模式：</strong>${withBreaks(type.relationMode)}</p>
        <p><strong>职场 / 创作模式：</strong>${withBreaks(type.workMode)}</p>
      </section>
      <section class="section">
        <h2>优势 / 问题</h2>
        <p><strong>你的强项：</strong>${withBreaks(type.strengths)}</p>
        <p><strong>你的隐性 Bug：</strong>${withBreaks(type.hiddenBug)}</p>
        <p><strong>压力状态：</strong>${withBreaks(type.stressMode)}</p>
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
        <h2>FAQ</h2>
        <p><strong>会不会变？</strong> 会，状态和环境变化都会影响结果。</p>
        <p><strong>适合什么工作场景？</strong> ${type.workMode}</p>
      </section>
      <section class="section">
        <h2>相关推荐</h2>
        <div id="related" class="type-list"></div>
      </section>
      <section class="section">
        <h2>CTA</h2>
        <div class="cta-row">
          <a class="btn" href="/test/">进入测试（2分钟）</a>
          <a class="btn secondary" href="${codePath(type.code)}">看结果样例</a>
        </div>
      </section>
    `;

    const related = window.NBTI_DATA.types
      .filter((item) => item.slug !== type.slug)
      .slice(0, 3)
      .map(renderTypeCard)
      .join("");
    const relatedNode = document.getElementById("related");
    relatedNode.innerHTML = related;
  }

  function renderTypesPage() {
    const root = document.getElementById("types-list-app");
    if (!root) return;
    root.innerHTML = window.NBTI_DATA.types.map(renderTypeCard).join("");
  }

  function renderRankingsPage() {
    const root = document.getElementById("rankings-app");
    if (!root) return;
    const list = window.NBTI_DATA.rankingsMock
      .map((row) => {
        const type = byCode(row.code);
        return `
          <div class="rank-item">
            <div>#${row.rank} · ${type ? type.name : row.code} (${row.code})</div>
            <strong>${row.ratio}</strong>
          </div>
        `;
      })
      .join("");
    root.innerHTML = list;
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
