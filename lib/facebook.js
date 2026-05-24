// lib/facebook.js — publishToFacebook, _FB_PAGES, _resolvePageId

const _FB_PAGES = {
  'arranca':              '1037617602773646',
  'arranca financial':    '1037617602773646',
  'red de salud hispana': '1069131969608041',
  'salud hispana':        '1069131969608041',
  'horizon wound care':   '441343592402827',
  'rg photo':             '268664976335314',
  'rg photo & video':     '268664976335314',
};

function _resolvePageId(cliente) {
  const ck = (cliente || 'arranca').toLowerCase().trim();
  if (_FB_PAGES[ck]) return _FB_PAGES[ck];
  const key = Object.keys(_FB_PAGES).find(k => ck.includes(k) || k.includes(ck));
  return key ? _FB_PAGES[key] : null;
}

async function publishToFacebook(item, clientData) {
  const pages = clientData.facebook_pages || [];
  let page = pages.find(p => p.id === item.page_id) || pages[0];
  if (!page?.token && clientData.fb_page_id && process.env.FB_USER_TOKEN) {
    page = { id: clientData.fb_page_id, token: process.env.FB_USER_TOKEN };
  }
  if (!page?.token) return { ok: false, error: 'No hay página de Facebook conectada' };
  try {
    const endpoint = item.platform === 'instagram' && clientData.instagram_accounts?.length
      ? `https://graph.facebook.com/v19.0/${clientData.instagram_accounts[0].id}/media`
      : `https://graph.facebook.com/v19.0/${page.id}/feed`;
    const body = item.platform === 'instagram'
      ? { caption: item.text, ...(item.image_url ? { image_url: item.image_url, media_type: 'IMAGE' } : {}), access_token: page.token }
      : { message: item.text, ...(item.image_url ? { link: item.image_url } : {}), access_token: page.token };
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    if (data.error) return { ok: false, error: data.error.message };
    if (item.platform === 'instagram' && data.id) {
      const pub = await fetch(`https://graph.facebook.com/v19.0/${clientData.instagram_accounts[0].id}/media_publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: data.id, access_token: page.token })
      });
      const pubData = await pub.json();
      return { ok: !pubData.error, post_id: pubData.id };
    }
    return { ok: true, post_id: data.id };
  } catch(e) { return { ok: false, error: e.message }; }
}

module.exports = { publishToFacebook, _FB_PAGES, _resolvePageId };
