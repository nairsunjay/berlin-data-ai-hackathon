// JustWatch Licensing Advisor - Content Script
// Injects questionnaire overlay and sends prompts to Lightdash AI

(function () {
  "use strict";

  // State
  let answers = []; // [{nodeKey, label, value}]
  let currentNodeKey = "root";

  // ── Trigger Button ──────────────────────────────────────────
  function createTriggerButton() {
    if (document.getElementById("lq-trigger")) return;
    const btn = document.createElement("button");
    btn.id = "lq-trigger";
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275z"/>
      </svg>
      JW Licensing Advisor
    `;
    btn.addEventListener("click", openQuestionnaire);
    document.body.appendChild(btn);
  }

  // ── Overlay ─────────────────────────────────────────────────
  function openQuestionnaire() {
    answers = [];
    currentNodeKey = "root";
    renderOverlay();
  }

  function closeOverlay() {
    const overlay = document.getElementById("lq-overlay");
    if (overlay) overlay.remove();
  }

  function renderOverlay() {
    closeOverlay();

    const node = DECISION_TREE[currentNodeKey];
    if (!node) return;

    const overlay = document.createElement("div");
    overlay.id = "lq-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });

    const panel = document.createElement("div");
    panel.id = "lq-panel";

    const isRoot = currentNodeKey === "root";

    // Header
    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">JustWatch Licensing Advisor</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      <p class="lq-subtitle">${isRoot
        ? "Your AI-powered guide to content licensing decisions"
        : "Answer a few questions to get tailored insights"}</p>
    `;
    panel.querySelector(".lq-close").addEventListener("click", closeOverlay);

    // Step dots (skip for root)
    if (!isRoot) {
      const totalSteps = estimateDepth(currentNodeKey);
      const currentStep = answers.length;
      const stepsDiv = document.createElement("div");
      stepsDiv.className = "lq-steps";
      const maxDots = currentStep + totalSteps;
      for (let i = 0; i < maxDots; i++) {
        const dot = document.createElement("div");
        dot.className = "lq-step-dot";
        if (i < currentStep) dot.classList.add("done");
        if (i === currentStep) dot.classList.add("active");
        stepsDiv.appendChild(dot);
      }
      panel.appendChild(stepsDiv);
    }

    // Breadcrumb (skip for root)
    if (answers.length > 0 && !isRoot) {
      const crumbDiv = document.createElement("div");
      crumbDiv.className = "lq-breadcrumb";
      answers.forEach((a, i) => {
        if (i > 0) {
          const sep = document.createElement("span");
          sep.className = "lq-crumb-sep";
          sep.textContent = ">";
          crumbDiv.appendChild(sep);
        }
        const crumb = document.createElement("span");
        crumb.className = "lq-crumb";
        crumb.textContent = a.label;
        crumb.title = a.label;
        crumbDiv.appendChild(crumb);
      });
      panel.appendChild(crumbDiv);
    }

    // Question
    const q = document.createElement("h4");
    q.className = "lq-question";
    q.textContent = node.question;
    panel.appendChild(q);

    // Options
    const optionsDiv = document.createElement("div");
    optionsDiv.className = "lq-options";

    if (isRoot) {
      // Root renders as two large cards with icons and descriptions
      optionsDiv.classList.add("lq-options-root");
      node.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "lq-option lq-option-card";
        const icon = opt.label === "Explain Analysis"
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
        btn.innerHTML = `
          <div class="lq-card-icon">${icon}</div>
          <div class="lq-card-text">
            <div class="lq-card-label">${opt.label}</div>
            <div class="lq-card-desc">${opt.description || ""}</div>
          </div>
        `;
        btn.addEventListener("click", () => handleAnswer(opt));
        optionsDiv.appendChild(btn);
      });
    } else {
      node.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "lq-option";
        btn.textContent = opt.label;
        btn.addEventListener("click", () => handleAnswer(opt));
        optionsDiv.appendChild(btn);
      });
    }
    panel.appendChild(optionsDiv);

    // Back button (not on root)
    if (answers.length > 0) {
      const back = document.createElement("button");
      back.className = "lq-back";
      back.innerHTML = "&#8592; Back";
      back.addEventListener("click", goBack);
      panel.appendChild(back);
    }

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function handleAnswer(option) {
    answers.push({
      nodeKey: currentNodeKey,
      label: option.label,
      value: option.value || option.label,
    });

    // "Explain Analysis" → enter inspect mode immediately
    if (option.label === "Explain Analysis") {
      closeOverlay();
      enterInspectMode();
      return;
    }

    if (option.next) {
      currentNodeKey = option.next;
      renderOverlay();
    } else {
      // End of tree: Explain shows inline, Guide sends to AI
      const isExplain = answers[0]?.label === "Explain Analysis";
      if (isExplain) {
        renderExplanation();
      } else {
        renderSummary();
      }
    }
  }

  function goBack() {
    if (answers.length === 0) return;
    const prev = answers.pop();
    currentNodeKey = prev.nodeKey;
    renderOverlay();
  }

  // ── Inspect Mode (click-on-chart to explain) ────────────────

  // Maps chart/tile titles (from dashboard YAML) to EXPLANATIONS keys
  const TITLE_TO_EXPLANATION = {
    // Ad Revenue dashboard
    "Total Est. Revenue Across 8 EU Markets": "kpi_total_revenue",
    "Est. AVOD & TVOD Revenue by Market": "market_revenue",
    "Revenue Efficiency (Per User)": "revenue_per_user",
    "How revenue is estimated": "methodology",
    "Top 20 Titles — Est. Ad Revenue (USD)": "top20_ad_revenue",
    "Est. Ad Revenue vs Licensing Score": "revenue_vs_score",
    "Est. Ad Revenue by Genre (Shows)": "genre_ad_revenue_shows",
    "AVOD vs TVOD Demand by Genre": "genre_avod_tvod",
    "Key genre insights": "genre_insights",
    // Challenge 6 dashboard
    "Users Engaged with Scored Content": "kpi_users",
    "AVOD Clickouts on Gap Titles": "kpi_avod_gap",
    "AVOD / TVOD Demand Ratio": "kpi_ratio",
    "Top 20 Licensing Priority Titles": "top20_priority",
    "Top 20 Licensing Gap Titles": "top20_gap",
    "Licensing Gap — Full List (Top 100)": "gap_table",
    "AVOD vs TVOD Score by Genre": "ch6_genre_avod_tvod",
    "AVOD Gap Rate by Genre": "ch6_gap_rate",
    "How to read this": "ch6_genre_howto",
  };

  let _inspectActive = false;
  let _inspectHighlight = null;
  let _inspectBanner = null;

  function enterInspectMode() {
    if (_inspectActive) return;
    _inspectActive = true;

    // Add inspect cursor to body
    document.body.style.cursor = "crosshair";

    // Show instruction banner
    _inspectBanner = document.createElement("div");
    _inspectBanner.id = "lq-inspect-banner";
    _inspectBanner.innerHTML = `
      <span>Click on any chart to explain it</span>
      <button id="lq-inspect-cancel">✕ Cancel</button>
    `;
    document.body.appendChild(_inspectBanner);
    document.getElementById("lq-inspect-cancel").addEventListener("click", exitInspectMode);

    // Create highlight overlay element
    _inspectHighlight = document.createElement("div");
    _inspectHighlight.id = "lq-inspect-highlight";
    document.body.appendChild(_inspectHighlight);

    // Bind events
    document.addEventListener("mousemove", inspectMouseMove, true);
    document.addEventListener("click", inspectClick, true);
    document.addEventListener("keydown", inspectKeyDown, true);
  }

  function exitInspectMode() {
    if (!_inspectActive) return;
    _inspectActive = false;

    document.body.style.cursor = "";

    if (_inspectBanner) { _inspectBanner.remove(); _inspectBanner = null; }
    if (_inspectHighlight) { _inspectHighlight.remove(); _inspectHighlight = null; }

    document.removeEventListener("mousemove", inspectMouseMove, true);
    document.removeEventListener("click", inspectClick, true);
    document.removeEventListener("keydown", inspectKeyDown, true);
  }

  function inspectKeyDown(e) {
    if (e.key === "Escape") exitInspectMode();
  }

  function findTileElement(el) {
    // Walk up from the hovered element to find a Lightdash dashboard tile
    let node = el;
    while (node && node !== document.body) {
      // Lightdash tiles typically have role, data attributes, or class patterns
      if (node.classList && (
        node.classList.toString().includes("tile") ||
        node.classList.toString().includes("Tile") ||
        node.classList.toString().includes("ChartView") ||
        node.getAttribute("data-testid")?.includes("tile")
      )) {
        return node;
      }
      // Also match grid items in the dashboard
      if (node.classList && node.classList.toString().includes("react-grid-item")) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function getTileTitle(tileEl) {
    // Try to find the tile's title text
    // Lightdash renders tile headers with the chart title
    const headerEl = tileEl.querySelector('[class*="TileHeader"] span, [class*="tileHeader"] span, [class*="Title"], header span');
    if (headerEl) return headerEl.textContent.trim();

    // Fallback: look for any heading-like text in the tile
    const h = tileEl.querySelector("h3, h4, h5, [class*=\"title\"], [class*=\"Title\"]");
    if (h) return h.textContent.trim();

    // Fallback: first span in the tile that matches a known title
    const spans = tileEl.querySelectorAll("span");
    for (const s of spans) {
      const text = s.textContent.trim();
      if (TITLE_TO_EXPLANATION[text]) return text;
    }

    return null;
  }

  function findExplanationKey(tileEl) {
    const title = getTileTitle(tileEl);
    if (!title) return null;

    // Exact match
    if (TITLE_TO_EXPLANATION[title]) return TITLE_TO_EXPLANATION[title];

    // Fuzzy: check if any known title is a substring
    for (const [knownTitle, key] of Object.entries(TITLE_TO_EXPLANATION)) {
      if (title.includes(knownTitle) || knownTitle.includes(title)) return key;
    }

    return null;
  }

  function inspectMouseMove(e) {
    const tile = findTileElement(e.target);
    if (tile && _inspectHighlight) {
      const rect = tile.getBoundingClientRect();
      _inspectHighlight.style.display = "block";
      _inspectHighlight.style.top = rect.top + window.scrollY + "px";
      _inspectHighlight.style.left = rect.left + window.scrollX + "px";
      _inspectHighlight.style.width = rect.width + "px";
      _inspectHighlight.style.height = rect.height + "px";

      const title = getTileTitle(tile);
      _inspectHighlight.setAttribute("data-label", title || "Unknown chart");
    } else if (_inspectHighlight) {
      _inspectHighlight.style.display = "none";
    }
  }

  function inspectClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const tile = findTileElement(e.target);
    if (!tile) return;

    const key = findExplanationKey(tile);
    exitInspectMode();

    if (key && EXPLANATIONS[key]) {
      showExplanationByKey(key);
    } else {
      const title = getTileTitle(tile) || "this chart";
      showExplanationNotFound(title);
    }
  }

  function closeSidePanel() {
    const panel = document.getElementById("lq-side-panel");
    if (panel) panel.remove();
    // Restore containers
    const containers = [
      document.getElementById("root"),
      document.querySelector('[class*="AppContainer"]'),
      document.querySelector('[class*="app-container"]'),
      document.querySelector("main"),
      document.body,
    ].filter(Boolean);
    containers.forEach((el) => {
      el.style.removeProperty("width");
      el.style.removeProperty("max-width");
      el.style.removeProperty("overflow-x");
    });
    document.documentElement.style.removeProperty("overflow-x");
  }

  function openSidePanel() {
    const panelWidth = 360;
    const containers = [
      document.getElementById("root"),
      document.querySelector('[class*="AppContainer"]'),
      document.querySelector('[class*="app-container"]'),
      document.querySelector("main"),
      document.body,
    ].filter(Boolean);
    containers.forEach((el) => {
      el.style.width = `calc(100vw - ${panelWidth}px)`;
      el.style.maxWidth = `calc(100vw - ${panelWidth}px)`;
      el.style.overflowX = "hidden";
    });
    document.documentElement.style.overflowX = "hidden";
  }

  function showExplanationByKey(key) {
    const info = EXPLANATIONS[key];
    if (!info) return;

    closeSidePanel();
    openSidePanel();

    const panel = document.createElement("div");
    panel.id = "lq-side-panel";

    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">${info.title}</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      <div class="lq-explain-meta">
        <span class="lq-explain-tag lq-tag-chart">${info.chart}</span>
        <span class="lq-explain-tag lq-tag-model">${info.model}</span>
      </div>
      <div class="lq-explain-body">${info.explanation}</div>
      <div class="lq-explain-action">
        <div class="lq-explain-action-label">What to do with this</div>
        <div class="lq-explain-action-text">${info.action}</div>
      </div>
    `;
    panel.querySelector(".lq-close").addEventListener("click", closeSidePanel);

    const again = document.createElement("button");
    again.className = "lq-submit";
    again.textContent = "Inspect another chart";
    again.addEventListener("click", () => {
      closeSidePanel();
      enterInspectMode();
    });
    panel.appendChild(again);

    const restart = document.createElement("button");
    restart.className = "lq-submit lq-submit-secondary";
    restart.textContent = "Back to menu";
    restart.addEventListener("click", () => {
      closeSidePanel();
      openQuestionnaire();
    });
    panel.appendChild(restart);

    document.body.appendChild(panel);
  }

  function showExplanationNotFound(title) {
    closeSidePanel();
    openSidePanel();

    const panel = document.createElement("div");
    panel.id = "lq-side-panel";
    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">No explanation available</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      <p style="color:#868e96;font-size:14px;margin:16px 0">Could not find an explanation for <strong>"${title}"</strong>. Try clicking on a chart tile.</p>
    `;
    panel.querySelector(".lq-close").addEventListener("click", closeSidePanel);

    const again = document.createElement("button");
    again.className = "lq-submit";
    again.textContent = "Try again";
    again.addEventListener("click", () => {
      closeSidePanel();
      enterInspectMode();
    });
    panel.appendChild(again);

    document.body.appendChild(panel);
  }

  // ── Explanation Screen (inline, no AI) ──────────────────────
  function renderExplanation() {
    closeOverlay();

    const info = getExplanation(answers);
    if (!info) return;

    const overlay = document.createElement("div");
    overlay.id = "lq-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });

    const panel = document.createElement("div");
    panel.id = "lq-panel";

    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">${info.title}</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      <div class="lq-explain-meta">
        <span class="lq-explain-tag lq-tag-chart">${info.chart}</span>
        <span class="lq-explain-tag lq-tag-model">${info.model}</span>
      </div>
      <div class="lq-explain-body">${info.explanation}</div>
      <div class="lq-explain-action">
        <div class="lq-explain-action-label">What to do with this</div>
        <div class="lq-explain-action-text">${info.action}</div>
      </div>
    `;
    panel.querySelector(".lq-close").addEventListener("click", closeOverlay);

    // Back button
    const back = document.createElement("button");
    back.className = "lq-back";
    back.innerHTML = "&#8592; Back";
    back.addEventListener("click", () => {
      const prev = answers.pop();
      currentNodeKey = prev.nodeKey;
      renderOverlay();
    });
    panel.appendChild(back);

    // Start over button
    const restart = document.createElement("button");
    restart.className = "lq-back";
    restart.style.marginLeft = "16px";
    restart.innerHTML = "Start over";
    restart.addEventListener("click", openQuestionnaire);
    panel.appendChild(restart);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  // ── Summary Screen (for Guide flow, sends to AI) ───────────
  function renderSummary() {
    closeOverlay();

    const prompt = buildPrompt(answers);

    const overlay = document.createElement("div");
    overlay.id = "lq-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });

    const panel = document.createElement("div");
    panel.id = "lq-panel";

    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">Your Licensing Query</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      <p class="lq-subtitle">Review your selections and send to Lightdash AI</p>
    `;
    panel.querySelector(".lq-close").addEventListener("click", closeOverlay);

    // Summary of answers
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "lq-summary";
    answers.forEach((a, i) => {
      const row = document.createElement("div");
      row.className = "lq-summary-row";
      row.innerHTML = `
        <span class="lq-summary-label">Step ${i + 1}</span>
        <span class="lq-summary-value">${a.label}</span>
      `;
      summaryDiv.appendChild(row);
    });
    panel.appendChild(summaryDiv);

    // Prompt preview
    const previewLabel = document.createElement("p");
    previewLabel.className = "lq-subtitle";
    previewLabel.style.marginBottom = "8px";
    previewLabel.textContent = "Prompt that will be sent to Lightdash AI:";
    panel.appendChild(previewLabel);

    const preview = document.createElement("div");
    preview.className = "lq-prompt-preview";
    preview.textContent = prompt;
    panel.appendChild(preview);

    // MCP button (facade — shows spinner for 3s)
    const mcpBtn = document.createElement("button");
    mcpBtn.className = "lq-submit";
    mcpBtn.textContent = "Ask via MCP";
    mcpBtn.addEventListener("click", () => {
      closeOverlay();
      renderResponsePanel('<div class="lq-loading"><div class="lq-spinner"></div></div><p class="lq-loading-text">Connecting to Lightdash MCP...</p>', true);
      setTimeout(() => { closeOverlay(); }, 3000);
    });
    panel.appendChild(mcpBtn);

    // Send to Lightdash AI panel (primary action)
    const fallbackBtn = document.createElement("button");
    fallbackBtn.className = "lq-submit lq-submit-secondary";
    fallbackBtn.textContent = "Send to Lightdash AI Panel";
    fallbackBtn.addEventListener("click", () => {
      closeOverlay();
      sendToLightdashAIPanel(prompt);
    });
    panel.appendChild(fallbackBtn);

    // Back button
    const back = document.createElement("button");
    back.className = "lq-back";
    back.innerHTML = "&#8592; Change answers";
    back.addEventListener("click", () => {
      const prev = answers.pop();
      currentNodeKey = prev.nodeKey;
      renderOverlay();
    });
    panel.appendChild(back);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  // ── MCP Integration ────────────────────────────────────────
  async function sendViaMCP(prompt) {
    renderResponsePanel("Connecting to Lightdash MCP...", true);

    // Build structured query from answers
    const mcpQuery = buildMcpQuery(answers);

    try {
      if (!LightdashMCP.isInitialized()) {
        updateResponsePanel("Initializing MCP session...");
      }

      // Discover tools and capture their schemas for debugging
      const tools = await LightdashMCP.discoverTools();
      const toolNames = tools.map((t) => t.name);

      // Log tool schema for debugging
      const runMetricTool = tools.find((t) => t.name === "run_metric_query");
      if (runMetricTool) {
        console.log("[LQ] run_metric_query schema:", JSON.stringify(runMetricTool.inputSchema || runMetricTool, null, 2));
      }

      updateResponsePanel("Running query: " + (mcpQuery ? mcpQuery.title : "..."));

      let result;

      if (mcpQuery && toolNames.includes("run_metric_query")) {
        // Log what we're sending
        const fullArgs = {
          title: mcpQuery.title,
          description: mcpQuery.description,
          queryConfig: mcpQuery.queryConfig,
        };
        console.log("[LQ] Sending run_metric_query args:", JSON.stringify(fullArgs, null, 2));

        // Use structured query (no streaming to simplify debugging)
        result = await LightdashMCP.runMetricQuery(
          mcpQuery.title,
          mcpQuery.description,
          mcpQuery.queryConfig
        );
        console.log("[LQ] Raw result:", JSON.stringify(result));
      } else {
        // Try calling any available tool that might accept a prompt
        const aiTool = tools.find((t) =>
          ["ask", "chat", "generate", "query"].some((k) =>
            t.name.toLowerCase().includes(k)
          )
        );

        if (aiTool) {
          result = await LightdashMCP.callToolByName(
            aiTool.name,
            { prompt: prompt, question: prompt, query: prompt },
          );
        } else {
          renderResponsePanel(
            `<div class="lq-mcp-error">
              <strong>Available MCP tools:</strong> ${toolNames.join(", ")}<br><br>
              No matching query could be built. Try the Lightdash AI Panel instead.
            </div>`,
            false,
            prompt
          );
          return;
        }
      }

      // Render final result
      if (result && result.content) {
        const text = result.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n\n");
        renderResponsePanel(formatResponse(text), false);
      } else {
        renderResponsePanel("Query completed but returned no content.", false);
      }
    } catch (err) {
      console.error("[LQ] MCP error:", err);
      const errorMsg = err.message || "Unknown error";
      const errorData = err.data ? "\n\nDetails: " + JSON.stringify(err.data, null, 2) : "";

      // Include tool schema and sent queryConfig in error for debugging
      let debugInfo = "";
      try {
        const tools = LightdashMCP.getTools();
        const runMetricTool = tools.find((t) => t.name === "run_metric_query");
        if (runMetricTool && runMetricTool.inputSchema) {
          debugInfo += "\n\nTool schema:\n" + JSON.stringify(runMetricTool.inputSchema, null, 2);
        }
        if (mcpQuery) {
          debugInfo += "\n\nSent queryConfig:\n" + JSON.stringify(mcpQuery.queryConfig, null, 2);
        }
      } catch (_) {}

      renderResponsePanel(
        `<div class="lq-mcp-error">
          <strong>MCP error:</strong> ${escapeHtml(errorMsg)}
          ${errorData ? '<pre style="font-size:11px;margin-top:8px;white-space:pre-wrap">' + escapeHtml(errorData) + "</pre>" : ""}
          ${debugInfo ? '<details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px">Debug info</summary><pre style="font-size:10px;margin-top:4px;white-space:pre-wrap;max-height:200px;overflow:auto">' + escapeHtml(debugInfo) + "</pre></details>" : ""}
        </div>`,
        false,
        prompt
      );
    }
  }

  function renderResponsePanel(content, isLoading, fallbackPrompt) {
    closeOverlay();

    const overlay = document.createElement("div");
    overlay.id = "lq-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });

    const panel = document.createElement("div");
    panel.id = "lq-panel";
    panel.style.maxWidth = "640px";

    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">Lightdash AI Response</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      ${isLoading ? '<div class="lq-loading"><div class="lq-spinner"></div></div>' : ""}
      <div id="lq-response-body" class="lq-response-body">${isLoading ? '<p class="lq-loading-text">' + escapeHtml(content) + "</p>" : content}</div>
    `;
    panel.querySelector(".lq-close").addEventListener("click", closeOverlay);

    // If there's a fallback prompt (MCP failed), show fallback button
    if (fallbackPrompt) {
      const fallbackBtn = document.createElement("button");
      fallbackBtn.className = "lq-submit";
      fallbackBtn.textContent = "Try via Lightdash AI Panel instead";
      fallbackBtn.addEventListener("click", () => {
        closeOverlay();
        sendToLightdashAIPanel(fallbackPrompt);
      });
      panel.appendChild(fallbackBtn);

      const copyBtn = document.createElement("button");
      copyBtn.className = "lq-submit lq-submit-secondary";
      copyBtn.textContent = "Copy prompt to clipboard";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(fallbackPrompt);
        copyBtn.textContent = "Copied!";
      });
      panel.appendChild(copyBtn);
    }

    // Action buttons row
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.marginTop = "12px";

    const startOver = document.createElement("button");
    startOver.className = "lq-back";
    startOver.innerHTML = "Start over";
    startOver.addEventListener("click", openQuestionnaire);
    actions.appendChild(startOver);

    panel.appendChild(actions);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function updateResponsePanel(text) {
    const el = document.querySelector("#lq-response-body");
    if (el) {
      el.innerHTML = '<p class="lq-loading-text">' + escapeHtml(text) + "</p>";
    }
  }

  function formatResponse(text) {
    // Basic markdown-like formatting
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="lq-inline-code">$1</code>')
      .replace(/\n/g, "<br>");
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Fallback: inject into Lightdash AI panel ───────────────
  function sendToLightdashAIPanel(prompt) {
    // Click the AI button in the navbar
    const aiButton = document.querySelector(
      '#navbar-header > header button:nth-child(4), [class*="ButtonGroup"] button:nth-child(4)'
    );
    if (aiButton) {
      aiButton.click();
    }

    const maxAttempts = 20;
    let attempt = 0;

    const interval = setInterval(() => {
      attempt++;
      const textarea = findAITextarea();

      if (textarea) {
        clearInterval(interval);
        fillAndSubmit(textarea, prompt);
      } else if (attempt >= maxAttempts) {
        clearInterval(interval);
        const fallback = document.querySelector('textarea[placeholder*="Ask"]');
        if (fallback) {
          fillAndSubmit(fallback, prompt);
        } else {
          showCopyNotification(prompt);
        }
      }
    }, 300);
  }

  function findAITextarea() {
    const selectors = [
      'textarea[placeholder*="Ask team"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="anything about your data"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }

  function fillAndSubmit(textarea, prompt) {
    textarea.focus();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    nativeInputValueSetter.call(textarea, prompt);

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));

    setTimeout(() => {
      const submitBtn = document.querySelector(
        'button[aria-label="Send message"], button[class*="submitButton"]'
      );
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      } else {
        setTimeout(() => {
          const btn = document.querySelector(
            'button[aria-label="Send message"], button[class*="submitButton"]'
          );
          if (btn && !btn.disabled) {
            btn.click();
          }
        }, 500);
      }
    }, 300);
  }

  function showCopyNotification(prompt) {
    closeOverlay();
    const overlay = document.createElement("div");
    overlay.id = "lq-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const panel = document.createElement("div");
    panel.id = "lq-panel";
    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">Prompt Ready</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      <p class="lq-subtitle">Could not find the AI chat. Copy the prompt and paste it manually:</p>
      <div class="lq-prompt-preview">${escapeHtml(prompt)}</div>
    `;
    panel.querySelector(".lq-close").addEventListener("click", () => overlay.remove());

    const copyBtn = document.createElement("button");
    copyBtn.className = "lq-submit";
    copyBtn.textContent = "Copy to Clipboard";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(prompt);
      copyBtn.textContent = "Copied!";
      setTimeout(() => overlay.remove(), 800);
    });
    panel.appendChild(copyBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  // ── Helpers ─────────────────────────────────────────────────
  function estimateDepth(nodeKey) {
    let depth = 0;
    let key = nodeKey;
    while (key && DECISION_TREE[key]) {
      depth++;
      const firstOption = DECISION_TREE[key].options[0];
      key = firstOption?.next || null;
    }
    return depth;
  }

  // ── Initialize ──────────────────────────────────────────────
  function init() {
    createTriggerButton();
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
