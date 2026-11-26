const KEY = 'agencia-seguros-v1-' + (window.AGENCIA_UID || 'local');
const RAMOS = ['Auto', 'Vida', 'Gastos médicos', 'Hogar', 'Negocio', 'Otro'];

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE'); };
const money = n => (+n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const fdate = d => d ? new Date(d + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const days = d => Math.round((new Date(d + 'T00:00') - new Date().setHours(0, 0, 0, 0)) / 864e5);
const ini = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const hue = n => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const av = n => `<i class="av" style="--h:${hue(n)}">${esc(ini(n))}</i>`;
const pers = n => `<span class="pers">${av(n)}${esc(n)}</span>`;
const slug = v => String(v).toLowerCase().replace(/\s+/g, '-');
const chip = d => `<span class="due ${d < 0 ? 'late' : d <= 30 ? 'soon' : 'ok'}">${d < 0 ? `vencida hace ${-d} d` : d === 0 ? 'hoy' : `en ${d} d`}</span>`;

/* ---------- Secciones y campos ---------- */
const S = {
  clientes: { label: 'Clientes', nuevo: 'Nuevo cliente', fields: [
    { k: 'nombre', l: 'Nombre completo', req: 1 },
    { k: 'telefono', l: 'Teléfono (WhatsApp)', type: 'tel' },
    { k: 'correo', l: 'Correo', type: 'email' },
    { k: 'notas', l: 'Notas', type: 'textarea' }] },
  polizas: { label: 'Pólizas', nuevo: 'Nueva póliza', fields: [
    { k: 'cliente', l: 'Cliente', ref: 1, req: 1 },
    { k: 'ramo', l: 'Ramo', opts: RAMOS },
    { k: 'aseguradora', l: 'Aseguradora' },
    { k: 'numero', l: 'Número de póliza' },
    { k: 'prima', l: 'Prima anual', type: 'number' },
    { k: 'fin', l: 'Vence', type: 'date', req: 1, due: 1 }] },
  cobranza: { label: 'Cobranza', nuevo: 'Nuevo cobro', fields: [
    { k: 'cliente', l: 'Cliente', ref: 1, req: 1 },
    { k: 'concepto', l: 'Concepto' },
    { k: 'monto', l: 'Monto', type: 'number', req: 1 },
    { k: 'fecha', l: 'Fecha límite', type: 'date', req: 1, due: 1 },
    { k: 'estatus', l: 'Estatus', opts: ['Pendiente', 'Pagado'], chip: 1 }] },
  cotizaciones: { label: 'Cotizaciones', nuevo: 'Nueva cotización', fields: [
    { k: 'prospecto', l: 'Cliente o prospecto', req: 1 },
    { k: 'ramo', l: 'Ramo', opts: RAMOS },
    { k: 'monto', l: 'Prima estimada', type: 'number' },
    { k: 'estatus', l: 'Estatus', opts: ['Enviada', 'En seguimiento', 'Ganada', 'Perdida'], chip: 1 },
    { k: 'fecha', l: 'Siguiente seguimiento', type: 'date', due: 1 }] }
};

/* ---------- Datos ---------- */
const vacio = () => ({ clientes: [], polizas: [], cobranza: [], cotizaciones: [] });
let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
db = { ...vacio(), ...(db || {}) };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
let view = 'panel', editing = null;
const cname = id => (db.clientes.find(c => c.id === id) || {}).nombre || '(cliente eliminado)';
const closed = (key, r) => (key === 'cobranza' && r.estatus === 'Pagado') || (key === 'cotizaciones' && ['Ganada', 'Perdida'].includes(r.estatus));

/* ---------- Panel ---------- */
function wa(c, msg) {
  const t = ((c && c.telefono) || '').replace(/\D/g, '');
  if (!t) return '';
  return `<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${t.length === 10 ? '52' + t : t}?text=${encodeURIComponent(msg)}">Avisar</a>`;
}
function row(cid, detalle, d, msg) {
  const c = db.clientes.find(x => x.id === cid);
  return `<li>${av(c ? c.nombre : '?')}<div><strong>${esc(c ? c.nombre : '(cliente eliminado)')}</strong><span>${esc(detalle)}</span></div>${chip(d)}${wa(c, msg(c ? c.nombre : ''))}</li>`;
}
function panel() {
  const ren = db.polizas.filter(p => days(p.fin) <= 60).sort((a, b) => days(a.fin) - days(b.fin));
  const cob = db.cobranza.filter(c => c.estatus !== 'Pagado').sort((a, b) => days(a.fecha) - days(b.fecha));
  const porCobrar = cob.reduce((t, c) => t + (+c.monto || 0), 0);
  const abiertas = db.cotizaciones.filter(c => !closed('cotizaciones', c)).length;
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = (window.AGENCIA_NAME || '').split(' ')[0];
  const urg = ren.filter(p => days(p.fin) <= 30).length;
  const resumen = (urg || porCobrar)
    ? `Tienes ${urg} ${urg === 1 ? 'renovación próxima' : 'renovaciones próximas'} y ${money(porCobrar)} por cobrar.`
    : 'Todo al día. Agrega tus clientes y pólizas para empezar.';
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const hero = `<div class="hero-p"><div><p class="eyebrow">${fecha}</p><h3>${saludo}${nombre ? ', ' + esc(nombre) : ''}</h3><p class="resumen">${resumen}</p></div>
    <div class="quick"><button data-go="clientes">Nuevo cliente</button><button data-go="polizas">Nueva póliza</button><button data-go="cobranza">Nuevo cobro</button></div></div>`;
  const kpi = (n, l) => `<div><b>${n}</b><span>${l}</span></div>`;
  const list = (items, vacio) => items.length ? `<ul class="rows">${items.join('')}</ul>` : `<p class="empty">${vacio}</p>`;
  return `${hero}<div class="kpis">
      ${kpi(db.polizas.filter(p => days(p.fin) >= 0).length, 'Pólizas vigentes')}
      ${kpi(ren.filter(p => days(p.fin) <= 30).length, 'Vencen en 30 días')}
      ${kpi(money(porCobrar), 'Por cobrar')}
      ${kpi(abiertas, 'Cotizaciones abiertas')}
    </div>
    <div class="cols">
      <section><h3>Renovaciones próximas</h3>${list(ren.map(p =>
        row(p.cliente, `${p.ramo}, ${p.aseguradora || 'sin aseguradora'}`, days(p.fin),
          n => `Hola ${n}, le escribo de su agencia de seguros. Su póliza de ${p.ramo} vence el ${fdate(p.fin)}. ¿Le preparo la renovación?`)),
        'Ninguna póliza vence en los próximos 60 días.')}</section>
      <section><h3>Cobranza pendiente</h3>${list(cob.map(c =>
        row(c.cliente, `${money(c.monto)}, ${c.concepto || 'pago pendiente'}`, days(c.fecha),
          n => `Hola ${n}, le recuerdo que tiene un pago pendiente de ${money(c.monto)} con fecha límite ${fdate(c.fecha)}.`)),
        'No hay pagos pendientes.')}</section>
    </div>`;
}

/* ---------- Tablas ---------- */
function cell(f, r, key) {
  const v = r[f.k];
  if (f.ref) return pers(cname(v));
  if ((key === 'clientes' && f.k === 'nombre') || (key === 'cotizaciones' && f.k === 'prospecto')) return pers(v);
  if (f.type === 'number') return v === '' || v == null ? '' : money(v);
  if (f.type === 'date') return v ? fdate(v) + (f.due && !closed(key, r) ? chip(days(v)) : '') : '';
  if (f.chip) return `<span class="tag ${slug(v)}">${esc(v)}</span>`;
  return esc(v);
}
function table(key) {
  const s = S[key], q = $('#q').value.trim().toLowerCase();
  const fields = s.fields.filter(f => f.type !== 'textarea');
  const data = db[key].filter(r => !q || (Object.values(r).join(' ') + ' ' + cname(r.cliente)).toLowerCase().includes(q));
  if (!data.length) return `<p class="empty">${q ? 'No hay resultados para esa búsqueda.' : `Aún no hay registros. Usa “${s.nuevo}” para agregar el primero.`}</p>`;
  return `<div class="scroll"><table><thead><tr>${fields.map(f => `<th>${f.l}</th>`).join('')}<th></th></tr></thead><tbody>
    ${data.map(r => `<tr>${fields.map(f => `<td>${cell(f, r, key)}</td>`).join('')}<td class="acts">
      ${key === 'cobranza' && r.estatus !== 'Pagado' ? `<button data-a="paid" data-id="${r.id}">Marcar pagado</button>` : ''}
      <button data-a="edit" data-id="${r.id}">Editar</button><button data-a="del" data-id="${r.id}">Eliminar</button></td></tr>`).join('')}
    </tbody></table></div>`;
}

/* ---------- Render ---------- */
function render() {
  $('#nav').innerHTML = ['panel', ...Object.keys(S)].map(k =>
    `<button data-v="${k}" ${k === view ? 'aria-current="page"' : ''}>${k === 'panel' ? 'Panel' : S[k].label}</button>`).join('');
  $('#title').textContent = view === 'panel' ? 'Panel' : S[view].label;
  const n = view === 'panel' ? 0 : db[view].length;
  $('#sub').textContent = view === 'panel' ? 'Resumen de tu cartera' : `${n} ${n === 1 ? 'registro' : 'registros'}`;
  $('#add').hidden = $('#q').hidden = view === 'panel';
  if (view !== 'panel') $('#add').textContent = S[view].nuevo;
  $('#view').innerHTML = view === 'panel' ? panel() : table(view);
}

/* ---------- Formulario ---------- */
function openForm(id) {
  const s = S[view], r = id ? db[view].find(x => x.id === id) : {};
  editing = id || null;
  const input = f => {
    const v = r[f.k] ?? '', req = f.req ? 'required' : '';
    if (f.ref) return `<select name="${f.k}" ${req}><option value="">Elegir cliente</option>${db.clientes.map(c => `<option value="${c.id}" ${c.id === v ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select>`;
    if (f.opts) return `<select name="${f.k}">${f.opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    if (f.type === 'textarea') return `<textarea name="${f.k}" rows="3">${esc(v)}</textarea>`;
    return `<input name="${f.k}" type="${f.type || 'text'}" value="${esc(v)}" ${req} ${f.type === 'number' ? 'min="0" step="0.01"' : ''}>`;
  };
  $('#form').innerHTML = `<h3>${id ? 'Editar registro' : s.nuevo}</h3>
    ${s.fields.map(f => `<label>${f.l}${input(f)}</label>`).join('')}
    <div class="btns"><button type="button" id="cancel">Cancelar</button><button type="submit" class="primary">Guardar</button></div>`;
  $('#dlg').showModal();
}
$('#form').addEventListener('submit', () => {
  const d = Object.fromEntries(new FormData($('#form')));
  if (editing) Object.assign(db[view].find(x => x.id === editing), d);
  else db[view].push({ id: uid(), ...d });
  save(); render();
});

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.go) { view = b.dataset.go; $('#q').value = ''; render(); openForm(); }
  else if (b.dataset.v) { view = b.dataset.v; $('#q').value = ''; render(); }
  else if (b.id === 'add') openForm();
  else if (b.id === 'cancel') $('#dlg').close();
  else if (b.dataset.a === 'edit') openForm(b.dataset.id);
  else if (b.dataset.a === 'del') {
    if (confirm('¿Eliminar este registro?')) { db[view] = db[view].filter(x => x.id !== b.dataset.id); save(); render(); }
  } else if (b.dataset.a === 'paid') {
    db.cobranza.find(x => x.id === b.dataset.id).estatus = 'Pagado'; save(); render();
  } else if (b.id === 'export') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
    a.download = `respaldo-agencia-${iso(0)}.json`; a.click();
  } else if (b.id === 'reset') {
    if (confirm('Se borrarán todos los datos de este navegador. ¿Continuar?')) {
      db = { clientes: [], polizas: [], cobranza: [], cotizaciones: [] }; save(); render();
    }
  }
});
$('#q').addEventListener('input', () => { $('#view').innerHTML = table(view); });

render();