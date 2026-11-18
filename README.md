# Encuesta de desempeño docente 2026 · H²B Física

Encuesta web anónima para estudiantes y acudientes. Recoge la percepción sobre el desempeño docente como evidencia de la **Evaluación Anual de Desempeño Laboral** de los docentes del Decreto Ley 1278 de 2002, reglamentada por el Decreto 3782 de 2007 (compilado en el Decreto 1075 de 2015). Sigue la metodología de la **Guía No. 31 del MEN**.

- **Página:** `index.html`, publicada con GitHub Pages.
- **Respuestas:** una hoja de cálculo de Google las recibe por medio de Apps Script (`apps-script/Codigo.gs`).

## Contenido

| Público | Afirmaciones | Competencias |
|---|---|---|
| Estudiantes | 35 + 2 abiertas | las 15 de la Guía 31 |
| Acudientes | 16 + 2 abiertas | las 12 que una familia puede observar |

- **Competencias funcionales (70 %)**
  - Gestión académica: dominio curricular, planeación y organización académica, pedagogía y didáctica, evaluación del aprendizaje.
  - Gestión administrativa: uso de recursos, seguimiento de procesos.
  - Gestión comunitaria: comunicación institucional, interacción con la comunidad y el entorno.
- **Competencias comportamentales (30 %):** liderazgo, comunicación y relaciones interpersonales, trabajo en equipo, negociación y mediación, compromiso social e institucional, iniciativa, orientación al logro.

**Escala:** 1 Nunca · 2 Casi nunca · 3 A veces · 4 Casi siempre · 5 Siempre.

## Conectar la hoja de respuestas (una sola vez)

1. Cree una hoja de cálculo nueva en Google Sheets, por ejemplo «Respuestas encuesta desempeño 2026».
2. Abra **Extensiones → Apps Script**, borre el contenido y pegue todo `apps-script/Codigo.gs`. Guarde.
3. Elija la función `configurar` y pulse **Ejecutar**. Autorice los permisos.
4. Abra **Implementar → Nueva implementación → Tipo: Aplicación web** y configure:
   - **Ejecutar como:** Yo.
   - **Quién tiene acceso:** Cualquier usuario.
5. Copie la URL que termina en `/exec` y péguela en `index.html`, en `CONFIG.ENDPOINT`. Mientras no la pegue, la página muestra «Modo de prueba» y no guarda respuestas.
6. En `CONFIG`, escriba también el nombre del docente (`DOCENTE`) y, si quiere, la fecha de cierre (`CIERRE`).

## Generar el informe (evidencia)

En la hoja, use el menú **Encuesta H²B → Generar informe Guía 31**. Se crea la pestaña «Informe Guía 31» con:

- el número de respuestas por público;
- el promedio de cada competencia (estudiantes, acudientes y general) y su equivalencia en la escala 1–100 (promedio × 20);
- el nivel: Sobresaliente 90–100 · Satisfactorio 60–89 · No satisfactorio 1–59;
- la valoración ponderada: 70 % funcionales + 30 % comportamentales;
- los comentarios abiertos.

Descárguela en PDF (Archivo → Descargar → PDF) y adjúntela al portafolio. La encuesta es **una** evidencia de percepción: la calificación oficial la asigna el evaluador.

## Privacidad

No se piden nombres ni correos. La página solo guarda en el navegador una marca de «ya respondió» para avisar si alguien intenta responder dos veces desde el mismo dispositivo.
