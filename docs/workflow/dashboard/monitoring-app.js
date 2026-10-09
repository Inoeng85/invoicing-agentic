(function () {
  const MONITOR_URL = new URL("../../reports/workflow/monitoring.json", window.location.href).href;
  const POLL_MS = 15000;

  let snapshot = null;

  function el(id) {
    return document.getElementById(id);
  }

  function formatAt(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "short" });
    } catch (_) {
      return iso;
    }
  }

  function renderMetrics() {
    if (!snapshot || !snapshot.summary) return;
    var s = snapshot.summary;
    var grid = el("monitor-metrics");
    if (!grid) return;
    var items = [
      ["Task total", s.total],
      ["Done", s.done],
      ["Running", s.runningCount != null ? s.runningCount : s.running],
      ["Ready", s.ready],
      ["Blocked", s.blockedCount != null ? s.blockedCount : s.blocked],
      ["Log entries", s.logCount],
      ["Aktif", s.activeTaskId ? s.activeKind + " · " + s.activeTaskId : "—"],
      ["Berikutnya", s.nextTaskId ? s.nextKind + " " + s.nextTaskId : "—"]
    ];
    grid.replaceChildren();
    items.forEach(function (pair) {
      var card = document.createElement("div");
      card.className = "monitor-metric";
      card.innerHTML = "<span class=\"monitor-metric-label\">" + pair[0] + "</span><strong class=\"monitor-metric-value\">" + pair[1] + "</strong>";
      grid.appendChild(card);
    });
    var meta = el("monitor-generated-at");
    if (meta) meta.textContent = "Snapshot " + formatAt(snapshot.generatedAt);
  }

  function renderTasks() {
    var body = el("monitor-task-body");
    if (!body || !snapshot) return;
    var q = (el("monitor-task-search") && el("monitor-task-search").value.trim().toLowerCase()) || "";
    var stateF = el("monitor-task-state") ? el("monitor-task-state").value : "not-done";
    body.replaceChildren();
    (snapshot.tasks || []).forEach(function (t) {
      if (stateF === "not-done" && t.runState === "done") return;
      if (stateF !== "all" && stateF !== "not-done" && t.runState !== stateF) return;
      if (q && t.taskId.toLowerCase().indexOf(q) === -1 && (t.title || "").toLowerCase().indexOf(q) === -1) return;
      var tr = document.createElement("tr");
      tr.dataset.taskId = t.taskId;
      tr.tabIndex = 0;
      var flags = t.isNext ? " NEXT" : "";
      if (t.autopilotActive) flags += " AUTO";
      tr.innerHTML =
        "<td><code>" + t.taskId + "</code></td>" +
        "<td><span class=\"run-badge " + t.runState + "\">" + t.runState + "</span>" + (flags ? "<small>" + flags + "</small>" : "") + "</td>" +
        "<td>" + t.stage + "</td>" +
        "<td>" + t.planStatus + " / " + t.developmentStatus + " / " + t.qaStatus + "</td>" +
        "<td><small>" + (t.phaseId || "") + "</small></td>";
      tr.addEventListener("click", function () { selectTask(t.taskId); });
      tr.addEventListener("keydown", function (e) { if (e.key === "Enter") selectTask(t.taskId); });
      body.appendChild(tr);
    });
  }

  function selectTask(taskId) {
    var panel = el("monitor-task-detail");
    var title = el("monitor-detail-title");
    var logsEl = el("monitor-detail-logs");
    if (!panel || !snapshot) return;
    var task = (snapshot.tasks || []).find(function (t) { return t.taskId === taskId; });
    var logs = (snapshot.taskLogIndex && snapshot.taskLogIndex[taskId]) || [];
    if (!task) return;
    panel.hidden = false;
    if (title) title.textContent = task.taskId + " — " + (task.title || "");
    var block = el("monitor-detail-status");
    if (block) {
      var parts = [];
      if (task.blockers && task.blockers.length) parts.push(task.blockers.join("; "));
      if (task.waitReasons && task.waitReasons.length) parts.push(task.waitReasons.join("; "));
      block.textContent = parts.length ? parts.join(" · ") : "Tidak ada blocker";
    }
    if (logsEl) {
      logsEl.replaceChildren();
      if (!logs.length) {
        var li = document.createElement("li");
        li.className = "monitor-log-empty";
        li.textContent = "Belum ada log untuk task ini (autopilot / laporan Result).";
        logsEl.appendChild(li);
      } else {
        logs.forEach(function (log) {
          var li = document.createElement("li");
          li.className = "monitor-log-item level-" + (log.level || "info");
          li.innerHTML =
            "<time datetime=\"" + log.at + "\">" + formatAt(log.at) + "</time>" +
            "<span class=\"monitor-log-source\">" + log.source + "</span>" +
            "<span class=\"monitor-log-msg\">" + log.message + "</span>";
          logsEl.appendChild(li);
        });
      }
    }
    document.querySelectorAll("#monitor-task-body tr").forEach(function (tr) {
      tr.classList.toggle("selected", tr.dataset.taskId === taskId);
    });
  }

  function renderLogStream() {
    var list = el("monitor-log-stream");
    if (!list || !snapshot) return;
    var q = (el("monitor-log-search") && el("monitor-log-search").value.trim().toLowerCase()) || "";
    var src = el("monitor-log-source") ? el("monitor-log-source").value : "all";
    list.replaceChildren();
    (snapshot.logs || []).forEach(function (log) {
      if (src !== "all" && log.source !== src) return;
      if (q) {
        var hay = (log.message + " " + (log.taskId || "") + " " + log.event).toLowerCase();
        if (hay.indexOf(q) === -1) return;
      }
      var li = document.createElement("li");
      li.className = "monitor-log-item level-" + (log.level || "info");
      li.innerHTML =
        "<time datetime=\"" + log.at + "\">" + formatAt(log.at) + "</time>" +
        "<span class=\"monitor-log-source\">" + log.source + "</span>" +
        (log.taskId ? "<code class=\"monitor-log-task\">" + log.taskId + "</code>" : "") +
        "<span class=\"monitor-log-msg\">" + log.message + "</span>";
      li.addEventListener("click", function () { if (log.taskId) selectTask(log.taskId); });
      list.appendChild(li);
    });
  }

  function renderSessions() {
    var pre = el("monitor-sessions-json");
    if (!pre || !snapshot) return;
    pre.textContent = JSON.stringify(snapshot.sessions || {}, null, 2);
  }

  function renderAll() {
    renderMetrics();
    renderTasks();
    renderLogStream();
    renderSessions();
    var err = el("monitor-load-error");
    if (err) err.hidden = true;
  }

  async function refresh() {
    try {
      var res = await fetch(MONITOR_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      snapshot = await res.json();
      renderAll();
      if (snapshot.summary && snapshot.summary.activeTaskId) {
        selectTask(snapshot.summary.activeTaskId);
      }
    } catch (e) {
      var errEl = el("monitor-load-error");
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = "Gagal memuat monitoring.json — npm run agentic:monitoring-data · " + (e.message || e);
      }
    }
  }

  ["monitor-task-search", "monitor-task-state"].forEach(function (id) {
    var node = el(id);
    if (node) {
      node.addEventListener("input", renderTasks);
      node.addEventListener("change", renderTasks);
    }
  });
  ["monitor-log-search", "monitor-log-source"].forEach(function (id) {
    var node = el(id);
    if (node) {
      node.addEventListener("input", renderLogStream);
      node.addEventListener("change", renderLogStream);
    }
  });
  var reload = el("monitor-reload");
  if (reload) reload.addEventListener("click", refresh);

  refresh();
  setInterval(refresh, POLL_MS);
})();
