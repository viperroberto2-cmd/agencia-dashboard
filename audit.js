const fs = require('fs');
const html = fs.readFileSync('index-v2.html', 'utf8');

// onclick handlers
const onclicks = [...html.matchAll(/onclick="([^"]+)"/g)].map(m => m[1]);
const unique = [...new Set(onclicks)];
console.log('=== ONCLICK HANDLERS (' + unique.length + ' unique):');
unique.forEach(o => console.log(' ', o.slice(0,90)));

// showPanel calls
const panels = [...html.matchAll(/showPanel\(["']([^"']+)["']/g)].map(m => m[1]);
console.log('\n=== showPanel targets:', [...new Set(panels)]);

// panel IDs in DOM
const panelIds = [...html.matchAll(/id="panel-([^"]+)"/g)].map(m => m[1]);
console.log('\n=== PANEL IDs in DOM:', panelIds);

// Missing panels (called but no DOM id)
const called = [...new Set(panels)];
const missing = called.filter(p => !panelIds.includes(p));
console.log('\n=== MISSING panels (called but no DOM):', missing);

// fetch endpoints
const fetches = [...html.matchAll(/fetch\(["']([^"']+)["']/g)].map(m => m[1]);
console.log('\n=== FETCH endpoints:', [...new Set(fetches)]);

// Nav items with data-section or similar
const dataAttrs = [...html.matchAll(/data-[a-z]+="([^"]+)"/g)].map(m => m[0]);
const navDataItems = dataAttrs.filter(a => a.includes('data-view') || a.includes('data-panel') || a.includes('data-section'));
console.log('\n=== NAV data attributes:', [...new Set(navDataItems)].slice(0,20));
