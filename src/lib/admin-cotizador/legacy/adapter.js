/*
 * MatrixLab · Cotizador admin — capa de integración.
 *
 * Se ejecuta DESPUÉS de calculator.js (el <script> original, verbatim). No
 * toca ninguna fórmula: sólo
 *   1. despacha los `data-ml-*` que sustituyen a los handlers en línea (la
 *      CSP estricta del panel no permite `onclick="…"`);
 *   2. reemplaza el render de líneas de cotización/recibo (sin handlers en
 *      línea, con etiquetas visibles para la vista de tarjetas en iPhone) y
 *      el de tarjetas de resultado (marca el precio sugerido como principal);
 *   3. guarda el historial de cotizaciones en memoria (no sólo localStorage);
 *   4. sincroniza la "foto" del espacio de trabajo con la nube
 *      (/api/admin/cotizador/workspace) con concurrencia optimista;
 *   5. pide al servidor el folio COT-xxx definitivo ANTES de construir cada
 *      PDF de cotización (/api/admin/cotizador/folios): el navegador ya no
 *      elige ni edita el número.
 */
(function () {
  'use strict';

  var API = '/api/admin/cotizador/workspace';
  var FOLIO_API = '/api/admin/cotizador/folios';
  var CACHE_KEY = 'mlCotizadorWorkspace:v1';
  /** sessionStorage (POR PESTAÑA): folio pendiente (reintento idempotente) y último emitido. */
  var FOLIO_KEY = 'mlCotizadorFolios:tab:v2';
  var MAX_SNAPSHOT_BYTES = 200 * 1024;
  var CSRF = (document.querySelector('meta[name="ml-csrf"]') || {}).content || '';
  var MODULE_PAGES = ['dulceros', 'tattoo', 'tshirt', 'caplab', 'prendas', 'stickers', 'imanes', 'accesorios', 'fablab'];
  var ALL_PAGES = MODULE_PAGES.concat(['cotizacion', 'recibos', 'insumos']);

  function $(id) { return document.getElementById(id); }
  function lsGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* sin almacenamiento local */ } }
  function lsInt(key) { var n = parseInt(lsGet(key) || '', 10); return n > 0 ? n : null; }

  // =========================================================================
  // 0. Folio automático: fuera las flechas y el campo manual del original.
  //    Se hace ANTES de registrar ALLOWED para que sus acciones
  //    (prevCotNum / nextCotNum / syncCotNum) ni siquiera queden permitidas.
  // =========================================================================
  (function () {
    var manual = $('cot-num-input');
    var controls = manual ? manual.parentNode : null;
    var header = controls ? controls.parentNode : null;
    if (!header) return;
    var label = header.querySelector('.sec-label');
    if (label) label.textContent = 'Última cotización emitida';
    var display = $('cot-num-display');
    if (display) display.textContent = '—';
    var panel = document.createElement('div');
    panel.className = 'mlz-folio';
    panel.id = 'mlz-folio';
    panel.innerHTML = '<span class="mlz-folio-label">Siguiente folio</span>'
      + '<strong class="mlz-folio-next" id="mlz-folio-next">—</strong>'
      + '<span class="mlz-folio-hint" id="mlz-folio-hint" role="status" aria-live="polite">Automático: lo asigna el servidor al generar el PDF</span>';
    header.replaceChild(panel, controls);

    var integratedBtn = document.querySelector('[data-ml-click=\'["generatePDF",true]\']');
    var actions = integratedBtn ? integratedBtn.parentNode : null;
    if (actions) {
      var reprint = document.createElement('button');
      reprint.type = 'button';
      reprint.className = 'btn btn-outline';
      reprint.id = 'mlz-reprint';
      reprint.hidden = true;
      reprint.textContent = '🖨 Reabrir último PDF';
      actions.appendChild(reprint);
      var note = document.createElement('p');
      note.className = 'note mlz-folio-note';
      note.id = 'mlz-folio-note';
      note.textContent = 'Folio automático: al generar un PDF el servidor asigna el siguiente número '
        + '(uno por hoja en la individual) aunque después canceles la impresión; un folio nunca se reutiliza '
        + 'para otra cotización. Si el diálogo no se abre o lo cerraste, «Reabrir último PDF» lo vuelve a '
        + 'mostrar con el mismo folio, sin gastar otro. Sin conexión no se genera el PDF.';
      var origNote = actions.nextElementSibling;
      actions.parentNode.insertBefore(note, origNote && origNote.classList.contains('note') ? origNote.nextSibling : actions.nextSibling);
    }
  })();

  // =========================================================================
  // 1. Despachador de acciones (sustituye a onclick/onchange/oninput)
  // =========================================================================
  // Sólo se pueden invocar funciones que aparecen en el markup versionado
  // al cargar. El contenido dinámico (texto del usuario) siempre va escapado
  // y nunca genera atributos data-ml-*.
  var ALLOWED = {};
  ['click', 'change', 'input'].forEach(function (ev) {
    document.querySelectorAll('[data-ml-' + ev + ']').forEach(function (el) {
      try { ALLOWED[JSON.parse(el.getAttribute('data-ml-' + ev))[0]] = true; } catch (e) { /* ignora */ }
    });
  });

  function runSpec(el, ev) {
    var spec;
    try { spec = JSON.parse(el.getAttribute('data-ml-' + ev)); } catch (e) { return; }
    if (!Array.isArray(spec) || !ALLOWED[spec[0]]) return;
    var fn = window[spec[0]];
    if (typeof fn !== 'function') return;
    var args = spec.slice(1).map(function (a) {
      return a === '$this' ? el : a === '$value' ? el.value : a;
    });
    fn.apply(el, args);
  }

  ['click', 'change', 'input'].forEach(function (ev) {
    document.addEventListener(ev, function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var el = target.closest('[data-ml-' + ev + ']');
      if (el && !el.disabled) runSpec(el, ev);
      afterInteraction();
    });
  });

  /** Sustituto del `oninput` de los sliders de margen. */
  window.setMargen = function (el, calcName) {
    var label = $(el.id + '-lbl');
    if (label) label.textContent = el.value + '%';
    if (/^calc\w+$/.test(calcName) && typeof window[calcName] === 'function') window[calcName]();
  };

  // =========================================================================
  // 2. Render sin handlers en línea + jerarquía de métricas
  // =========================================================================
  window.resCard = function (label, val, sub, hi) {
    return '<div class="res-card' + (hi ? ' res-card--main' : '') + '">'
      + '<p class="res-label">' + escH(label) + '</p>'
      + '<p class="res-val' + (hi ? ' hi' : '') + '">' + escH(val) + '</p>'
      + (sub ? '<p class="res-sub">' + escH(sub) + '</p>' : '')
      + '</div>';
  };

  var LINE_KINDS = {
    cot: {
      body: 'cot-lines-body',
      lines: function () { return COT.lines; },
      empty: '<div class="cot-empty" id="cot-empty-msg">No hay servicios añadidos. Usa el botón "↓ Añadir a cotización" en cada módulo o agrega una línea manual.</div>',
      totals: function () { calcCotTotals(); },
      update: function (id, field, value) { updateLine(id, field, value); },
      remove: function (id) { removeCotLine(id); },
      addButton: function () { return document.querySelector('[data-ml-click=\'["addManualLine"]\']'); }
    },
    rec: {
      body: 'rec-lines-body',
      lines: function () { return REC.lines; },
      empty: '<div class="cot-empty" id="rec-empty-msg">No hay conceptos. Carga desde una cotización o agrega líneas manualmente.</div>',
      totals: function () { calcRecTotals(); },
      update: function (id, field, value) { updateRecLine(id, field, value); },
      remove: function (id) { removeRecLine(id); },
      addButton: function () { return document.querySelector('[data-ml-click=\'["addRecLine"]\']'); }
    }
  };

  function lineRowHtml(kind, l, index) {
    var n = index + 1;
    var name = l.desc ? ': ' + l.desc : '';
    return '<div class="cot-line-row" role="group" aria-label="Línea ' + n + '" data-id="' + l.id + '" data-kind="' + kind + '">'
      + '<label class="line-field line-field--desc"><span class="line-label">Concepto</span>'
      + '<textarea data-field="desc" rows="3" maxlength="600" autocomplete="off">' + escH(l.desc) + '</textarea></label>'
      + '<label class="line-field line-field--qty"><span class="line-label">Cantidad</span>'
      + '<input type="number" inputmode="numeric" data-field="qty" min="1" step="1" value="' + l.qty + '"></label>'
      + '<label class="line-field line-field--unit"><span class="line-label">Precio unitario</span>'
      + '<input type="number" inputmode="decimal" data-field="unitPrice" step="0.01" value="' + l.unitPrice.toFixed(2) + '"></label>'
      + '<div class="line-field line-field--total"><span class="line-label">Importe</span>'
      + '<span class="cot-line-total">' + fmtK(l.qty * l.unitPrice) + '</span></div>'
      + '<button type="button" class="cot-del-btn" data-line-del aria-label="Eliminar línea ' + n + escH(name) + '">✕</button>'
      + '</div>';
  }

  function renderLines(kind) {
    var k = LINE_KINDS[kind];
    var body = $(k.body);
    var lines = k.lines();
    body.innerHTML = lines.length === 0 ? k.empty : lines.map(function (l, i) { return lineRowHtml(kind, l, i); }).join('');
    body.querySelectorAll('textarea[data-field]').forEach(fitTextarea);
    k.totals();
  }
  /** El concepto crece con su texto: nunca queda oculto tras un scroll. */
  function fitTextarea(t) {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 2 + 'px';
  }
  window.addEventListener('resize', function () {
    document.querySelectorAll('.cot-line-row textarea[data-field]').forEach(fitTextarea);
  });
  window.renderCotLines = function () { renderLines('cot'); };
  window.renderRecLines = function () { renderLines('rec'); };

  function lineContext(target) {
    var row = target.closest('.cot-line-row[data-kind]');
    if (!row) return null;
    return { row: row, kind: LINE_KINDS[row.getAttribute('data-kind')], id: parseFloat(row.getAttribute('data-id')) };
  }

  function onLineEdit(event) {
    var input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || !input.hasAttribute('data-field')) return;
    var ctx = lineContext(input);
    if (!ctx) return;
    var field = input.getAttribute('data-field');
    if (input instanceof HTMLTextAreaElement) fitTextarea(input);
    ctx.kind.update(ctx.id, field, input.value);
    // Al confirmar (change), refleja la cantidad normalizada por el original.
    if (event.type === 'change' && field === 'qty') {
      var line = ctx.kind.lines().find(function (x) { return x.id === ctx.id; });
      if (line) input.value = line.qty;
    }
  }
  document.addEventListener('input', onLineEdit);
  document.addEventListener('change', onLineEdit);

  document.addEventListener('click', function (event) {
    var btn = event.target instanceof Element ? event.target.closest('[data-line-del]') : null;
    if (!btn) return;
    var ctx = lineContext(btn);
    if (!ctx) return;
    var rows = Array.prototype.slice.call(ctx.row.parentNode.querySelectorAll('.cot-line-row'));
    var index = rows.indexOf(ctx.row);
    var bodyId = ctx.row.parentNode.id;
    ctx.kind.remove(ctx.id);
    // Foco a la línea que ocupa su lugar, o al botón de agregar.
    var next = $(bodyId).querySelectorAll('.cot-line-row')[index] || $(bodyId).querySelectorAll('.cot-line-row')[index - 1];
    var focusTarget = next ? next.querySelector('[data-line-del]') : ctx.kind.addButton();
    if (focusTarget) focusTarget.focus();
    afterInteraction();
  });

  function focusLastLine(kind) {
    var rows = $(LINE_KINDS[kind].body).querySelectorAll('.cot-line-row');
    var last = rows[rows.length - 1];
    if (last) last.querySelector('[data-field="desc"]').focus();
  }
  var originalAddManualLine = window.addManualLine;
  window.addManualLine = function () { originalAddManualLine(); focusLastLine('cot'); };
  var originalAddRecLine = window.addRecLine;
  window.addRecLine = function () { originalAddRecLine(); focusLastLine('rec'); };

  // =========================================================================
  // 3. Historial de cotizaciones en memoria (localStorage sólo como caché)
  // =========================================================================
  var SAVED = (function () { try { return JSON.parse(lsGet('mlSavedCots') || '[]'); } catch (e) { return []; } })();
  if (!Array.isArray(SAVED)) SAVED = [];
  function mirrorSaved() { lsSet('mlSavedCots', JSON.stringify(SAVED)); }

  window.getSavedCots = function () { return SAVED.slice(); };
  window.saveCotForLater = function (cotNum, cd, lines) {
    // Misma lógica que el original, sobre la lista en memoria.
    SAVED = SAVED.filter(function (s) { return s.cotNum !== cotNum; });
    SAVED.unshift({
      cotNum: cotNum, fecha: cd.fecha, cliente: cd.cliente, tel: cd.tel, lugar: cd.lugar, tipo: cd.tipo, iva: cd.iva,
      lines: lines.map(function (l) { return { desc: l.desc, qty: l.qty, unitPrice: l.unitPrice }; })
    });
    if (SAVED.length > 50) SAVED = SAVED.slice(0, 50);
    mirrorSaved();
  };
  window.clearSavedCots = function () {
    if (!confirm('¿Borrar todas las cotizaciones guardadas? (no afecta los PDFs ya impresos)')) return;
    SAVED = [];
    mirrorSaved();
    refreshSavedCotDropdown();
    showToast('✓ Lista de cotizaciones borrada');
  };

  // Siguiente folio tras el último PDF generado aquí. Sólo informativo (viaja
  // en la foto como `cot.nextNum`): el número real lo decide el servidor, ver
  // la sección 6b. Ni la nube ni el caché pueden hacer retroceder el folio.
  var lastNextNum = lsInt('mlCotNum');

  // =========================================================================
  // 4. Accesibilidad, navegación de módulos y estado visual
  // =========================================================================
  // Asocia cada etiqueta visible con su control (el original no usa `for`).
  document.querySelectorAll('.row, .cost-item, .form-item').forEach(function (box) {
    var label = box.querySelector(':scope > label:not(.chk-row)');
    var control = box.querySelector('input[id], select[id], textarea[id]');
    if (label && control && !label.htmlFor && !label.contains(control)) label.htmlFor = control.id;
  });
  document.querySelectorAll('.qty-num').forEach(function (el) { el.setAttribute('aria-live', 'polite'); });

  var FIELD_LIMITS = {
    'cot-cliente': 200, 'cot-tel': 120, 'cot-lugar': 300, 'cot-tipo': 200, 'cot-vigencia': 60, 'cot-notas': 4000,
    'rec-cot-ref': 40, 'rec-cliente': 200, 'rec-tel': 120, 'rec-lugar': 300, 'rec-tipo': 200, 'rec-pay-ref': 120, 'rec-notas': 4000,
    'laser-insumo-nombre': 200
  };
  Object.keys(FIELD_LIMITS).forEach(function (id) { var el = $(id); if (el) el.maxLength = FIELD_LIMITS[id]; });
  ['cot-tel', 'rec-tel'].forEach(function (id) { var el = $(id); if (el) el.autocomplete = 'off'; });

  var picker = $('mlz-module');
  if (picker) {
    var groups = [
      ['Calculadoras', MODULE_PAGES],
      ['Documentos', ['cotizacion', 'recibos']],
      ['Configuración', ['insumos']]
    ];
    groups.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g[0];
      g[1].forEach(function (page) {
        var tab = document.querySelector('.main-tab[data-page="' + page + '"]');
        var opt = document.createElement('option');
        opt.value = page;
        opt.textContent = tab ? tab.textContent.trim() : page;
        og.appendChild(opt);
      });
      picker.appendChild(og);
    });
    picker.addEventListener('change', function () {
      switchPage(picker.value);
      var container = document.querySelector('.container');
      if (container) container.scrollIntoView({ block: 'start' });
    });
  }

  var activePage = 'dulceros';
  var originalSwitchPage = window.switchPage;
  window.switchPage = function (p) {
    if (ALL_PAGES.indexOf(p) < 0) return;
    originalSwitchPage(p);
    activePage = p;
    // Sólo aquí se toca el selector: si syncUi lo re-sincronizara, el evento
    // `input` (que llega antes que `change`) devolvería el valor anterior.
    if (picker && picker.value !== p) picker.value = p;
    syncUi();
  };

  function syncUi() {
    document.querySelectorAll('.chip, .pill-opt').forEach(function (el) {
      el.setAttribute('aria-pressed', el.classList.contains('active') ? 'true' : 'false');
    });
    document.querySelectorAll('.sub-tab').forEach(function (el) {
      var on = el.classList.contains('active-cyan') || el.classList.contains('active-purple');
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('.main-tab').forEach(function (el) {
      if (el.classList.contains('active')) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  }

  // =========================================================================
  // 5. Foto del espacio de trabajo (captura / restauración)
  // =========================================================================
  function moduleRoots() { return MODULE_PAGES.map(function (p) { return $('page-' + p); }); }
  function moduleControls() {
    var out = [];
    moduleRoots().forEach(function (root) {
      root.querySelectorAll('input[id], select[id], textarea[id]').forEach(function (el) {
        if (el.type !== 'file') out.push(el);
      });
    });
    return out;
  }
  function chipGroups() {
    var out = [];
    moduleRoots().forEach(function (root) {
      root.querySelectorAll('.chip-group').forEach(function (g) { out.push(g); });
    });
    return out;
  }
  function groupChips(group) {
    return Array.prototype.filter.call(group.children, function (c) { return c.classList.contains('chip'); });
  }
  function subTabsOf(page) { return Array.prototype.slice.call($('page-' + page).querySelectorAll('.sub-tabs .sub-tab')); }
  function val(id) { var el = $(id); return el ? String(el.value) : ''; }
  function clampInt(n, min, max) { n = Math.round(Number(n)); if (!isFinite(n)) n = min; return Math.min(max, Math.max(min, n)); }
  function clampNum(n, min, max) { n = Number(n); if (!isFinite(n)) n = 0; return Math.min(max, Math.max(min, n)); }
  function cleanLine(l) {
    return { id: clampNum(l.id, 0, Number.MAX_SAFE_INTEGER), desc: String(l.desc || '').slice(0, 600), qty: clampInt(l.qty, 1, 1e9), unitPrice: clampNum(l.unitPrice, -1e8, 1e8) };
  }
  function fields(map) {
    var out = {};
    Object.keys(map).forEach(function (key) { out[key] = val(map[key]).slice(0, FIELD_LIMITS[map[key]] || 200); });
    return out;
  }
  var COT_FIELDS = { cliente: 'cot-cliente', tel: 'cot-tel', fechaEvento: 'cot-fecha-evento', lugar: 'cot-lugar', tipo: 'cot-tipo', vigencia: 'cot-vigencia', notas: 'cot-notas' };
  var REC_FIELDS = { cotRef: 'rec-cot-ref', cliente: 'rec-cliente', tel: 'rec-tel', fechaPago: 'rec-fecha-pago', lugar: 'rec-lugar', tipo: 'rec-tipo', payRef: 'rec-pay-ref', notas: 'rec-notas' };

  function capture() {
    var inputs = {};
    moduleControls().forEach(function (el) {
      inputs[el.id] = el.type === 'checkbox' ? el.checked : String(el.value).slice(0, 200);
    });
    var chips = {};
    chipGroups().forEach(function (g, i) {
      var idx = groupChips(g).findIndex(function (c) { return c.classList.contains('active'); });
      if (idx >= 0) chips['g' + i] = idx;
    });
    var subTabs = {};
    MODULE_PAGES.forEach(function (page) {
      var idx = subTabsOf(page).findIndex(function (b) { return b.classList.contains('active-cyan') || b.classList.contains('active-purple'); });
      if (idx >= 0) subTabs[page] = idx;
    });
    var costs = {};
    $('page-insumos').querySelectorAll('input[id^="c-"]').forEach(function (el) { costs[el.id] = String(el.value); });
    return {
      schema: 1,
      activePage: activePage,
      cot: {
        num: clampInt(COT.cotNum, 1, 1e9),
        nextNum: lastNextNum ? clampInt(lastNextNum, 1, 1e9) : null,
        iva: !!COT.iva,
        lines: COT.lines.map(cleanLine),
        fields: fields(COT_FIELDS)
      },
      rec: {
        num: clampInt(REC.recNum, 1, 1e9),
        iva: !!REC.iva,
        payMethod: REC.payMethod,
        status: val('rec-status'),
        lines: REC.lines.map(cleanLine),
        attachment: REC.attachment ? { name: String(REC.attachment.name).slice(0, 200), size: clampInt(REC.attachment.size, 0, 1e7) } : null,
        fields: fields(REC_FIELDS)
      },
      savedCots: SAVED.slice(0, 50),
      costs: costs,
      modules: {
        inputs: inputs,
        chips: chips,
        subTabs: subTabs,
        counters: { qtyD: SD.qtyD, tsCustomQty: STS_S.customQty, pQty: SP.qty }
      }
    };
  }

  function setPill(toggleId, on) {
    return $(toggleId).querySelectorAll('.pill-opt')[on ? 1 : 0];
  }

  function applySnapshot(s, options) {
    var m = s.modules || {};
    // a) Costos de Insumos (se aplican con updateCosts al final).
    Object.keys(s.costs || {}).forEach(function (id) {
      var el = $(id);
      if (el && el.closest('#page-insumos')) el.value = s.costs[id];
    });
    // b) Valores de los módulos.
    var inputs = m.inputs || {};
    moduleControls().forEach(function (el) {
      if (!(el.id in inputs)) return;
      if (el.type === 'checkbox') el.checked = !!inputs[el.id];
      else el.value = inputs[el.id];
    });
    MODULE_PAGES.forEach(function (page) {
      var label;
      $('page-' + page).querySelectorAll('input[type=range][id]').forEach(function (r) {
        label = $(r.id + '-lbl');
        if (label) label.textContent = r.value + '%';
      });
    });
    // c) Sub-pestañas y chips: se re-ejecutan sus setters originales.
    Object.keys(m.subTabs || {}).forEach(function (page) {
      var tab = MODULE_PAGES.indexOf(page) >= 0 ? subTabsOf(page)[m.subTabs[page]] : null;
      if (tab) runSpec(tab, 'click');
    });
    var groups = chipGroups();
    Object.keys(m.chips || {}).forEach(function (key) {
      var group = groups[parseInt(key.slice(1), 10)];
      var chip = group ? groupChips(group)[m.chips[key]] : null;
      if (chip) runSpec(chip, 'click');
    });
    // d) Casillas que muestran/ocultan opciones (toggleAgra, etc.).
    moduleControls().forEach(function (el) {
      var spec = el.getAttribute('data-ml-change') || '';
      if (el.type === 'checkbox' && spec.indexOf('["toggle') === 0) runSpec(el, 'change');
    });
    // e) Contadores que el original guarda en variables.
    if (m.counters) {
      SD.qtyD = m.counters.qtyD; $('qty-d').textContent = SD.qtyD;
      STS_S.customQty = m.counters.tsCustomQty; $('qty-ts').textContent = STS_S.customQty;
      SP.qty = m.counters.pQty; $('qty-p').textContent = SP.qty;
    }
    updateCosts();

    // f) Cotización.
    // Folio de referencia: sólo para mostrar. Restaurar una foto vieja NUNCA
    // cambia el siguiente folio (lo decide el servidor al generar).
    COT.cotNum = s.cot.num;
    lastNextNum = s.cot.nextNum;
    if (lastNextNum) lsSet('mlCotNum', String(lastNextNum));
    COT.lines = s.cot.lines.map(cleanLine);
    Object.keys(COT_FIELDS).forEach(function (key) { $(COT_FIELDS[key]).value = s.cot.fields[key]; });
    syncCotNum(getCotNumStr());
    setIva(!!s.cot.iva, setPill('iva-toggle', !!s.cot.iva));

    // g) Recibo.
    REC.recNum = s.rec.num;
    lsSet('mlRecNum', String(REC.recNum));
    REC.lines = s.rec.lines.map(cleanLine);
    Object.keys(REC_FIELDS).forEach(function (key) { $(REC_FIELDS[key]).value = s.rec.fields[key]; });
    $('rec-status').value = s.rec.status;
    var payChip = document.querySelector('#rec-pay-chips [data-ml-click=\'["setRecPay","' + s.rec.payMethod + '","$this"]\']');
    if (payChip) setRecPay(s.rec.payMethod, payChip);
    syncRecNum(getRecNumStr());
    setRecIva(!!s.rec.iva, setPill('rec-iva-toggle', !!s.rec.iva));
    $('rec-cot-file').value = '';
    REC.attachment = s.rec.attachment;
    var info = $('rec-attachment-info');
    if (REC.attachment) {
      info.textContent = '📎 Adjunto: ' + REC.attachment.name + ' (' + REC.attachment.size + ' KB) — se referenciará en el recibo (el archivo no se incrusta).';
      info.classList.remove('hidden');
    } else {
      info.classList.add('hidden');
    }
    renderRecLines();

    // h) Historial.
    SAVED = (s.savedCots || []).slice(0, 50);
    mirrorSaved();
    refreshSavedCotDropdown();

    switchPage(options && options.keepPage ? activePage : s.activePage);
    syncUi();
  }

  // Serialización canónica (jsonb reordena llaves) + hash para detectar cambios.
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(value[k]); }).join(',') + '}';
    }
    return JSON.stringify(value === undefined ? null : value);
  }
  function hashOf(snapshot) {
    var copy = {};
    Object.keys(snapshot).forEach(function (k) { if (k !== 'activePage') copy[k] = snapshot[k]; });
    var str = canonical(copy);
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
  }
  function byteLength(obj) { return new TextEncoder().encode(JSON.stringify(obj)).length; }

  // =========================================================================
  // 6. Sincronización con la nube
  // =========================================================================
  var WS = { version: 0, updatedAt: null, syncedHash: null, cloudSnapshot: null, saving: false, conflict: false, ready: false };
  /** lastIssued: último folio emitido según el servidor (null = desconocido). */
  var FOLIO = { lastIssued: null, busy: false, lastHtml: null, lastTitle: null };
  var statusEl = $('mlz-status');
  var saveBtn = $('mlz-save');
  var reloadBtn = $('mlz-reload');
  var noticeEl = $('mlz-notice');

  function formatWhen(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function setStatus(state, message) {
    statusEl.setAttribute('data-state', state);
    statusEl.textContent = message;
    applyLock();
  }

  /**
   * Bloqueos de edición: la primera lectura (o una recarga confirmada)
   * reemplaza los campos, y mientras el servidor asigna un folio la
   * cotización no puede cambiar (el PDF debe ser exactamente lo que se envió).
   */
  function applyLock() {
    var locked = !WS.ready || FOLIO.busy;
    saveBtn.disabled = WS.saving || locked;
    reloadBtn.disabled = WS.saving || locked;
    saveBtn.setAttribute('aria-busy', WS.saving ? 'true' : 'false');
    saveBtn.textContent = WS.saving ? 'Guardando…' : 'Guardar en la nube';
    document.querySelectorAll('.container, .main-tabs, .mlz-picker').forEach(function (el) {
      el.inert = locked;
      el.setAttribute('aria-busy', locked ? 'true' : 'false');
    });
  }

  /** actions: [{label, primary?, onClick}] */
  function showNotice(kind, message, actions) {
    noticeEl.setAttribute('data-kind', kind);
    noticeEl.innerHTML = '';
    var p = document.createElement('p');
    p.textContent = message;
    noticeEl.appendChild(p);
    if (actions && actions.length) {
      var row = document.createElement('div');
      row.className = 'mlz-notice-actions';
      actions.forEach(function (a) {
        var b;
        if (a.href) {
          b = document.createElement('a');
          b.href = a.href;
        } else {
          b = document.createElement('button');
          b.type = 'button';
          b.addEventListener('click', a.onClick);
        }
        b.className = 'mlz-btn' + (a.primary ? ' mlz-btn--primary' : '');
        b.textContent = a.label;
        row.appendChild(b);
      });
      noticeEl.appendChild(row);
    }
    noticeEl.hidden = false;
  }
  function hideNotice() { noticeEl.hidden = true; noticeEl.innerHTML = ''; }

  function isDirty() { return WS.syncedHash === null || hashOf(capture()) !== WS.syncedHash; }

  function writeCache(dirty) {
    var snapshot = capture();
    lsSet(CACHE_KEY, JSON.stringify({ v: 1, baseVersion: WS.version, syncedHash: WS.syncedHash, dirty: dirty, savedAt: Date.now(), snapshot: snapshot }));
  }
  function readCache() {
    try {
      var c = JSON.parse(lsGet(CACHE_KEY) || 'null');
      return c && c.v === 1 && c.snapshot && c.snapshot.schema === 1 ? c : null;
    } catch (e) { return null; }
  }

  function refreshIdleStatus() {
    if (WS.saving || WS.conflict || !WS.ready) return;
    if (isDirty()) {
      setStatus('dirty', WS.version > 0 ? 'Cambios sin guardar en la nube' : 'Sin guardar en la nube todavía');
    } else if (WS.version > 0) {
      setStatus('saved', 'Guardado en la nube · ' + formatWhen(WS.updatedAt));
    } else {
      setStatus('empty', 'Aún no hay nada guardado en la nube');
    }
  }

  var checkTimer = null;
  function afterInteraction() {
    syncUi();
    if (!WS.ready) return;
    clearTimeout(checkTimer);
    checkTimer = setTimeout(function () {
      writeCache(isDirty());
      refreshIdleStatus();
    }, 250);
  }

  function markSynced(version, updatedAt) {
    WS.version = version;
    WS.updatedAt = updatedAt;
    WS.syncedHash = hashOf(capture());
  }

  function request(method, body, url) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    var init = { method: method, credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } };
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.headers['x-ml-csrf'] = CSRF;
      init.body = JSON.stringify(body);
    }
    return fetch(url || API, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { status: res.status, data: data || {}, retryAfter: res.headers.get('Retry-After') }; });
    }).finally(function () { clearTimeout(timeout); });
  }

  function describeFailure(r) {
    if (!r) return 'Sin conexión con la nube. Tus cambios siguen en este dispositivo; vuelve a intentar.';
    if (r.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión para usar la nube (tus cambios siguen en este dispositivo).';
    if (r.status === 429) return 'Demasiados intentos seguidos. Espera ' + (r.retryAfter || 'unos') + ' segundos y vuelve a intentar.';
    if (r.status === 503) return 'La nube no está configurada en este servidor. Tus cambios sólo se guardan en este dispositivo.';
    if (r.status === 413) return 'El guardado es demasiado grande. Borra cotizaciones guardadas antiguas en Recibos y vuelve a intentar.';
    if (r.status === 400) return 'La nube rechazó los datos del cotizador. Revisa cantidades y textos muy largos.';
    return 'No pudimos comunicarnos con la nube (error ' + r.status + '). Tus cambios siguen en este dispositivo.';
  }
  function failureActions(r) {
    return r && r.status === 401 ? [{ label: 'Iniciar sesión', href: '/admin/login', primary: true }] : [];
  }

  function save(force) {
    if (WS.saving || !WS.ready || FOLIO.busy) return;
    var snapshot = capture();
    var size = byteLength(snapshot);
    if (size > MAX_SNAPSHOT_BYTES) {
      setStatus('error', 'Guardado demasiado grande');
      showNotice('error', 'El guardado ocupa ' + Math.ceil(size / 1024) + ' KB y el máximo es ' + (MAX_SNAPSHOT_BYTES / 1024) + ' KB. Borra cotizaciones guardadas antiguas en Recibos y vuelve a intentar.');
      return;
    }
    WS.saving = true;
    setStatus('saving', 'Guardando en la nube…');
    request('PUT', { baseVersion: WS.version, snapshot: snapshot }).then(function (r) {
      WS.saving = false;
      if (r.status === 200 && r.data.ok) {
        WS.conflict = false;
        hideNotice();
        WS.version = r.data.version;
        WS.updatedAt = r.data.updatedAt;
        WS.syncedHash = hashOf(snapshot);
        writeCache(isDirty());
        refreshIdleStatus();
        if (force) showToast('✓ Versión de la nube reemplazada');
        return;
      }
      if (r.status === 409) {
        WS.conflict = true;
        writeCache(true);
        setStatus('conflict', 'Conflicto: hay una versión más nueva en la nube');
        var when = formatWhen(r.data.updatedAt);
        showNotice('conflict', 'Otra sesión guardó una versión más nueva' + (when ? ' (' + when + ')' : '') + '. Tus cambios siguen en esta pantalla y no se ha sobrescrito nada.', [
          { label: 'Cargar la versión de la nube', onClick: function () { reload(true); } },
          { label: 'Reemplazarla con mis cambios', primary: true, onClick: function () {
            if (!confirm('Esto reemplazará la versión guardada en la nube por la de esta pantalla. ¿Continuar?')) return;
            WS.version = r.data.currentVersion;
            WS.conflict = false;
            save(true);
          } }
        ]);
        return;
      }
      writeCache(true);
      setStatus('error', 'No se guardó en la nube');
      showNotice('error', describeFailure(r), failureActions(r));
    }, function () {
      WS.saving = false;
      writeCache(true);
      setStatus('error', 'No se guardó en la nube');
      showNotice('error', describeFailure(null));
    });
  }

  function reload(skipConfirm) {
    if (WS.saving || FOLIO.busy) return;
    if (!skipConfirm && isDirty() && !confirm('Tienes cambios sin guardar en la nube. ¿Descartarlos y cargar la versión guardada?')) return;
    WS.ready = false;
    setStatus('loading', 'Cargando guardado de la nube…');
    request('GET').then(function (r) {
      WS.ready = true;
      if (r.status !== 200 || !r.data.ok) {
        setStatus('error', 'No se pudo cargar la nube');
        showNotice('error', describeFailure(r), failureActions(r));
        return;
      }
      WS.conflict = false;
      hideNotice();
      if (!r.data.snapshot || r.data.version === 0) {
        WS.version = r.data.version || 0;
        setStatus('empty', 'Aún no hay nada guardado en la nube');
        showToast('No hay nada guardado en la nube todavía');
        return;
      }
      applySnapshot(r.data.snapshot, { keepPage: true });
      markSynced(r.data.version, r.data.updatedAt);
      writeCache(false);
      refreshIdleStatus();
      refreshFolioStatus();
      showToast('✓ Versión de la nube cargada');
    }, function () {
      WS.ready = true;
      setStatus('error', 'No se pudo cargar la nube');
      showNotice('error', describeFailure(null));
    });
  }

  function boot() {
    var cache = readCache();
    setStatus('loading', 'Cargando guardado de la nube…');
    // Sólo informativo (no reserva): el folio real se asigna al generar.
    refreshFolioStatus();
    request('GET').then(function (r) {
      WS.ready = true;
      if (r.status !== 200 || !r.data.ok) { bootOffline(cache, r); return; }
      var cloud = r.data.snapshot && r.data.version > 0 ? r.data.snapshot : null;
      WS.cloudSnapshot = cloud;
      if (cloud) {
        applySnapshot(cloud);
        markSynced(r.data.version, r.data.updatedAt);
      } else {
        WS.version = r.data.version || 0;
        // Nube vacía: el estado inicial cuenta como "limpio" hasta que se edite.
        WS.syncedHash = cache && cache.baseVersion === WS.version && cache.syncedHash ? cache.syncedHash : hashOf(capture());
      }
      if (cache && cache.dirty) {
        // Nunca se pisan en silencio cambios locales sin guardar.
        applySnapshot(cache.snapshot);
        if (cloud && cache.baseVersion !== r.data.version) {
          WS.conflict = true;
          setStatus('conflict', 'Conflicto: hay una versión más nueva en la nube');
          showNotice('conflict', 'Este dispositivo tiene cambios sin guardar y en la nube hay una versión más nueva (' + formatWhen(r.data.updatedAt) + '). Elige cuál conservar.', [
            { label: 'Usar la versión de la nube', onClick: function () {
              if (!confirm('Se descartarán los cambios de este dispositivo. ¿Continuar?')) return;
              applySnapshot(WS.cloudSnapshot, { keepPage: true });
              markSynced(WS.version, WS.updatedAt);
              WS.conflict = false; hideNotice(); writeCache(false); refreshIdleStatus();
            } },
            { label: 'Conservar mis cambios', primary: true, onClick: function () {
              WS.conflict = false; hideNotice(); writeCache(true); refreshIdleStatus();
              showToast('Tus cambios se conservan. Pulsa “Guardar en la nube”.');
            } }
          ]);
          writeCache(true);
          return;
        }
        showToast('Se recuperaron cambios sin guardar de este dispositivo');
      }
      writeCache(isDirty());
      refreshIdleStatus();
    }, function () {
      WS.ready = true;
      bootOffline(cache, null);
    });
  }

  function bootOffline(cache, r) {
    if (cache) {
      applySnapshot(cache.snapshot);
      WS.version = cache.baseVersion || 0;
      WS.syncedHash = cache.syncedHash || null;
    }
    var reason = !r ? 'Sin conexión con la nube' : r.status === 401 ? 'Sesión expirada' : r.status === 503 ? 'Nube no configurada' : 'No se pudo cargar la nube';
    setStatus('error', reason + (cache ? ' · usando la copia de este dispositivo' : ''));
    showNotice('error', describeFailure(r), failureActions(r).concat(r && r.status === 401 ? [] : [{ label: 'Reintentar', onClick: function () { reload(true); } }]));
  }

  // =========================================================================
  // 6b. Folios de cotización asignados por el servidor
  // =========================================================================
  // Cada PDF de cotización consume folios DEFINITIVOS que elige el servidor
  // (integrada o de una línea: 1; individual: uno por hoja, contiguos). El
  // navegador no puede saber si el PDF se guardó o se canceló, así que el
  // folio se consume al generar y nunca se recicla. Sin respuesta confirmada
  // no hay PDF ni número: nada de folios locales que puedan duplicarse.
  //
  // Idempotencia: la solicitud lleva un UUID que se guarda (con la huella del
  // contenido) ANTES de enviarse. Si la respuesta se pierde (timeout, red,
  // recarga), reintentar con el mismo contenido reutiliza el UUID y el
  // servidor devuelve el mismo rango sin consumir otro. Si el contenido
  // cambió, el UUID viejo se descarta: un folio jamás cubre dos contenidos.
  //
  // El estado (pendiente + último emitido) es POR PESTAÑA: vive en memoria y
  // se refleja en sessionStorage para sobrevivir a recargar la misma pestaña.
  // Nunca en localStorage: dos pestañas con el mismo contenido son dos
  // generaciones distintas y no deben compartir UUID. Una pestaña duplicada
  // hereda una copia de sessionStorage; por eso, además, cada pestaña toma un
  // Web Lock con el UUID antes de usarlo y, si otra ya lo tiene, pide uno
  // nuevo. Si el almacenamiento falla, el estado sigue en memoria.
  function formatFolio(n) { return 'COT-' + String(n).padStart(3, '0'); }
  function folioRange(first, count) { return count > 1 ? formatFolio(first) + ' a ' + formatFolio(first + count - 1) : formatFolio(first); }

  var TAB_FOLIOS = (function () {
    try {
      var s = JSON.parse(window.sessionStorage.getItem(FOLIO_KEY) || 'null');
      if (s && s.v === 2) return { v: 2, pending: s.pending || null, issued: s.issued || null };
    } catch { /* sin sessionStorage o corrupto: sólo memoria */ }
    return { v: 2, pending: null, issued: null };
  })();
  function readFolios() { return TAB_FOLIOS; }
  function writeFolios(s) {
    TAB_FOLIOS = s;
    try { window.sessionStorage.setItem(FOLIO_KEY, JSON.stringify(s)); } catch { /* queda en memoria */ }
  }

  // Web Locks por UUID: sólo una pestaña viva puede usar un UUID pendiente.
  var heldLocks = {};
  function claimRequest(id) {
    if (heldLocks[id]) return Promise.resolve(true);
    var locks = navigator.locks;
    if (!locks || typeof locks.request !== 'function') return Promise.resolve(true);
    return new Promise(function (resolve) {
      locks.request('mlz-cot-folio:' + id, { ifAvailable: true }, function (lock) {
        if (!lock) { resolve(false); return undefined; }
        // Se mantiene hasta que la solicitud se resuelva o la pestaña se cierre.
        return new Promise(function (release) { heldLocks[id] = release; resolve(true); });
      }).catch(function () { resolve(true); });
    });
  }
  function releaseRequest(id) {
    if (heldLocks[id]) { heldLocks[id](); delete heldLocks[id]; }
  }
  // UUIDs ya resueltos (PDF emitido o rechazo definitivo). Una pestaña
  // duplicada puede heredar un pendiente que la original ya completó y soltó:
  // esta lista (sólo UUIDs, compartida entre pestañas) impide reutilizarlo.
  // Se marca ANTES de soltar el lock y se consulta DESPUÉS de tomarlo.
  var DONE_KEY = 'mlCotizadorFolioDone:v2';
  var doneMem = {};
  function doneList() {
    try { var l = JSON.parse(lsGet(DONE_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; }
  }
  function isDone(id) { return !!doneMem[id] || doneList().indexOf(id) >= 0; }
  function finishRequest(id) {
    doneMem[id] = true;
    var l = doneList().filter(function (x) { return x !== id; });
    l.unshift(id);
    lsSet(DONE_KEY, JSON.stringify(l.slice(0, 100)));
    releaseRequest(id);
  }
  /** UUID para este contenido: reutiliza el pendiente propio, nunca uno ajeno ni uno ya resuelto. */
  function requestIdFor(key) {
    var store = readFolios();
    var reuse = store.pending && store.pending.key === key ? store.pending.requestId : null;
    var claim = reuse ? claimRequest(reuse) : Promise.resolve(false);
    return claim.then(function (owned) {
      if (owned && !isDone(reuse)) return reuse;
      if (owned) releaseRequest(reuse);
      if (store.pending && !reuse) releaseRequest(store.pending.requestId);
      var fresh = newRequestId();
      return claimRequest(fresh).then(function () {
        writeFolios({ v: 2, pending: { requestId: fresh, key: key }, issued: readFolios().issued });
        return fresh;
      });
    });
  }

  function newRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    var b = window.crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  /** Contenido que identifica la cotización (mismo contrato que valida el servidor). */
  function folioQuote() {
    return {
      iva: !!COT.iva,
      lines: COT.lines.map(function (l) { var c = cleanLine(l); return { desc: c.desc, qty: c.qty, unitPrice: c.unitPrice }; }),
      fields: fields(COT_FIELDS)
    };
  }

  var folioNext = $('mlz-folio-next');
  var folioHint = $('mlz-folio-hint');
  var reprintBtn = $('mlz-reprint');
  var genButtons = document.querySelectorAll('[data-ml-click^=\'["generatePDF"\']');
  var originalTitle = document.title;

  function renderFolio() {
    var known = FOLIO.lastIssued !== null;
    $('cot-num-display').textContent = known ? formatFolio(FOLIO.lastIssued) : '—';
    if (folioNext) folioNext.textContent = known ? formatFolio(FOLIO.lastIssued + 1) : '—';
    if (folioHint) {
      folioHint.textContent = FOLIO.busy ? 'Asignando folio en el servidor…'
        : known ? 'Automático: lo asigna el servidor al generar el PDF'
        : 'Lo asigna el servidor al generar el PDF (requiere conexión)';
    }
  }
  function noteLastIssued(n) {
    if (typeof n === 'number' && isFinite(n) && n >= 1) FOLIO.lastIssued = Math.max(FOLIO.lastIssued || 0, Math.floor(n));
  }

  // El folio ya no se escribe a mano ni con flechas: sólo se muestra.
  window.syncCotNum = function () { renderFolio(); };
  window.prevCotNum = function () { renderFolio(); };
  window.nextCotNum = function () { renderFolio(); };

  function setFolioBusy(on) {
    FOLIO.busy = on;
    genButtons.forEach(function (b) { b.disabled = on; b.setAttribute('aria-busy', on ? 'true' : 'false'); });
    if (reprintBtn) reprintBtn.disabled = on;
    applyLock();
    renderFolio();
  }

  function refreshFolioStatus() {
    request('GET', undefined, FOLIO_API).then(function (r) {
      if (r.status === 200 && r.data.ok) noteLastIssued(r.data.lastIssued);
      renderFolio();
    }, function () { renderFolio(); });
  }

  function describeFolioFailure(r) {
    var keep = ' Tu cotización sigue aquí, sin cambios.';
    if (!r) return 'No se generó el PDF: el servidor no confirmó el folio (sin conexión o tardó demasiado).' + keep + ' Vuelve a intentar: se reutiliza la misma solicitud, así que no se duplica ni se salta ningún folio.';
    if (r.status === 401) return 'No se generó el PDF: tu sesión expiró. Inicia sesión y vuelve a generar.' + keep;
    if (r.status === 429) return 'No se generó el PDF: demasiados intentos seguidos. Espera ' + (r.retryAfter || 'unos') + ' segundos y vuelve a intentar.' + keep;
    if (r.status === 503) return 'No se generó el PDF: la nube no está configurada en este servidor, así que no se pueden asignar folios.' + keep;
    if (r.status === 409) return 'No se generó el PDF: la solicitud anterior se hizo con otro contenido. Vuelve a generar para obtener un folio nuevo.' + keep;
    if (r.status === 400 || r.status === 413) return 'No se generó el PDF: el servidor rechazó los datos de la cotización. Revisa cantidades y textos muy largos.' + keep;
    return 'No se generó el PDF: no pudimos asignar el folio (error ' + r.status + ').' + keep + ' Vuelve a intentar.';
  }

  function restoreTitle() { document.title = originalTitle; }
  window.addEventListener('afterprint', restoreTitle);

  var originalGeneratePDF = window.generatePDF;
  window.generatePDF = function (integrated) {
    if (FOLIO.busy) return;
    // Sin líneas: el original avisa y no genera nada (no se pide folio).
    if (COT.lines.length === 0) { originalGeneratePDF(integrated); return; }
    if (!WS.ready || WS.saving) { showToast('⚠ Espera a que termine la sincronización con la nube'); return; }

    var mode = integrated ? 'integrated' : 'individual';
    var quote = folioQuote();
    var key = hashOf({ mode: mode, quote: quote });
    var expected = (integrated || quote.lines.length === 1) ? 1 : quote.lines.length;

    // Bloqueo SÍNCRONO desde el primer toque: el segundo toque no entra.
    setFolioBusy(true);
    var requestId = null;
    // Reintento del mismo contenido → mismo UUID (no consume otro folio).
    requestIdFor(key).then(function (id) {
      requestId = id;
      return request('POST', { requestId: id, mode: mode, quote: quote }, FOLIO_API);
    }).then(function (r) {
      var d = r.data;
      var ok = r.status === 200 && d.ok && d.count === expected && typeof d.first === 'number' && d.first >= 1 && Math.floor(d.first) === d.first;
      if (!ok) {
        setFolioBusy(false);
        // Rechazos definitivos: esa solicitud no prosperará nunca → se descarta.
        if (r.status === 200 || r.status === 400 || r.status === 409 || r.status === 413) {
          var s = readFolios();
          if (s.pending && s.pending.requestId === requestId) writeFolios({ v: 2, pending: null, issued: s.issued });
          finishRequest(requestId);
        }
        showNotice('error', r.status === 200 ? describeFolioFailure({ status: 500 }) : describeFolioFailure(r), failureActions(r));
        showToast('⚠ No se generó el PDF');
        return;
      }
      // El bloqueo sigue hasta que el print() programado por el original
      // (setTimeout 150 ms) ya se haya llamado: un toque en esa ventana no
      // puede reservar otro folio ni reemplazar la plantilla antes de imprimir.
      var printing = { scheduled: false };
      try {
        issueAndPrint(integrated, d, requestId, quote, printing);
      } finally {
        if (printing.scheduled) setTimeout(function () { setFolioBusy(false); }, PRINT_SETTLE_MS);
        else setFolioBusy(false);
      }
    }, function () {
      setFolioBusy(false);
      showNotice('error', describeFolioFailure(null));
      showToast('⚠ No se generó el PDF');
    });
  };

  /** Margen sobre el setTimeout(print, 150) del generatePDF original. */
  var PRINT_SETTLE_MS = 250;

  function issueAndPrint(integrated, d, requestId, quote, printing) {
    var prev = readFolios();
    var store = {
      v: 2,
      pending: prev.pending && prev.pending.requestId === requestId ? null : prev.pending,
      issued: { first: d.first, count: d.count, quote: hashOf({ quote: quote }) }
    };
    writeFolios(store);
    finishRequest(requestId);
    noteLastIssued(d.lastIssued);
    noteLastIssued(d.first + d.count - 1);
    renderFolio();

    // La edición está bloqueada durante la solicitud; si aun así cambió la
    // cotización (p. ej. se eligió otra versión de la nube), no se imprime un
    // folio sobre un contenido distinto del que se envió.
    if (hashOf({ quote: folioQuote() }) !== store.issued.quote) {
      showNotice('error', 'La cotización cambió mientras se asignaba el folio ' + folioRange(d.first, d.count) + ', así que no se generó el PDF. Vuelve a generarlo (recibirá un folio nuevo).');
      return;
    }
    hideNotice();

    // El renderer original numera desde COT.cotNum: se fija al folio confirmado.
    COT.cotNum = d.first;
    var label = folioRange(d.first, d.count);
    document.title = 'MatrixLab ' + label;
    printing.scheduled = true;
    try {
      originalGeneratePDF(integrated);
    } catch {
      // El original guarda `mlCotNum` con localStorage.setItem SIN try: con el
      // almacenamiento bloqueado lanza DESPUÉS de armar la plantilla y antes de
      // programar la impresión. Se imprime igual, con el mismo retraso.
      setTimeout(function () { window.print(); }, 150);
    }
    lastNextNum = d.first + d.count;
    FOLIO.lastHtml = $('print-template').innerHTML;
    FOLIO.lastTitle = document.title;
    if (reprintBtn) {
      reprintBtn.textContent = '🖨 Reabrir PDF ' + label;
      reprintBtn.hidden = false;
    }
    renderFolio();
    showToast('✓ Folio ' + label + ' asignado');
    afterInteraction();
  }

  if (reprintBtn) {
    // Reimprime el PDF ya emitido con su mismo folio, sin pedir otro. Es
    // síncrono dentro del toque: sirve si Safari bloqueó el print() diferido.
    reprintBtn.addEventListener('click', function () {
      if (!FOLIO.lastHtml || FOLIO.busy) return;
      $('print-template').innerHTML = FOLIO.lastHtml;
      document.title = FOLIO.lastTitle || originalTitle;
      window.print();
    });
  }

  // "Cargar de cotización actual" sólo enlaza un folio YA emitido para este
  // mismo contenido: el recibo nunca apunta a un folio que no existe.
  var originalLoadFromCurrentCot = window.loadFromCurrentCot;
  window.loadFromCurrentCot = function () {
    originalLoadFromCurrentCot();
    if (COT.lines.length === 0) return;
    var issued = readFolios().issued;
    var ref = $('rec-cot-ref');
    if (issued && issued.quote === hashOf({ quote: folioQuote() })) {
      ref.value = formatFolio(issued.first);
      showToast('✓ Datos cargados desde ' + ref.value);
    } else {
      ref.value = '';
      showToast('Datos cargados. Esta cotización aún no tiene folio: genera su PDF o elige una guardada.');
    }
  };

  // El recibo también usa #print-template: no puede reemplazar la plantilla
  // mientras una cotización espera su impresión.
  var originalGenerateReceiptPDF = window.generateReceiptPDF;
  window.generateReceiptPDF = function () {
    if (FOLIO.busy) return;
    originalGenerateReceiptPDF();
  };

  // El aviso original mostraba el folio local (que ya no se usa).
  var originalAddToCot = window.addToCot;
  window.addToCot = function (serviceKey) {
    var before = COT.lines.length;
    originalAddToCot(serviceKey);
    if (COT.lines.length > before) showToast('✓ Añadido a cotización');
  };

  saveBtn.addEventListener('click', function () { save(false); });
  reloadBtn.addEventListener('click', function () { reload(false); });
  window.addEventListener('beforeunload', function (event) {
    if (FOLIO.busy || (WS.ready && (WS.saving || isDirty()))) { event.preventDefault(); event.returnValue = ''; }
  });

  // =========================================================================
  // 7. Arranque
  // =========================================================================
  // Folio visible: "—" hasta que el servidor responda (nunca el contador local).
  renderFolio();
  // Navegadores sin <input type="date">: el `valueAsDate` del original lanza
  // InvalidStateError y la fecha queda vacía. Se rellena con hoy (AAAA-MM-DD).
  ['cot-fecha-evento', 'rec-fecha-pago'].forEach(function (id) {
    var el = $(id);
    if (el && el.type !== 'date' && !el.value) {
      var d = new Date();
      el.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
  });
  updateCosts();      // re-render de resultados con la jerarquía nueva
  renderCotLines();
  renderRecLines();
  refreshSavedCotDropdown();
  syncUi();
  boot();
})();
