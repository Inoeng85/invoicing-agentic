// Prototype behaviour for the Invoicing UI system (vanilla JS, no build step).
// Icons are a subset of Lucide (ISC license) — the same set shadcn/ui uses.
;(function () {
  'use strict'

  var ICONS = {
    'layout-dashboard':
      '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'layout-grid':
      '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    'file-text':
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    settings:
      '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevrons-up-down': '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    'more-horizontal':
      '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    download:
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload:
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    trash:
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'log-out':
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    'triangle-alert':
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'circle-alert': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    'circle-help':
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    calendar:
      '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone:
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    building:
      '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    receipt:
      '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    wallet:
      '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'external-link':
      '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'shield-check':
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    palette:
      '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    type: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    pointer:
      '<path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>',
    'text-cursor-input':
      '<path d="M5 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1"/><path d="M13 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H5"/><path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1"/><path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7"/><path d="M9 7v10"/>',
    'panel-top': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>',
    'panel-bottom': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/>',
    'panel-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    blocks:
      '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
    printer:
      '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    globe:
      '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    percent:
      '<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    'trending-up': '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    image:
      '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    'grip-vertical':
      '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  }

  var DOC_PAGES = [
    ['index.html', 'Overview'],
    ['color-palette.html', 'Color'],
    ['typography.html', 'Typography'],
    ['buttons.html', 'Button'],
    ['forms.html', 'Form'],
    ['header.html', 'Header'],
    ['footer.html', 'Footer'],
    ['menu.html', 'Menu'],
    ['components.html', 'Components'],
  ]

  var SCREEN_PAGES = [
    ['screen-auth.html', 'Auth'],
    ['screen-dashboard.html', 'Dashboard'],
    ['screen-clients.html', 'Klien'],
    ['screen-invoice-editor.html', 'Editor invoice'],
    ['screen-invoice-preview.html', 'Detail & preview'],
    ['screen-public.html', 'Tampilan publik'],
    ['screen-settings.html', 'Pengaturan'],
    ['screen-invoice-list.html', 'Daftar invoice'],
    ['screen-client-detail.html', 'Detail klien'],
    ['screen-invoice-send.html', 'Alur kirim'],
    ['screen-invoice-locked.html', 'Invoice terkunci'],
    ['screen-pdf-states.html', 'PDF & tautan publik'],
  ]

  var THEME_KEY = 'invoicing-proto-theme'
  var currentPage = location.pathname.split('/').pop() || 'index.html'

  function icon(name, className) {
    var body = ICONS[name]
    if (!body) return ''
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="' +
      (className || 'size-4') +
      '">' +
      body +
      '</svg>'
    )
  }

  function renderIcons(root) {
    root.querySelectorAll('i[data-icon]').forEach(function (el) {
      var markup = icon(el.getAttribute('data-icon'), el.className || 'size-4')
      if (markup) el.outerHTML = markup
    })
  }

  // ---------- Theme ----------
  function isDark() {
    return document.documentElement.classList.contains('dark')
  }

  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch (_) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', dark ? 'Gunakan tema terang' : 'Gunakan tema gelap')
      btn.title = 'Dark mode — Could FR-12, di luar scope MVP'
      btn.innerHTML = icon(dark ? 'sun' : 'moon')
    })
  }

  // ---------- Prototype chrome ----------
  function docsHeader() {
    var links = DOC_PAGES.map(function (p) {
      var current = p[0] === currentPage ? ' aria-current="page"' : ''
      return '<a class="nav-link h-8 px-2.5" href="' + p[0] + '"' + current + '>' + p[1] + '</a>'
    }).join('')
    var screens = SCREEN_PAGES.map(function (p) {
      return '<a class="dropdown-item" href="' + p[0] + '">' + icon('monitor') + p[1] + '</a>'
    }).join('')
    return (
      '<header class="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">' +
      '<div class="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">' +
      '<a href="index.html" class="flex items-center gap-2 font-semibold tracking-tight">' +
      '<span class="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">' +
      icon('receipt', 'size-4') +
      '</span><span class="hidden sm:inline">Invoicing UI</span>' +
      '<span class="badge badge-outline hidden font-mono md:inline-flex">v2 · Tailwind + shadcn</span></a>' +
      '<nav aria-label="Dokumentasi" class="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1">' +
      links +
      '</nav>' +
      '<details class="dropdown"><summary class="btn btn-outline btn-sm">' +
      icon('monitor') +
      '<span class="hidden sm:inline">Layar</span>' +
      icon('chevron-down') +
      '</summary><div class="dropdown-content w-56"><div class="dropdown-label">Layar MVP</div><div class="dropdown-separator"></div>' +
      screens +
      '</div></details>' +
      '<button type="button" class="btn btn-ghost btn-icon btn-sm" data-theme-toggle></button>' +
      '</div></header>'
    )
  }

  function screenToolbar() {
    var index = SCREEN_PAGES.findIndex(function (p) {
      return p[0] === currentPage
    })
    var prev = SCREEN_PAGES[(index - 1 + SCREEN_PAGES.length) % SCREEN_PAGES.length]
    var next = SCREEN_PAGES[(index + 1) % SCREEN_PAGES.length]
    return (
      '<div class="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded-full border bg-popover/95 p-1 text-popover-foreground shadow-lg backdrop-blur print:hidden">' +
      '<a class="btn btn-ghost btn-sm rounded-full" href="index.html" title="Kembali ke design system">' +
      icon('layout-grid') +
      '<span class="hidden sm:inline">Design system</span></a>' +
      '<span class="h-5 w-px bg-border"></span>' +
      '<a class="btn btn-ghost btn-icon btn-sm rounded-full" href="' +
      prev[0] +
      '" title="' +
      prev[1] +
      '">' +
      icon('chevron-left') +
      '</a>' +
      '<span class="px-1 text-xs font-medium text-muted-foreground tabular-nums">' +
      (index + 1) +
      '/' +
      SCREEN_PAGES.length +
      '</span>' +
      '<a class="btn btn-ghost btn-icon btn-sm rounded-full" href="' +
      next[0] +
      '" title="' +
      next[1] +
      '">' +
      icon('chevron-right') +
      '</a>' +
      '<span class="h-5 w-px bg-border"></span>' +
      '<button type="button" class="btn btn-ghost btn-icon btn-sm rounded-full" data-theme-toggle></button>' +
      '</div>'
    )
  }

  // ---------- Toast ----------
  var toastEl
  var toastTimer
  function toast(message, variant) {
    if (!toastEl) {
      toastEl = document.createElement('div')
      toastEl.className = 'toast'
      toastEl.setAttribute('role', 'status')
      toastEl.setAttribute('aria-live', 'polite')
      document.body.appendChild(toastEl)
    }
    var iconName = variant === 'error' ? 'circle-alert' : variant === 'info' ? 'info' : 'circle-check'
    var tone =
      variant === 'error' ? 'text-destructive' : variant === 'info' ? 'text-primary' : 'text-success'
    toastEl.innerHTML =
      '<span class="mt-0.5 ' +
      tone +
      '">' +
      icon(iconName) +
      '</span><div class="grid gap-0.5"><p class="font-medium">' +
      message +
      '</p><p class="text-[13px] text-muted-foreground">Prototipe — tidak ada data yang disimpan.</p></div>'
    toastEl.setAttribute('data-state', 'open')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () {
      toastEl.setAttribute('data-state', 'closed')
    }, 3200)
  }

  // ---------- Tabs ----------
  function selectTab(trigger) {
    var list = trigger.closest('[role=tablist]')
    if (!list) return
    list.querySelectorAll('[role=tab]').forEach(function (tab) {
      var selected = tab === trigger
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      var panelId = tab.getAttribute('aria-controls')
      var panel = panelId && document.getElementById(panelId)
      if (panel) panel.hidden = !selected
      if (!panelId) return
      document.querySelectorAll('[data-when-tab="' + panelId + '"]').forEach(function (el) { el.hidden = !selected })
      document.querySelectorAll('[data-unless-tab="' + panelId + '"]').forEach(function (el) { el.hidden = selected })
    })
    var filterTarget = list.getAttribute('data-filter-target')
    if (filterTarget) applyFilter(filterTarget, trigger.getAttribute('data-filter') || 'all')
  }

  function applyFilter(targetId, status) {
    var target = document.getElementById(targetId)
    if (!target) return
    var visible = 0
    target.querySelectorAll('[data-status]').forEach(function (row) {
      var show = status === 'all' || row.getAttribute('data-status') === status
      row.hidden = !show
      if (show) visible++
    })
    var empty = document.querySelector('[data-empty-for="' + targetId + '"]')
    if (empty) empty.hidden = visible > 0
  }

  // ---------- Invoice calculator (mirrors @invoicing/domain computeInvoiceTotals) ----------
  var idr = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })

  function parseNumber(value) {
    var n = Number(String(value || '').replace(/[^\d,-]/g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }

  function recalc(root) {
    var subtotal = 0
    root.querySelectorAll('[data-line]').forEach(function (line) {
      var qty = parseNumber(line.querySelector('[data-qty]').value)
      var price = parseNumber(line.querySelector('[data-price]').value)
      var discountInput = line.querySelector('[data-discount]')
      var discount = discountInput ? parseNumber(discountInput.value) : 0
      var lineTotal = Math.max(0, Math.round(qty * price) - discount)
      subtotal += lineTotal
      var out = line.querySelector('[data-line-total]')
      if (out) out.textContent = idr.format(lineTotal)
    })
    var toggle = root.querySelector('[data-ppn-toggle]')
    var ppnEnabled = toggle ? toggle.checked : false
    var rate = Number(root.getAttribute('data-ppn-rate') || '0.11')
    var ppn = ppnEnabled ? Math.round(subtotal * rate) : 0
    root.querySelectorAll('[data-subtotal]').forEach(function (el) {
      el.textContent = idr.format(subtotal)
    })
    root.querySelectorAll('[data-ppn]').forEach(function (el) {
      el.textContent = idr.format(ppn)
    })
    root.querySelectorAll('[data-total]').forEach(function (el) {
      el.textContent = idr.format(subtotal + ppn)
    })
    root.querySelectorAll('[data-ppn-row]').forEach(function (el) {
      el.hidden = !ppnEnabled
    })
    var count = root.querySelectorAll('[data-line]').length
    root.querySelectorAll('[data-line-count]').forEach(function (el) {
      el.textContent = String(count)
    })
    root.querySelectorAll('[data-remove-line]').forEach(function (btn) {
      btn.disabled = count <= 1
    })
  }

  function initInvoice(root) {
    var body = root.querySelector('[data-lines]')
    var template = root.querySelector('template[data-line-template]')
    root.addEventListener('input', function () {
      recalc(root)
    })
    root.addEventListener('change', function () {
      recalc(root)
    })
    root.addEventListener('click', function (event) {
      var add = event.target.closest('[data-add-line]')
      if (add && body && template) {
        body.appendChild(template.content.cloneNode(true))
        renderIcons(body)
        var inputs = body.querySelectorAll('[data-line]:last-child input')
        if (inputs[0]) inputs[0].focus()
        recalc(root)
      }
      var remove = event.target.closest('[data-remove-line]')
      if (remove) {
        var line = remove.closest('[data-line]')
        if (line && root.querySelectorAll('[data-line]').length > 1) line.remove()
        recalc(root)
      }
    })
    recalc(root)
  }

  // ---------- Boot ----------
  function boot() {
    var shell = document.body.getAttribute('data-shell')
    if (shell === 'docs') document.body.insertAdjacentHTML('afterbegin', docsHeader())
    if (shell === 'screen') document.body.insertAdjacentHTML('beforeend', screenToolbar())

    renderIcons(document)
    setTheme(isDark())

    document.querySelectorAll('[role=tablist]').forEach(function (list) {
      var selected = list.querySelector('[role=tab][aria-selected=true]') || list.querySelector('[role=tab]')
      if (selected) selectTab(selected)
    })

    document.querySelectorAll('[data-invoice]').forEach(initInvoice)

    document.addEventListener('click', function (event) {
      var target = event.target

      var themeBtn = target.closest('[data-theme-toggle]')
      if (themeBtn) setTheme(!isDark())

      var tab = target.closest('[role=tab]')
      if (tab) selectTab(tab)

      var opener = target.closest('[data-dialog-open]')
      if (opener) {
        var dialog = document.getElementById(opener.getAttribute('data-dialog-open'))
        if (dialog && dialog.showModal) dialog.showModal()
      }

      var closer = target.closest('[data-dialog-close]')
      if (closer) {
        var parentDialog = closer.closest('dialog')
        if (parentDialog) parentDialog.close()
      }

      if (target instanceof HTMLDialogElement) {
        var rect = target.getBoundingClientRect()
        var outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        if (outside) target.close()
      }

      document.querySelectorAll('details.dropdown[open]').forEach(function (details) {
        var inside = details.contains(target)
        var isItem = target.closest('.dropdown-item') && !target.closest('label')
        if (!inside || isItem) details.removeAttribute('open')
      })

      var copy = target.closest('[data-copy]')
      if (copy) {
        var value = copy.getAttribute('data-copy')
        if (navigator.clipboard) navigator.clipboard.writeText(value).catch(function () {})
        toast('Tautan disalin ke clipboard')
      }

      var toastBtn = target.closest('[data-toast]')
      if (toastBtn) toast(toastBtn.getAttribute('data-toast'), toastBtn.getAttribute('data-toast-variant'))
    })

    document.addEventListener('keydown', function (event) {
      var tab = event.target.closest && event.target.closest('[role=tab]')
      if (!tab || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')) return
      var tabs = Array.prototype.slice.call(tab.closest('[role=tablist]').querySelectorAll('[role=tab]'))
      var index = tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1)
      var next = tabs[(index + tabs.length) % tabs.length]
      next.focus()
      selectTab(next)
    })

    document.addEventListener('submit', function (event) {
      var form = event.target
      if (!form.hasAttribute('data-demo')) return
      event.preventDefault()
      var dialog = form.closest('dialog')
      if (dialog) dialog.close()
      toast(form.getAttribute('data-demo') || 'Tersimpan')
    })

    document.querySelectorAll('[data-search]').forEach(function (input) {
      input.addEventListener('input', function () {
        var target = document.getElementById(input.getAttribute('data-search'))
        if (!target) return
        var q = input.value.trim().toLowerCase()
        var visible = 0
        target.querySelectorAll('[data-row]').forEach(function (row) {
          var show = !q || row.textContent.toLowerCase().indexOf(q) !== -1
          row.hidden = !show
          if (show) visible++
        })
        var empty = document.querySelector('[data-empty-for="' + target.id + '"]')
        if (empty) empty.hidden = visible > 0
      })
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()

  window.InvoicingProto = { toast: toast, icon: icon }
})()
