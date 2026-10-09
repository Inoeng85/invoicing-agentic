(function () {
  const columns = [
    { id: "intake", title: "Intake", agent: "Agent Intake", human: false, actor: "IN", hint: "Antrian phase & taskIds" },
    { id: "plan", title: "Plan", agent: "Agent Plan", human: false, actor: "PL", hint: "Plan + skills per task (berurutan)" },
    { id: "development", title: "Development", agent: "Agent Development", human: false, actor: "DV", hint: "Task sedang dikerjakan" },
    { id: "test", title: "Test", agent: "Agent QA", human: false, actor: "QA", hint: "Menunggu uji" },
    { id: "audit", title: "Audit", agent: "Agent Audit", human: false, actor: "AU", hint: "Review phase" },
    { id: "human-clarify", title: "Human Clarify", agent: "Manusia", human: true, actor: "HC", hint: "Klarifikasi" },
    { id: "human-qa", title: "Human QA", agent: "Manusia", human: true, actor: "HQ", hint: "Gate release" },
    { id: "done", title: "Done", agent: "Selesai", human: true, done: true, actor: "OK", hint: "Task/phase selesai" }
  ];

  const BOARD_URLS = [
    new URL("data/kanban-board.json", window.location.href).href,
    new URL("../../development/Plan/kanban-board.json", window.location.href).href
  ];
  const POLL_MS = 15000;
  const storageKey = "agentic-kanban-board-v6";
  const uiStorageKey = "agentic-kanban-ui-v1";
  const LANE_COLLAPSE_THRESHOLD = 20;
  /** Agentic repo root from docs/PRD/0800-orkestrasi-stage/ (coba beberapa layout workspace). */
  const REPO_ROOT_BASES = ["../../../", "../../../../Agentic/", "../../../../../Agentic/"];
  const WORKSPACE_PREFIX = "Agentic/";

  const boardEl = document.getElementById("board");
  const dialog = document.getElementById("phase-dialog");
  const search = document.getElementById("search");
  const actorFilter = document.getElementById("actor-filter");
  const epicFilter = document.getElementById("epic-filter");
  const viewMode = document.getElementById("view-mode");
  const agenticOnly = document.getElementById("agentic-only");
  const compactMode = document.getElementById("compact-mode");
  const phaseProgSel = document.getElementById("phase-progress-select");
  const resetPinsBtn = document.getElementById("reset-pins");
  const stageSelect = document.getElementById("stage-select");
  const toastEl = document.getElementById("toast");
  const loadStatusEl = document.getElementById("queue-load-status");
  const liveStatusEl = document.getElementById("live-status");

  let toastTimer;
  let pollTimer;
  let boardSnapshot = null;
  let tasks = {};
  let phases = {};
  let columnState = {};
  let taskOverrides = {};
  let phaseOverrides = {};
  let draggedId = null;
  let activeCard = null;
  let storageAvailable = true;
  let uiState = { compact: false, lanes: {} };
  let wantedEpic = null;
  let wantedPhase = null;

  const validColumnIds = columns.map(function (c) { return c.id; });

  function columnMeta(id) {
    return columns.find(function (c) { return c.id === id; });
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3500);
  }

  function getOrchestrator() {
    return boardSnapshot && boardSnapshot.orchestrator ? boardSnapshot.orchestrator : null;
  }

  function orchestratorStepLabel(next) {
    if (!next || !next.action) return "Tidak ada langkah otomatis";
    if (next.action === "run_intake") return "Intake · phase " + next.phaseId;
    if (next.action === "run_plan_task") return "Plan · " + next.taskId + " (" + next.taskIndex + "/" + next.taskTotal + ")";
    if (next.action === "finalize_plan") return "Plan · finalisasi phase " + next.phaseId;
    if (next.action === "run_development_task") return "Development · " + next.taskId + " · phase " + next.phaseId;
    if (next.action === "human_clarify") return "Menunggu klarifikasi manusia";
    if (next.action === "wait_prior_release") return "Menunggu release phase sebelumnya";
    if (next.action === "idle") return "Idle — tidak ada task antrian";
    return next.action;
  }

  function copyText(text) {
    if (!text) return Promise.reject(new Error("empty"));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function triggerPrimaryAction() {
    var orch = getOrchestrator();
    if (!orch || !orch.agentPrompt) {
      showToast("Belum ada prompt — jalankan npm run agentic:kanban-data");
      return;
    }
    copyText(orch.agentPrompt).then(function () {
      var cmd = orch.terminalExecute || "npm run agentic:trigger-next -- --execute";
      if (orch.next && orch.next.action === "run_development_task") {
        showToast("Prompt Development disalin. Jalankan agent, lalu: " + cmd + " (--write sesi dev)");
      } else {
        showToast("Prompt disalin · terminal: " + cmd);
      }
    }).catch(function () {
      showToast("Gagal menyalin — buka pratinjau prompt di bawah");
      var wrap = document.getElementById("intake-trigger-prompt-wrap");
      if (wrap) wrap.open = true;
    });
  }

  function renderIntakeTriggerPanel() {
    var summaryEl = document.getElementById("intake-trigger-summary");
    var pre = document.getElementById("intake-trigger-prompt");
    var wrap = document.getElementById("intake-trigger-prompt-wrap");
    var btnPrimary = document.getElementById("trigger-task-primary");
    var btnCopy = document.getElementById("trigger-copy-prompt");
    var btnTerm = document.getElementById("trigger-copy-terminal");
    if (!summaryEl) return;
    var orch = getOrchestrator();
    if (!orch || !orch.next) {
      summaryEl.textContent = "Orkestrator belum ada di kanban-board.json — npm run agentic:kanban-data";
      if (btnPrimary) btnPrimary.disabled = true;
      if (btnCopy) btnCopy.disabled = true;
      if (btnTerm) btnTerm.disabled = true;
      if (wrap) wrap.hidden = true;
      return;
    }
    var col = orch.targetColumn;
    var colTitle = col ? (columnMeta(col) || {}).title || col : "—";
    var ap = orch.autopilot;
    var apLine = ap && ap.smallestUndone
      ? " · Autopilot (terkecil): " + (ap.smallestUndone.taskId || ap.smallestUndone.phaseId || ap.smallestUndone.kind)
      : "";
    summaryEl.textContent =
      "Langkah berikutnya: " + orchestratorStepLabel(orch.next) +
      (col ? " → kolom " + colTitle : "") +
      (orch.next.orchestratorStage === "development" ? " · sesi dev via prompt" : "") +
      apLine;
    if (pre) pre.textContent = orch.agentPrompt || "";
    if (wrap) wrap.hidden = !(orch.agentPrompt && orch.agentPrompt.length);
    var hasPrompt = !!(orch.agentPrompt && orch.agentPrompt.trim());
    if (btnPrimary) {
      btnPrimary.disabled = !hasPrompt;
      btnPrimary.textContent = orch.next.action === "run_development_task" ? "Trigger Development" : "Trigger task";
    }
    if (btnCopy) btnCopy.disabled = !hasPrompt;
    if (btnTerm) btnTerm.disabled = !orch.terminalExecute;
  }

  function loadOverrides() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      taskOverrides = saved.taskOverrides || {};
      phaseOverrides = saved.phaseOverrides || {};
    } catch (_) {
      storageAvailable = false;
    }
  }

  function saveOverrides() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        boardGeneratedAt: boardSnapshot && boardSnapshot.generatedAt,
        taskOverrides: taskOverrides,
        phaseOverrides: phaseOverrides
      }));
      storageAvailable = true;
    } catch (_) {
      storageAvailable = false;
    }
  }

  function loadUiState() {
    try {
      const saved = JSON.parse(localStorage.getItem(uiStorageKey) || "{}");
      uiState = { compact: !!saved.compact, lanes: saved.lanes || {} };
    } catch (_) {
      storageAvailable = false;
    }
  }

  function saveUiState() {
    try {
      localStorage.setItem(uiStorageKey, JSON.stringify(uiState));
    } catch (_) {
      storageAvailable = false;
    }
  }

  function applyHashToControls() {
    const h = new URLSearchParams(window.location.hash.slice(1));
    viewMode.value = h.get("view") === "phases" ? "phases" : "tasks";
    actorFilter.value = ["agent", "human"].includes(h.get("actor")) ? h.get("actor") : "all";
    search.value = h.get("q") || "";
    agenticOnly.checked = h.get("agentic") === "1";
    wantedEpic = h.get("epic");
    wantedPhase = h.get("phase");
  }

  function writeHash() {
    const h = new URLSearchParams();
    if (viewMode.value !== "tasks") h.set("view", viewMode.value);
    if (epicFilter.value !== "all") h.set("epic", epicFilter.value);
    if (actorFilter.value !== "all") h.set("actor", actorFilter.value);
    if (search.value.trim()) h.set("q", search.value.trim());
    if (agenticOnly.checked) h.set("agentic", "1");
    if (phaseProgSel && phaseProgSel.value && phaseProgSel.selectedIndex > 0) h.set("phase", phaseProgSel.value);
    const str = h.toString();
    history.replaceState(null, "", str ? "#" + str : window.location.pathname + window.location.search);
  }

  function repoColumn(id, kind) {
    if (kind === "task") return tasks[id] ? tasks[id].column : "intake";
    const row = boardSnapshot && (boardSnapshot.phases || []).find(function (p) { return p.phaseId === id; });
    return (row && row.progress.suggestedColumn) || "intake";
  }

  function overridesFor(kind) {
    return kind === "task" ? taskOverrides : phaseOverrides;
  }

  function isPinned(id, kind) {
    const ov = overridesFor(kind)[id];
    return !!(ov && ov.pinned);
  }

  function pinnedCount() {
    return Object.keys(taskOverrides).filter(function (id) { return tasks[id] && isPinned(id, "task"); }).length +
      Object.keys(phaseOverrides).filter(function (id) { return phases[id] && isPinned(id, "phase"); }).length;
  }

  function unpin(id, kind) {
    delete overridesFor(kind)[id];
    columnState[id] = repoColumn(id, kind);
    saveOverrides();
    paint();
    showToast(id + " kembali ke " + columnMeta(columnState[id]).title + " (posisi repo)");
  }

  function syncSaveStatus() {
    const el = document.getElementById("save-status");
    if (!el) return;
    el.textContent = storageAvailable
      ? "Live · " + (boardSnapshot ? boardSnapshot.generatedAt.slice(11, 19) : "—") + " · drag tersimpan lokal"
      : "Live · penyimpanan browser tidak tersedia";
  }

  function applyBoard(data, fromPoll) {
    const prevGen = boardSnapshot && boardSnapshot.generatedAt;
    boardSnapshot = data;
    tasks = {};
    phases = {};
    (data.tasks || []).forEach(function (t) {
      tasks[t.id] = t;
    });
    (data.phases || []).forEach(function (p) {
      phases[p.phaseId] = {
        id: p.phaseId,
        key: p.phaseId,
        label: "Phase " + p.ordinal + " · " + p.epic,
        ordinal: p.ordinal,
        epic: p.epic,
        title: p.title,
        summary: p.progress.total + " task · audit " + (p.audit && p.audit.status || p.progress.auditStatus || "pending"),
        body: "Epic " + p.epic + " · " + (p.devPhasePath || ""),
        progress: p.progress,
        audit: p.audit,
        devPhasePath: p.devPhasePath,
        taskIds: p.taskIds || [],
        taskProgress: p.taskProgress || []
      };
    });

    columnState = {};
    Object.keys(tasks).forEach(function (id) {
      columnState[id] = isPinned(id, "task") ? taskOverrides[id].column : repoColumn(id, "task");
    });
    Object.keys(phases).forEach(function (id) {
      columnState[id] = isPinned(id, "phase") ? phaseOverrides[id].column : repoColumn(id, "phase");
    });

    if (fromPoll && prevGen !== data.generatedAt && liveStatusEl) {
      liveStatusEl.textContent = "Diperbarui " + new Date().toLocaleTimeString("id-ID");
    }
    const viewSel = document.getElementById("view-mode");
    if (viewSel && viewSel.options[0] && data.summary) {
      viewSel.options[0].textContent = "Task (" + data.summary.taskCount + ")";
    }

    updateChrome(data);
    populateEpicFilter(data);
    populatePhaseProgressSelect();
    renderPhaseProgressPanel();
    renderIntakeTriggerPanel();
    paint();
    syncSaveStatus();
  }

  function populatePhaseProgressSelect() {
    const sel = phaseProgSel;
    if (!sel || !boardSnapshot) return;
    const current = wantedPhase || sel.value;
    wantedPhase = null;
    const epic = epicFilter ? epicFilter.value : "all";
    const list = (boardSnapshot.phases || []).filter(function (p) {
      return epic === "all" || p.epic === epic;
    });
    sel.replaceChildren();
    list.forEach(function (p) {
      const opt = document.createElement("option");
      opt.value = p.phaseId;
      opt.textContent = p.phaseId + " — " + p.title + " (" + p.progress.total + " task)";
      sel.appendChild(opt);
    });
    if (list.some(function (p) { return p.phaseId === current; })) sel.value = current;
    else if (list.length) sel.value = list[0].phaseId;
  }

  function renderPhaseProgressPanel() {
    const sel = phaseProgSel;
    const summary = document.getElementById("phase-progress-summary");
    const listEl = document.getElementById("phase-task-list");
    const barWrap = document.getElementById("phase-progress-bar-wrap");
    const bar = document.getElementById("phase-progress-bar");
    const barInner = bar && bar.querySelector("span");
    const pctEl = document.getElementById("phase-progress-pct");
    if (!sel || !listEl || !boardSnapshot) return;
    const phaseId = sel.value;
    const row = (boardSnapshot.phases || []).find(function (p) { return p.phaseId === phaseId; });
    if (!row) {
      summary.textContent = "Tidak ada phase.";
      listEl.replaceChildren();
      if (barWrap) barWrap.hidden = true;
      var qaBw = document.getElementById("phase-qa-bar-wrap");
      if (qaBw) qaBw.hidden = true;
      var audBw = document.getElementById("phase-audit-bar-wrap");
      if (audBw) audBw.hidden = true;
      var audAct = document.getElementById("phase-audit-actions");
      if (audAct) audAct.replaceChildren();
      return;
    }
    const pr = row.progress || {};
    const avg = pr.avgProgress != null ? pr.avgProgress : 0;
    const qaPct = pr.qaPercent != null ? pr.qaPercent : 0;
    const auditSt = (row.audit && row.audit.status) || pr.auditStatus || "pending";
    const qaGate = pr.qaPhaseComplete ? " · QA siap Audit" : pr.qaNeedsClarify ? " · QA perlu Clarify" : "";
    const auditGate =
      pr.auditPhaseComplete ? " · Audit siap Human QA" :
      pr.auditNeedsClarify || auditSt === "needs_clarify" ? " · Audit perlu Clarify" :
      auditSt === "in_progress" ? " · Audit berjalan" : "";
    summary.textContent =
      row.title +
      " · dev " + (pr.devCompleteCount || 0) + "/" + pr.total +
      " · QA " + (pr.qaCompleteCount || 0) + "/" + pr.total +
      " · audit " + auditSt +
      " · " + avg + "%" + qaGate + auditGate;
    if (barWrap && bar && barInner && pctEl) {
      barWrap.hidden = false;
      barInner.style.width = avg + "%";
      bar.setAttribute("aria-valuenow", String(avg));
      pctEl.textContent = avg + "%";
    }
    const qaBarWrap = document.getElementById("phase-qa-bar-wrap");
    const qaBar = document.getElementById("phase-qa-bar");
    const qaBarInner = qaBar && qaBar.querySelector("span");
    const qaPctEl = document.getElementById("phase-qa-pct");
    if (qaBarWrap && qaBar && qaBarInner && qaPctEl) {
      qaBarWrap.hidden = false;
      qaBarInner.style.width = qaPct + "%";
      qaBar.setAttribute("aria-valuenow", String(qaPct));
      qaPctEl.textContent = qaPct + "%";
    }
    var auditPct = pr.auditPercent != null ? pr.auditPercent : (auditSt === "pass" ? 100 : 0);
    var auditBarWrap = document.getElementById("phase-audit-bar-wrap");
    var auditBar = document.getElementById("phase-audit-bar");
    var auditBarInner = auditBar && auditBar.querySelector("span");
    var auditPctEl = document.getElementById("phase-audit-pct");
    if (auditBarWrap && auditBar && auditBarInner && auditPctEl) {
      auditBarWrap.hidden = false;
      auditBarInner.style.width = auditPct + "%";
      auditBar.setAttribute("aria-valuenow", String(auditPct));
      auditPctEl.textContent = auditPct + "%";
    }
    var auditLinkWrap = document.getElementById("phase-audit-actions");
    if (auditLinkWrap && row.audit) {
      auditLinkWrap.replaceChildren();
      var rep = row.audit.report;
      var hasRep = row.audit.hasReport;
      auditLinkWrap.appendChild(makeReportButton("Laporan audit phase", rep, hasRep, { primary: true }));
      auditLinkWrap.appendChild(makeReportButton("Pratinjau audit", rep, hasRep, { preview: true }));
      if (row.devPhasePath) {
        var devPhBtn = makeReportButton("PRD dev phase", row.devPhasePath, true);
        auditLinkWrap.appendChild(devPhBtn);
      }
    }
    listEl.replaceChildren();
    (row.taskProgress || []).forEach(function (t) {
      const li = document.createElement("li");
      li.className = "phase-task-item";
      const col = columnMeta(t.column);
      li.innerHTML =
        '<div><strong></strong><span class="meta"></span><span class="mini-bar"><span></span></span></div>' +
        '<span class="dev-status"></span><span class="qa-status"></span><span class="progress-pct"></span>' +
        '<button type="button" class="task-report-link">Laporan dev</button>';
      li.querySelector("strong").textContent = t.title;
      li.querySelector(".meta").textContent = t.id + " · " + (col ? col.title : t.column);
      li.querySelector(".dev-status").textContent = "dev:" + (t.developmentStatus || "pending");
      li.querySelector(".dev-status").classList.toggle("complete", t.developmentStatus === "complete");
      var qaSt = t.qaStatus || "pending";
      li.querySelector(".qa-status").textContent = "qa:" + qaSt;
      li.querySelector(".qa-status").classList.add("qa-" + qaSt.replace("_", "-"));
      li.querySelector(".progress-pct").textContent = t.progressPercent + "%";
      li.querySelector(".mini-bar span").style.width = t.progressPercent + "%";
      var fullTask = tasks[t.id];
      var linkBtn = li.querySelector(".task-report-link");
      var rep = fullTask ? taskReports(fullTask) : { hasDevelopment: false, development: "" };
      linkBtn.disabled = !rep.hasDevelopment;
      linkBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (rep.hasDevelopment) openRepoFile(rep.development, "Laporan development", fullTask, "development");
        else if (fullTask) openTaskDialog(fullTask);
      });
      listEl.appendChild(li);
    });
  }

  function updateChrome(data) {
    const s = data.summary || {};
    document.getElementById("total-phases").textContent = String(s.taskCount || 0).padStart(3, "0");
    const active = (s.byColumn && (s.byColumn.plan + s.byColumn.development + s.byColumn.test + s.byColumn.audit)) || 0;
    document.getElementById("active-phases").textContent = String(active).padStart(2, "0");
    const human = (s.byColumn && (s.byColumn["human-clarify"] + s.byColumn["human-qa"])) || 0;
    document.getElementById("human-phases").textContent = String(human).padStart(2, "0");
    document.getElementById("done-phases").textContent = String(s.byColumn && s.byColumn.done || 0).padStart(2, "0");
    document.getElementById("side-project-title").textContent = "Semua PRD · " + (s.epicCount || 0) + " epic";
    document.getElementById("side-project-meta").textContent =
      (s.taskCount || 0) + " task · " + (s.phaseCount || 0) + " phase";
    document.getElementById("checklist-task-count").textContent = String(s.taskCount || 0);
  }

  function populateEpicFilter(data) {
    if (!epicFilter) return;
    const current = wantedEpic || epicFilter.value;
    wantedEpic = null;
    epicFilter.replaceChildren();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "Semua epic";
    epicFilter.appendChild(all);
    (data.epics || []).forEach(function (e) {
      const opt = document.createElement("option");
      opt.value = e.epic;
      opt.textContent = "PRD-" + e.epic + " (" + e.taskCount + ")";
      epicFilter.appendChild(opt);
    });
    if ([...epicFilter.options].some(function (o) { return o.value === current; })) {
      epicFilter.value = current;
    }
  }

  function visibleTasks() {
    const q = search.value.trim().toLocaleLowerCase("id");
    const epic = epicFilter.value;
    return Object.values(tasks).filter(function (t) {
      if (epic !== "all" && t.epic !== epic) return false;
      if (agenticOnly.checked && !t.agenticReady) return false;
      const col = columnMeta(columnState[t.id]);
      const actorOk = actorFilter.value === "all" || (actorFilter.value === "human" ? col.human : !col.human);
      if (!actorOk) return false;
      const hay = [t.id, t.title, t.epic, t.phaseId, t.area].join(" ").toLocaleLowerCase("id");
      return hay.includes(q);
    });
  }

  function visiblePhases() {
    const q = search.value.trim().toLocaleLowerCase("id");
    const epic = epicFilter.value;
    return Object.values(phases).filter(function (p) {
      if (epic !== "all" && p.epic !== epic) return false;
      const col = columnMeta(columnState[p.id]);
      const actorOk = actorFilter.value === "all" || (actorFilter.value === "human" ? col.human : !col.human);
      if (!actorOk) return false;
      return [p.label, p.title, p.key, p.epic].join(" ").toLocaleLowerCase("id").includes(q);
    });
  }

  function taskProgressPercent(task) {
    if (typeof task.progressPercent === "number") return task.progressPercent;
    const p = task.progress || {};
    if (p.qa && p.auditPhase) return 90;
    if (p.qa) return 75;
    if (p.development) return 55;
    if (p.planComplete) return 30;
    if (p.plan) return 15;
    return 5;
  }

  function repoFileUrls(repoRelativePath) {
    return REPO_ROOT_BASES.map(function (base) {
      return new URL(base + repoRelativePath.split("/").join("/"), window.location.href).href;
    });
  }

  function repoFileUrl(repoRelativePath) {
    return repoFileUrls(repoRelativePath)[0];
  }

  async function fetchRepoFile(repoRelativePath) {
    var urls = repoFileUrls(repoRelativePath);
    var lastStatus = "";
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache: "no-store" });
        if (res.ok) return res;
        lastStatus = String(res.status);
      } catch (e) {
        lastStatus = e.message || "fetch error";
      }
    }
    throw new Error("HTTP " + lastStatus);
  }

  function taskReports(task) {
    const r = task.reports || {};
    const p = task.progress || {};
    return {
      plan: r.plan || "",
      development: r.development || "",
      qa: r.qa || "",
      previewPlan: r.previewPlan || "",
      previewDevelopment: r.previewDevelopment || "",
      previewQa: r.previewQa || "",
      hasPlan: r.hasPlan != null ? r.hasPlan : !!p.plan,
      hasDevelopment: r.hasDevelopment != null ? r.hasDevelopment : !!p.development,
      hasQa: r.hasQa != null ? r.hasQa : !!p.qa
    };
  }

  function openRepoFile(repoPath, label, task, previewKind) {
    if (!repoPath) return;
    if (window.location.protocol === "file:") {
      copyRepoPath(repoPath);
      previewReport(repoPath, task, previewKind);
      showToast("Pratinjau lokal (file://) — path disalin ke clipboard");
      return;
    }
    window.open(repoFileUrl(repoPath), "_blank", "noopener,noreferrer");
    showToast((label || "File") + " dibuka di tab baru");
  }

  async function copyRepoPath(repoPath) {
    if (!repoPath || !navigator.clipboard) return;
    var wsPath = WORKSPACE_PREFIX + repoPath;
    try {
      await navigator.clipboard.writeText(wsPath);
      showToast("Path workspace disalin: " + wsPath);
    } catch (e) {
      showToast("Gagal menyalin path");
    }
  }

  async function previewReport(repoPath, task, kind) {
    const wrap = document.getElementById("dialog-report-preview-wrap");
    const pre = document.getElementById("dialog-report-preview");
    if (!wrap || !pre || !repoPath) return;
    pre.textContent = "Memuat…";
    wrap.hidden = false;
    wrap.open = true;
    const rep = task ? taskReports(task) : {};
    const mirror =
      kind === "qa" ? rep.previewQa :
      kind === "plan" ? rep.previewPlan :
      rep.previewDevelopment;
    if (mirror) {
      try {
        const res = await fetch(new URL(mirror, window.location.href).href, { cache: "no-store" });
        if (res.ok) {
          pre.textContent = await res.text();
          return;
        }
      } catch (e) { /* fallback */ }
    }
    try {
      const res = await fetchRepoFile(repoPath);
      pre.textContent = await res.text();
    } catch (e) {
      pre.textContent =
        "Tidak dapat memuat pratinjau (" + (e.message || e) + ").\n\n" +
        "Jalankan: npm run agentic:kanban-data\n\n" +
        "Path Cursor (AIEngineer):\n  " + WORKSPACE_PREFIX + repoPath + "\n\n" +
        "Terminal:\n  cd Agentic && npm run agentic:show-report -- --task <id> --type development\n\n" +
        "Path Agentic:\n  " + repoPath;
    }
  }

  function makeReportButton(label, repoPath, available, opts) {
    opts = opts || {};
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button" + (opts.primary ? " primary-dev" : "") + (available ? "" : " missing");
    btn.textContent = label;
    btn.disabled = !available;
    btn.title = available ? repoPath : "Belum ada di repo — jalankan Agent Development";
    if (available) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const kind = opts.kind || "development";
        if (opts.preview) previewReport(repoPath, opts.task, kind);
        else openRepoFile(repoPath, label, opts.task, kind);
      });
    }
    return btn;
  }

  function fillTaskReportActions(container, task) {
    if (!container) return;
    container.replaceChildren();
    const rep = taskReports(task);
    container.appendChild(makeReportButton("Plan task", rep.plan, rep.hasPlan, { task: task, kind: "plan" }));
    container.appendChild(makeReportButton("Laporan development", rep.development, rep.hasDevelopment, { primary: true, task: task, kind: "development" }));
    container.appendChild(makeReportButton("Pratinjau development", rep.development, rep.hasDevelopment, { preview: true, task: task, kind: "development" }));
    container.appendChild(makeReportButton("Laporan QA", rep.qa, rep.hasQa, { task: task, kind: "qa" }));
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "button";
    copyBtn.textContent = "Salin path development";
    copyBtn.disabled = !rep.development;
    copyBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      copyRepoPath(rep.development);
    });
    container.appendChild(copyBtn);
  }

  function progressRow(pct, label) {
    const aria = label ? ' aria-label="' + label + ": " + pct + '%"' : "";
    return '<span class="issue-progress-row"' + aria + ">" +
      '<span class="progress-bar"><span style="width:' + pct + '%"></span></span>' +
      '<span class="progress-pct">' + pct + "%</span></span>";
  }

  function cardShell(id, kind, className, title) {
    const el = document.createElement("article");
    el.className = "issue " + className + (isPinned(id, kind) ? " is-pinned" : "");
    el.tabIndex = 0;
    el.draggable = true;
    el.dataset.id = id;
    el.dataset.kind = kind;
    el.setAttribute("aria-label", title + " (" + id + ") — Enter untuk detail");
    return el;
  }

  function pinBadge(id, kind) {
    return isPinned(id, kind)
      ? '<button type="button" class="pin-badge" title="Dipindah manual — klik untuk ikut posisi repo">Manual ×</button>'
      : "";
  }

  function buildTaskCard(task) {
    const col = columnMeta(columnState[task.id]);
    const btn = cardShell(task.id, "task", "issue-task", task.title);
    const pct = taskProgressPercent(task);
    const prog = task.progress || {};
    btn.innerHTML =
      '<span class="issue-top"><span class="issue-phase">PRD-' + task.epic + " · " + task.phaseId + "</span>" + pinBadge(task.id, "task") + "</span>" +
      progressRow(pct, "Progress task") +
      '<span class="issue-title"></span><span class="issue-summary"></span><span class="issue-tag"></span>' +
      '<span class="issue-foot"><span class="issue-key"></span><span class="assignee"></span>' +
      '<button type="button" class="issue-report-btn">Dev report</button></span>';
    btn.querySelector(".issue-title").textContent = task.title;
    btn.querySelector(".issue-summary").textContent =
      (task.agenticReady ? "Agentic-ready · " : "") + (task.area || "") +
      (prog.planComplete ? " · plan OK" : prog.plan ? " · plan draft" : "");
    btn.querySelector(".issue-tag").textContent = col.title;
    btn.querySelector(".issue-key").textContent = task.id;
    btn.querySelector(".assignee").textContent = task.epic.slice(-2);
    btn.querySelector(".assignee").title = col.agent;
    const rep = taskReports(task);
    const devBtn = btn.querySelector(".issue-report-btn");
    devBtn.disabled = !rep.hasDevelopment;
    devBtn.title = rep.hasDevelopment ? rep.development : "Laporan development belum ada";
    return btn;
  }

  function buildPhaseCard(phase) {
    const col = columnMeta(columnState[phase.id]);
    const btn = cardShell(phase.id, "phase", "issue-phase-card", phase.title);
    const pct = phase.progress ? phase.progress.percentDone : 0;
    btn.innerHTML =
      '<span class="issue-top"><span class="issue-phase"></span>' + pinBadge(phase.id, "phase") + "</span>" +
      progressRow(pct, "Progress phase") +
      '<span class="issue-title"></span><span class="issue-summary"></span><span class="issue-tag"></span>' +
      '<span class="issue-foot"><span class="issue-key"></span><span class="assignee"></span></span>';
    btn.querySelector(".issue-phase").textContent = phase.label;
    btn.querySelector(".issue-title").textContent = phase.title;
    btn.querySelector(".issue-summary").textContent = phase.summary;
    btn.querySelector(".issue-tag").textContent = col.title;
    btn.querySelector(".issue-key").textContent = phase.key;
    btn.querySelector(".assignee").textContent = col.actor;
    return btn;
  }

  function openCard(id, kind) {
    if (kind === "task" && tasks[id]) openTaskDialog(tasks[id]);
    else if (kind === "phase" && phases[id]) openPhaseDialog(phases[id]);
  }

  function bindBoardEvents() {
    boardEl.addEventListener("click", function (e) {
      if (e.target.closest(".column-trigger")) {
        triggerPrimaryAction();
        return;
      }
      const card = e.target.closest(".issue");
      if (!card || draggedId) return;
      const id = card.dataset.id;
      const kind = card.dataset.kind;
      if (e.target.closest(".pin-badge")) {
        unpin(id, kind);
        return;
      }
      if (e.target.closest(".issue-report-btn")) {
        const rep = taskReports(tasks[id]);
        if (rep.hasDevelopment) openRepoFile(rep.development, "Laporan development", tasks[id], "development");
        return;
      }
      openCard(id, kind);
    });
    boardEl.addEventListener("keydown", function (e) {
      if ((e.key !== "Enter" && e.key !== " ") || !e.target.classList.contains("issue")) return;
      e.preventDefault();
      openCard(e.target.dataset.id, e.target.dataset.kind);
    });
    boardEl.addEventListener("dragstart", function (e) {
      const card = e.target.closest(".issue");
      if (!card) return;
      draggedId = card.dataset.id;
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", card.dataset.kind + ":" + card.dataset.id);
    });
    boardEl.addEventListener("dragend", function () {
      draggedId = null;
      boardEl.querySelectorAll(".dragging, .drag-over").forEach(function (n) { n.classList.remove("dragging", "drag-over"); });
    });
    boardEl.addEventListener("dragover", function (e) {
      const body = e.target.closest(".column-body");
      if (!body || !draggedId) return;
      e.preventDefault();
      body.classList.add("drag-over");
    });
    boardEl.addEventListener("dragleave", function (e) {
      const body = e.target.closest(".column-body");
      if (body && !body.contains(e.relatedTarget)) body.classList.remove("drag-over");
    });
    boardEl.addEventListener("drop", function (e) {
      const body = e.target.closest(".column-body");
      if (!body) return;
      e.preventDefault();
      body.classList.remove("drag-over");
      const m = e.dataTransfer.getData("text/plain").match(/^(task|phase):(.+)$/);
      if (m) moveCard(m[2], m[1], body.closest(".column").dataset.stage);
      draggedId = null;
    });
    // toggle does not bubble; capture it so lane state needs no per-lane listener
    boardEl.addEventListener("toggle", function (e) {
      const lane = e.target;
      if (!lane.classList || !lane.classList.contains("epic-lane")) return;
      const key = lane.dataset.laneKey;
      if (lane.open === (lane.dataset.defaultOpen === "true")) delete uiState.lanes[key];
      else uiState.lanes[key] = lane.open;
      saveUiState();
    }, true);
  }

  function moveCard(id, kind, columnId) {
    if (!validColumnIds.includes(columnId) || columnState[id] === columnId) return;
    columnState[id] = columnId;
    if (columnId === repoColumn(id, kind)) delete overridesFor(kind)[id];
    else overridesFor(kind)[id] = { column: columnId, pinned: true };
    saveOverrides();
    paint();
    showToast(id + " → " + columnMeta(columnId).title);
  }

  function groupByEpic(items, getEpic) {
    const map = new Map();
    items.forEach(function (item) {
      const e = getEpic(item);
      if (!map.has(e)) map.set(e, []);
      map.get(e).push(item);
    });
    return [...map.entries()].sort(function (a, b) { return a[0].localeCompare(b[0]); });
  }

  function appendEpicLanes(body, items, buildCard, getEpic, columnId) {
    const groups = groupByEpic(items, getEpic);
    const defaultOpen = items.length <= LANE_COLLAPSE_THRESHOLD;
    groups.forEach(function (entry) {
      const epic = entry[0];
      const list = entry[1];
      const key = columnId + ":" + epic;
      const lane = document.createElement("details");
      lane.className = "epic-lane";
      lane.dataset.laneKey = key;
      lane.dataset.defaultOpen = String(defaultOpen);
      lane.open = key in uiState.lanes ? uiState.lanes[key] : defaultOpen;
      const head = document.createElement("summary");
      head.className = "epic-lane-head";
      const ep = boardSnapshot.epics.find(function (x) { return x.epic === epic; });
      head.textContent = "PRD-" + epic + " · " + list.length + (ep ? " · " + ep.progress.percentDone + "%" : "");
      lane.appendChild(head);
      list.forEach(function (item) { lane.appendChild(buildCard(item)); });
      body.appendChild(lane);
    });
  }

  function paint() {
    const mode = viewMode.value;
    const visTasks = visibleTasks();
    const visPhases = visiblePhases();
    const total = mode === "tasks" ? Object.keys(tasks).length : Object.keys(phases).length;
    const shown = mode === "tasks" ? visTasks.length : visPhases.length;
    document.getElementById("board-total").textContent = shown + " / " + total + (mode === "tasks" ? " task" : " phase");
    document.getElementById("filter-status").textContent = shown + " dari " + total + " ditampilkan";
    document.getElementById("no-results").hidden = shown > 0;
    const pins = pinnedCount();
    resetPinsBtn.textContent = pins ? "Sync repo (" + pins + ")" : "Sync repo";
    const scrolls = {};
    boardEl.querySelectorAll(".column").forEach(function (s) {
      scrolls[s.dataset.stage] = s.querySelector(".column-body").scrollTop;
    });
    boardEl.replaceChildren();

    columns.forEach(function (col) {
      const inCol = mode === "tasks"
        ? visTasks.filter(function (t) { return columnState[t.id] === col.id; })
        : visPhases.filter(function (p) { return columnState[p.id] === col.id; });

      const section = document.createElement("section");
      section.className = "column";
      section.dataset.stage = col.id;
      const head = document.createElement("div");
      head.className = "column-head";
      head.innerHTML = '<div class="column-heading"><span class="stage-dot"></span><h3></h3><span class="count"></span></div><p class="column-agent"></p>';
      head.querySelector("h3").textContent = col.title;
      head.querySelector(".count").textContent = String(inCol.length);
      head.querySelector(".column-agent").textContent = col.agent;
      var orch = getOrchestrator();
      if (orch && orch.targetColumn === col.id) {
        section.classList.add("column-next");
        var trig = document.createElement("button");
        trig.type = "button";
        trig.className = "button primary column-trigger is-next";
        trig.textContent = orch.next && orch.next.action === "run_development_task" ? "▶ Trigger Development" : "▶ Trigger task";
        trig.title = "Salin prompt agent untuk langkah ini";
        head.appendChild(trig);
      }
      const body = document.createElement("div");
      body.className = "column-body";

      if (inCol.length) {
        if (mode === "tasks") {
          appendEpicLanes(body, inCol, buildTaskCard, function (t) { return t.epic; }, col.id);
        } else {
          inCol.forEach(function (p) { body.appendChild(buildPhaseCard(p)); });
        }
      } else {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = "<strong>Kosong</strong><span>" + col.hint + "</span>";
        body.appendChild(empty);
      }
      section.append(head, body);
      boardEl.appendChild(section);
      body.scrollTop = scrolls[col.id] || 0;
    });
  }

  function openTaskDialog(task) {
    activeCard = { kind: "task", id: task.id };
    const col = columnMeta(columnState[task.id]);
    document.getElementById("dialog-key").textContent = task.id + " · PRD-" + task.epic;
    document.getElementById("dialog-title").textContent = task.title;
    const pct = taskProgressPercent(task);
    document.getElementById("dialog-kicker").textContent = col.title + " · " + task.phaseId + " · " + pct + "%";
    const p = task.progress || {};
    document.getElementById("dialog-body").textContent =
      "Progress " + pct + "% — plan=" + p.plan + ", skills=" + p.skillCount + ", dev=" + p.development + ", qa=" + p.qa +
      ". Kolom: " + task.column + ".";
    document.getElementById("dialog-tasks").hidden = true;
    document.getElementById("intake-meta").hidden = true;
    const reportsEl = document.getElementById("dialog-reports");
    const previewWrap = document.getElementById("dialog-report-preview-wrap");
    if (reportsEl) {
      reportsEl.hidden = false;
      fillTaskReportActions(document.getElementById("dialog-report-actions"), task);
    }
    if (previewWrap) {
      previewWrap.hidden = true;
      previewWrap.open = false;
      const pre = document.getElementById("dialog-report-preview");
      if (pre) pre.textContent = "";
    }
    stageSelect.value = col.id;
    dialog.showModal();
  }

  function openPhaseDialog(phase) {
    activeCard = { kind: "phase", id: phase.id };
    const col = columnMeta(columnState[phase.id]);
    const row = (boardSnapshot.phases || []).find(function (p) { return p.phaseId === phase.id; });
    document.getElementById("dialog-key").textContent = phase.key;
    document.getElementById("dialog-title").textContent = phase.title;
    const auditSt = row && row.audit ? row.audit.status : "pending";
    document.getElementById("dialog-kicker").textContent =
      col.title + " · " + phase.progress.percentDone + "% · audit " + auditSt;
    document.getElementById("dialog-body").textContent =
      phase.body + (row && row.audit && row.audit.report
        ? "\n\nLaporan audit: " + row.audit.report
        : "\n\nAudit: 1 session = 1 phase — lihat docs/agentic/skill/audit/SKILL.md");
    const list = document.getElementById("dialog-tasks");
    list.replaceChildren();
    list.hidden = false;
    (phase.taskIds || []).forEach(function (tid) {
      const li = document.createElement("li");
      const t = tasks[tid];
      li.textContent = tid + (t ? " → " + columnMeta(columnState[tid]).title : "");
      list.appendChild(li);
    });
    document.getElementById("intake-meta").hidden = true;
    const reportsEl = document.getElementById("dialog-reports");
    if (reportsEl) {
      if (row && row.audit) {
        reportsEl.hidden = false;
        fillTaskReportActions(document.getElementById("dialog-report-actions"), {
          reports: {
            plan: row.audit.plan,
            development: row.audit.report,
            qa: row.devPhasePath || "",
            hasPlan: true,
            hasDevelopment: row.audit.hasReport,
            hasQa: !!row.devPhasePath
          }
        });
        var act = document.getElementById("dialog-report-actions");
        if (act && act.firstChild) act.firstChild.textContent = "Plan audit phase";
        if (act && act.children[1]) act.children[1].textContent = "Laporan audit phase";
        if (act && act.children[2]) act.children[2].textContent = "Pratinjau audit phase";
        if (act && act.children[3]) {
          act.children[3].textContent = "PRD development phase";
          act.children[3].disabled = !row.devPhasePath;
        }
      } else reportsEl.hidden = true;
    }
    stageSelect.value = col.id;
    dialog.showModal();
  }

  async function fetchBoard() {
    let err = null;
    for (let i = 0; i < BOARD_URLS.length; i++) {
      try {
        const res = await fetch(BOARD_URLS[i], { cache: "no-cache" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      } catch (e) {
        err = e;
      }
    }
    throw err;
  }

  async function refresh(fromPoll) {
    try {
      const data = await fetchBoard();
      if (fromPoll && boardSnapshot && data.generatedAt === boardSnapshot.generatedAt) return;
      applyBoard(data, fromPoll);
      loadStatusEl.hidden = true;
    } catch (e) {
      if (!boardSnapshot) {
        loadStatusEl.hidden = false;
        loadStatusEl.textContent =
          "Gagal memuat kanban-board.json. Jalankan npm run agentic:kanban-data dan serve via HTTP. " + (e.message || "");
      }
    }
  }

  function startPoll() {
    clearInterval(pollTimer);
    pollTimer = setInterval(function () { refresh(true); }, POLL_MS);
  }

  columns.forEach(function (col) {
    const opt = document.createElement("option");
    opt.value = col.id;
    opt.textContent = col.title;
    stageSelect.appendChild(opt);
  });

  search.addEventListener("input", function () {
    paint();
    writeHash();
  });
  [actorFilter, epicFilter, viewMode, agenticOnly].forEach(function (el) {
    el.addEventListener("change", function () {
      populatePhaseProgressSelect();
      renderPhaseProgressPanel();
      paint();
      writeHash();
    });
  });
  if (phaseProgSel) phaseProgSel.addEventListener("change", function () {
    renderPhaseProgressPanel();
    writeHash();
  });
  compactMode.addEventListener("change", function () {
    uiState.compact = compactMode.checked;
    boardEl.classList.toggle("board-compact", uiState.compact);
    saveUiState();
  });
  // in-page anchors (skip link, sidebar #main) replace the hash; put the filter state back
  window.addEventListener("hashchange", function () {
    if (!window.location.hash.includes("=")) writeHash();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      clearInterval(pollTimer);
      return;
    }
    refresh(true).then(startPoll);
  });
  bindBoardEvents();

  document.getElementById("close").addEventListener("click", function () { dialog.close(); });
  document.getElementById("move-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!activeCard) return;
    moveCard(activeCard.id, activeCard.kind, stageSelect.value);
    dialog.close();
  });
  document.getElementById("reload-queue").addEventListener("click", function () { refresh(false); });
  var triggerPrimary = document.getElementById("trigger-task-primary");
  if (triggerPrimary) triggerPrimary.addEventListener("click", triggerPrimaryAction);
  var triggerCopy = document.getElementById("trigger-copy-prompt");
  if (triggerCopy) triggerCopy.addEventListener("click", function () {
    var orch = getOrchestrator();
    if (!orch || !orch.agentPrompt) return;
    copyText(orch.agentPrompt).then(function () { showToast("Prompt agent disalin."); }).catch(function () { showToast("Gagal menyalin prompt."); });
  });
  var triggerTerm = document.getElementById("trigger-copy-terminal");
  if (triggerTerm) triggerTerm.addEventListener("click", function () {
    var orch = getOrchestrator();
    var cmd = (orch && orch.terminalExecute) || "npm run agentic:trigger-next -- --execute";
    copyText(cmd).then(function () { showToast("Perintah terminal disalin."); }).catch(function () { showToast("Gagal menyalin."); });
  });
  resetPinsBtn.addEventListener("click", function () {
    taskOverrides = {};
    phaseOverrides = {};
    saveOverrides();
    refresh(false);
    showToast("Posisi kartu mengikuti progress repo lagi.");
  });

  loadOverrides();
  loadUiState();
  applyHashToControls();
  compactMode.checked = uiState.compact;
  boardEl.classList.toggle("board-compact", uiState.compact);
  loadStatusEl.hidden = false;
  liveStatusEl.textContent = "Polling " + POLL_MS / 1000 + "s";
  refresh(false).then(startPoll);
})();
