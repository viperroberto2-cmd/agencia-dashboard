// lib/skills.js — skill loader for the agentic loop
const path = require('path');
const fs   = require('fs');

const _MEMORIA_DIR = path.join(__dirname, '..', 'memoria');

function _cargarSkill(nombre) {
  try {
    const ruta = path.join(_MEMORIA_DIR, `${nombre}.json`);
    if (!fs.existsSync(ruta)) return `[Skill '${nombre}' no encontrada]`;
    const data = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const contenido = typeof data === 'object'
      ? (data.contenido || data.content || data.conocimiento || JSON.stringify(data, null, 2))
      : String(data);
    return `[${nombre.toUpperCase().replace(/_/g,' ')}]\n${contenido}`;
  } catch(e) { return `[Error cargando skill '${nombre}': ${e.message}]`; }
}

const _CATALOGO_SKILLS = `EQUIPO DE ESPECIALISTAS DISPONIBLE (usa cargar_skill para activar cada uno):

ESTRATEGA — psicología humana, ventas, storytelling, persuasión:
  • psicologia_venta — diagnóstico del comprador, manejo de objeciones, cierre
  • sleight_of_mouth — 14 patrones de reencuadre para transformar objeciones
  • storytelling_master — estructura narrativa profesional, arcos emocionales
  • story_persuasion — persuasión a través de historia, conexión emocional
  • video_hypnotic_selling — venta hipnótica en video, lenguaje del inconsciente
  • storytelling_series — storytelling en serie, episodios, continuidad

DIRECTOR — dirección de cine, actores, escenas:
  • director_cine — dirección de actores, mise en scène, lenguaje cinematográfico
  • director_maestro — dirección avanzada, visión artística, toma de decisiones
  • emotional_film_director — dirección emocional, performance, autenticidad
  • storyboard_bong — storyboard estilo Bong Joon-ho, planificación visual

CINEMATÓGRAFO — imagen, luz, composición:
  • cinematografia — reglas de composición, movimientos de cámara, planos
  • master_shots — planos maestros, cobertura de escena, continuidad
  • zettl_estetica — estética visual de Zettl, color, forma, espacio
  • millerson_iluminacion — iluminación profesional de estudio y locación
  • visual_storytelling_arun — narrativa visual, metáforas visuales

COMPOSITOR — música, audio, psicoacústica:
  • film_scoring — composición musical para cine, emoción y ritmo
  • cinematic_audio_composer — audio cinematográfico, leitmotifs, mezcla
  • music_video_director — dirección de videos musicales, sincronización

ESTRATEGIA DE MARCA Y MARKETING:
  • branding_estrategia — identidad de marca, posicionamiento, diferenciación
  • canales_publicidad — selección de canales, mix de medios, presupuesto
  • diseno_publicitario — diseño de ads, jerarquía visual, CTA
  • analytics_roas — métricas, ROAS, optimización de campañas
  • web_design_conversion — landing pages, CRO, UX de conversión

VENTAS AVANZADAS:
  • sales_closer_elite — técnicas de cierre, manejo de presión, negociación

FORMATOS DE VIDEO:
  • ms_ugc — User Generated Content, autenticidad, testimoniales
  • ms_tutorial — tutoriales, educación, paso a paso
  • ms_tvspot — spots de TV/redes, 15-30-60 segundos
  • ms_hyper_motion — hiper-motion, acción, energía
  • ms_review — reviews de productos, credibilidad
  • ms_wildcard — formato experimental, creatividad libre`;

module.exports = { _cargarSkill, _MEMORIA_DIR, _CATALOGO_SKILLS };
