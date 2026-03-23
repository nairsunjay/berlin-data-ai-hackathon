// Lightdash Licensing Advisor - Content Script
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
      Licensing Advisor
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

    // Determine total steps for this path (estimate: depth of tree)
    const totalSteps = estimateDepth(currentNodeKey);
    const currentStep = answers.length;

    // Header
    panel.innerHTML = `
      <div class="lq-header">
        <h3 class="lq-title">Licensing Advisor</h3>
        <button class="lq-close" aria-label="Close">&times;</button>
      </div>
      <p class="lq-subtitle">Answer a few questions to get tailored licensing insights</p>
    `;
    panel.querySelector(".lq-close").addEventListener("click", closeOverlay);

    // Step dots
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

    // Breadcrumb
    if (answers.length > 0) {
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
    node.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "lq-option";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => handleAnswer(opt));
      optionsDiv.appendChild(btn);
    });
    panel.appendChild(optionsDiv);

    // Back button
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

    if (option.next) {
      currentNodeKey = option.next;
      renderOverlay();
    } else {
      // End of tree - show summary + prompt
      renderSummary();
    }
  }

  function goBack() {
    if (answers.length === 0) return;
    const prev = answers.pop();
    currentNodeKey = prev.nodeKey;
    renderOverlay();
  }

  // ── Summary Screen ──────────────────────────────────────────
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

    // Header
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

    const questionLabels = [
      "Question",
      "Content type",
      "Priority",
      "Genre",
      "Budget",
    ];
    answers.forEach((a, i) => {
      const row = document.createElement("div");
      row.className = "lq-summary-row";
      row.innerHTML = `
        <span class="lq-summary-label">${questionLabels[i] || `Step ${i + 1}`}</span>
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

    // Submit button
    const submit = document.createElement("button");
    submit.className = "lq-submit";
    submit.textContent = "Send to Lightdash AI";
    submit.addEventListener("click", () => {
      closeOverlay();
      sendToLightdashAI(prompt);
    });
    panel.appendChild(submit);

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

  // ── Lightdash AI Integration ────────────────────────────────
  function sendToLightdashAI(prompt) {
    // Step 1: Click the AI button in the navbar (4th button in the button group)
    const aiButton = document.querySelector(
      '#navbar-header > header button:nth-child(4), [class*="ButtonGroup"] button:nth-child(4)'
    );
    if (aiButton) {
      aiButton.click();
    }

    // Step 2: Wait for the AI panel to open, then fill the textarea
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
        // Fallback: try to find any visible textarea on the page
        const fallback = document.querySelector('textarea[placeholder*="Ask"]');
        if (fallback) {
          fillAndSubmit(fallback, prompt);
        } else {
          showNotification(
            "Could not find the AI chat. Please open it manually and paste:",
            prompt
          );
        }
      }
    }, 300);
  }

  function findAITextarea() {
    // Look for the AI textarea by placeholder text
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
    // Focus and set value using native input setter to trigger React state
    textarea.focus();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    nativeInputValueSetter.call(textarea, prompt);

    // Dispatch events to trigger React's onChange
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));

    // Wait briefly for the submit button to become enabled
    setTimeout(() => {
      const submitBtn = document.querySelector(
        'button[aria-label="Send message"], button[class*="submitButton"]'
      );
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      } else {
        // Try again after a moment
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

  function showNotification(message, prompt) {
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
      <p class="lq-subtitle">${message}</p>
      <div class="lq-prompt-preview">${prompt}</div>
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
  // Wait for page to settle then inject trigger button
  function init() {
    createTriggerButton();
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
