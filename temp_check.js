
// ============ DATA ============
const agents = [
  { id: 'organizador', emoji: 'ðŸŽ¯', name: 'Organizador', role: 'CEO Â· Delega y coordina', status: 'online', skills: ['Razona', 'Delega', 'EvalÃºa', 'Memoria'] },
  { id: 'director', emoji: 'ðŸŽ¬', name: 'Director', role: 'Creativo Â· Copy y guiones', status: 'online', skills: ['Copy', 'Guiones', 'Audio AI'] },
  { id: 'crew', emoji: 'ðŸŽ¨', name: 'Crew', role: 'ProducciÃ³n Â· Video, imagen', status: 'checking', skills: ['Veo 3.1', 'Flux', 'Suno', 'Runway'] },
  { id: 'estrategia', emoji: 'ðŸ“Š', name: 'Estrategia', role: 'Marketing Â· CampaÃ±as', status: 'online', skills: ['FB Ads', 'SEO', 'Funnels'] },
  { id: 'scheduler', emoji: 'ðŸ“…', name: 'Scheduler', role: 'PublicaciÃ³n automÃ¡tica', status: 'online', skills: ['Facebook', 'Instagram', 'Auto-post'] },
  { id: 'analytics', emoji: 'ðŸ“ˆ', name: 'Analytics', role: 'Reportes y mÃ©tricas', status: 'online', skills: ['Reportes', 'MÃ©tricas', 'ROAS'] },
  { id: 'compositor', emoji: 'ðŸŽµ', name: 'CompositorBot', role: 'Audio Â· Scoring', status: 'checking', skills: ['Scoring', 'BPM', 'Mood'] },
  { id: 'scraper', emoji: 'ðŸ”', name: 'Scraper', role: 'Research Â· Competencia', status: 'online', skills: ['Compete', 'Playwright', 'Memoria'] },
  { id: 'seo', emoji: 'ðŸ·ï¸', name: 'SEO Strategist', role: 'Keywords Â· AuditorÃ­as', status: 'online', skills: ['Keywords', 'SERP', 'ArtÃ­culos'] },
  { id: 'web', emoji: 'ðŸŒ', name: 'Web Designer', role: 'PÃ¡ginas animadas Â· FTP', status: 'online', skills: ['GSAP', 'Three.js', 'Hostinger'] },
  { id: 'motion', emoji: 'ðŸŽžï¸', name: 'Motion Bot', role: 'Lottie Â· Remotion Â· FFmpeg', status: 'online', skills: ['Lottie', 'Remotion', 'FFmpeg'] }
];

const leads = {
  new: [
    { name: 'MarÃ­a GonzÃ¡lez', source: 'Facebook', meta: 'hace 2h Â· interesada en Turo', phone: '+1 (323) 555-0191', email: 'maria.g@gmail.com', notes: 'Vio el post del Turo en Facebook. Interesada en el programa de $197. Mejor hora de contacto: tardes despuÃ©s de las 4pm.' },
    { name: 'Carlos RamÃ­rez', source: 'WhatsApp', meta: 'hace 4h Â· pidiÃ³ info', phone: '+1 (213) 555-0143', notes: 'PreguntÃ³ cuÃ¡nto cuesta el curso y si hay planes de pago. Tiene un Toyota Camry 2022.' },
    { name: 'Ana Torres', source: 'Instagram', meta: 'hace 6h Â· DM directo', email: 'ana.torres98@gmail.com', notes: 'DM: "Â¿El programa incluye soporte 1 a 1?" Perfil activo, buena presencia en IG.' },
    { name: 'Luis PÃ©rez', source: 'Apollo', meta: 'ayer Â· cold outreach' }
  ],
  contacted: [
    { name: 'Roberto DÃ­az', source: 'Facebook', meta: 'MarÃ­a llamÃ³ Â· sin respuesta', phone: '+1 (714) 555-0177', notes: 'Llamada sin respuesta el lunes. Dejar voicemail y seguir por FB.' },
    { name: 'SofÃ­a Mendoza', source: 'Instagram', meta: 'SMS enviado Â· esperando', phone: '+1 (323) 555-0162', email: 'sofia.m@icloud.com', notes: 'SMS enviado con link de info. LeyÃ³ a los 5 min, sin respuesta aÃºn.' },
    { name: 'Jorge Castro', source: 'Referido', meta: 'WhatsApp Â· leyÃ³', phone: '+1 (626) 555-0134', notes: 'Referido por Daniel Soto. Ya leyÃ³ el mensaje pero no ha respondido. Esperar 24h.' }
  ],
  interested: [
    { name: 'Patricia Ruiz', source: 'Facebook', meta: 'agendÃ³ llamada maÃ±ana', phone: '+1 (818) 555-0189', email: 'patriruiz@yahoo.com', notes: 'Llamada agendada para maÃ±ana 10am. Tiene Subaru Outback 2021. Muy calificada.' },
    { name: 'Miguel Ãngel', source: 'WhatsApp', meta: 'pidiÃ³ link de pago', phone: '+1 (562) 555-0155', notes: 'Listo para comprar. Enviar link de pago de $197. Prefiere Zelle o tarjeta.' },
    { name: 'Elena Vargas', source: 'Instagram', meta: 'objeciÃ³n precio Â· negociando', email: 'elena.v@gmail.com', notes: 'ObjeciÃ³n: "Es mucho para empezar." Ofrecer plan 2 pagos o mostrar ROI del primer mes.' }
  ],
  closed: [
    { name: 'Daniel Soto', source: 'Facebook', meta: 'pagÃ³ $197 Â· onboarding', phone: '+1 (213) 555-0101', email: 'dsoto@gmail.com', notes: 'Cliente activo. CompletÃ³ onboarding. Ya tiene su primer vehÃ­culo listado en Turo.' },
    { name: 'Laura NÃºÃ±ez', source: 'Referido', meta: 'pagÃ³ $197 Â· mÃ³dulo 1', phone: '+1 (323) 555-0118', email: 'laura.nunez@hotmail.com', notes: 'Referida por Patricia Ruiz. Muy motivada, terminÃ³ mÃ³dulo 1 en 2 dÃ­as.' }
  ]
};

const inboxItems = [
  { id: 1, channel: 'whatsapp', icon: 'ðŸ’š', from: 'MarÃ­a GonzÃ¡lez', preview: 'Hola, vi tu post de Turo, Â¿cÃ³mo funciona el curso?', time: '2 min', unread: true, client: 'arranca' },
  { id: 2, channel: 'instagram', icon: 'ðŸ“¸', from: 'carlos_ramirez_98', preview: 'DM: Me interesa el curso de $197. Â¿CuÃ¡ndo arranca?', time: '15 min', unread: true, client: 'arranca' },
  { id: 3, channel: 'facebook', icon: 'ðŸ“˜', from: 'Ana Torres', preview: 'ComentÃ³ en tu video: "CuÃ¡nto cuesta el programa?"', time: '1h', unread: true, client: 'arranca' },
  { id: 4, channel: 'sms', icon: 'ðŸ’¬', from: '+1 (323) 555-0142', preview: 'SÃ­, me interesa informaciÃ³n sobre el tratamiento GLP-1', time: '2h', unread: false, client: 'sofia' },
  { id: 5, channel: 'email', icon: 'ðŸ“§', from: 'jorge.martinez@gmail.com', preview: 'RecibÃ­ tu email, Â¿podemos agendar llamada esta semana?', time: '3h', unread: false, client: 'arranca' },
  { id: 6, channel: 'whatsapp', icon: 'ðŸ’š', from: '+1 (213) 555-0198', preview: 'Quiero pagar el curso pero tengo una pregunta antes', time: '5h', unread: false, client: 'arranca' },
  { id: 7, channel: 'instagram', icon: 'ðŸ“¸', from: 'patricia_ruiz', preview: 'DM: Gracias por la info, lo voy a pensar', time: 'ayer', unread: false, client: 'arranca' },
  { id: 8, channel: 'facebook', icon: 'ðŸ“˜', from: 'Daniel Soto', preview: 'Lead form: nombre, telÃ©fono, email â€” completado', time: 'ayer', unread: false, client: 'arranca' },
  { id: 9, channel: 'sms', icon: 'ðŸ’¬', from: '+1 (818) 555-0234', preview: 'Hola, Â¿es la clÃ­nica de pÃ©rdida de peso?', time: 'ayer', unread: false, client: 'sofia' }
];

const recordings = [
  { date: 'Hoy 14:32', agent: 'maria', phone: '+1 (714) 555-0123', duration: '4:21', transcript: 'Hola, soy MarÃ­a de Arranca Financial. Te llamo porque dejaste tus datos en Facebookâ€¦', leadStatus: 'interested', client: 'arranca' },
  { date: 'Hoy 11:18', agent: 'maria', phone: '+1 (323) 555-0089', duration: '2:45', transcript: 'Buenos dÃ­as, Â¿hablo con Carlos? Soy MarÃ­a de Arranca, vi que comentaste enâ€¦', leadStatus: 'contacted', client: 'arranca' },
  { date: 'Ayer 17:50', agent: 'sofia', phone: '+1 (213) 555-0142', duration: '6:12', transcript: 'Hola, soy SofÃ­a de la clÃ­nica. Te llamo por tu interÃ©s en el tratamiento GLP-1â€¦', leadStatus: 'closed', client: 'sofia' },
  { date: 'Ayer 16:23', agent: 'maria', phone: '+1 (818) 555-0234', duration: '3:38', transcript: 'Hola Patricia, soy MarÃ­a de Arranca. Vi que agendaste llamada para hoyâ€¦', leadStatus: 'interested', client: 'arranca' },
  { date: 'Ayer 10:05', agent: 'sofia', phone: '+1 (310) 555-0876', duration: '1:52', transcript: 'Hola, soy SofÃ­a, vi que llenaste el formulario sobre el programa de pÃ©rdida de pesoâ€¦', leadStatus: 'contacted', client: 'sofia' },
  { date: 'Lun 15:30', agent: 'maria', phone: '+1 (323) 555-0445', duration: '5:48', transcript: 'Hola, soy MarÃ­a, Â¿sigues interesado en el curso? Recuerdo que mencionasteâ€¦', leadStatus: 'closed', client: 'arranca' },
  { date: 'Lun 12:14', agent: 'sofia', phone: '+1 (619) 555-0301', duration: '4:02', transcript: 'Buenas tardes, soy SofÃ­a de la clÃ­nica. Te llamo para contarte sobreâ€¦', leadStatus: 'interested', client: 'sofia' }
];

const driveItems = [
  { type: 'video', name: 'Reel_Turo_3errores_v2.mp4', size: '28 MB', source: 'Crew', date: 'Hoy', icon: 'ðŸŽ¬' },
  { type: 'video', name: 'Testimonio_Daniel_Module1.mp4', size: '64 MB', source: 'Crew', date: 'Hoy', icon: 'ðŸŽ¥' },
  { type: 'image', name: 'Hero_Arranca_Landing.png', size: '1.8 MB', source: 'Crew (Flux)', date: 'Hoy', icon: 'ðŸ–¼ï¸' },
  { type: 'audio', name: 'Score_Cinematic_Drama.mp3', size: '4.2 MB', source: 'CompositorBot', date: 'Hoy', icon: 'ðŸŽµ' },
  { type: 'video', name: 'Carrusel_CrÃ©dito_USA.mp4', size: '15 MB', source: 'Motion Bot', date: 'Ayer', icon: 'ðŸŽžï¸' },
  { type: 'audio', name: 'BGM_Hipnotic_Sales.mp3', size: '3.8 MB', source: 'Suno AI', date: 'Ayer', icon: 'ðŸŽ¶' },
  { type: 'image', name: 'Avatar_Marco_LUMINAE.png', size: '2.4 MB', source: 'HeyGen', date: 'Ayer', icon: 'ðŸ‘¤' },
  { type: 'image', name: 'Carousel_FB_Slide1.png', size: '1.1 MB', source: 'Crew', date: 'Ayer', icon: 'ðŸ–¼ï¸' },
  { type: 'audio', name: 'VoiceOver_VSL_Module2.mp3', size: '2.1 MB', source: 'ElevenLabs', date: 'Lun', icon: 'ðŸŽ™ï¸' },
  { type: 'image', name: 'Cinematic_Lighting_v3.png', size: '3.2 MB', source: 'Higgsfield', date: 'Lun', icon: 'âœ¨' },
  { type: 'video', name: 'Promo_Curso_$197_60s.mp4', size: '42 MB', source: 'Crew', date: 'Lun', icon: 'ðŸ“¹' },
  { type: 'image', name: 'Producto_Sofia_Clinic.png', size: '2.7 MB', source: 'Crew', date: 'SÃ¡b', icon: 'ðŸ’Š' }
];

const playwrightEndpoints = [
  { method: 'POST', path: '/scrape', desc: 'Extrae texto completo de cualquier URL Â· Playwright primero, BS4 fallback', users: ['Organizador', 'Estratega'] },
  { method: 'POST', path: '/screenshot', desc: 'Captura screenshot de una pÃ¡gina Â· devuelve imagen base64', users: ['Director', 'Web'] },
  { method: 'POST', path: '/search', desc: 'BÃºsqueda web headless Â· resultados estructurados con contexto', users: ['Analytics', 'Scraper'] }
];

const playwrightRequests = [
  { time: '14:32', endpoint: '/scrape', target: 'https://turo.com/los-angeles', status: 200, ms: 1240, bot: 'Estratega' },
  { time: '14:18', endpoint: '/search', target: 'GLP-1 clinic Los Angeles', status: 200, ms: 890, bot: 'Scraper' },
  { time: '13:55', endpoint: '/screenshot', target: 'arrancafinancial.com', status: 200, ms: 2100, bot: 'Web' },
  { time: '13:42', endpoint: '/scrape', target: 'https://hyperdrive-rentals.com', status: 200, ms: 1580, bot: 'Estratega' },
  { time: '13:20', endpoint: '/scrape', target: 'https://getaround.com/cars/los-angeles', status: 500, ms: 30000, bot: 'Estratega' },
  { time: '12:48', endpoint: '/search', target: 'best GLP-1 weight loss USA', status: 200, ms: 720, bot: 'Scraper' },
  { time: '12:30', endpoint: '/scrape', target: 'https://noom.com/glp-1', status: 200, ms: 980, bot: 'Estratega' },
  { time: '12:05', endpoint: '/screenshot', target: 'instagram.com/arrancafinancial', status: 200, ms: 1890, bot: 'Director' }
];

const globalIntegrations = [
  { name: 'Railway', icon: 'ðŸš‚', status: 'connected', meta: 'Hosting de los bots' },
  { name: 'Supabase', icon: 'ðŸ’¾', status: 'connected', meta: 'ydggwvpndcazmyvsdbec' },
  { name: 'Claude API', icon: 'ðŸ§ ', status: 'connected', meta: 'Cerebro de los agentes' },
  { name: 'Telegram (Bot personal)', icon: 'âœˆï¸', status: 'connected', meta: 'Comandos de la agencia' },
  { name: 'Higgsfield AI', icon: 'ðŸŽ¬', status: 'connected', meta: 'GeneraciÃ³n de video' },
  { name: 'kie.ai', icon: 'âš¡', status: 'connected', meta: 'Video + mÃºsica AI' },
  { name: 'Apollo.io', icon: 'ðŸ“Š', status: 'pending', meta: 'Prospecting' },
  { name: 'Suno AI', icon: 'ðŸŽµ', status: 'pending', meta: 'MÃºsica generativa' },
  { name: 'HyperFrames', icon: 'ðŸŽžï¸', status: 'disconnected', meta: 'Frames cinematogrÃ¡ficos' }
];

const clientIntegrations = {
  arranca: [
    { name: 'Twilio (MarÃ­a)', icon: 'ðŸ“ž', status: 'connected', meta: '+1 714 844 8860' },
    { name: 'Facebook + Instagram', icon: 'ðŸ“˜', status: 'connected', meta: 'act_2622567464589584' },
    { name: 'WhatsApp Business', icon: 'ðŸ’š', status: 'pending', meta: 'Verificando +1 657-707-4672' },
    { name: 'Stripe', icon: 'ðŸ’³', status: 'connected', meta: 'Curso $197' },
    { name: 'HeyGen', icon: 'ðŸŽ­', status: 'connected', meta: 'Avatares para curso' },
    { name: 'Hostinger FTP', icon: 'ðŸŒ', status: 'connected', meta: 'arrancafinancial.com' },
    { name: 'Gmail / SendGrid', icon: 'ðŸ“§', status: 'pending', meta: 'RecepciÃ³n de leads' },
    { name: 'Google Calendar', icon: 'ðŸ“…', status: 'disconnected', meta: 'Para agendar' },
    { name: 'YouTube', icon: 'â–¶ï¸', status: 'disconnected', meta: 'Canal de Arranca' },
    { name: 'TikTok', icon: 'ðŸŽµ', status: 'disconnected', meta: 'Por configurar' },
    { name: 'LinkedIn', icon: 'ðŸ’¼', status: 'disconnected', meta: 'Por configurar' },
    { name: 'Pinterest', icon: 'ðŸ“Œ', status: 'disconnected', meta: 'Por configurar' },
    { name: 'Twitter / X', icon: 'ð•', status: 'disconnected', meta: 'Por configurar' },
    { name: 'Google Ads', icon: 'ðŸ“Š', status: 'disconnected', meta: 'Ads de Arranca' }
  ],
  sofia: [
    { name: 'Twilio (SofÃ­a)', icon: 'ðŸ“ž', status: 'connected', meta: '+1 213 669 4427' },
    { name: 'A2P 10DLC', icon: 'ðŸ“œ', status: 'pending', meta: 'Registro SMS USA' },
    { name: 'Facebook + Instagram', icon: 'ðŸ“˜', status: 'pending', meta: 'Por configurar' },
    { name: 'WhatsApp Business', icon: 'ðŸ’š', status: 'disconnected', meta: 'Por configurar' },
    { name: 'TikTok', icon: 'ðŸŽµ', status: 'disconnected', meta: 'Por configurar' },
    { name: 'LinkedIn', icon: 'ðŸ’¼', status: 'disconnected', meta: 'Por configurar' },
    { name: 'YouTube', icon: 'â–¶ï¸', status: 'disconnected', meta: 'Por configurar' },
    { name: 'Stripe', icon: 'ðŸ’³', status: 'disconnected', meta: 'Pagos clÃ­nica GLP-1' },
    { name: 'Google Calendar', icon: 'ðŸ“…', status: 'disconnected', meta: 'Citas con la clÃ­nica' },
    { name: 'Gmail / SendGrid', icon: 'ðŸ“§', status: 'disconnected', meta: 'Bandeja de la clÃ­nica' }
  ]
};

let schedulerPosts = [];
let calendarMonth = new Date(); calendarMonth.setDate(1);
let calendarDayFilter = null;

let activeAgent = agents[0];
let currentClient = 'arranca';
let inboxFilter = 'all';
let driveFilter = 'all';
let recordingFilter = 'all';

// ============ NAVIGATION ============
function goSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('section-' + name);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item, .tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === name);
  });
  document.querySelector('.main').scrollTop = 0;
  if (name === 'home')      loadHomeStats();
  if (name === 'drive')     loadDriveFromAPI();
  if (name === 'marketing') { loadMSJobs(); renderRefSlots('ms'); }
  if (name === 'inbox')     loadInboxFromSupabase();
  if (name === 'scheduler') loadSchedulerPosts();
  if (name === 'grabaciones') loadRecordingsFromAPI();
  if (name === 'scraper')   { loadScraperStats(); loadScraperLogs(); }
  if (name === 'config')    { loadConfigClientes(); loadPortalUsers(); }
  closeAllDropdowns();
  if (document.getElementById('drawer').classList.contains('open')) toggleDrawer();
}

function toggleDropdown(id, event) {
  event.stopPropagation();
  const dd = document.getElementById(id);
  const wasOpen = dd.classList.contains('open');
  closeAllDropdowns();
  if (!wasOpen) dd.classList.add('open');
}
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
}
document.addEventListener('click', closeAllDropdowns);

function selectClient(id, emoji, name, ev) {
  currentClient = id;
  document.getElementById('clientAvatar').textContent = emoji;
  document.getElementById('clientName').textContent = name;
  document.querySelectorAll('#clientDropdown .dropdown-item').forEach(it => {
    it.classList.toggle('active', it.dataset.client === id);
  });
  renderClientIntegrations();
  document.getElementById('clientContextEmoji').textContent = emoji;
  document.getElementById('clientContextName').textContent = name;
  if (ev) ev.stopPropagation();
  closeAllDropdowns();
}

function toggleDrawer() {
  document.getElementById('drawer').classList.toggle('open');
  document.getElementById('drawerOverlay').classList.toggle('open');
}

// ============ TEAM ============
function renderTeam() {
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = agents.map(a => `
    <button class="agent-card" onclick="openChat('${a.id}')">
      <div class="agent-card-top">
        <div class="agent-emoji">${a.emoji}</div>
        <div class="agent-info"><div class="agent-name">${a.name}</div><div class="agent-role">${a.role}</div></div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span id="agent-status-${a.id}" class="agent-status ${a.status}"><span class="dot"></span>${a.status === 'online' ? 'online' : a.status === 'crashing' ? 'crashing' : 'chequeando'}</span>
      </div>
      <div class="agent-skills">${a.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
    </button>
  `).join('');
}

function openChat(agentId) {
  const a = agents.find(x => x.id === agentId);
  if (!a) return;
  activeAgent = a;
  document.getElementById('activeAgentEmoji').textContent = a.emoji;
  document.getElementById('activeAgentName').textContent = a.name;
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML = `<div class="message-group"><div class="message-meta">${a.name} Â· ahora</div><div class="message bot">${getAgentGreeting(a)}</div></div>`;
  goSection('chat');
}

function getAgentGreeting(a) {
  const g = {
    organizador: 'Hola Roberto. Soy el Organizador. Tienes 12 leads esta semana y 3 tareas del Crew pendientes. Â¿QuÃ© arrancamos?',
    director: 'Listo para guiones, copy y direcciÃ³n musical. Â¿QuÃ© necesitas escribir?',
    crew: 'Crew aquÃ­. Estoy crasheando ahora mismo â€” chÃ©came el Ãºltimo commit en Railway.',
    estrategia: 'Estrategia online. CampaÃ±as, SEO, funnels â€” Â¿quÃ© movemos hoy?',
    scheduler: 'Scheduler listo. 5 posts programados esta semana.',
    analytics: 'Analytics aquÃ­. Â¿Reporte semanal de Arranca o SofÃ­a?',
    compositor: 'CompositorBot â€” chequeando. Listo para scoring.',
    scraper: 'Scraper online. Â¿QuÃ© competidor analizamos?',
    seo: 'SEO Strategist. Dame keyword o URL y te audito.',
    web: 'Web Designer aquÃ­. Listo para landing pages + FTP a Hostinger.',
    motion: 'Motion Bot. Lottie, Remotion o FFmpeg â€” Â¿quÃ© animamos?'
  };
  return g[a.id] || 'Hola Roberto. Â¿En quÃ© te ayudo?';
}

function renderAgentDropdown() {
  document.getElementById('agentDropdown').innerHTML = agents.map(a => `
    <button class="dropdown-item ${a.id === activeAgent.id ? 'active' : ''}" onclick="event.stopPropagation(); openChat('${a.id}'); closeAllDropdowns();">
      <div class="agent-emoji" style="width: 28px; height: 28px; font-size: 14px;">${a.emoji}</div>
      <div><div style="font-weight: 600; font-size: 13px;">${a.name}</div><div style="font-size: 11px; color: var(--text-muted);">${a.role}</div></div>
      <span class="check">âœ“</span>
    </button>
  `).join('');
}

// ============ CRM ============
function renderCRM() {
  const cols = [
    { id: 'new', label: 'ðŸ†• Nuevo', items: leads.new },
    { id: 'contacted', label: 'ðŸ“ž Contactado', items: leads.contacted },
    { id: 'interested', label: 'ðŸ”¥ Interesado', items: leads.interested },
    { id: 'closed', label: 'âœ… Cerrado', items: leads.closed }
  ];
  document.getElementById('crmBoard').innerHTML = cols.map(col => `
    <div class="crm-column">
      <div class="crm-col-header">
        <div class="crm-col-title ${col.id}"><span class="dot"></span>${col.label}</div>
        <span class="crm-col-count">${col.items.length}</span>
      </div>
      ${col.items.map((l, idx) => `
        <div class="lead-card" style="cursor:pointer;" onclick="openLeadModal('${col.id}', ${idx})">
          <div class="lead-name">${l.name}</div>
          <div class="lead-meta"><span class="lead-channel">${l.source}</span><span>${l.meta}</span></div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ============ CALENDAR ============
const PLATAFORMA_ICON = { facebook:'ðŸ“˜', instagram:'ðŸ“¸', tiktok:'ðŸŽµ', youtube:'â–¶ï¸', twitter:'ðŸ¦', linkedin:'ðŸ’¼', x:'ðŸ¦' };
const ESTADO_CSS   = { pendiente:'draft', aprobado:'scheduled', publicado:'published', rechazado:'draft' };
const ESTADO_LABEL_MAP = { pendiente:'Borrador', aprobado:'Programado', publicado:'Publicado', rechazado:'Rechazado' };
const MES_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIA_NAMES = ['Dom','Lun','Mar','MiÃ©','Jue','Vie','SÃ¡b'];

async function loadSchedulerPosts() {
  const panel = document.getElementById('postsPanel');
  if (panel) panel.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-size:14px;">Cargando postsâ€¦</div>';
  try {
    const r = await fetch('/api/scheduler/posts');
    schedulerPosts = await r.json();
    if (!Array.isArray(schedulerPosts)) schedulerPosts = [];
  } catch(e) { schedulerPosts = []; }
  calendarDayFilter = null;
  renderCalendar();
  renderPosts();
}

function changeCalMonth(delta) {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1);
  calendarDayFilter = null;
  renderCalendar();
  renderPosts();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calMonthLabel');
  if (!grid) return;
  const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth();
  if (label) label.textContent = `${MES_NAMES[month]} ${year}`;
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const postDaySet = new Set(
    schedulerPosts
      .filter(p => { if (!p.fecha_publicacion) return false;
        const d = new Date(p.fecha_publicacion + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === month; })
      .map(p => new Date(p.fecha_publicacion + 'T00:00:00').getDate())
  );
  let html = ['D','L','M','X','J','V','S'].map(d => `<div class="cal-day-name">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day dim"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const cls = ['cal-day'];
    const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
    const isSelected = calendarDayFilter && calendarDayFilter.day===d;
    if (isToday) cls.push('today');
    if (isToday && !isSelected) cls.push('selected');
    if (isSelected) cls.push('selected');
    if (postDaySet.has(d)) cls.push('has-post');
    html += `<div class="${cls.join(' ')}" onclick="filterCalDay(${year},${month},${d},this)">${d}</div>`;
  }
  grid.innerHTML = html;
}

function filterCalDay(year, month, day, el) {
  if (calendarDayFilter && calendarDayFilter.day === day) {
    calendarDayFilter = null;
  } else {
    calendarDayFilter = { year, month, day };
  }
  renderCalendar();
  renderPosts();
}

function renderPosts() {
  const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth();
  let filtered = schedulerPosts.filter(p => {
    if (!p.fecha_publicacion) return false;
    const d = new Date(p.fecha_publicacion + 'T00:00:00');
    if (calendarDayFilter) return d.getFullYear()===calendarDayFilter.year && d.getMonth()===calendarDayFilter.month && d.getDate()===calendarDayFilter.day;
    return d.getFullYear()===year && d.getMonth()===month;
  });
  const panel = document.getElementById('postsPanel');
  if (!panel) return;
  if (!filtered.length) {
    panel.innerHTML = `<div style="padding:20px;color:var(--text-muted);font-size:14px;">${schedulerPosts.length ? 'Sin posts para este perÃ­odo.' : 'No hay posts programados aÃºn. Usa "+ Programar post" para crear el primero.'}</div>`;
    return;
  }
  const today = new Date();
  panel.innerHTML = `
    <div style="font-size:13px;font-weight:600;padding:4px 4px 0;color:var(--text-muted);">Posts Â· ${filtered.length}</div>
    ${filtered.map(p => {
      const dateObj = new Date(p.fecha_publicacion + 'T00:00:00');
      let dateLabel;
      if (dateObj.toDateString()===today.toDateString()) dateLabel = 'Hoy';
      else { const tom = new Date(today); tom.setDate(today.getDate()+1);
        dateLabel = dateObj.toDateString()===tom.toDateString() ? 'MaÃ±ana' : `${DIA_NAMES[dateObj.getDay()]} ${dateObj.getDate()}`; }
      const icon = PLATAFORMA_ICON[p.plataforma] || 'ðŸ“„';
      const statusCss = ESTADO_CSS[p.estado] || 'draft';
      const statusLbl = ESTADO_LABEL_MAP[p.estado] || p.estado;
      const snippet = p.contenido ? (p.contenido.length>70 ? p.contenido.slice(0,70)+'â€¦' : p.contenido) : '(sin contenido)';
      return `<div class="post-item" style="gap:10px;">
        <div class="post-thumb">${icon}</div>
        <div class="post-content">
          <div class="post-channels"><span class="post-channel">${icon} ${p.plataforma}</span>${p.cliente ? `<span class="post-channel" style="opacity:.6">${p.cliente}</span>` : ''}</div>
          <div class="post-title">${snippet}</div>
          <div class="post-meta"><span>${dateLabel} Â· ${p.hora_publicacion || ''}</span></div>
        </div>
        <span class="post-status ${statusCss}">${statusLbl}</span>
        <button onclick="deletePost('${p.post_id}')" title="Borrar post" style="background:none;border:none;color:var(--text-dim);font-size:16px;cursor:pointer;padding:4px;border-radius:6px;flex-shrink:0;line-height:1;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-dim)'">ðŸ—‘</button>
      </div>`;
    }).join('')}
  `;
}

async function deletePost(postId) {
  if (!confirm('Â¿Borrar este post? Se eliminarÃ¡ de Supabase y no se publicarÃ¡.')) return;
  try {
    const r = await fetch(`/api/scheduler/posts/${postId}`, { method: 'DELETE' });
    if (!r.ok) { alert('Error al borrar el post.'); return; }
    schedulerPosts = schedulerPosts.filter(p => p.post_id !== postId);
    renderCalendar();
    renderPosts();
  } catch(e) { alert('Error de conexiÃ³n: ' + e.message); }
}

// ============ INBOX ============
function renderInboxFilters() {
  const filters = [
    { id: 'all', label: 'Todos', count: inboxItems.length },
    { id: 'unread', label: 'Sin leer', count: inboxItems.filter(i => i.unread).length },
    { id: 'whatsapp', label: 'ðŸ’š WhatsApp', count: inboxItems.filter(i => i.channel === 'whatsapp').length },
    { id: 'instagram', label: 'ðŸ“¸ Instagram', count: inboxItems.filter(i => i.channel === 'instagram').length },
    { id: 'facebook', label: 'ðŸ“˜ Facebook', count: inboxItems.filter(i => i.channel === 'facebook').length },
    { id: 'sms', label: 'ðŸ’¬ SMS', count: inboxItems.filter(i => i.channel === 'sms').length },
    { id: 'email', label: 'ðŸ“§ Email', count: inboxItems.filter(i => i.channel === 'email').length }
  ];
  document.getElementById('inboxFilters').innerHTML = filters.map(f => `
    <button class="filter-pill ${f.id === inboxFilter ? 'active' : ''}" onclick="setInboxFilter('${f.id}')">${f.label} <span style="opacity:0.6;margin-left:4px;">${f.count}</span></button>
  `).join('');
}

function setInboxFilter(id) { inboxFilter = id; renderInboxFilters(); renderInbox(); }

function renderInbox() {
  let items = inboxItems;
  if (inboxFilter === 'unread') items = items.filter(i => i.unread);
  else if (inboxFilter !== 'all') items = items.filter(i => i.channel === inboxFilter);
  document.getElementById('inboxList').innerHTML = items.map(i => `
    <button class="inbox-item ${i.unread ? 'unread' : ''}" onclick="alert('Abriendo conversaciÃ³n con ${i.from}...')">
      <div class="inbox-channel-icon">${i.icon}</div>
      <div class="inbox-content">
        <div class="inbox-top">
          <div class="inbox-from">${i.from}</div>
          <div class="inbox-time">${i.time}</div>
        </div>
        <div class="inbox-preview">${i.preview}</div>
        <div class="inbox-tags">
          <span class="inbox-tag client">${i.client === 'arranca' ? 'ðŸ’° Arranca' : 'ðŸ’Š SofÃ­a'}</span>
          <span class="inbox-tag">${i.channel}</span>
        </div>
      </div>
      ${i.unread ? '<div class="inbox-unread-dot"></div>' : ''}
    </button>
  `).join('');
}

// ============ RECORDINGS ============
function renderRecordingFilters() {
  const filters = [
    { id: 'all', label: 'Todos', count: recordings.length },
    { id: 'maria', label: 'ðŸŽ¯ MarÃ­a (Arranca)', count: recordings.filter(r => r.agent === 'maria').length },
    { id: 'sofia', label: 'ðŸ’Š SofÃ­a (clÃ­nica)', count: recordings.filter(r => r.agent === 'sofia').length },
    { id: 'closed', label: 'âœ… Cerrados', count: recordings.filter(r => r.leadStatus === 'closed').length }
  ];
  document.getElementById('recordingFilters').innerHTML = filters.map(f => `
    <button class="filter-pill ${f.id === recordingFilter ? 'active' : ''}" onclick="setRecordingFilter('${f.id}')">${f.label} <span style="opacity:0.6;margin-left:4px;">${f.count}</span></button>
  `).join('');
}

function setRecordingFilter(id) { recordingFilter = id; renderRecordingFilters(); renderRecordings(); }

function renderRecordings() {
  let items = recordings;
  if (recordingFilter === 'maria' || recordingFilter === 'sofia') items = items.filter(r => r.agent === recordingFilter);
  else if (recordingFilter === 'closed') items = items.filter(r => r.leadStatus === 'closed');
  const statusLabel = { closed: 'âœ… Cerrado', interested: 'ðŸ”¥ Interesado', contacted: 'ðŸ“ž Contactado' };
  document.getElementById('recordingsTable').innerHTML = `
    <div class="rec-row header">
      <div>Fecha</div><div>Agente</div><div>TelÃ©fono</div><div>DuraciÃ³n</div><div class="rec-col-trans">Transcript</div><div class="rec-col-status">Estado</div><div class="rec-col-play">Audio</div>
    </div>
    ${items.map(r => `
      <div class="rec-row">
        <div>${r.date}</div>
        <div><span class="rec-agent ${r.agent}">${r.agent === 'maria' ? 'ðŸŽ¯ MarÃ­a' : 'ðŸ’Š SofÃ­a'}</span></div>
        <div class="rec-phone">${r.phone}</div>
        <div class="rec-duration">${r.duration}</div>
        <div class="rec-transcript rec-col-trans" title="${r.transcript}">${r.transcript}</div>
        <div class="rec-col-status"><span class="rec-status-pill ${r.leadStatus}">${statusLabel[r.leadStatus]}</span></div>
        <div class="rec-col-play"><button class="rec-play" onclick="alert('Reproduciendo grabaciÃ³n de ${r.date}...')">â–¶</button></div>
      </div>
    `).join('')}
  `;
}

// ============ DRIVE ============
let driveFolderOpen = null; // null = root folders, 'video'|'audio'|'image' = inside folder

const DRIVE_FOLDERS = [
  { id: 'video', label: 'Video', icon: 'ðŸŽ¬', color: 'video', gdLabel: 'Videos' },
  { id: 'audio', label: 'Audio', icon: 'ðŸŽµ', color: 'audio', gdLabel: 'Audios' },
  { id: 'image', label: 'Imagen', icon: 'ðŸ–¼ï¸', color: 'image', gdLabel: 'ImÃ¡genes' },
];

function renderDriveFilters() { renderDrive(); } // compat alias
function setDriveFilter(id) { driveFolderOpen = id === 'all' ? null : id; renderDrive(); }

function openDriveFolder(folderId) {
  driveFolderOpen = folderId;
  renderDrive();
}

function closeDriveFolder() {
  driveFolderOpen = null;
  renderDrive();
}

function renderDrive() {
  const allItems = window._driveAPIItems || driveItems;
  const content = document.getElementById('driveContent');
  const breadcrumb = document.getElementById('driveBreadcrumb');
  if (!content) return;

  if (!driveFolderOpen) {
    // â”€â”€ ROOT: mostrar carpetas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (breadcrumb) breadcrumb.textContent = 'Videos, audios e imÃ¡genes generadas por tu equipo';
    const rows = DRIVE_FOLDERS.map(f => {
      const items = allItems.filter(d => d.type === f.id);
      const thumbs = items.slice(0, 3).map(d =>
        `<div class="drive-folder-mini ${f.id}">${d.icon}</div>`).join('');
      const sizes = items.reduce((acc, d) => {
        const mb = parseFloat(d.size);
        return acc + (isNaN(mb) ? 0 : mb);
      }, 0);
      return `
        <div class="drive-folder-row" onclick="openDriveFolder('${f.id}')">
          <div class="drive-folder-icon">${f.icon}</div>
          <div class="drive-folder-info">
            <div class="drive-folder-name">${f.label}</div>
            <div class="drive-folder-meta">${items.length} archivos Â· ${sizes.toFixed(1)} MB</div>
          </div>
          <div class="drive-folder-thumbs">${thumbs}</div>
          <div class="drive-folder-arrow">â€º</div>
        </div>`;
    }).join('');
    content.innerHTML = `<div class="drive-folders">${rows}</div>`;
  } else {
    // â”€â”€ INSIDE FOLDER: mostrar archivos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const folder = DRIVE_FOLDERS.find(f => f.id === driveFolderOpen);
    const items = allItems.filter(d => d.type === driveFolderOpen);
    if (breadcrumb) breadcrumb.innerHTML = `<span style="cursor:pointer;color:var(--accent)" onclick="closeDriveFolder()">Drive</span> â€º ${folder.label}`;
    const grid = items.map(d => `
      <button class="drive-card" onclick="alert('Abriendo ${d.name}...')">
        <div class="drive-thumb ${d.type}">
          ${d.icon}
          <span class="drive-type-badge">${d.type === 'image' ? 'IMAGE' : d.type.toUpperCase()}</span>
        </div>
        <div class="drive-info">
          <div class="drive-name" title="${d.name}">${d.name}</div>
          <div class="drive-meta"><span>${d.date}</span><span>${d.size}</span></div>
          <div class="drive-source">${d.source}</div>
        </div>
      </button>`).join('');
    content.innerHTML = `
      <div class="drive-back-bar">
        <button class="drive-back-btn" onclick="closeDriveFolder()">â† Volver</button>
        <span>${folder.icon} ${folder.label} Â· ${items.length} archivos</span>
      </div>
      <div class="drive-grid">${grid || '<div style="padding:32px;color:var(--text-muted)">Esta carpeta estÃ¡ vacÃ­a.</div>'}</div>`;
  }
}

// ============ SCRAPER ============
function renderEndpoints() {
  document.getElementById('endpointsList').innerHTML = playwrightEndpoints.map(e => `
    <div class="endpoint-card">
      <span class="endpoint-method">${e.method}</span>
      <span class="endpoint-path">${e.path}</span>
      <span class="endpoint-desc">${e.desc}</span>
      <div class="endpoint-users">${e.users.map(u => `<span class="endpoint-user-tag">${u}</span>`).join('')}</div>
    </div>
  `).join('');
}

function renderRequests(data) {
  const rows = data || playwrightRequests;
  document.getElementById('requestsTable').innerHTML = `
    <div class="req-row header">
      <div>Hora</div><div>Endpoint</div><div>Target</div><div>Status</div><div class="req-col-ms">ms</div><div class="req-col-bot">Bot</div>
    </div>
    ${rows.map(r => {
      const time = r.time || (r.ts ? new Date(r.ts).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }) : 'â€”');
      const status = r.status || 0;
      return `<div class="req-row">
        <div class="req-time">${time}</div>
        <div class="req-endpoint">${r.endpoint || 'â€”'}</div>
        <div class="req-target" title="${r.target}">${r.target || 'â€”'}</div>
        <div><span class="req-status ${status >= 200 && status < 400 ? 'ok' : 'err'}">${status}</span></div>
        <div class="req-ms req-col-ms">${r.ms || 'â€”'}</div>
        <div class="req-col-bot"><span class="req-bot">${r.bot || 'â€”'}</span></div>
      </div>`;
    }).join('')}
  `;
}

// ============ INTEGRATIONS ============
function statusLabel(s) { return s === 'connected' ? 'Conectado' : s === 'pending' ? 'Configurando' : 'No conectado'; }

function renderIntegrationCard(i, isClientScoped) {
  return `
    <div class="integration ${isClientScoped ? 'client-scoped' : ''}">
      <div class="integration-top">
        <div class="integration-icon">${i.icon}</div>
        <div class="integration-info">
          <div class="integration-name">${i.name}</div>
          <span class="integration-status ${i.status}"><span class="dot"></span>${statusLabel(i.status)}</span>
        </div>
      </div>
      ${i.meta ? `<div class="integration-meta">${i.meta}</div>` : ''}
      ${i.status !== 'connected' ? `<button class="integration-action">${i.status === 'pending' ? 'Continuar â†’' : 'Conectar â†’'}</button>` : ''}
    </div>
  `;
}

function renderGlobalIntegrations() { document.getElementById('globalIntegrationsGrid').innerHTML = globalIntegrations.map(i => renderIntegrationCard(i, false)).join(''); }
function renderClientIntegrations() { document.getElementById('clientIntegrationsGrid').innerHTML = (clientIntegrations[currentClient] || []).map(i => renderIntegrationCard(i, true)).join(''); }

function switchConfigTab(tab) {
  document.querySelectorAll('.config-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.config-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('pane-' + tab).classList.add('active');
}

// ============ CHAT ============
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML += `<div class="message-group user"><div class="message-meta" style="text-align:right">TÃº Â· ahora</div><div class="message user">${escapeHtml(text)}</div></div>`;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  msgs.scrollTop = msgs.scrollHeight;

  // Loading indicator
  const loadId = 'load-' + Date.now();
  msgs.innerHTML += `<div class="message-group" id="${loadId}"><div class="message-meta">${activeAgent.name} Â· ahora</div><div class="message bot" style="opacity:.5">â³ Pensando...</div></div>`;
  msgs.scrollTop = msgs.scrollHeight;

  const agentCfg = window.AGENT_MAP && window.AGENT_MAP[activeAgent.id];
  if (!agentCfg) {
    document.getElementById(loadId).querySelector('.message').textContent = simulateReply(text);
    return;
  }
  fetch(agentCfg.url + agentCfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, client: currentClient })
  })
  .then(r => r.json())
  .then(d => {
    const reply = d.response || d.respuesta || d.message || d.reply || d.content || JSON.stringify(d);
    document.getElementById(loadId).querySelector('.message').style.opacity = '1';
    document.getElementById(loadId).querySelector('.message').textContent = reply;
    msgs.scrollTop = msgs.scrollHeight;
  })
  .catch(e => {
    document.getElementById(loadId).querySelector('.message').textContent = 'âš  Sin respuesta del agente (' + e.message + ')';
    document.getElementById(loadId).querySelector('.message').style.opacity = '1';
  });
}

function sendQuick(text) { chatInput.value = text; sendMessage(); }

function simulateReply(text) {
  const t = text.toLowerCase();
  if (t.includes('estado') || t.includes('proyecto')) return 'Arranca: 12 leads, 2 cerrados ($394). SofÃ­a: agente de voz activo. Crew: crasheando.';
  if (t.includes('reporte')) return 'Generando reporte semanal... Te lo mando en PDF y al Telegram.';
  if (t.includes('campaÃ±a')) return 'Â¿Para quÃ© cliente? Dame brief: objetivo, presupuesto, canales y deadline.';
  if (t.includes('lead')) return 'Hoy: 3 leads nuevos. MarÃ­a llamÃ³ a 2 â€” uno sin respuesta.';
  if (t.includes('crew')) return 'Crew crasheando desde el commit "SKILL.md for Higgsfield Studio". Fix desde Claude Code.';
  return 'Recibido. Procesando con el equipo y te confirmo en breve.';
}

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

// ============ MIC ============
let recognition = null, isRecording = false;
function initMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'es-ES'; rec.continuous = true; rec.interimResults = true;
  rec.onresult = (e) => {
    let final = '', interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    chatInput.value = (chatInput.dataset.baseText || '') + final + interim;
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    if (final) chatInput.dataset.baseText = (chatInput.dataset.baseText || '') + final;
  };
  rec.onend = () => { if (isRecording) { try { rec.start(); } catch(e) {} } };
  rec.onerror = () => stopMic();
  return rec;
}
function toggleMic() {
  if (!recognition) recognition = initMic();
  if (!recognition) { alert('Tu navegador no soporta Web Speech API. Usa Chrome o Edge.'); return; }
  if (isRecording) stopMic(); else startMic();
}
function startMic() {
  isRecording = true;
  chatInput.dataset.baseText = chatInput.value ? chatInput.value + ' ' : '';
  document.getElementById('micBtn').classList.add('recording');
  document.getElementById('chatBar').classList.add('recording');
  document.getElementById('recHint').classList.add('show');
  try { recognition.start(); } catch(e) {}
}
function stopMic() {
  isRecording = false;
  document.getElementById('micBtn').classList.remove('recording');
  document.getElementById('chatBar').classList.remove('recording');
  document.getElementById('recHint').classList.remove('show');
  delete chatInput.dataset.baseText;
  if (recognition) try { recognition.stop(); } catch(e) {}
}

// ============ ONBOARDING ============
const onboardingSteps = [
  { id: 1, label: 'Info' }, { id: 2, label: 'Canales' }, { id: 3, label: 'Redes' },
  { id: 4, label: 'CampaÃ±a' }, { id: 5, label: 'Agentes' }, { id: 6, label: 'Conexiones' }, { id: 7, label: 'Listo' }
];
let currentStep = 1;
const onboardingData = {
  nombre: '', industria: '', email: '', telefono: '', precio_producto: 197, descripcion: '',
  whatsapp_option: '', respond_io_key: '', whatsapp_number: '',
  redes: [], channels: [], agents: [], integrations: []
};

function renderStepper() {
  const s = document.getElementById('stepper');
  s.innerHTML = onboardingSteps.map((step, i) => {
    const cls = step.id === currentStep ? 'active' : step.id < currentStep ? 'done' : '';
    const connector = i < onboardingSteps.length - 1 ? '<div class="step-connector"></div>' : '';
    return `<button class="step-pill ${cls}" onclick="goStep(${step.id})"><span class="step-num">${step.id < currentStep ? 'âœ“' : step.id}</span><span>${step.label}</span></button>${connector}`;
  }).join('');
  document.getElementById('stepLabel').textContent = `Paso ${currentStep} de ${onboardingSteps.length}`;
  document.getElementById('prevBtn').style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  document.getElementById('nextBtn').textContent = currentStep === onboardingSteps.length ? 'ðŸš€ Lanzar cliente' : 'Siguiente â†’';
}

function renderStepContent() {
  const c = document.getElementById('onboardingStep');
  if (currentStep === 1) c.innerHTML = `
    <div class="step-title">ðŸ“‹ InformaciÃ³n del cliente</div>
    <div class="step-desc">Lo bÃ¡sico para arrancar.</div>
    <div class="field-group"><label class="field-label">Nombre del cliente *</label><input id="ob_nombre" class="field-input" placeholder="Ej: Arranca Financial" value="${onboardingData.nombre}" oninput="onboardingData.nombre=this.value" /></div>
    <div class="field-group"><label class="field-label">Sector</label>
      <select id="ob_industria" class="field-select" onchange="onboardingData.industria=this.value">
        <option value="educacion" ${onboardingData.industria==='educacion'?'selected':''}>EducaciÃ³n financiera</option>
        <option value="salud" ${onboardingData.industria==='salud'?'selected':''}>ClÃ­nica / Salud</option>
        <option value="restaurante" ${onboardingData.industria==='restaurante'?'selected':''}>Restaurante</option>
        <option value="automotriz" ${onboardingData.industria==='automotriz'?'selected':''}>Automotriz / Turo</option>
        <option value="bienes_raices" ${onboardingData.industria==='bienes_raices'?'selected':''}>Bienes raÃ­ces</option>
        <option value="finanzas" ${onboardingData.industria==='finanzas'?'selected':''}>Finanzas</option>
        <option value="legal" ${onboardingData.industria==='legal'?'selected':''}>Legal</option>
        <option value="belleza" ${onboardingData.industria==='belleza'?'selected':''}>Belleza / EstÃ©tica</option>
        <option value="otro" ${onboardingData.industria==='otro'?'selected':''}>Otro</option>
      </select></div>
    <div class="field-group"><label class="field-label">Email</label><input id="ob_email" class="field-input" placeholder="cliente@empresa.com" value="${onboardingData.email}" oninput="onboardingData.email=this.value" /></div>
    <div class="field-group"><label class="field-label">TelÃ©fono</label><input id="ob_telefono" class="field-input" placeholder="+1 714 000 0000" value="${onboardingData.telefono}" oninput="onboardingData.telefono=this.value" /></div>
    <div class="field-group"><label class="field-label">Precio de su producto / curso ($)</label><input id="ob_precio" class="field-input" type="number" placeholder="197" value="${onboardingData.precio_producto}" oninput="onboardingData.precio_producto=+this.value" /></div>`;

  if (currentStep === 2) c.innerHTML = `
    <div class="step-title">ðŸ“¡ Canal WhatsApp</div>
    <div class="step-desc">Â¿CÃ³mo conectarÃ¡ WhatsApp el cliente?</div>
    <div class="choice-grid" style="grid-template-columns:1fr 1fr">
      <button class="choice ${onboardingData.whatsapp_option==='respondio'?'selected':''}" onclick="onboardingData.whatsapp_option='respondio';renderStepContent()">
        <span class="choice-icon">ðŸ’¼</span><span class="choice-label">NÃºmero vÃ­a Respond.io</span>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Agencia gestiona Â· cliente paga</div>
      </button>
      <button class="choice ${onboardingData.whatsapp_option==='propio'?'selected':''}" onclick="onboardingData.whatsapp_option='propio';renderStepContent()">
        <span class="choice-icon">ðŸ’š</span><span class="choice-label">WA Business propio</span>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Cliente trae su nÃºmero</div>
      </button>
    </div>
    ${onboardingData.whatsapp_option==='respondio' ? `
      <div class="field-group" style="margin-top:16px"><label class="field-label">API Key de Respond.io</label><input class="field-input" placeholder="Pegar API key" value="${onboardingData.respond_io_key}" oninput="onboardingData.respond_io_key=this.value" /></div>
      <div class="field-group"><label class="field-label">NÃºmero asignado</label><input class="field-input" placeholder="+1 657 000 0000" value="${onboardingData.whatsapp_number}" oninput="onboardingData.whatsapp_number=this.value" /></div>` : ''}
    ${onboardingData.whatsapp_option==='propio' ? `
      <div class="field-group" style="margin-top:16px"><label class="field-label">NÃºmero WA Business</label><input class="field-input" placeholder="+1 657 000 0000" value="${onboardingData.whatsapp_number}" oninput="onboardingData.whatsapp_number=this.value" /></div>
      <div class="field-group"><label class="field-label">API Key Meta / Respond.io (opcional)</label><input class="field-input" placeholder="Pegar API key" value="${onboardingData.respond_io_key}" oninput="onboardingData.respond_io_key=this.value" /></div>` : ''}`;

  if (currentStep === 3) c.innerHTML = `
    <div class="step-title">ðŸ“± Redes sociales</div>
    <div class="step-desc">Selecciona las redes que tiene el cliente. Agrega sus tokens para que el Scheduler pueda publicar.</div>
    ${[
      { key:'tiktok', label:'TikTok', icon:'ðŸŽµ', field:'tiktok_token' },
      { key:'linkedin', label:'LinkedIn', icon:'ðŸ’¼', field:'linkedin_token' },
      { key:'youtube', label:'YouTube', icon:'â–¶ï¸', field:'youtube_token' },
      { key:'pinterest', label:'Pinterest', icon:'ðŸ“Œ', field:'pinterest_token' },
      { key:'twitter', label:'Twitter / X', icon:'ð•', field:'twitter_token' },
      { key:'facebook', label:'Facebook', icon:'ðŸ“˜', field:null },
      { key:'instagram', label:'Instagram', icon:'ðŸ“¸', field:null },
    ].map(r => `
      <div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <button class="choice ${onboardingData.redes.includes(r.key)?'selected':''}" style="width:auto;padding:8px 14px;flex-shrink:0" onclick="toggleRedSocial('${r.key}');renderStepContent()">
          <span>${r.icon}</span> <span>${r.label}</span>
        </button>
        ${onboardingData.redes.includes(r.key) && r.field ? `<input class="field-input" style="flex:1" placeholder="Token / Page ID" value="${onboardingData[r.field]||''}" oninput="onboardingData.${r.field}=this.value" />` : '<div style="flex:1;font-size:12px;color:var(--text-dim)">Selecciona para agregar token</div>'}
      </div>`).join('')}`;

  if (currentStep === 4) c.innerHTML = `
    <div class="step-title">ðŸŽ¯ Primera campaÃ±a</div>
    <div class="step-desc">El primer objetivo del cliente.</div>
    <div class="field-group"><label class="field-label">Objetivo principal</label><select class="field-select"><option>Generar leads</option><option>Vender producto / curso</option><option>Agendar citas</option><option>Hacer follow-up</option></select></div>
    <div class="field-group"><label class="field-label">Presupuesto mensual ads</label><input class="field-input" placeholder="$500" /></div>
    <div class="field-group"><label class="field-label">Mensaje principal</label><textarea class="field-textarea" placeholder="Ej: Curso $197 para aprender Turo"></textarea></div>`;

  if (currentStep === 5) c.innerHTML = `
    <div class="step-title">ðŸ¤– Agentes asignados</div>
    <div class="step-desc">Selecciona los agentes que trabajan con este cliente.</div>
    <div class="choice-grid">${agents.map(a => `<button class="choice ${onboardingData.agents.includes(a.id)?'selected':''}" onclick="toggleChoice(this,'agent','${a.id}')"><span class="choice-icon">${a.emoji}</span><span class="choice-label">${a.name}</span></button>`).join('')}</div>`;

  if (currentStep === 6) c.innerHTML = `
    <div class="step-title">ðŸ”Œ Conexiones del cliente</div>
    <div class="step-desc">Marca las que tiene el cliente. Credenciales se configuran despuÃ©s en Config â†’ Integraciones.</div>
    <div class="choice-grid">${['Twilio','Stripe','Facebook Ads','WhatsApp Business','Gmail/SendGrid','Google Calendar','HeyGen'].map(int => `<button class="choice ${onboardingData.integrations.includes(int)?'selected':''}" onclick="toggleChoice(this,'integration','${int}')"><span class="choice-icon">ðŸ”Œ</span><span class="choice-label">${int}</span></button>`).join('')}</div>`;

  if (currentStep === 7) c.innerHTML = `
    <div class="step-title">âœ… Todo listo</div>
    <div class="step-desc">Revisa el resumen y lanza el cliente.</div>
    <div class="summary-grid">
      <div class="summary-row"><span class="key">Cliente</span><span class="val">${onboardingData.nombre || 'â€”'}</span></div>
      <div class="summary-row"><span class="key">Sector</span><span class="val">${onboardingData.industria || 'â€”'}</span></div>
      <div class="summary-row"><span class="key">Email</span><span class="val">${onboardingData.email || 'â€”'}</span></div>
      <div class="summary-row"><span class="key">WhatsApp</span><span class="val">${onboardingData.whatsapp_option || 'â€”'} ${onboardingData.whatsapp_number ? 'Â· ' + onboardingData.whatsapp_number : ''}</span></div>
      <div class="summary-row"><span class="key">Redes sociales</span><span class="val">${onboardingData.redes.length ? onboardingData.redes.join(', ') : 'â€”'}</span></div>
      <div class="summary-row"><span class="key">Agentes</span><span class="val">${onboardingData.agents.length || 'â€”'}</span></div>
      <div class="summary-row"><span class="key">Precio producto</span><span class="val">$${onboardingData.precio_producto || 197}</span></div>
      <div class="summary-row"><span class="key">Estado</span><span class="val" style="color:var(--success);">â— Listo para lanzar</span></div>
    </div>
    <div id="onboardingError" style="color:var(--danger);font-size:13px;margin-top:8px;display:none"></div>`;
}

function toggleRedSocial(key) {
  const idx = onboardingData.redes.indexOf(key);
  if (idx > -1) onboardingData.redes.splice(idx, 1); else onboardingData.redes.push(key);
}
function toggleChoice(el, type, value) {
  el.classList.toggle('selected');
  const key = type === 'channel' ? 'channels' : type === 'agent' ? 'agents' : 'integrations';
  const idx = onboardingData[key].indexOf(value);
  if (idx > -1) onboardingData[key].splice(idx, 1); else onboardingData[key].push(value);
}
function goStep(n) { currentStep = n; renderStepper(); renderStepContent(); }
function prevStep() { if (currentStep > 1) { currentStep--; renderStepper(); renderStepContent(); } }
async function nextStep() {
  if (currentStep === 1 && !onboardingData.nombre.trim()) {
    alert('El nombre del cliente es obligatorio.'); return;
  }
  if (currentStep < onboardingSteps.length) {
    currentStep++; renderStepper(); renderStepContent();
  } else {
    const btn = document.getElementById('nextBtn');
    btn.textContent = 'Guardando...'; btn.disabled = true;
    try {
      const res = await fetch('/api/clientes/crear', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      });
      const d = await res.json();
      if (d.ok) {
        alert('ðŸš€ Cliente ' + onboardingData.nombre + ' creado exitosamente.');
        resetOnboarding();
        loadConfigClientes();
      } else {
        const errEl = document.getElementById('onboardingError');
        if (errEl) { errEl.textContent = d.error || 'Error al crear cliente.'; errEl.style.display = 'block'; }
        btn.textContent = 'ðŸš€ Lanzar cliente'; btn.disabled = false;
      }
    } catch(e) {
      const errEl = document.getElementById('onboardingError');
      if (errEl) { errEl.textContent = 'Error de conexiÃ³n.'; errEl.style.display = 'block'; }
      btn.textContent = 'ðŸš€ Lanzar cliente'; btn.disabled = false;
    }
  }
}
function resetOnboarding() {
  currentStep = 1;
  Object.assign(onboardingData, { nombre:'', industria:'', email:'', telefono:'', precio_producto:197, descripcion:'', whatsapp_option:'', respond_io_key:'', whatsapp_number:'', redes:[], channels:[], agents:[], integrations:[] });
  renderStepper(); renderStepContent();
}

// ============ USERS / ACCESS ============
const portalUsers = [
  { name: 'Roberto GonzÃ¡lez', email: 'roberto@rg-production.com', client: { name: 'Arranca Financial', emoji: 'ðŸ’°' }, role: 'owner', lastLogin: 'hace 2 min', status: 'active', initials: 'RG', color: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Dra. Ana RamÃ­rez', email: 'ana@clinicaramirez.com', client: { name: 'ClÃ­nica RamÃ­rez', emoji: 'ðŸ’Š' }, role: 'owner', lastLogin: 'hace 1 hora', status: 'active', initials: 'AR', color: 'linear-gradient(135deg, #10b981, #047857)' },
  { name: 'MarÃ­a LÃ³pez', email: 'maria@clinicaramirez.com', client: { name: 'ClÃ­nica RamÃ­rez', emoji: 'ðŸ’Š' }, role: 'staff', lastLogin: 'hace 3 horas', status: 'active', initials: 'ML', color: 'linear-gradient(135deg, #3b82f6, #1e40af)' },
  { name: 'Carlos MÃ©ndez', email: 'carlos@clinicaramirez.com', client: { name: 'ClÃ­nica RamÃ­rez', emoji: 'ðŸ’Š' }, role: 'staff', lastLogin: 'â€”', status: 'pending', initials: 'CM', color: 'linear-gradient(135deg, #a78bfa, #6d28d9)' },
  { name: 'Patricia NÃºÃ±ez', email: 'patricia@dentalsmile.com', client: { name: 'Dental Smile', emoji: 'ðŸ¦·' }, role: 'owner', lastLogin: 'â€”', status: 'pending', initials: 'PN', color: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { name: 'Jorge SuÃ¡rez', email: 'jorge@oldclient.com', client: { name: 'Arranca Financial', emoji: 'ðŸ’°' }, role: 'readonly', lastLogin: 'hace 30 dÃ­as', status: 'suspended', initials: 'JS', color: 'linear-gradient(135deg, #6b7280, #374151)' }
];

function roleLabel(r) { return r === 'owner' ? 'Owner' : r === 'staff' ? 'Staff' : 'Read-only'; }
function userStatusLabel(s) { return s === 'active' ? 'Activo' : s === 'pending' ? 'Pendiente' : 'Suspendido'; }

function renderUsers() {
  const t = document.getElementById('usersTable');
  if (!t) return;
  t.innerHTML = `
    <div class="user-row header">
      <div>Usuario</div>
      <div class="col-client">Cliente</div>
      <div class="col-role">Rol</div>
      <div class="col-login">Ãšltimo login</div>
      <div>Estado</div>
      <div></div>
    </div>
    ${portalUsers.map(u => `
      <div class="user-row">
        <div class="user-cell-main">
          <div class="user-avatar-circle" style="background: ${u.color};">${u.initials}</div>
          <div class="user-name-block">
            <div class="user-name">${u.name}</div>
            <div class="user-email">${u.email}</div>
          </div>
        </div>
        <div class="col-client"><span class="user-client-pill">${u.client.emoji} ${u.client.name}</span></div>
        <div class="col-role"><span class="role-badge ${u.role}">${roleLabel(u.role)}</span></div>
        <div class="col-login user-last-login">${u.lastLogin}</div>
        <div><span class="user-status-badge ${u.status}"><span class="dot"></span>${userStatusLabel(u.status)}</span></div>
        <div><button class="user-actions-btn" onclick="alert('Acciones disponibles para ${u.name}:\\n\\nâ€¢ Reenviar invitaciÃ³n\\nâ€¢ Resetear contraseÃ±a\\nâ€¢ Cambiar rol (Owner/Staff/Read-only)\\nâ€¢ ${u.status === 'suspended' ? 'Reactivar cuenta' : 'Suspender acceso'}\\nâ€¢ Eliminar usuario\\nâ€¢ Ver historial de logins')">â‹¯</button></div>
      </div>
    `).join('')}
  `;
}

// ============ INIT ============
renderTeam();
renderCRM();
renderCalendar(); // draws empty shell with current month
renderPosts();    // shows empty state until loadSchedulerPosts() fires
renderInboxFilters();
renderInbox();
renderRecordingFilters();
renderRecordings();
renderDrive();
renderEndpoints();
renderRequests();
renderGlobalIntegrations();
renderClientIntegrations();
renderAgentDropdown();
renderStepper();
renderStepContent();
renderUsers();

// â”€â”€ HEALTH CHECK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadHealth() {
  const HEALTH_TO_AGENT = {
    b2: 'crew', b3: 'estrategia', b5: 'scheduler',
    org: 'organizador', web: 'web', motion: 'motion',
    scraper: 'scraper', seo: 'seo', analytics: 'analytics',
    compositor: 'compositor'
  };
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const labelMap = {
      b2: 'Crew bot', b1: 'Bot 1', org: 'Organizador', b5: 'Scheduler',
      web: 'Web Designer', motion: 'Motion', scraper: 'Scraper',
      seo: 'SEO', analytics: 'Analytics', b3: 'Estrategia'
    };
    // Build status rows HTML (shared by Config panel + Home card)
    const statusRowsHtml = Object.entries(data).map(([k, v]) => {
      const label = labelMap[k] || k;
      const ok = v && v.ok;
      return `<div class="status-row">
        <span class="status-label">${label}</span>
        <span class="status-dot ${ok ? 'dot-green' : 'dot-red'}"></span>
        <span class="status-text" style="color:${ok ? '#4ade80' : '#f87171'}">${ok ? 'Operacional' : 'Offline'}</span>
      </div>`;
    }).join('');

    // Update systemStatusList (Config panel)
    const container = document.getElementById('systemStatusList');
    if (container) container.innerHTML = statusRowsHtml;

    // Update homeSistema (Home card)
    const homeSis = document.getElementById('homeSistema');
    if (homeSis) homeSis.innerHTML = statusRowsHtml;

    // Update kpiAgentes
    const onlineCount = Object.values(data).filter(v => v && v.ok).length;
    const totalCount  = Object.keys(data).length;
    const kpiAg = document.getElementById('kpiAgentes');
    if (kpiAg) kpiAg.textContent = onlineCount;
    const kpiAgTrend = document.getElementById('kpiAgentesTrend');
    if (kpiAgTrend) kpiAgTrend.textContent = onlineCount + ' de ' + totalCount + ' en lÃ­nea';

    // Refresh homeSub now that agentes count is known
    const homeSb = document.getElementById('homeSub');
    if (homeSb && !homeSb.dataset.statsLoaded) {
      const kpiCl = document.getElementById('kpiClientes');
      const clVal = kpiCl ? kpiCl.textContent : '?';
      homeSb.textContent = `Tu agencia tiene ${onlineCount} agentes activos y ${clVal} clientes en marcha.`;
    }
    // Update agent card badges in Equipo section
    Object.entries(data).forEach(([key, v]) => {
      const agentId = HEALTH_TO_AGENT[key];
      if (!agentId) return;
      const el = document.getElementById('agent-status-' + agentId);
      if (!el) return;
      const ok = v && v.ok;
      const status = ok ? 'online' : 'crashing';
      const label  = ok ? 'online' : 'crashing';
      el.className = 'agent-status ' + status;
      el.innerHTML = '<span class="dot"></span>' + label;
      // Keep agents array in sync for chat header
      const agent = agents.find(a => a.id === agentId);
      if (agent) agent.status = status;
    });
  } catch(e) { console.warn('Health check failed:', e.message); }
}
loadHealth();
setInterval(loadHealth, 30000);

// â”€â”€ HOME STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadHomeStats() {
  try {
    const res = await fetch('/api/home-stats');
    const d = await res.json();
    if (!d.ok) return;

    document.getElementById('kpiClientes').textContent = d.clientes;
    document.getElementById('kpiClientesTrend').textContent =
      d.clientes_names.length ? d.clientes_names.join(', ') : 'â€”';

    document.getElementById('kpiLeads').textContent = d.leads_7d;
    document.getElementById('kpiLeadsTrend').textContent = d.leads_total + ' total';

    document.getElementById('kpiRevenue').textContent = '$' + d.revenue_est.toLocaleString();
    document.getElementById('kpiRevenueTrend').textContent =
      d.cerrados + ' cerrado' + (d.cerrados !== 1 ? 's' : '') + ' Ã— $197';

    // homeSub â€” mark as loaded so loadHealth() doesn't overwrite it
    const homeSb = document.getElementById('homeSub');
    if (homeSb) {
      const agEl = document.getElementById('kpiAgentes');
      const agVal = agEl && agEl.textContent !== 'â€”' ? agEl.textContent : '?';
      homeSb.textContent = `Tu agencia tiene ${agVal} agentes activos y ${d.clientes} clientes en marcha.`;
      homeSb.dataset.statsLoaded = '1';
    }

    const qaLeads = document.getElementById('qaLeadsSub');
    if (qaLeads) qaLeads.textContent = d.leads_7d + ' leads esta semana';

    const actEl = document.getElementById('homeActividad');
    if (actEl) {
      if (!d.actividad || !d.actividad.length) {
        actEl.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:12px 0;">Sin actividad reciente.</div>';
      } else {
        actEl.innerHTML = d.actividad.map(a => {
          const ts = a.ts_creado
            ? new Date(a.ts_creado).toLocaleString('es-MX', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
            : '';
          const preview = (a.contenido || '').slice(0, 90);
          const bot = a.bot_destino || a.tipo || 'Bot';
          return `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:18px;">ðŸ¤–</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;color:var(--text);">${bot}</div>
              <div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${preview}</div>
            </div>
            <span style="font-size:11px;color:var(--text-dim);white-space:nowrap;">${ts}</span>
          </div>`;
        }).join('');
      }
    }
  } catch(e) { console.warn('loadHomeStats error:', e.message); }
}
loadHomeStats();

// â”€â”€ GDRIVE LIVE LOAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadDriveFromAPI() {
  const content = document.getElementById('driveContent');
  if (content && !window._driveAPIItems) {
    content.innerHTML = '<div style="padding:32px;color:var(--text-muted);font-size:14px;">Conectando con Google Driveâ€¦</div>';
  }
  try {
    const res = await fetch('/gdrive/listar?tipo=all');
    const data = await res.json();
    if (!data.ok || !data.archivos || !data.archivos.length) { renderDrive(); return; }
    const iconMap = { video: 'ðŸŽ¬', audio: 'ðŸŽµ', image: 'ðŸ–¼ï¸' };
    window._driveAPIItems = data.archivos.map(f => {
      const mime = f.mimeType || '';
      const type = mime.includes('video') ? 'video' : mime.includes('audio') ? 'audio' : mime.includes('image') ? 'image' : 'file';
      const sizeKB = f.size ? Math.round(f.size / 1024) : 0;
      const sizeFmt = sizeKB > 1024 ? (sizeKB/1024).toFixed(1) + ' MB' : sizeKB + ' KB';
      return { type, name: f.name, size: sizeFmt, source: 'Google Drive', date: new Date(f.modifiedTime).toLocaleDateString('es-MX',{month:'short',day:'numeric'}), icon: iconMap[type]||'ðŸ“„', link: f.webViewLink };
    });
    renderDrive();
  } catch(e) { console.warn('GDrive API no disponible, usando datos demo:', e.message); renderDrive(); }
}


// â”€â”€ REFERENCIAS DESDE DRIVE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let refCache = null;
let refPickerCtx = null;   // 'gen' | 'ms'
let refPickerSlot = null;  // 'first_frame' | 'last_frame' | 'ref_images' | 'ref_videos' | 'ref_audios'
let refPickerFilter = null; // 'image' | 'video' | 'audio'

// Slot definitions per context
const REF_SLOTS_DEF = [
  { key: 'first_frame',  label: 'ðŸŽ¯ First Frame',          type: 'image', multi: false, max: 1, color: '#f59e0b' },
  { key: 'last_frame',   label: 'ðŸ Last Frame',           type: 'image', multi: false, max: 1, color: '#10b981' },
  { key: 'ref_images',   label: 'ðŸ–¼ï¸ Imagen de referencia', type: 'image', multi: true,  max: 9, color: 'var(--accent)', tip: 'Recomendado: 3-4 Ã¡ngulos (overhead, 45Â°, frontal, detalle)' },
  { key: 'ref_videos',   label: 'ðŸŽ¬ Video de referencia',  type: 'video', multi: true,  max: 3, color: 'var(--info)',    tip: 'MÃ¡x 3 videos Â· duraciÃ³n total â‰¤ 15 seg' },
  { key: 'ref_audios',   label: 'ðŸŽµ Audio de referencia',  type: 'audio', multi: true,  max: 3, color: '#a78bfa',       tip: 'MÃ¡x 3 audios Â· duraciÃ³n total â‰¤ 15 seg' },
];

// Data: gen and ms each have their own slots
const refSlots = {
  gen: { first_frame: null, last_frame: null, ref_images: [], ref_videos: [], ref_audios: [] },
  ms:  { first_frame: null, last_frame: null, ref_images: [], ref_videos: [], ref_audios: [] },
};

function resetRefSlots(ctx) {
  refSlots[ctx] = { first_frame: null, last_frame: null, ref_images: [], ref_videos: [], ref_audios: [] };
}

function renderRefSlots(ctx) {
  const container = document.getElementById(ctx + '-ref-slots');
  if (!container) return;
  const isMs = ctx === 'ms';
  const mutualNote = `<div style="font-size:10px;color:#f59e0b;padding:4px 0 8px;grid-column:1/-1;">âš ï¸ First/Last Frame y Referencias de imagen son mutuamente exclusivos</div>`;
  const rows = REF_SLOTS_DEF.map((slot, i) => {
    const val = refSlots[ctx][slot.key];
    const files = slot.multi ? (val || []) : (val ? [val] : []);
    const atMax = slot.multi && files.length >= slot.max;
    const chips = files.map(f =>
      `<span style="display:inline-flex;align-items:center;gap:4px;background:${slot.color}18;border:1px solid ${slot.color}50;border-radius:20px;padding:3px 8px;font-size:11px;color:${slot.color}">
        <span style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span>
        <button onclick="removeRefSlot('${ctx}','${slot.key}','${f.id}')" style="background:none;border:none;color:${slot.color};cursor:pointer;font-size:12px;padding:0;line-height:1;">âœ•</button>
      </span>`).join('');
    const counter = slot.multi ? `<span style="font-size:10px;color:${atMax?'#f87171':slot.color+'99'};flex-shrink:0;">${files.length}/${slot.max}</span>` : '';
    const tipHtml = slot.tip ? `<span title="${slot.tip}" style="font-size:10px;color:#6b7280;cursor:help;flex-shrink:0;">â“˜</span>` : '';
    const btnLabel = slot.type === 'image' ? '+ imagen' : slot.type === 'video' ? '+ video' : '+ audio';
    const btn = atMax ? '' : `<button onclick="openRefPicker('${ctx}','${slot.key}','${slot.type}')"
      style="background:${isMs?'#1a1730':'var(--bg-elevated)'};border:${isMs?'.5px solid #2a2540':'1px solid var(--border)'};
      border-radius:8px;padding:4px 10px;font-size:11px;color:${isMs?'#9b8ec4':'var(--text-muted)'};cursor:pointer;white-space:nowrap;flex-shrink:0;">
      ${btnLabel}</button>`;
    const showBtn = slot.multi ? !atMax : !files.length;
    const separator = i === 1 ? mutualNote : '';
    return `${separator}<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid ${isMs?'#1a1730':'var(--border)'};">
      <span style="font-size:12px;font-weight:600;color:${slot.color};min-width:160px;flex-shrink:0;">${slot.label} ${tipHtml}</span>
      <div style="display:flex;flex-wrap:wrap;gap:4px;flex:1;">${chips || `<span style="font-size:11px;color:${isMs?'#7b6fa0':'var(--text-dim)'}">Sin archivo</span>`}</div>
      ${counter}
      ${showBtn ? btn : ''}
    </div>`;
  }).join('');
  container.innerHTML = `<div style="display:flex;flex-direction:column;">${rows}</div>`;
}

async function loadRefFiles() {
  if (refCache) return refCache;
  try {
    const r = await fetch('/gdrive/referencias');
    const d = await r.json();
    const iconFor = m => m.includes('video') ? 'ðŸŽ¬' : m.includes('audio') ? 'ðŸŽµ' : m.includes('image') ? 'ðŸ–¼ï¸' : 'ðŸ“„';
    refCache = (d.archivos || []).map(f => ({
      id: f.id, name: f.name, link: f.webViewLink || f.link || '',
      icon: iconFor(f.mimeType || ''), mime: f.mimeType || ''
    }));
  } catch(e) { refCache = []; }
  return refCache;
}

async function openRefPicker(ctx, slot, filterType) {
  const picker = document.getElementById(ctx + '-ref-picker');
  const list   = document.getElementById(ctx + '-ref-list');
  // Toggle off if same picker open
  if (refPickerCtx === ctx && refPickerSlot === slot && picker.style.display !== 'none') {
    picker.style.display = 'none'; refPickerCtx = null; return;
  }
  refPickerCtx = ctx; refPickerSlot = slot; refPickerFilter = filterType;
  picker.style.display = 'block';
  list.innerHTML = '<div style="color:var(--text-muted);font-size:12px;grid-column:1/-1;">Cargandoâ€¦</div>';
  const allFiles = await loadRefFiles();
  const files = allFiles.filter(f => f.mime.includes(filterType));
  if (!files.length) {
    list.innerHTML = `<div style="color:var(--text-muted);font-size:12px;grid-column:1/-1;">No hay archivos de tipo <b>${filterType}</b> en tu carpeta Referencias de Drive.</div>`;
    return;
  }
  list.innerHTML = files.map(f => {
    const slotData = refSlots[ctx][slot];
    const isSel = Array.isArray(slotData) ? slotData.some(x => x.id === f.id) : slotData?.id === f.id;
    return `<button onclick="selectRefFile('${ctx}','${slot}','${f.id}','${f.name.replace(/'/g,"\\'")}','${f.link}','${f.mime}')"
      id="rpick-${ctx}-${slot}-${f.id}"
      style="display:flex;align-items:center;gap:6px;padding:7px 9px;border-radius:8px;width:100%;text-align:left;
      border:1px solid ${isSel ? 'var(--accent)' : 'var(--border)'};
      background:${isSel ? 'var(--accent-dim)' : 'var(--bg-card)'};
      color:${isSel ? 'var(--accent)' : 'var(--text)'};font-size:12px;cursor:pointer;">
      <span>${f.icon}</span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span>
    </button>`;
  }).join('');
}

function selectRefFile(ctx, slot, id, name, link, mime) {
  const def = REF_SLOTS_DEF.find(s => s.key === slot);
  const file = { id, name, link, mime };
  if (def.multi) {
    const arr = refSlots[ctx][slot] || [];
    const idx = arr.findIndex(f => f.id === id);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      if (arr.length >= def.max) return; // lÃ­mite API
      arr.push(file);
    }
    refSlots[ctx][slot] = arr;
  } else {
    refSlots[ctx][slot] = refSlots[ctx][slot]?.id === id ? null : file;
  }
  renderRefSlots(ctx);
  // re-open picker to refresh selection state
  openRefPicker(ctx, slot, mime.includes('video') ? 'video' : mime.includes('audio') ? 'audio' : 'image');
}

function removeRefSlot(ctx, slot, id) {
  const def = REF_SLOTS_DEF.find(s => s.key === slot);
  if (def.multi) refSlots[ctx][slot] = (refSlots[ctx][slot] || []).filter(f => f.id !== id);
  else refSlots[ctx][slot] = null;
  renderRefSlots(ctx);
}

function buildRefPayload(ctx) {
  const s = refSlots[ctx];
  return {
    first_frame_url:      s.first_frame ? s.first_frame.link : undefined,
    last_frame_url:       s.last_frame  ? s.last_frame.link  : undefined,
    reference_image_urls: s.ref_images.length  ? s.ref_images.map(f => f.link)  : undefined,
    reference_video_urls: s.ref_videos.length  ? s.ref_videos.map(f => f.link)  : undefined,
    reference_audio_urls: s.ref_audios.length  ? s.ref_audios.map(f => f.link)  : undefined,
  };
}

function buildRefText(ctx) {
  const s = refSlots[ctx];
  const lines = [];
  if (s.first_frame)    lines.push(`- First Frame: ${s.first_frame.link}`);
  if (s.last_frame)     lines.push(`- Last Frame: ${s.last_frame.link}`);
  s.ref_images.forEach(f => lines.push(`- Img referencia: ${f.link}`));
  s.ref_videos.forEach(f => lines.push(`- Video referencia: ${f.link}`));
  s.ref_audios.forEach(f => lines.push(`- Audio referencia: ${f.link}`));
  return lines.length ? `\n\nReferencias (Drive):\n${lines.join('\n')}` : '';
}

// â”€â”€ DRIVE GENERAR MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let genType = 'video';

function openDriveGenerar() {
  genType = 'video';
  selectGenType('video');
  document.getElementById('gen-prompt').value = '';
  document.getElementById('gen-result').style.display = 'none';
  document.getElementById('gen-btn').textContent = 'âœ¨ Enviar al Crew â†’';
  document.getElementById('gen-btn').disabled = false;
  resetRefSlots('gen');
  renderRefSlots('gen');
  document.getElementById('gen-ref-picker').style.display = 'none';
  document.getElementById('driveGenerarOverlay').style.display = 'flex';
}

function closeDriveGenerar() {
  document.getElementById('driveGenerarOverlay').style.display = 'none';
}

function selectGenType(type) {
  genType = type;
  ['video','image','audio'].forEach(t => {
    const btn = document.getElementById('gtype-' + t);
    const active = t === type;
    btn.style.border = active ? '2px solid var(--accent)' : '1px solid var(--border)';
    btn.style.background = active ? 'var(--accent-dim)' : 'var(--bg-elevated)';
    btn.style.color = active ? 'var(--accent)' : 'var(--text-muted)';
  });
}

async function pollKieJob(jobId, type) {
  for (let i = 0; i < 48; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const btn = document.getElementById('gen-btn');
    if (btn) btn.textContent = `â³ Procesandoâ€¦ ${Math.round((i+1)*5/60*10)/10} min`;
    try {
      const r = await fetch(`/api/crew/${type}/${jobId}`);
      const d = await r.json();
      const info = d.data || d;
      const status = (info.status || info.task_status || '').toLowerCase();
      if (status === 'completed' || status === 'success') {
        const out = info.output || info;
        return out.imageUrl || out.image_url || out.videoUrl || out.video_url || out.url || '';
      }
      if (status === 'failed' || status === 'error') throw new Error('La generaciÃ³n fallÃ³ en kie.ai');
    } catch(e) {
      if (e.message.includes('fallÃ³')) throw e;
    }
  }
  throw new Error('Timeout: generaciÃ³n tardÃ³ mÃ¡s de 4 minutos');
}

async function submitGenerar() {
  const prompt = document.getElementById('gen-prompt').value.trim();
  if (!prompt) { document.getElementById('gen-prompt').focus(); return; }
  const btn = document.getElementById('gen-btn');
  const result = document.getElementById('gen-result');
  btn.textContent = 'Enviandoâ€¦'; btn.disabled = true;
  result.style.display = 'none';

  try {
    if (genType === 'image') {
      const r = await fetch('/api/crew/imagen', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: prompt, aspect_ratio: '1:1', resolution: '1K' })
      });
      const d = await r.json();
      if (!d.job_id) throw new Error(d.error || 'No job_id recibido');
      result.style.display = 'block'; result.style.color = 'var(--text-muted)';
      result.textContent = `â³ Modelo: ${d.model} â€” generando imagen...`;
      const imageUrl = await pollKieJob(d.job_id, 'imagen');
      result.innerHTML = `<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">âœ… ${d.model} Â· <a href="${imageUrl}" target="_blank" style="color:var(--accent)">Abrir imagen â†’</a></div>
        <img src="${imageUrl}" style="width:100%;border-radius:8px;cursor:pointer;" onclick="window.open('${imageUrl}','_blank')" />`;
      btn.textContent = 'âœ¨ Generar otro'; btn.disabled = false;

    } else if (genType === 'video') {
      const refs = buildRefPayload('gen');
      const r = await fetch('/api/crew/seedance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: prompt, aspect_ratio: '9:16', ...refs })
      });
      const d = await r.json();
      if (!d.job_id) throw new Error(d.error || 'No job_id recibido');
      result.style.display = 'block'; result.style.color = 'var(--text-muted)';
      result.textContent = `â³ Modelo: ${d.model} â€” generando video (~5 min)...`;
      const videoUrl = await pollKieJob(d.job_id, 'seedance');
      result.innerHTML = `<div style="font-size:11px;color:var(--success);margin-bottom:6px;">âœ… Video listo Â· <a href="${videoUrl}" target="_blank" style="color:var(--accent)">Ver video â†’</a></div>
        <video src="${videoUrl}" controls style="width:100%;border-radius:8px;"></video>`;
      btn.textContent = 'âœ¨ Generar otro'; btn.disabled = false;

    } else {
      // audio: via chat por ahora
      const r = await fetch('/api/chat/crew', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `[GENERAR AUDIO] ${prompt}`, agent: 'crew' })
      });
      const d = await r.json();
      result.style.display = 'block'; result.style.color = 'var(--success)';
      result.textContent = 'âœ… ' + (d.response || 'Solicitud de audio enviada al Crew.');
      btn.textContent = 'âœ¨ Enviar al Crew â†’'; btn.disabled = false;
    }
  } catch(e) {
    result.style.display = 'block'; result.style.color = 'var(--danger)';
    result.textContent = 'âŒ Error: ' + e.message;
    btn.textContent = 'âœ¨ Enviar al Crew â†’'; btn.disabled = false;
  }
}

// â”€â”€ MARKETING STUDIO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let msPreset = 'ugc';
let msAspectRatio = '9:16';
let msDuration = '8';
let msAvatarOn = false;
let msAudioOn = true;

function msSelect(el, id) {
  document.querySelectorAll('.ms-preset-card').forEach(c => { c.style.borderColor='#2a2540'; c.style.background='#1a1730'; });
  el.style.borderColor = '#7c5cfc'; el.style.background = '#1e1a3a';
  msPreset = id;
}
function msAR(el, val) {
  document.querySelectorAll('.ms-ar-btn').forEach(b => { b.style.borderColor='#2a2540'; b.style.background='#150f25'; b.style.color='#9b8ec4'; });
  el.style.borderColor = '#7c5cfc'; el.style.background = '#1e1a3a'; el.style.color = '#e8e0ff';
  msAspectRatio = val;
}
function msDur(el, val) {
  document.querySelectorAll('.ms-dur-btn').forEach(b => { b.style.borderColor='#2a2540'; b.style.background='#150f25'; b.style.color='#9b8ec4'; });
  el.style.borderColor = '#7c5cfc'; el.style.background = '#1e1a3a'; el.style.color = '#e8e0ff';
  msDuration = val;
}
function msToggle(type) {
  if (type === 'avatar') {
    msAvatarOn = !msAvatarOn;
    const t = document.getElementById('ms-avatar-toggle');
    const k = document.getElementById('ms-avatar-knob');
    t.style.background = msAvatarOn ? '#7c5cfc' : '#2a2540';
    k.style.left = msAvatarOn ? '14px' : '2px';
    k.style.background = msAvatarOn ? '#fff' : '#7b6fa0';
  } else {
    msAudioOn = !msAudioOn;
    const t = document.getElementById('ms-audio-toggle');
    const k = document.getElementById('ms-audio-knob');
    t.style.background = msAudioOn ? '#7c5cfc' : '#2a2540';
    k.style.left = msAudioOn ? '14px' : '2px';
    k.style.background = msAudioOn ? '#fff' : '#7b6fa0';
  }
}
async function msGenerar() {
  const brief = document.getElementById('ms-brief').value.trim();
  if (!brief) { document.getElementById('ms-status').textContent = 'âš  Escribe un brief primero'; return; }
  document.getElementById('ms-status').textContent = 'â³ Enviando al Crew bot...';
  document.getElementById('ms-output').style.display = 'none';
  document.getElementById('ms-ref-picker').style.display = 'none';
  const refs = buildRefPayload('ms');
  try {
    const r = await fetch('/api/crew/seedance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preset: msPreset, brief, client: currentClient,
        aspect_ratio: msAspectRatio, duration: parseInt(msDuration),
        generate_audio: msAudioOn, use_avatar: msAvatarOn,
        ...refs
      })
    });
    const d = await r.json();
    const out = document.getElementById('ms-output');
    out.textContent = d.prompt || d.message || JSON.stringify(d, null, 2);
    out.style.display = 'block';
    const statusText = d.job_id ? 'âœ“ Job ID: ' + d.job_id : 'âœ“ Completado';
    document.getElementById('ms-status').textContent = statusText;
    // Persist job to Supabase so mobile can see it
    const job = {
      job_id: d.job_id || null, preset: msPreset, brief: brief.slice(0, 120),
      client: currentClient, aspect_ratio: msAspectRatio, duration: msDuration,
      status: d.job_id ? 'processing' : (d.error ? 'error' : 'ok'),
      error: d.error || null, ts: new Date().toISOString()
    };
    fetch('/api/ms/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) })
      .then(() => loadMSJobs()).catch(() => {});
  } catch(e) {
    document.getElementById('ms-status').textContent = 'âš  Error: ' + e.message;
  }
}

async function loadMSJobs() {
  const el = document.getElementById('ms-jobs-list');
  if (!el) return;
  try {
    const r = await fetch('/api/ms/jobs');
    const d = await r.json();
    const jobs = d.jobs || [];
    if (!jobs.length) { el.textContent = 'Sin trabajos aÃºn. Â¡Genera tu primer video!'; return; }
    el.innerHTML = jobs.map(j => {
      const ts = j.ts ? new Date(j.ts).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const statusIcon = j.status === 'processing' ? 'â³' : j.status === 'error' ? 'âŒ' : 'âœ“';
      const statusColor = j.status === 'processing' ? '#a78bfa' : j.status === 'error' ? '#f87171' : '#34d399';
      return `<div style="background:#1a1730;border:.5px solid #2a2540;border-radius:8px;padding:10px 12px;margin-bottom:7px;display:flex;align-items:center;gap:10px">
        <span style="font-size:16px">${{ugc:'ðŸ‘¤',tutorial:'ðŸ“‹',tv_spot:'ðŸ“º',hyper_motion:'âš¡',review:'â­',wild_card:'ðŸƒ'}[j.preset]||'ðŸŽ¬'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:#e8e0ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j.brief || 'â€”'}</div>
          <div style="font-size:10px;color:#7b6fa0;margin-top:2px">${j.preset} Â· ${j.aspect_ratio} Â· ${j.duration}s Â· ${ts}</div>
          ${j.job_id ? `<div style="font-size:10px;color:#7b6fa0;margin-top:1px">ID: ${j.job_id}</div>` : ''}
        </div>
        <span style="color:${statusColor};font-size:13px">${statusIcon}</span>
      </div>`;
    }).join('');
  } catch(e) { el.textContent = 'Error cargando jobs.'; }
}

async function loadInboxFromSupabase() {
  try {
    const r = await fetch(`/api/inbox?client=roberto_agencia&limit=30`);
    const d = await r.json();
    if (!d.ok || !d.items.length) return; // fallback to hardcoded if no real data
    // Replace hardcoded inboxItems with Supabase data
    inboxItems = d.items.map((item, idx) => ({
      id: item.id || idx,
      channel: 'telegram', icon: 'âœˆï¸',
      from: item.bot_destino || 'Agencia AI',
      preview: (item.contenido || '').slice(0, 80),
      time: item.ts_creado ? new Date(item.ts_creado).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'â€”',
      unread: !item.ts_procesado,
      client: 'arranca', tipo: item.tipo, prioridad: item.prioridad
    }));
    renderInbox();
    const unread = inboxItems.filter(i => i.unread).length;
    document.getElementById('tabInboxCount').textContent = unread || '';
    document.getElementById('navInboxCount').textContent = unread || '';
  } catch(e) { /* keep hardcoded fallback */ }
}

// ============ CRM EXPORT ============
function leadsToCSV() {
  const cols = ['Nombre', 'Canal', 'Estado', 'Detalle', 'TelÃ©fono', 'Email'];
  const rows = [cols.join(',')];
  const statusMap = { new: 'Nuevo', contacted: 'Contactado', interested: 'Interesado', closed: 'Cerrado' };
  Object.entries(leads).forEach(([colId, items]) => {
    items.forEach(l => {
      rows.push([
        `"${l.name}"`, `"${l.source}"`, `"${statusMap[colId]}"`,
        `"${l.meta}"`, `"${l.phone || ''}"`, `"${l.email || ''}"`
      ].join(','));
    });
  });
  return rows.join('\n');
}

async function exportLeadsCSV() {
  const csv  = leadsToCSV();
  const blob = new Blob(['ï»¿' + csv], { type: 'text/csv;charset=utf-8;' });
  const name = `leads-${currentClient}-${new Date().toISOString().slice(0,10)}.csv`;
  if (window.showSaveFilePicker) {
    try {
      const fh = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'CSV / Excel', accept: { 'text/csv': ['.csv'] } }]
      });
      const w = await fh.createWritable();
      await w.write(blob); await w.close(); return;
    } catch(e) { if (e.name === 'AbortError') return; }
  }
  // Fallback: auto-descarga directa
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function exportLeadsPDF() {
  const statusMap = { new: 'Nuevo', contacted: 'Contactado', interested: 'Interesado', closed: 'Cerrado' };
  const rows = Object.entries(leads).flatMap(([colId, items]) =>
    items.map(l => `<tr><td>${l.name}</td><td>${l.source}</td><td>${statusMap[colId]}</td><td>${l.meta}</td><td>${l.phone||'-'}</td><td>${l.email||'-'}</td></tr>`)
  ).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Leads Â· ${currentClient}</title>
  <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f1f5f9;text-align:left;padding:8px 12px;border-bottom:2px solid #e2e8f0;font-weight:600}
  td{padding:8px 12px;border-bottom:1px solid #e2e8f0}tr:hover td{background:#f8fafc}@media print{body{padding:16px}}</style></head>
  <body><h1>Leads Â· ${currentClient}</h1><p>Exportado el ${new Date().toLocaleDateString('es-US',{year:'numeric',month:'long',day:'numeric'})}</p>
  <table><thead><tr><th>Nombre</th><th>Canal</th><th>Estado</th><th>Detalle</th><th>TelÃ©fono</th><th>Email</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ============ LEAD MODAL ============
const LEAD_STATUS_LABEL = { new: 'ðŸ†• Nuevo', contacted: 'ðŸ“ž Contactado', interested: 'ðŸ”¥ Interesado', closed: 'âœ… Cerrado' };
const LEAD_CHANNEL_ICON = { Facebook: 'ðŸ“˜', Instagram: 'ðŸ“¸', WhatsApp: 'ðŸ’š', SMS: 'ðŸ’¬', Referido: 'ðŸ¤', Apollo: 'ðŸ”' };

function openLeadModal(colId, idx) {
  const lead = leads[colId][idx];
  if (!lead) return;
  const overlay = document.getElementById('leadModalOverlay');
  overlay.dataset.colId = colId;
  overlay.dataset.idx = idx;
  const statusColor = { new: '#3b82f6', contacted: '#f59e0b', interested: '#8b5cf6', closed: '#10b981' };
  const STATUS_STEPS = [
    { id: 'new',       label: 'Nuevo',      icon: 'ðŸ”µ' },
    { id: 'contacted', label: 'Contactado', icon: 'ðŸŸ¡' },
    { id: 'interested',label: 'Interesado', icon: 'ðŸŸ£' },
    { id: 'closed',    label: 'Cerrado',    icon: 'ðŸŸ¢' },
  ];
  const moveButtons = STATUS_STEPS
    .filter(s => s.id !== colId)
    .map(s => `<button onclick="moveLead('${colId}',${idx},'${s.id}')" style="background:${statusColor[s.id]}18;color:${statusColor[s.id]};border:1px solid ${statusColor[s.id]}40;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;">â†’ ${s.icon} ${s.label}</button>`)
    .join('');
  document.getElementById('leadModalContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${LEAD_CHANNEL_ICON[lead.source] || 'ðŸ‘¤'}</div>
      <div>
        <div style="font-size:18px;font-weight:700;">${lead.name}</div>
        <div style="font-size:13px;color:var(--text-muted);">${lead.source} Â· ${lead.meta}</div>
      </div>
      <span style="margin-left:auto;background:${statusColor[colId]}20;color:${statusColor[colId]};font-size:12px;font-weight:600;padding:4px 10px;border-radius:99px;">${LEAD_STATUS_LABEL[colId]}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      <div style="background:var(--bg-elevated);border-radius:10px;padding:12px;">
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Canal origen</div>
        <div style="font-size:14px;font-weight:500;">${LEAD_CHANNEL_ICON[lead.source] || ''} ${lead.source}</div>
      </div>
      <div style="background:var(--bg-elevated);border-radius:10px;padding:12px;">
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Actividad</div>
        <div style="font-size:14px;font-weight:500;">${lead.meta}</div>
      </div>
      ${lead.phone ? `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">TelÃ©fono</div><div style="font-size:14px;font-weight:500;"><a href="tel:${lead.phone}" style="color:var(--success);text-decoration:none;">${lead.phone}</a></div></div>` : ''}
      ${lead.email ? `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Email</div><div style="font-size:14px;font-weight:500;"><a href="mailto:${lead.email}" style="color:var(--info);text-decoration:none;">${lead.email}</a></div></div>` : ''}
    </div>
    ${lead.notes ? `<div style="background:var(--bg-elevated);border-radius:10px;padding:14px;margin-bottom:16px;"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Notas</div><div style="font-size:14px;line-height:1.6;">${lead.notes}</div></div>` : ''}
    <div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:14px;">
      <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">Mover a etapa</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${moveButtons}</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="openChat('organizador');closeLeadModal()" style="flex:1;min-width:120px;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;">ðŸ’¬ Consultar Organizador</button>
      <button onclick="deleteLead('${colId}',${idx})" style="background:#f8717120;color:var(--danger);border:1px solid #f8717140;border-radius:10px;padding:11px 14px;font-size:13px;cursor:pointer;">ðŸ—‘ Borrar</button>
      <button onclick="closeLeadModal()" style="background:var(--bg-elevated);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:11px 16px;font-size:13px;cursor:pointer;">Cerrar</button>
    </div>`;
  overlay.style.display = 'flex';
}

function moveLead(fromCol, idx, toCol) {
  const lead = leads[fromCol].splice(idx, 1)[0];
  leads[toCol].push(lead);
  closeLeadModal();
  renderCRM();
  openLeadModal(toCol, leads[toCol].length - 1);
}

function deleteLead(colId, idx) {
  const lead = leads[colId][idx];
  if (!confirm(`Â¿Borrar a ${lead.name}? Esta acciÃ³n no se puede deshacer.`)) return;
  leads[colId].splice(idx, 1);
  closeLeadModal();
  renderCRM();
}

function closeLeadModal() {
  document.getElementById('leadModalOverlay').style.display = 'none';
}

// ============ SCHEDULE POST MODAL ============
function openScheduleModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sp-fecha').value = today;
  document.getElementById('sp-hora').value = '10:00';
  document.getElementById('sp-contenido').value = '';
  document.getElementById('sp-error').style.display = 'none';
  document.getElementById('sp-btn').textContent = 'Enviar para aprobaciÃ³n â†’';
  document.getElementById('sp-btn').disabled = false;
  document.getElementById('scheduleModalOverlay').style.display = 'flex';
}

function closeScheduleModal() {
  document.getElementById('scheduleModalOverlay').style.display = 'none';
}

async function submitSchedulePost() {
  const contenido  = document.getElementById('sp-contenido').value.trim();
  const plataforma = document.getElementById('sp-plataforma').value;
  const cliente    = document.getElementById('sp-cliente').value;
  const fecha      = document.getElementById('sp-fecha').value;
  const hora       = document.getElementById('sp-hora').value;
  const errEl      = document.getElementById('sp-error');
  const btn        = document.getElementById('sp-btn');
  if (!contenido) { errEl.textContent = 'El contenido no puede estar vacÃ­o.'; errEl.style.display = 'block'; return; }
  btn.textContent = 'Enviando...'; btn.disabled = true; errEl.style.display = 'none';
  try {
    const r = await fetch('/api/scheduler/post', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido, plataforma, cliente, fecha_publicacion: `${fecha}T${hora}:00` })
    });
    const d = await r.json();
    if (d.status === 'ok' || d.post_id) {
      closeScheduleModal();
      alert('âœ… Post enviado al Scheduler. RecibirÃ¡s aprobaciÃ³n vÃ­a Telegram antes de publicar.');
    } else {
      errEl.textContent = d.error || 'Error del servidor.'; errEl.style.display = 'block';
      btn.textContent = 'Enviar para aprobaciÃ³n â†’'; btn.disabled = false;
    }
  } catch(e) {
    errEl.textContent = 'Error de conexiÃ³n.'; errEl.style.display = 'block';
    btn.textContent = 'Enviar para aprobaciÃ³n â†’'; btn.disabled = false;
  }
}

// â”€â”€ GENERADOR DE BOTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function generarBot() {
  const nombre       = document.getElementById('bg_nombre').value.trim();
  const rol          = document.getElementById('bg_rol').value.trim();
  const canal        = document.getElementById('bg_canal').value;
  const integraciones = document.getElementById('bg_integraciones').value.trim();
  const skills       = document.getElementById('bg_skills').value.trim();
  const cliente      = document.getElementById('bg_cliente').value.trim();
  const statusEl     = document.getElementById('bg_status');

  if (!nombre || !rol) { statusEl.textContent = 'âš  Nombre y rol son obligatorios.'; return; }

  statusEl.textContent = 'â³ Claude estÃ¡ generando el cÃ³digo...';
  document.querySelector('#pane-bots .btn.btn-primary').disabled = true;

  try {
    const res = await fetch('/api/generar-bot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Genera un bot Python completo y listo para Railway con estas especificaciones:

NOMBRE: ${nombre}
ROL: ${rol}
CANAL: ${canal}
INTEGRACIONES: ${integraciones || 'Supabase, Claude API'}
SKILLS: ${skills || 'memoria_clientes'}
CLIENTE: ${cliente || 'generico'}

El bot debe:
- Ser un archivo Python standalone (bot_${nombre.toLowerCase().replace(/\s+/g,'_')}.py)
- Incluir comentarios claros en espaÃ±ol
- Usar las mismas convenciones de la agencia (Flask + python-telegram-bot si es Telegram, etc.)
- Incluir SUPABASE_URL, SUPABASE_SECRET_KEY, ANTHROPIC_API_KEY como variables de entorno
- Incluir funciÃ³n de salud /health
- Incluir sistema de memoria_clientes si aplica
- Ser funcional y deployable inmediatamente en Railway

Genera SOLO el cÃ³digo Python, sin explicaciones adicionales.`
        }]
      })
    });
    const d = await res.json();
    const codigo = d.content?.[0]?.text || d.choices?.[0]?.message?.content || JSON.stringify(d, null, 2);
    const limpio = codigo.replace(/^```python\n?/i, '').replace(/```\s*$/g, '').trim();

    document.getElementById('bg_codigo').textContent = limpio;
    document.getElementById('botGenForm').style.display = 'none';
    document.getElementById('botGenOutput').style.display = 'block';
    statusEl.textContent = '';
  } catch(e) {
    statusEl.textContent = 'âš  Error: ' + e.message;
  }
  document.querySelector('#pane-bots .btn.btn-primary') && (document.querySelector('#pane-bots .btn.btn-primary').disabled = false);
}

function copiarCodigoBot() {
  const code = document.getElementById('bg_codigo').textContent;
  navigator.clipboard.writeText(code).then(() => alert('âœ… CÃ³digo copiado al portapapeles.'));
}

function descargarCodigoBot() {
  const nombre = document.getElementById('bg_nombre')?.value?.trim() || 'bot_nuevo';
  const code   = document.getElementById('bg_codigo').textContent;
  const blob   = new Blob([code], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bot_' + nombre.toLowerCase().replace(/\s+/g,'_') + '.py';
  a.click();
}

// â”€â”€ CHAT MENU ACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function chatClearHistory() {
  closeAllDropdowns();
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  msgs.innerHTML = `<div class="message-group"><div class="message-meta">${activeAgent.name} Â· ahora</div><div class="message bot">${getAgentGreeting(activeAgent)}</div></div>`;
}

function chatExport() {
  closeAllDropdowns();
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const lines = [];
  msgs.querySelectorAll('.message').forEach(m => {
    const isBot = m.classList.contains('bot');
    lines.push((isBot ? activeAgent.name : 'Roberto') + ': ' + m.textContent.trim());
  });
  const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'chat_' + activeAgent.id + '_' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
}

async function chatCallClient() {
  closeAllDropdowns();
  const telefono = prompt('NÃºmero del cliente a llamar:', '+1 714 844 8860');
  if (!telefono) return;
  try {
    const res = await fetch('/api/call/iniciar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: telefono, cliente: currentClient })
    });
    const d = await res.json();
    if (d.ok) alert('ðŸ“ž Llamada iniciada a ' + telefono);
    else alert('Error al iniciar llamada: ' + (d.error || 'desconocido'));
  } catch(e) { alert('Error de conexiÃ³n al iniciar llamada.'); }
}

// â”€â”€ CONFIG CLIENTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SECTOR_EMOJI = {
  'educacion': 'ðŸ“š', 'salud': 'ðŸ’Š', 'restaurante': 'ðŸ½ï¸', 'automotriz': 'ðŸš—',
  'bienes_raices': 'ðŸ ', 'finanzas': 'ðŸ’°', 'legal': 'âš–ï¸', 'belleza': 'ðŸ’…', 'otro': 'ðŸ¢'
};
async function loadConfigClientes() {
  const el = document.getElementById('configClientesList');
  if (!el) return;
  try {
    const res = await fetch('/api/clientes');
    const d = await res.json();
    if (!d.ok || !d.clientes.length) {
      el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:16px 0;">No hay clientes aÃºn. Usa Onboarding para agregar uno.</div>';
      return;
    }
    el.innerHTML = d.clientes.map(c => {
      const emoji = SECTOR_EMOJI[c.industria] || 'ðŸ¢';
      const tags = [c.whatsapp_option, c.tiktok_token ? 'TikTok' : null, c.linkedin_token ? 'LinkedIn' : null,
                    c.youtube_token ? 'YouTube' : null].filter(Boolean);
      return `<div class="client-row">
        <div class="client-icon">${emoji}</div>
        <div class="client-info">
          <div class="client-name">${c.nombre}</div>
          <div class="client-desc">${c.industria || 'â€”'} ${c.precio_producto ? 'Â· $' + c.precio_producto : ''} ${c.email ? 'Â· ' + c.email : ''}</div>
          ${tags.length ? '<div class="client-tags">' + tags.map(t => `<span class="client-tag">${t}</span>`).join('') + '</div>' : ''}
        </div>
        <span class="agent-status online"><span class="dot"></span>activo</span>
      </div>`;
    }).join('');
  } catch(e) { el.innerHTML = '<div style="color:var(--danger);font-size:13px;">Error cargando clientes.</div>'; }
}

// â”€â”€ PORTAL USERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadPortalUsers() {
  const el = document.getElementById('usersTable');
  if (!el) return;
  try {
    const res = await fetch('/api/portal-users');
    const d = await res.json();
    const users = d.ok ? d.users : [];
    const activos   = users.filter(u => u.estado === 'activo').length;
    const pendientes = users.filter(u => u.estado === 'pendiente').length;
    const suspendidos = users.filter(u => u.estado === 'suspendido').length;
    const stats = document.querySelector('#pane-usuarios .users-stats');
    if (stats) stats.innerHTML = `
      <div class="user-stat"><div class="user-stat-icon green">âœ“</div><div><div class="user-stat-value">${activos}</div><div class="user-stat-label">Activos</div></div></div>
      <div class="user-stat"><div class="user-stat-icon amber">ðŸ“§</div><div><div class="user-stat-value">${pendientes}</div><div class="user-stat-label">Invitaciones pendientes</div></div></div>
      <div class="user-stat"><div class="user-stat-icon red">ðŸš«</div><div><div class="user-stat-value">${suspendidos}</div><div class="user-stat-label">Suspendidos</div></div></div>`;
    if (!users.length) { el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:16px 0;">No hay usuarios aÃºn.</div>'; return; }
    el.innerHTML = `<div class="req-row header" style="grid-template-columns:2fr 1fr 1fr 1fr 80px 80px">
      <div>Usuario</div><div>Cliente</div><div>Rol</div><div>Ãšltimo login</div><div>Estado</div><div></div></div>` +
    users.map(u => {
      const initials = (u.nombre || u.email || '?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const loginStr = u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString('es-MX') : 'â€”';
      const estadoColor = u.estado === 'activo' ? 'var(--success)' : u.estado === 'suspendido' ? 'var(--danger)' : 'var(--warning)';
      return `<div class="req-row" style="grid-template-columns:2fr 1fr 1fr 1fr 80px 80px">
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-dim);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--accent)">${initials}</div>
          <div><div style="font-size:13px;font-weight:500">${u.nombre || 'â€”'}</div><div style="font-size:11px;color:var(--text-muted)">${u.email}</div></div>
        </div>
        <div style="font-size:12px">${u.cliente_id || 'â€”'}</div>
        <div><span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--bg-elevated);color:var(--text-muted)">${(u.rol||'staff').toUpperCase()}</span></div>
        <div style="font-size:12px;color:var(--text-muted)">${loginStr}</div>
        <div><span style="font-size:12px;color:${estadoColor}">${u.estado}</span></div>
        <div style="display:flex;gap:6px">
          ${u.estado !== 'suspendido' ? `<button onclick="patchUser('${u.id}','suspendido')" style="font-size:10px;padding:2px 6px;border-radius:4px;background:var(--danger);color:#fff;border:none;cursor:pointer">Suspender</button>` : `<button onclick="patchUser('${u.id}','activo')" style="font-size:10px;padding:2px 6px;border-radius:4px;background:var(--success);color:#000;border:none;cursor:pointer">Activar</button>`}
        </div>
      </div>`;
    }).join('');
  } catch(e) { console.warn('loadPortalUsers:', e.message); }
}

async function patchUser(id, estado) {
  await fetch(`/api/portal-users/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ estado }) });
  loadPortalUsers();
}

async function createUserManual() {
  const nombre = prompt('Nombre completo:');
  if (!nombre) return;
  const email = prompt('Email:');
  if (!email) return;
  const cliente_id = prompt('cliente_id (ej: arranca):');
  const rol = prompt('Rol (owner / staff / read-only):', 'staff');
  await fetch('/api/portal-users/crear', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre, email, cliente_id, rol }) });
  loadPortalUsers();
}

// â”€â”€ RECORDINGS REAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadRecordingsFromAPI() {
  const el = document.getElementById('recordingsList');
  if (!el) return;
  el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:16px 0;">Cargando grabaciones...</div>';
  try {
    const res = await fetch('/api/recordings');
    const d = await res.json();
    if (!d.ok || !d.recordings.length) {
      el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:16px 0;">Sin grabaciones aÃºn. Se activarÃ¡n cuando el voice agent inicie llamadas.</div>';
      return;
    }
    el.innerHTML = d.recordings.map(r => {
      const ts = r.ts_inicio ? new Date(r.ts_inicio * 1000).toLocaleString('es-MX', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'â€”';
      return `<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:20px">ðŸŽ™ï¸</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500">${r.agent || 'Agente'} Â· ${r.cliente || 'â€”'}</div>
          <div style="font-size:11px;color:var(--text-muted)">${ts} Â· ${r.call_status || 'â€”'}</div>
          ${r.recording_url ? `<audio controls src="${r.recording_url}" style="margin-top:6px;width:100%;height:32px"></audio>` : '<div style="font-size:11px;color:var(--text-dim)">GrabaciÃ³n no disponible</div>'}
        </div>
      </div>`;
    }).join('');
  } catch(e) { el.innerHTML = '<div style="color:var(--danger);font-size:13px;">Error cargando grabaciones.</div>'; }
}

// â”€â”€ SCRAPER STATS + LOGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadScraperStats() {
  try {
    const res = await fetch('/api/scraper/stats');
    const d = await res.json();
    if (!d.ok) return;
    const totalEl = document.getElementById('scraperTotal');
    const rateEl  = document.getElementById('scraperRate');
    const msEl    = document.getElementById('scraperMs');
    if (totalEl) totalEl.textContent = d.total;
    if (rateEl)  rateEl.textContent  = d.success_rate + '%';
    if (msEl)    msEl.textContent    = (d.avg_ms / 1000).toFixed(1) + 's';
  } catch(e) { console.warn('loadScraperStats:', e.message); }
}

async function loadScraperLogs() {
  try {
    const res = await fetch('/api/scraper/logs');
    const d = await res.json();
    if (!d.ok) return;
    renderRequests(d.logs);
  } catch(e) { console.warn('loadScraperLogs:', e.message); }
}


