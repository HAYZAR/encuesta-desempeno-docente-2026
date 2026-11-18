/**
 * RECEPTOR DE RESPUESTAS · Encuesta de desempeño docente 2026 (H²B · Física)
 *
 * Se pega en una hoja de cálculo de Google (Extensiones → Apps Script) y se implementa
 * como «Aplicación web» con acceso «Cualquier usuario». La página de GitHub envía cada
 * respuesta a esta aplicación, que la guarda en la pestaña «Respuestas».
 *
 * Menú «Encuesta H²B» en la hoja → «Generar informe Guía 31».
 */

const HOJA_RESP = 'Respuestas';
const HOJA_INF = 'Informe Guía 31';
const FIJAS = ['Marca temporal', 'Año', 'Docente', 'Rol', 'Grado', 'Duración (s)', 'Fortalezas', 'Mejoras'];
const ROLES = ['Estudiante', 'Madre, padre o acudiente'];

// Competencias de la Guía 31 (deben coincidir con los códigos de index.html)
const COMP = [
  ['DC', 'Funcional', 'Gestión académica', 'Dominio curricular'],
  ['PO', 'Funcional', 'Gestión académica', 'Planeación y organización académica'],
  ['PD', 'Funcional', 'Gestión académica', 'Pedagogía y didáctica'],
  ['EA', 'Funcional', 'Gestión académica', 'Evaluación del aprendizaje'],
  ['UR', 'Funcional', 'Gestión administrativa', 'Uso de recursos'],
  ['SP', 'Funcional', 'Gestión administrativa', 'Seguimiento de procesos'],
  ['CI', 'Funcional', 'Gestión comunitaria', 'Comunicación institucional'],
  ['IC', 'Funcional', 'Gestión comunitaria', 'Interacción con la comunidad y el entorno'],
  ['LI', 'Comportamental', 'Comportamentales', 'Liderazgo'],
  ['CR', 'Comportamental', 'Comportamentales', 'Comunicación y relaciones interpersonales'],
  ['TE', 'Comportamental', 'Comportamentales', 'Trabajo en equipo'],
  ['NM', 'Comportamental', 'Comportamentales', 'Negociación y mediación'],
  ['CS', 'Comportamental', 'Comportamentales', 'Compromiso social e institucional'],
  ['IN', 'Comportamental', 'Comportamentales', 'Iniciativa'],
  ['OL', 'Comportamental', 'Comportamentales', 'Orientación al logro'],
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Encuesta H²B')
    .addItem('Generar informe Guía 31', 'generarInforme')
    .addToUi();
}

/** Ejecútela una vez para preparar la pestaña de respuestas. */
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const h = ss.getSheetByName(HOJA_RESP) || ss.insertSheet(HOJA_RESP, 0);
  if (h.getLastRow() === 0) {
    h.getRange(1, 1, 1, FIJAS.length).setValues([FIJAS]);
    h.getRange(1, 1, 1, FIJAS.length).setFontWeight('bold').setBackground('#1B2A4A').setFontColor('#F5F1E8');
    h.setFrozenRows(1);
  }
  const sobra = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (sobra && sobra.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sobra);
}

function doGet() {
  return json_({ ok: true, servicio: 'Encuesta H²B', hora: new Date().toISOString() });
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.web) return json_({ ok: true }); // trampa anti-bots
    if (ROLES.indexOf(d.rol) < 0) throw new Error('Rol no válido');
    const resp = d.respuestas || {};
    const claves = Object.keys(resp).filter(k => /^[A-Z]{2}-[EA]-\d{1,2}$/.test(k));
    if (!claves.length) throw new Error('Sin respuestas');
    claves.forEach(k => { const v = Number(resp[k]); if (!(v >= 1 && v <= 5)) throw new Error('Valor fuera de escala'); });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      configurar();
      const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_RESP);
      let enc = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
      const textos = d.textos || {};
      // Agrega columnas nuevas para las afirmaciones que aún no existen
      const nuevas = claves.filter(k => !enc.some(c => String(c).split(' · ')[0] === k));
      if (nuevas.length) {
        const tit = nuevas.map(k => k + ' · ' + String(textos[k] || '').slice(0, 200));
        h.getRange(1, enc.length + 1, 1, tit.length).setValues([tit])
          .setFontWeight('bold').setBackground('#1B2A4A').setFontColor('#F5F1E8');
        enc = enc.concat(tit);
      }
      const ab = d.abiertas || {};
      const fila = enc.map(c => {
        switch (c) {
          case 'Marca temporal': return new Date();
          case 'Año': return d.anio || '';
          case 'Docente': return limpiar_(d.docente, 120);
          case 'Rol': return d.rol;
          case 'Grado': return limpiar_(d.grado, 20);
          case 'Duración (s)': return Number(d.segundos) || '';
          case 'Fortalezas': return limpiar_(ab.fortalezas, 1500);
          case 'Mejoras': return limpiar_(ab.mejoras, 1500);
          default: { const k = String(c).split(' · ')[0]; return resp[k] ? Number(resp[k]) : ''; }
        }
      });
      h.appendRow(fila);
    } finally { lock.releaseLock(); }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// Evita que un texto se interprete como fórmula en la hoja
function limpiar_(s, n) { s = String(s || '').slice(0, n); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// ════════════════════════════════════════════════════════════════════
/** Promedios por competencia, equivalencia 1–100 (promedio × 20) y valoración ponderada 70/30. */
function generarInforme() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const h = ss.getSheetByName(HOJA_RESP);
  if (!h || h.getLastRow() < 2) throw new Error('Aún no hay respuestas.');
  const datos = h.getDataRange().getValues();
  const enc = datos[0], filas = datos.slice(1);
  const cRol = enc.indexOf('Rol'), cDoc = enc.indexOf('Docente');
  const nE = filas.filter(r => r[cRol] === ROLES[0]).length, nA = filas.length - nE;

  const acc = {};
  enc.forEach((c, j) => {
    const m = String(c).match(/^([A-Z]{2})-([EA])-\d+/);
    if (!m) return;
    acc[m[1]] = acc[m[1]] || { E: [], A: [] };
    filas.forEach(r => { const v = Number(r[j]); if (v >= 1 && v <= 5) acc[m[1]][m[2]].push(v); });
  });
  const prom = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

  const tabla = [['Tipo', 'Área de gestión', 'Competencia', 'Estudiantes (1–5)', 'Acudientes (1–5)', 'General (1–5)', 'Equivalencia (1–100)', 'Nivel']];
  const porTipo = { Funcional: [], Comportamental: [] };
  COMP.forEach(([cod, tipo, area, nombre]) => {
    const a = acc[cod] || { E: [], A: [] };
    const g = prom(a.E.concat(a.A));
    const eq = g === null ? null : g * 20;
    if (eq !== null) porTipo[tipo].push(eq);
    tabla.push([tipo, area, nombre, red_(prom(a.E)), red_(prom(a.A)), red_(g), red_(eq), nivel_(eq)]);
  });
  const f = prom(porTipo.Funcional), c = prom(porTipo.Comportamental);
  const total = f !== null && c !== null ? f * 0.7 + c * 0.3 : null;

  const inf = ss.getSheetByName(HOJA_INF) || ss.insertSheet(HOJA_INF);
  inf.clear();
  const tz = ss.getSpreadsheetTimeZone();
  inf.getRange(1, 1, 5, 2).setValues([
    ['Informe de percepción del desempeño docente', ''],
    ['Docente', cDoc >= 0 ? filas[0][cDoc] : ''],
    ['Fuente', 'Encuesta anónima a estudiantes y acudientes (H²B · Física)'],
    ['Respuestas', `${filas.length} (estudiantes: ${nE} · acudientes: ${nA})`],
    ['Fecha de corte', Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd')],
  ]);
  inf.getRange(1, 1).setFontSize(15).setFontWeight('bold');
  inf.getRange(2, 1, 4, 1).setFontWeight('bold');

  inf.getRange(7, 1, tabla.length, tabla[0].length).setValues(tabla);
  estiloEnc_(inf.getRange(7, 1, 1, tabla[0].length));
  const r = 9 + tabla.length;
  inf.getRange(r, 1, 4, 3).setValues([
    ['Resumen ponderado (Guía 31)', 'Equivalencia (1–100)', 'Nivel'],
    ['Competencias funcionales (70 %)', red_(f), nivel_(f)],
    ['Competencias comportamentales (30 %)', red_(c), nivel_(c)],
    ['Valoración ponderada', red_(total), nivel_(total)],
  ]);
  estiloEnc_(inf.getRange(r, 1, 1, 3));
  inf.getRange(r + 3, 1, 1, 3).setFontWeight('bold').setBackground('#FCE9D8');
  inf.getRange(r + 5, 1).setValue(
    'Equivalencia = promedio Likert × 20. Niveles: Sobresaliente 90–100 · Satisfactorio 60–89 · No satisfactorio 1–59. ' +
    'Esta percepción es una evidencia del portafolio; la calificación oficial la asigna el evaluador.').setFontStyle('italic');

  let fila = r + 7;
  [['Fortalezas', 'Fortalezas señaladas'], ['Mejoras', 'Sugerencias de mejora']].forEach(([col, tit]) => {
    const j = enc.indexOf(col);
    const txt = j < 0 ? [] : filas.map(x => [String(x[j]).trim(), x[cRol]]).filter(x => x[0]);
    if (!txt.length) return;
    inf.getRange(fila++, 1).setValue(tit).setFontWeight('bold').setFontSize(12);
    txt.forEach(([t, rol]) => inf.getRange(fila++, 1, 1, 2).setValues([[rol === ROLES[0] ? 'Estudiante' : 'Acudiente', t]]));
    fila++;
  });
  inf.setColumnWidth(1, 260); inf.setColumnWidth(2, 220); inf.setColumnWidth(3, 300);
  inf.setColumnWidths(4, 5, 130);
  ss.setActiveSheet(inf);
}

function estiloEnc_(rg) { rg.setFontWeight('bold').setBackground('#1B2A4A').setFontColor('#F5F1E8'); }
function red_(x) { return x === null || isNaN(x) ? '' : Math.round(x * 100) / 100; }
function nivel_(x) { return x === null || isNaN(x) ? '' : x >= 90 ? 'Sobresaliente' : x >= 60 ? 'Satisfactorio' : 'No satisfactorio'; }
