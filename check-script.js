
// ============ DATA ============
const agents = [
  { id: 'organizador', emoji: '🎯', name: 'Organizador', role: 'CEO · Delega y coordina', status: 'online', skills: ['Razona', 'Delega', 'Evalúa', 'Memoria'] },
  { id: 'director', emoji: '🎬', name: 'Director', role: 'Creativo · Copy y guiones', status: 'online', skills: ['Copy', 'Guiones', 'Audio AI'] },
  { id: 'crew', emoji: '🎨', name: 'Crew', role: 'Producción · Video, imagen', status: 'checking', skills: ['Veo 3.1', 'Flux', 'Suno', 'Runway'] },
  { id: 'estrategia', emoji: '📊', name: 'Estrategia', role: 'Marketing · Campañas', status: 'online', skills: ['FB Ads', 'SEO', 'Funnels'] },
  { id: 'scheduler', emoji: '📅', name: 'Scheduler', role: 'Publicación automática', status: 'online', skills: ['Facebook', 'Instagram', 'Auto-post'] },
  { id: 'analytics', emoji: '📈', name: 'Analytics', role: 'Reportes y métricas', status: 'online', skills: ['Reportes', 'Métricas', 'ROAS'] },
  { id: 'compositor', emoji: '🎵', name: 'CompositorBot', role: 'Audio · Scoring', status: 'checking', skills: ['Scoring', 'BPM', 'Mood'] },
  { id: 'scraper', emoji: '🔍', name: 'Scraper', role: 'Research · Competencia', status: 'online', skills: ['Compete', 'Playwright', 'Memoria'] },
  { id: 'seo', emoji: '🏷️', name: 'SEO Strategist', role: 'Keywords · Auditorías', status: 'online', skills: ['Keywords', 'SERP', 'Artículos'] },
  { id: 'web', emoji: '🌐', name: 'Web Designer', role: 'Páginas animadas · FTP', status: 'online', skills: ['GSAP', 'Three.js', 'Hostinger'] },
  { id: 'motion', emoji: '🎞️', name: 'Motion Bot', role: 'Lottie · Remotion · FFmpeg', status: 'online', skills: ['Lottie', 'Remotion', 'FFmpeg'] }
];

const leads = {
  new: [
    { name: 'María González', source: 'Facebook', meta: 'hace 2h · interesada en Turo' },
    { name: 'Carlos Ramírez', source: 'WhatsApp', meta: 'hace 4h · pidió info' },
    { name: 'Ana Torres', source: 'Instagram', meta: 'hace 6h · DM directo' },
    { name: 'Luis Pérez', source: 'Apollo', meta: 'ayer · cold outreach' }
  ],
  contacted: [
    { name: 'Roberto Díaz', source: 'Facebook', meta: 'María llamó · sin respuesta' },
    { name: 'Sofía Mendoza', source: 'Instagram', meta: 'SMS enviado · esperando' },
    { name: 'Jorge Castro', source: 'Referido', meta: 'WhatsApp · leyó' }
  ],
  interested: [
    { name: 'Patricia Ruiz', source: 'Facebook', meta: 'agendó llamada mañana' },
    { name: 'Miguel Ángel', source: 'WhatsApp', meta: 'pidió link de pago' },
    { name: 'Elena Vargas', source: 'Instagram', meta: 'objeción precio · negociando' }
  ],
  closed: [
    { name: 'Daniel Soto', source: 'Facebook', meta: 'pagó $197 · onboarding' },
    { name: 'Laura Núñez', source: 'Referido', meta: 'pagó $197 · módulo 1' }
  ]
};

const inboxItems = [
  { id: 1, channel: 'whatsapp', icon: '💚', from: 'María González', preview: 'Hola, vi tu post de Turo, ¿cómo funciona el curso?', time: '2 min', unread: true, client: 'arranca' },
  { id: 2, channel: 'instagram', icon: '📸', from: 'carlos_ramirez_98', preview: 'DM: Me interesa el curso de $197. ¿Cuándo arranca?', time: '15 min', unread: true, client: 'arranca' },
  { id: 3, channel: 'facebook', icon: '📘', from: 'Ana Torres', preview: 'Comentó en tu video: "Cuánto cuesta el programa?"', time: '1h', unread: true, client: 'arranca' },
  { id: 4, channel: 'sms', icon: '💬', from: '+1 (323) 555-0142', preview: 'Sí, me interesa información sobre el tratamiento GLP-1', time: '2h', unread: false, client: 'sofia' },
  { id: 5, channel: 'email', icon: '📧', from: 'jorge.martinez@gmail.com', preview: 'Recibí tu email, ¿podemos agendar llamada esta semana?', time: '3h', unread: false, client: 'arranca' },
  { id: 6, channel: 'whatsapp', icon: '💚', from: '+1 (213) 555-0198', preview: 'Quiero pagar el curso pero tengo una pregunta antes', time: '5h', unread: false, client: 'arranca' },
  { id: 7, channel: 'instagram', icon: '📸', from: 'patricia_ruiz', preview: 'DM: Gracias por la info, lo voy a pensar', time: 'ayer', unread: false, client: 'arranca' },
  { id: 8, channel: 'facebook', icon: '📘', from: 'Daniel Soto', preview: 'Lead form: nombre, teléfono, email — completado', time: 'ayer', unread: false, client: 'arranca' },
  { id: 9, channel: 'sms', icon: '💬', from: '+1 (818) 555-0234', preview: 'Hola, ¿es la clínica de pérdida de peso?', time: 'ayer', unread: false, client: 'sofia' }
];

const recordings = [
  { date: 'Hoy 14:32', agent: 'maria', phone: '+1 (714) 555-0123', duration: '4:21', transcript: 'Hola, soy María de Arranca Financial. Te llamo porque dejaste tus datos en Facebook…', leadStatus: 'interested', client: 'arranca' },
  { date: 'Hoy 11:18', agent: 'maria', phone: '+1 (323) 555-0089', duration: '2:45', transcript: 'Buenos días, ¿hablo con Carlos? Soy María de Arranca, vi que comentaste en…', leadStatus: 'contacted', client: 'arranca' },
  { date: 'Ayer 17:50', agent: 'sofia', phone: '+1 (213) 555-0142', duration: '6:12', transcript: 'Hola, soy Sofía de la clínica. Te llamo por tu interés en el tratamiento GLP-1…', leadStatus: 'closed', client: 'sofia' },
  { date: 'Ayer 16:23', agent: 'maria', phone: '+1 (818) 555-0234', duration: '3:38', transcript: 'Hola Patricia, soy María de Arranca. Vi que agendaste llamada para hoy…', leadStatus: 'interested', client: 'arranca' },
  { date: 'Ayer 10:05', agent: 'sofia', phone: '+1 (310) 555-0876', duration: '1:52', transcript: 'Hola, soy Sofía, vi que llenaste el formulario sobre el programa de pérdida de peso…', leadStatus: 'contacted', client: 'sofia' },
  { date: 'Lun 15:30', agent: 'maria', phone: '+1 (323) 555-0445', duration: '5:48', transcript: 'Hola, soy María, ¿sigues interesado en el curso? Recuerdo que mencionaste…', leadStatus: 'closed', client: 'arranca' },
  { date: 'Lun 12:14', agent: 'sofia', phone: '+1 (619) 555-0301', duration: '4:02', transcript: 'Buenas tardes, soy Sofía de la clínica. Te llamo para contarte sobre…', leadStatus: 'interested', client: 'sofia' }
];

const driveItems = [
  { type: 'video', name: 'Reel_Turo_3errores_v2.mp4', size: '28 MB', source: 'Crew', date: 'Hoy', icon: '🎬' },
  { type: 'video', name: 'Testimonio_Daniel_Module1.mp4', size: '64 MB', source: 'Crew', date: 'Hoy', icon: '🎥' },
  { type: 'image', name: 'Hero_Arranca_Landing.png', size: '1.8 MB', source: 'Crew (Flux)', date: 'Hoy', icon: '🖼️' },
  { type: 'audio', name: 'Score_Cinematic_Drama.mp3', size: '4.2 MB', source: 'CompositorBot', date: 'Hoy', icon: '🎵' },
  { type: 'video', name: 'Carrusel_Crédito_USA.mp4', size: '15 MB', source: 'Motion Bot', date: 'Ayer', icon: '🎞️' },
  { type: 'audio', name: 'BGM_Hipnotic_Sales.mp3', size: '3.8 MB', source: 'Suno AI', date: 'Ayer', icon: '🎶' },
  { type: 'image', name: 'Avatar_Marco_LUMINAE.png', size: '2.4 MB', source: 'HeyGen', date: 'Ayer', icon: '👤' },
  { type: 'image', name: 'Carousel_FB_Slide1.png', size: '1.1 MB', source: 'Crew', date: 'Ayer', icon: '🖼️' },
  { type: 'audio', name: 'VoiceOver_VSL_Module2.mp3', size: '2.1 MB', source: 'ElevenLabs', date: 'Lun', icon: '🎙️' },
  { type: 'image', name: 'Cinematic_Lighting_v3.png', size: '3.2 MB', source: 'Higgsfield', date: 'Lun', icon: '✨' },
  { type: 'video', name: 'Promo_Curso_$197_60s.mp4', size: '42 MB', source: 'Crew', date: 'Lun', icon: '📹' },
  { type: 'image', name: 'Producto_Sofia_Clinic.png', size: '2.7 MB', source: 'Crew', date: 'Sáb', icon: '💊' }
];

const playwrightEndpoints = [
  { method: 'POST', path: '/scrape', desc: 'Extrae texto completo de cualquier URL · Playwright primero, BS4 fallback', users: ['Organizador', 'Estratega'] },
  { method: 'POST', path: '/screenshot', desc: 'Captura screenshot de una página · devuelve imagen base64', users: ['Director', 'Web'] },
  { method: 'POST', path: '/search', desc: 'Búsqueda web headless · resultados estructurados con contexto', users: ['Analytics', 'Scraper'] }
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
  { name: 'Railway', icon: '🚂', status: 'connected', meta: 'Hosting de los bots' },
  { name: 'Supabase', icon: '💾', status: 'connected', meta: 'ydggwvpndcazmyvsdbec' },
  { name: 'Claude API', icon: '🧠', status: 'connected', meta: 'Cerebro de los agentes' },
  { name: 'Telegram (Bot personal)', icon: '✈️', status: 'connected', meta: 'Comandos de la agencia' },
  { name: 'Higgsfield AI', icon: '🎬', status: 'connected', meta: 'Generación de video' },
  { name: 'kie.ai', icon: '⚡', status: 'connected', meta: 'Video + música AI' },
  { name: 'Apollo.io', icon: '📊', status: 'pending', meta: 'Prospecting' },
  { name: 'Suno AI', icon: '🎵', status: 'pending', meta: 'Música generativa' },
  { name: 'HyperFrames', icon: '🎞️', status: 'disconnected', meta: 'Frames cinematográficos' }
];

const clientIntegrations = {
  arranca: [
    { name: 'Twilio (María)', icon: '📞', status: 'connected', meta: '+1 714 844 8860' },
    { name: 'Facebook + Instagram', icon: '📘', status: 'connected', meta: 'act_2622567464589584' },
    { name: 'WhatsApp Business', icon: '💚', status: 'pending', meta: 'Verificando +1 657-707-4672' },
    { name: 'Stripe', icon: '💳', status: 'connected', meta: 'Curso $197' },
    { name: 'HeyGen', icon: '🎭', status: 'connected', meta: 'Avatares para curso' },
    { name: 'Hostinger FTP', icon: '🌐', status: 'connected', meta: 'arrancafinancial.com' },
    { name: 'Gmail / SendGrid', icon: '📧', status: 'pending', meta: 'Recepción de leads' },
    { name: 'Google Calendar', icon: '📅', status: 'disconnected', meta: 'Para agendar' },
    { name: 'YouTube', icon: '▶️', status: 'disconnected', meta: 'Canal de Arranca' },
    { name: 'Google Ads', icon: '📊', status: 'disconnected', meta: 'Ads de Arranca' }
  ],
  sofia: [
    { name: 'Twilio (Sofía)', icon: '📞', status: 'connected', meta: '+1 213 669 4427' },
    { name: 'A2P 10DLC', icon: '📜', status: 'pending', meta: 'Registro SMS USA' },
    { name: 'Facebook + Instagram', icon: '📘', status: 'pending', meta: 'Por configurar' },
    { name: 'WhatsApp Business', icon: '💚', status: 'disconnected', meta: 'Por configurar' },
    { name: 'Stripe', icon: '💳', status: 'disconnected', meta: 'Pagos clínica GLP-1' },
    { name: 'Google Calendar', icon: '📅', status: 'disconnected', meta: 'Citas con la clínica' },
    { name: 'Gmail / SendGrid', icon: '📧', status: 'disconnected', meta: 'Bandeja de la clínica' }
  ]
};

const posts = [
  { thumb: '📘', title: 'Cómo los hispanos están ganando $2,000/mes con Turo', channels: ['📘', '📸'], status: 'scheduled', meta: 'Hoy · 14:00' },
  { thumb: '📸', title: 'Reel: 3 errores al rentar tu carro en EE.UU.', channels: ['📸'], status: 'scheduled', meta: 'Hoy · 18:30' },
  { thumb: '📘', title: 'Testimonio: Daniel pasó de $0 a $1,400 en 30 días', channels: ['📘', '📸'], status: 'draft', meta: 'Mañana · 10:00' },
  { thumb: '📸', title: 'Carrusel: Cómo construir crédito en EE.UU.', channels: ['📸'], status: 'scheduled', meta: 'Mié · 12:00' },
  { thumb: '📘', title: 'Live: Sesión Q&A con la comunidad', channels: ['📘'], status: 'draft', meta: 'Vie · 19:00' }
];

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
  if (name === 'drive') loadDriveFromAPI();
  if (name === 'marketing') loadMSJobs();
  if (name === 'inbox') loadInboxFromSupabase();
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
  msgs.innerHTML = `<div class="message-group"><div class="message-meta">${a.name} · ahora</div><div class="message bot">${getAgentGreeting(a)}</div></div>`;
  goSection('chat');
}

function getAgentGreeting(a) {
  const g = {
    organizador: 'Hola Roberto. Soy el Organizador. Tienes 12 leads esta semana y 3 tareas del Crew pendientes. ¿Qué arrancamos?',
    director: 'Listo para guiones, copy y dirección musical. ¿Qué necesitas escribir?',
    crew: 'Crew aquí. Estoy crasheando ahora mismo — chécame el último commit en Railway.',
    estrategia: 'Estrategia online. Campañas, SEO, funnels — ¿qué movemos hoy?',
    scheduler: 'Scheduler listo. 5 posts programados esta semana.',
    analytics: 'Analytics aquí. ¿Reporte semanal de Arranca o Sofía?',
    compositor: 'CompositorBot — chequeando. Listo para scoring.',
    scraper: 'Scraper online. ¿Qué competidor analizamos?',
    seo: 'SEO Strategist. Dame keyword o URL y te audito.',
    web: 'Web Designer aquí. Listo para landing pages + FTP a Hostinger.',
    motion: 'Motion Bot. Lottie, Remotion o FFmpeg — ¿qué animamos?'
  };
  return g[a.id] || 'Hola Roberto. ¿En qué te ayudo?';
}

function renderAgentDropdown() {
  document.getElementById('agentDropdown').innerHTML = agents.map(a => `
    <button class="dropdown-item ${a.id === activeAgent.id ? 'active' : ''}" onclick="event.stopPropagation(); openChat('${a.id}'); closeAllDropdowns();">
      <div class="agent-emoji" style="width: 28px; height: 28px; font-size: 14px;">${a.emoji}</div>
      <div><div style="font-weight: 600; font-size: 13px;">${a.name}</div><div style="font-size: 11px; color: var(--text-muted);">${a.role}</div></div>
      <span class="check">✓</span>
    </button>
  `).join('');
}

// ============ CRM ============
function renderCRM() {
  const cols = [
    { id: 'new', label: '🆕 Nuevo', items: leads.new },
    { id: 'contacted', label: '📞 Contactado', items: leads.contacted },
    { id: 'interested', label: '🔥 Interesado', items: leads.interested },
    { id: 'closed', label: '✅ Cerrado', items: leads.closed }
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
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  let html = days.map(d => `<div class="cal-day-name">${d}</div>`).join('');
  const startOffset = 5, daysInMonth = 31, today = 4;
  const postDays = [4, 5, 6, 8, 11, 14, 18, 22, 27];
  for (let i = 0; i < startOffset; i++) html += `<div class="cal-day dim"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const cls = ['cal-day'];
    if (d === today) cls.push('today', 'selected');
    if (postDays.includes(d)) cls.push('has-post');
    html += `<div class="${cls.join(' ')}">${d}</div>`;
  }
  grid.innerHTML = html;
}

function renderPosts() {
  document.getElementById('postsPanel').innerHTML = `
    <div style="font-size: 13px; font-weight: 600; padding: 4px 4px 0; color: var(--text-muted);">Posts próximos · ${posts.length}</div>
    ${posts.map(p => `
      <div class="post-item">
        <div class="post-thumb">${p.thumb}</div>
        <div class="post-content">
          <div class="post-channels">${p.channels.map(c => `<span class="post-channel">${c}</span>`).join('')}</div>
          <div class="post-title">${p.title}</div>
          <div class="post-meta"><span>${p.meta}</span></div>
        </div>
        <span class="post-status ${p.status}">${p.status === 'scheduled' ? 'Programado' : p.status === 'draft' ? 'Borrador' : 'Publicado'}</span>
      </div>
    `).join('')}
  `;
}

// ============ INBOX ============
function renderInboxFilters() {
  const filters = [
    { id: 'all', label: 'Todos', count: inboxItems.length },
    { id: 'unread', label: 'Sin leer', count: inboxItems.filter(i => i.unread).length },
    { id: 'whatsapp', label: '💚 WhatsApp', count: inboxItems.filter(i => i.channel === 'whatsapp').length },
    { id: 'instagram', label: '📸 Instagram', count: inboxItems.filter(i => i.channel === 'instagram').length },
    { id: 'facebook', label: '📘 Facebook', count: inboxItems.filter(i => i.channel === 'facebook').length },
    { id: 'sms', label: '💬 SMS', count: inboxItems.filter(i => i.channel === 'sms').length },
    { id: 'email', label: '📧 Email', count: inboxItems.filter(i => i.channel === 'email').length }
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
    <button class="inbox-item ${i.unread ? 'unread' : ''}" onclick="alert('Abriendo conversación con ${i.from}...')">
      <div class="inbox-channel-icon">${i.icon}</div>
      <div class="inbox-content">
        <div class="inbox-top">
          <div class="inbox-from">${i.from}</div>
          <div class="inbox-time">${i.time}</div>
        </div>
        <div class="inbox-preview">${i.preview}</div>
        <div class="inbox-tags">
          <span class="inbox-tag client">${i.client === 'arranca' ? '💰 Arranca' : '💊 Sofía'}</span>
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
    { id: 'maria', label: '🎯 María (Arranca)', count: recordings.filter(r => r.agent === 'maria').length },
    { id: 'sofia', label: '💊 Sofía (clínica)', count: recordings.filter(r => r.agent === 'sofia').length },
    { id: 'closed', label: '✅ Cerrados', count: recordings.filter(r => r.leadStatus === 'closed').length }
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
  const statusLabel = { closed: '✅ Cerrado', interested: '🔥 Interesado', contacted: '📞 Contactado' };
  document.getElementById('recordingsTable').innerHTML = `
    <div class="rec-row header">
      <div>Fecha</div><div>Agente</div><div>Teléfono</div><div>Duración</div><div class="rec-col-trans">Transcript</div><div class="rec-col-status">Estado</div><div class="rec-col-play">Audio</div>
    </div>
    ${items.map(r => `
      <div class="rec-row">
        <div>${r.date}</div>
        <div><span class="rec-agent ${r.agent}">${r.agent === 'maria' ? '🎯 María' : '💊 Sofía'}</span></div>
        <div class="rec-phone">${r.phone}</div>
        <div class="rec-duration">${r.duration}</div>
        <div class="rec-transcript rec-col-trans" title="${r.transcript}">${r.transcript}</div>
        <div class="rec-col-status"><span class="rec-status-pill ${r.leadStatus}">${statusLabel[r.leadStatus]}</span></div>
        <div class="rec-col-play"><button class="rec-play" onclick="alert('Reproduciendo grabación de ${r.date}...')">▶</button></div>
      </div>
    `).join('')}
  `;
}

// ============ DRIVE ============
function renderDriveFilters() {
  const filters = [
    { id: 'all', label: '📁 Todos', count: driveItems.length },
    { id: 'video', label: '🎬 Videos', count: driveItems.filter(d => d.type === 'video').length },
    { id: 'audio', label: '🎵 Audios', count: driveItems.filter(d => d.type === 'audio').length },
    { id: 'image', label: '🖼️ Imágenes', count: driveItems.filter(d => d.type === 'image').length }
  ];
  document.getElementById('driveFilters').innerHTML = filters.map(f => `
    <button class="filter-pill ${f.id === driveFilter ? 'active' : ''}" onclick="setDriveFilter('${f.id}')">${f.label} <span style="opacity:0.6;margin-left:4px;">${f.count}</span></button>
  `).join('');
}

function setDriveFilter(id) { driveFilter = id; renderDriveFilters(); renderDrive(); }

function renderDrive() {
  let items = window._driveAPIItems || driveItems;
  if (driveFilter !== 'all') items = items.filter(d => d.type === driveFilter);
  document.getElementById('driveGrid').innerHTML = items.map(d => `
    <button class="drive-card" onclick="alert('Abriendo ${d.name}...')">
      <div class="drive-thumb ${d.type}">
        ${d.icon}
        <span class="drive-type-badge">${d.type}</span>
      </div>
      <div class="drive-info">
        <div class="drive-name" title="${d.name}">${d.name}</div>
        <div class="drive-meta"><span>${d.date}</span><span>${d.size}</span></div>
        <div class="drive-source">${d.source}</div>
      </div>
    </button>
  `).join('');
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

function renderRequests() {
  document.getElementById('requestsTable').innerHTML = `
    <div class="req-row header">
      <div>Hora</div><div>Endpoint</div><div>Target</div><div>Status</div><div class="req-col-ms">ms</div><div class="req-col-bot">Bot</div>
    </div>
    ${playwrightRequests.map(r => `
      <div class="req-row">
        <div class="req-time">${r.time}</div>
        <div class="req-endpoint">${r.endpoint}</div>
        <div class="req-target" title="${r.target}">${r.target}</div>
        <div><span class="req-status ${r.status === 200 ? 'ok' : 'err'}">${r.status}</span></div>
        <div class="req-ms req-col-ms">${r.ms}</div>
        <div class="req-col-bot"><span class="req-bot">${r.bot}</span></div>
      </div>
    `).join('')}
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
      ${i.status !== 'connected' ? `<button class="integration-action">${i.status === 'pending' ? 'Continuar →' : 'Conectar →'}</button>` : ''}
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
  msgs.innerHTML += `<div class="message-group user"><div class="message-meta" style="text-align:right">Tú · ahora</div><div class="message user">${escapeHtml(text)}</div></div>`;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  msgs.scrollTop = msgs.scrollHeight;

  // Loading indicator
  const loadId = 'load-' + Date.now();
  msgs.innerHTML += `<div class="message-group" id="${loadId}"><div class="message-meta">${activeAgent.name} · ahora</div><div class="message bot" style="opacity:.5">⏳ Pensando...</div></div>`;
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
    document.getElementById(loadId).querySelector('.message').textContent = '⚠ Sin respuesta del agente (' + e.message + ')';
    document.getElementById(loadId).querySelector('.message').style.opacity = '1';
  });
}

function sendQuick(text) { chatInput.value = text; sendMessage(); }

function simulateReply(text) {
  const t = text.toLowerCase();
  if (t.includes('estado') || t.includes('proyecto')) return 'Arranca: 12 leads, 2 cerrados ($394). Sofía: agente de voz activo. Crew: crasheando.';
  if (t.includes('reporte')) return 'Generando reporte semanal... Te lo mando en PDF y al Telegram.';
  if (t.includes('campaña')) return '¿Para qué cliente? Dame brief: objetivo, presupuesto, canales y deadline.';
  if (t.includes('lead')) return 'Hoy: 3 leads nuevos. María llamó a 2 — uno sin respuesta.';
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
  { id: 1, label: 'Info' }, { id: 2, label: 'Canales' }, { id: 3, label: 'Campaña' },
  { id: 4, label: 'Agentes' }, { id: 5, label: 'Conexiones' }, { id: 6, label: 'Listo' }
];
let currentStep = 1;
const onboardingData = { channels: [], agents: [], integrations: [] };

function renderStepper() {
  const s = document.getElementById('stepper');
  s.innerHTML = onboardingSteps.map((step, i) => {
    const cls = step.id === currentStep ? 'active' : step.id < currentStep ? 'done' : '';
    const connector = i < onboardingSteps.length - 1 ? '<div class="step-connector"></div>' : '';
    return `<button class="step-pill ${cls}" onclick="goStep(${step.id})"><span class="step-num">${step.id < currentStep ? '✓' : step.id}</span><span>${step.label}</span></button>${connector}`;
  }).join('');
  document.getElementById('stepLabel').textContent = `Paso ${currentStep} de ${onboardingSteps.length}`;
  document.getElementById('prevBtn').style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  document.getElementById('nextBtn').textContent = currentStep === onboardingSteps.length ? '🚀 Lanzar cliente' : 'Siguiente →';
}

function renderStepContent() {
  const c = document.getElementById('onboardingStep');
  if (currentStep === 1) c.innerHTML = `
    <div class="step-title">📋 Información del cliente</div>
    <div class="step-desc">Lo básico para arrancar.</div>
    <div class="field-group"><label class="field-label">Nombre del cliente</label><input class="field-input" placeholder="Ej: Arranca Financial" /></div>
    <div class="field-group"><label class="field-label">Sector</label><select class="field-select"><option>Educación financiera</option><option>Clínica médica</option><option>E-commerce</option><option>Servicios profesionales</option><option>Otro</option></select></div>
    <div class="field-group"><label class="field-label">Descripción / pitch</label><textarea class="field-textarea" placeholder="¿Qué hace el cliente?"></textarea></div>`;
  if (currentStep === 2) c.innerHTML = `
    <div class="step-title">📡 Canales de operación</div>
    <div class="step-desc">¿Dónde habla con leads?</div>
    <div class="choice-grid">${['Llamadas','SMS','WhatsApp','Email','Facebook','Instagram','Telegram','Web Chat'].map(ch => `<button class="choice" onclick="toggleChoice(this,'channel','${ch}')"><span class="choice-icon">${({Llamadas:'📞',SMS:'💬',WhatsApp:'💚',Email:'📧',Facebook:'📘',Instagram:'📸',Telegram:'✈️','Web Chat':'🌐'})[ch]}</span><span class="choice-label">${ch}</span></button>`).join('')}</div>`;
  if (currentStep === 3) c.innerHTML = `
    <div class="step-title">🎯 Primera campaña</div>
    <div class="step-desc">El primer objetivo del cliente.</div>
    <div class="field-group"><label class="field-label">Objetivo principal</label><select class="field-select"><option>Generar leads</option><option>Vender producto / curso</option><option>Agendar citas</option><option>Hacer follow-up</option></select></div>
    <div class="field-group"><label class="field-label">Presupuesto mensual</label><input class="field-input" placeholder="$500" /></div>
    <div class="field-group"><label class="field-label">Mensaje principal</label><textarea class="field-textarea" placeholder="Ej: Curso $197 para Turo"></textarea></div>`;
  if (currentStep === 4) c.innerHTML = `
    <div class="step-title">🤖 Agentes asignados</div>
    <div class="step-desc">Selecciona los agentes que trabajan con este cliente.</div>
    <div class="choice-grid">${agents.map(a => `<button class="choice" onclick="toggleChoice(this,'agent','${a.id}')"><span class="choice-icon">${a.emoji}</span><span class="choice-label">${a.name}</span></button>`).join('')}</div>`;
  if (currentStep === 5) c.innerHTML = `
    <div class="step-title">🔌 Conexiones del cliente</div>
    <div class="step-desc">Estas son <strong>por cliente</strong>, cada uno con sus credenciales.</div>
    <div class="choice-grid">${['Twilio','Stripe','Facebook Ads','WhatsApp Business','Gmail/SendGrid','Google Calendar','YouTube','HeyGen'].map(int => `<button class="choice" onclick="toggleChoice(this,'integration','${int}')"><span class="choice-icon">🔌</span><span class="choice-label">${int}</span></button>`).join('')}</div>
    <div class="field-hint" style="margin-top:16px;">⚠️ Las credenciales se configuran después en Config → Integraciones</div>`;
  if (currentStep === 6) c.innerHTML = `
    <div class="step-title">✅ Todo listo</div>
    <div class="step-desc">Revisa el resumen y lanza.</div>
    <div class="summary-grid">
      <div class="summary-row"><span class="key">Cliente</span><span class="val">Por configurar</span></div>
      <div class="summary-row"><span class="key">Canales</span><span class="val">${onboardingData.channels.length || '—'}</span></div>
      <div class="summary-row"><span class="key">Agentes asignados</span><span class="val">${onboardingData.agents.length || '—'}</span></div>
      <div class="summary-row"><span class="key">Integraciones</span><span class="val">${onboardingData.integrations.length || '—'}</span></div>
      <div class="summary-row"><span class="key">Estado</span><span class="val" style="color:var(--success);">● Listo para lanzar</span></div>
    </div>`;
}

function toggleChoice(el, type, value) {
  el.classList.toggle('selected');
  const key = type === 'channel' ? 'channels' : type === 'agent' ? 'agents' : 'integrations';
  const idx = onboardingData[key].indexOf(value);
  if (idx > -1) onboardingData[key].splice(idx, 1); else onboardingData[key].push(value);
}
function goStep(n) { currentStep = n; renderStepper(); renderStepContent(); }
function nextStep() { if (currentStep < onboardingSteps.length) { currentStep++; renderStepper(); renderStepContent(); } else { alert('🚀 Cliente lanzado.'); resetOnboarding(); } }
function prevStep() { if (currentStep > 1) { currentStep--; renderStepper(); renderStepContent(); } }
function resetOnboarding() { currentStep = 1; onboardingData.channels = []; onboardingData.agents = []; onboardingData.integrations = []; renderStepper(); renderStepContent(); }

// ============ USERS / ACCESS ============
const portalUsers = [
  { name: 'Roberto González', email: 'roberto@rg-production.com', client: { name: 'Arranca Financial', emoji: '💰' }, role: 'owner', lastLogin: 'hace 2 min', status: 'active', initials: 'RG', color: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Dra. Ana Ramírez', email: 'ana@clinicaramirez.com', client: { name: 'Clínica Ramírez', emoji: '💊' }, role: 'owner', lastLogin: 'hace 1 hora', status: 'active', initials: 'AR', color: 'linear-gradient(135deg, #10b981, #047857)' },
  { name: 'María López', email: 'maria@clinicaramirez.com', client: { name: 'Clínica Ramírez', emoji: '💊' }, role: 'staff', lastLogin: 'hace 3 horas', status: 'active', initials: 'ML', color: 'linear-gradient(135deg, #3b82f6, #1e40af)' },
  { name: 'Carlos Méndez', email: 'carlos@clinicaramirez.com', client: { name: 'Clínica Ramírez', emoji: '💊' }, role: 'staff', lastLogin: '—', status: 'pending', initials: 'CM', color: 'linear-gradient(135deg, #a78bfa, #6d28d9)' },
  { name: 'Patricia Núñez', email: 'patricia@dentalsmile.com', client: { name: 'Dental Smile', emoji: '🦷' }, role: 'owner', lastLogin: '—', status: 'pending', initials: 'PN', color: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { name: 'Jorge Suárez', email: 'jorge@oldclient.com', client: { name: 'Arranca Financial', emoji: '💰' }, role: 'readonly', lastLogin: 'hace 30 días', status: 'suspended', initials: 'JS', color: 'linear-gradient(135deg, #6b7280, #374151)' }
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
      <div class="col-login">Último login</div>
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
        <div><button class="user-actions-btn" onclick="alert('Acciones disponibles para ${u.name}:\\n\\n• Reenviar invitación\\n• Resetear contraseña\\n• Cambiar rol (Owner/Staff/Read-only)\\n• ${u.status === 'suspended' ? 'Reactivar cuenta' : 'Suspender acceso'}\\n• Eliminar usuario\\n• Ver historial de logins')">⋯</button></div>
      </div>
    `).join('')}
  `;
}

// ============ INIT ============
renderTeam();
renderCRM();
renderCalendar();
renderPosts();
renderInboxFilters();
renderInbox();
renderRecordingFilters();
renderRecordings();
renderDriveFilters();
renderDrive();
renderEndpoints();
renderRequests();
renderGlobalIntegrations();
renderClientIntegrations();
renderAgentDropdown();
renderStepper();
renderStepContent();
renderUsers();

// ── HEALTH CHECK ──────────────────────────────────────────────────
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
    // Update systemStatusList (Config panel)
    const container = document.getElementById('systemStatusList');
    if (container) {
      container.innerHTML = Object.entries(data).map(([k, v]) => {
        const label = labelMap[k] || k;
        const ok = v && v.ok;
        return `<div class="status-row">
          <span class="status-label">${label}</span>
          <span class="status-dot ${ok ? 'dot-green' : 'dot-red'}"></span>
          <span class="status-text" style="color:${ok ? '#4ade80' : '#f87171'}">${ok ? 'Operacional' : 'Offline'}</span>
        </div>`;
      }).join('');
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


// ── GDRIVE LIVE LOAD ──────────────────────────────────────────────
async function loadDriveFromAPI() {
  try {
    const tipo = driveFilter === 'all' ? 'all' : driveFilter;
    const res = await fetch('/gdrive/listar?tipo=' + tipo);
    const data = await res.json();
    if (!data.ok || !data.archivos.length) return; // fallback to static data
    const iconMap = { video: '🎬', audio: '🎵', image: '🖼️' };
    window._driveAPIItems = data.archivos.map(f => {
      const mime = f.mimeType || '';
      const type = mime.includes('video') ? 'video' : mime.includes('audio') ? 'audio' : mime.includes('image') ? 'image' : 'file';
      const sizeKB = f.size ? Math.round(f.size / 1024) : 0;
      const sizeFmt = sizeKB > 1024 ? (sizeKB/1024).toFixed(1) + ' MB' : sizeKB + ' KB';
      return { type, name: f.name, size: sizeFmt, source: 'Drive', date: new Date(f.modifiedTime).toLocaleDateString('es-MX',{month:'short',day:'numeric'}), icon: iconMap[type]||'📄', link: f.webViewLink };
    });
    renderDrive();
  } catch(e) { console.warn('GDrive API failed, using static data:', e.message); }
}


// ── MARKETING STUDIO ──────────────────────────────────────────────
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
  if (!brief) { document.getElementById('ms-status').textContent = '⚠ Escribe un brief primero'; return; }
  document.getElementById('ms-status').textContent = '⏳ Enviando al Crew bot...';
  document.getElementById('ms-output').style.display = 'none';
  try {
    const r = await fetch('/api/crew/seedance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preset: msPreset, brief, client: currentClient,
        aspect_ratio: msAspectRatio, duration: msDuration,
        generate_audio: msAudioOn, use_avatar: msAvatarOn
      })
    });
    const d = await r.json();
    const out = document.getElementById('ms-output');
    out.textContent = d.prompt || d.message || JSON.stringify(d, null, 2);
    out.style.display = 'block';
    const statusText = d.job_id ? '✓ Job ID: ' + d.job_id : '✓ Completado';
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
    document.getElementById('ms-status').textContent = '⚠ Error: ' + e.message;
  }
}

async function loadMSJobs() {
  const el = document.getElementById('ms-jobs-list');
  if (!el) return;
  try {
    const r = await fetch('/api/ms/jobs');
    const d = await r.json();
    const jobs = d.jobs || [];
    if (!jobs.length) { el.textContent = 'Sin trabajos aún. ¡Genera tu primer video!'; return; }
    el.innerHTML = jobs.map(j => {
      const ts = j.ts ? new Date(j.ts).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const statusIcon = j.status === 'processing' ? '⏳' : j.status === 'error' ? '❌' : '✓';
      const statusColor = j.status === 'processing' ? '#a78bfa' : j.status === 'error' ? '#f87171' : '#34d399';
      return `<div style="background:#1a1730;border:.5px solid #2a2540;border-radius:8px;padding:10px 12px;margin-bottom:7px;display:flex;align-items:center;gap:10px">
        <span style="font-size:16px">${{ugc:'👤',tutorial:'📋',tv_spot:'📺',hyper_motion:'⚡',review:'⭐',wild_card:'🃏'}[j.preset]||'🎬'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:#e8e0ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j.brief || '—'}</div>
          <div style="font-size:10px;color:#7b6fa0;margin-top:2px">${j.preset} · ${j.aspect_ratio} · ${j.duration}s · ${ts}</div>
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
      channel: 'telegram', icon: '✈️',
      from: item.bot_destino || 'Agencia AI',
      preview: (item.contenido || '').slice(0, 80),
      time: item.ts_creado ? new Date(item.ts_creado).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
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
  const cols = ['Nombre', 'Canal', 'Estado', 'Detalle', 'Teléfono', 'Email'];
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
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
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
  win.document.write(`<!DOCTYPE html><html><head><title>Leads · ${currentClient}</title>
  <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f1f5f9;text-align:left;padding:8px 12px;border-bottom:2px solid #e2e8f0;font-weight:600}
  td{padding:8px 12px;border-bottom:1px solid #e2e8f0}tr:hover td{background:#f8fafc}@media print{body{padding:16px}}</style></head>
  <body><h1>Leads · ${currentClient}</h1><p>Exportado el ${new Date().toLocaleDateString('es-US',{year:'numeric',month:'long',day:'numeric'})}</p>
  <table><thead><tr><th>Nombre</th><th>Canal</th><th>Estado</th><th>Detalle</th><th>Teléfono</th><th>Email</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ============ LEAD MODAL ============
const LEAD_STATUS_LABEL = { new: '🆕 Nuevo', contacted: '📞 Contactado', interested: '🔥 Interesado', closed: '✅ Cerrado' };
const LEAD_CHANNEL_ICON = { Facebook: '📘', Instagram: '📸', WhatsApp: '💚', SMS: '💬', Referido: '🤝', Apollo: '🔍' };

function openLeadModal(colId, idx) {
  const lead = leads[colId][idx];
  if (!lead) return;
  const overlay = document.getElementById('leadModalOverlay');
  const statusColor = { new: '#3b82f6', contacted: '#f59e0b', interested: '#8b5cf6', closed: '#10b981' };
  document.getElementById('leadModalContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${LEAD_CHANNEL_ICON[lead.source] || '👤'}</div>
      <div>
        <div style="font-size:18px;font-weight:700;">${lead.name}</div>
        <div style="font-size:13px;color:var(--text-muted);">${lead.source} · ${lead.meta}</div>
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
      ${lead.phone ? `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Teléfono</div><div style="font-size:14px;font-weight:500;">${lead.phone}</div></div>` : ''}
      ${lead.email ? `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Email</div><div style="font-size:14px;font-weight:500;">${lead.email}</div></div>` : ''}
    </div>
    ${lead.notes ? `<div style="background:var(--bg-elevated);border-radius:10px;padding:14px;margin-bottom:20px;"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Notas</div><div style="font-size:14px;line-height:1.6;">${lead.notes}</div></div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="openChat('organizador');closeLeadModal()" style="flex:1;min-width:120px;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;">💬 Consultar Organizador</button>
      <button onclick="closeLeadModal()" style="background:var(--bg-elevated);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:11px 16px;font-size:13px;cursor:pointer;">Cerrar</button>
    </div>`;
  overlay.style.display = 'flex';
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
  document.getElementById('sp-btn').textContent = 'Enviar para aprobación →';
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
  if (!contenido) { errEl.textContent = 'El contenido no puede estar vacío.'; errEl.style.display = 'block'; return; }
  btn.textContent = 'Enviando...'; btn.disabled = true; errEl.style.display = 'none';
  try {
    const r = await fetch('/api/scheduler/post', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido, plataforma, cliente, fecha_publicacion: `${fecha}T${hora}:00` })
    });
    const d = await r.json();
    if (d.status === 'ok' || d.post_id) {
      closeScheduleModal();
      alert('✅ Post enviado al Scheduler. Recibirás aprobación vía Telegram antes de publicar.');
    } else {
      errEl.textContent = d.error || 'Error del servidor.'; errEl.style.display = 'block';
      btn.textContent = 'Enviar para aprobación →'; btn.disabled = false;
    }
  } catch(e) {
    errEl.textContent = 'Error de conexión.'; errEl.style.display = 'block';
    btn.textContent = 'Enviar para aprobación →'; btn.disabled = false;
  }
}

