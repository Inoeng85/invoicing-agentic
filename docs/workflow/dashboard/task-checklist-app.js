(function () {
  const CHECKLIST_URL = new URL("../../reports/workflow/task-checklist.json", window.location.href).href;
  const POLL_MS = 15000;

  let checklistSnapshot = null;
  let pollTimer;

  function runStateLabel(s) {
    return s || "—";
  }

  function renderTaskChecklist() {
    var summaryEl = document.getElementById("task-checklist-summary");
    var body = document.getElementById("task-checklist-body");
    var metaEl = document.getElementById("checklist-generated-at");
    if (!summaryEl || !body) return;
    if (!checklistSnapshot || !checklistSnapshot.items) {
      summaryEl.textContent = "Checklist belum ada — jalankan npm run agentic:task-checklist di folder Agentic";
      body.replaceChildren();
      return;
    }
    var s = checklistSnapshot.summary;
    summaryEl.textContent =
      "Total " + s.total +
      " · done " + s.done +
      " · running " + s.running +
      " · ready " + s.ready +
      " · waiting " + s.waiting +
      " · blocked " + s.blocked +
      (s.nextTaskId ? " · berikutnya: " + s.nextKind + " " + s.nextTaskId : "");
    if (metaEl && checklistSnapshot.generatedAt) {
      metaEl.textContent = "Diperbarui " + checklistSnapshot.generatedAt.slice(0, 19).replace("T", " ") + " UTC";
    }
    var filterEl = document.getElementById("checklist-filter");
    var searchEl = document.getElementById("checklist-search");
    var phaseEl = document.getElementById("checklist-phase");
    var filter = filterEl ? filterEl.value : "not-done";
    var q = searchEl ? searchEl.value.trim().toLowerCase() : "";
    var phaseFilter = phaseEl ? phaseEl.value : "all";
    body.replaceChildren();
    checklistSnapshot.items.forEach(function (it) {
      if (filter === "not-done" && it.runState === "done") return;
      if (filter !== "all" && filter !== "not-done" && it.runState !== filter) return;
      if (phaseFilter !== "all" && it.phaseId !== phaseFilter) return;
      if (q && it.taskId.toLowerCase().indexOf(q) === -1 && (it.title || "").toLowerCase().indexOf(q) === -1) return;
      var tr = document.createElement("tr");
      tr.dataset.state = it.runState;
      var flags = [];
      if (it.isNext) flags.push("NEXT");
      if (it.autopilotActive) flags.push("AUTOPILOT");
      var parts = [];
      if (it.blockers && it.blockers.length) parts.push(it.blockers.join("; "));
      if (it.waitReasons && it.waitReasons.length) parts.push(it.waitReasons.join("; "));
      if (it.notes && it.notes.length) parts.push(it.notes.join("; "));
      var block = parts.length ? parts.join(" · ") : "—";
      tr.innerHTML =
        "<td>" + it.seq + "</td>" +
        "<td><code>" + it.taskId + "</code><br><span class=\"muted\">" + (it.title || "") + "</span></td>" +
        "<td><span class=\"run-badge " + it.runState + "\">" + runStateLabel(it.runState) + "</span>" +
        (flags.length ? " <small>" + flags.join(" ") + "</small>" : "") + "</td>" +
        "<td>" + it.stage + "<br><small>" + (it.phaseId || "") + "</small></td>" +
        "<td>" + it.planStatus + " / " + it.developmentStatus + " / " + it.qaStatus + "</td>" +
        "<td>" + block + "</td>";
      body.appendChild(tr);
    });
    var countEl = document.getElementById("checklist-row-count");
    if (countEl) countEl.textContent = String(body.children.length) + " baris ditampilkan";
  }

  function populatePhaseFilter() {
    var sel = document.getElementById("checklist-phase");
    if (!sel || !checklistSnapshot || !checklistSnapshot.items) return;
    var current = sel.value;
    var phases = [];
    var seen = {};
    checklistSnapshot.items.forEach(function (it) {
      if (it.phaseId && !seen[it.phaseId]) {
        seen[it.phaseId] = true;
        phases.push(it.phaseId);
      }
    });
    phases.sort();
    sel.replaceChildren();
    var all = document.createElement("option");
    all.value = "all";
    all.textContent = "Semua phase";
    sel.appendChild(all);
    phases.forEach(function (pid) {
      var opt = document.createElement("option");
      opt.value = pid;
      opt.textContent = pid;
      sel.appendChild(opt);
    });
    if (phases.indexOf(current) >= 0) sel.value = current;
  }

  async function fetchChecklist() {
    var res = await fetch(CHECKLIST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    checklistSnapshot = await res.json();
    populatePhaseFilter();
    renderTaskChecklist();
  }

  async function refresh() {
    try {
      await fetchChecklist();
      var err = document.getElementById("checklist-load-error");
      if (err) err.hidden = true;
    } catch (e) {
      var errEl = document.getElementById("checklist-load-error");
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = "Gagal memuat task-checklist.json — " + (e.message || e);
      }
    }
  }

  ["checklist-filter", "checklist-search", "checklist-phase"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", renderTaskChecklist);
      el.addEventListener("change", renderTaskChecklist);
    }
  });

  var reloadBtn = document.getElementById("checklist-reload");
  if (reloadBtn) reloadBtn.addEventListener("click", function () { refresh(); });

  refresh();
  pollTimer = setInterval(refresh, POLL_MS);
})();
