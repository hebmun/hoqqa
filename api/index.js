let ACCESS_USER = 'gabi';
let ACCESS_PASS = 'WNzjYb2LGlp0uXYtv4Ke';

// CONTACTS API - muntezir.de backend
// Cloudflare-də CONTACTS_API_TOKEN secret kimi əlavə et.
const CONTACTS_API_BASE = 'http://muntezir.de/bazalar/api/index.php';
// ETNDR relay — muntezir.de serverinə etender-api.php yüklə (curl + proxy dəstəyi)
// muntezir.de HTTPS işləmir (ERR_SSL_PROTOCOL_ERROR) → yalnız HTTP.
const ETENDER_RELAY = 'http://muntezir.de/bazalar/etender-api.php';
// MSK UNVAN relay - GCP serverde /var/www/bazalar/msk-unvan-api.php
const MSK_UNVAN_RELAY = 'http://34.30.56.108.nip.io/bazalar/msk-unvan-api.php';
// MSK SEÇİCİ relay - GCP serverdə /var/www/bazalar/msk-secici-api.php
const MSK_SECICI_RELAY = 'http://34.30.56.108.nip.io/bazalar/msk-secici.php';
// TERKIB relay - GCP serverde /var/www/bazalar/terkib-api.php
const TERKIB_RELAY = 'http://34.30.56.108.nip.io/bazalar/terkib-api.php';
// AİLƏ AĞACI relay - GCP serverdə /var/www/bazalar/aile-api.php
const AILE_API_RELAY = 'http://34.30.56.108.nip.io/bazalar/aile-api.php';
// XƏBƏR relay - GCP serverdə /var/www/bazalar/xeber-api.php
const XEBER_RELAY = 'http://34.30.56.108.nip.io/bazalar/xeber-api.php';
const UKR_RELAY = 'http://34.30.56.108.nip.io/bazalar/ukr-api.php';
const CONTACTS_API_TOKEN_FALLBACK = 'Z8H9z9cu4hlHx9spEqgqoqjwtJm7HgG7FLAqOuYkeSApwKMsI8zZbKcd596Jp5Kq';

// ─── HOQQA (Süni Zəka Araşdırma) ─────────────────────────────────────────────
const HOQQA_BAZA_BASE = 'http://34.30.56.108.nip.io/bazalar/';

// ⬇⬇⬇  GROQ AÇARINI BURAYA YAPIŞDIRIN (yalnız Groq üçün sabit açar)  ⬇⬇⬇
let HOQQA_GROQ_KEY = '';   // Cloudflare secret: HOQQA_GROQ_KEY (Variables and Secrets)
// ⬆⬆⬆  Digər xidmətlərin (OpenAI, Claude, Gemini, Grok) açarı saytda yazılır  ⬆⬆⬆
// HF_TOKEN artıq StreetCLIP üçün lazım deyil. Yalnız GeoVLM Space private olsa opsional istifadə edilə bilər.
let HF_TOKEN = '';   // opsional Cloudflare secret

// GeoVLM Gradio Space
const GEOVLM_SPACE = 'https://acexroux-geovlm.hf.space';
// StreetCLIP artıq HF Inference yox, sənin public Hugging Face Space-in üzərindən işləyir.
// Space səhifəsi: https://huggingface.co/spaces/muntezir/StreetCLIP
const SCLIP_SPACE = 'https://muntezir-streetclip.hf.space';
// ─── DÜNYA / İngiltərə — Companies House (UK) rəsmi API ───────────────────────
const CH_API = 'https://api.company-information.service.gov.uk';
// ⬇⬇⬇  COMPANIES HOUSE AÇARI (pulsuz): developer.company-information.service.gov.uk → "REST API" açarı  ⬇⬇⬇
let CH_API_KEY = 'b872801c-59f6-4b1a-96e3-c682d27b5c9e';   // məs:  const CH_API_KEY = 'a1b2c3d4-5678-...'
// ⬆⬆⬆  Boş olsa, İngiltərə tabı açar tələb edir  ⬆⬆⬆
const SCLIP_COUNTRIES = ['Azerbaijan','Georgia','Armenia','Turkey','Russia','Iran','Iraq','Kazakhstan','Uzbekistan','Turkmenistan','Ukraine','Belarus','Poland','Germany','France','Italy','Spain','Portugal','United Kingdom','Ireland','Netherlands','Belgium','Switzerland','Austria','Czechia','Slovakia','Hungary','Romania','Bulgaria','Greece','Serbia','Croatia','Bosnia and Herzegovina','Albania','North Macedonia','Montenegro','Slovenia','Sweden','Norway','Finland','Denmark','Estonia','Latvia','Lithuania','United States','Canada','Mexico','Brazil','Argentina','Chile','Colombia','Peru','China','Japan','South Korea','North Korea','Taiwan','Hong Kong','Vietnam','Thailand','Cambodia','Laos','Myanmar','Malaysia','Singapore','Indonesia','Philippines','India','Pakistan','Bangladesh','Sri Lanka','Nepal','Afghanistan','Saudi Arabia','United Arab Emirates','Qatar','Kuwait','Israel','Jordan','Lebanon','Syria','Egypt','Morocco','Algeria','Tunisia','Libya','Nigeria','Kenya','Ethiopia','South Africa','Tanzania','Ghana','Australia','New Zealand'];


// ─── KV KEŞ ────────────────────────────────────────────────────────────────
// KV binding adı: KVDB  (Cloudflare dashboard → Workers & Pages → KV → binding)
// TTL: 300 saniyə (5 dəqiqə)
const KV_TTL = 300;
// Cloudflare edge cache: təkrar sorğular muntezir.de-yə getmədən edge-dən qayıdır
const EDGE_CACHE = { cf: { cacheTtl: 300, cacheEverything: true } };

async function kvFetch(kv, cacheKey, ttl, fetchFn) {
  // KV bağlanmayıbsa — birbaşa fetch et
  if (!kv) return fetchFn();
  try {
    const cached = await kv.get(cacheKey, { type: 'text' });
    if (cached !== null) return cached;
  } catch (_) {}
  const result = await fetchFn();
  try { await kv.put(cacheKey, result, { expirationTtl: ttl }); } catch (_) {}
  return result;
}

// ─── RATE LIMITING ─────────────────────────────────────────────────────────
// Dəqiqədə eyni IP-dən maksimum 30 sorğu
const RATE_LIMIT = 30;
const RATE_WINDOW = 60; // saniyə

async function checkRateLimit(kv, ip) {
  if (!kv) return false; // KV yoxdursa limit tətbiq etmə
  const key = `rl:${ip}`;
  try {
    const raw = await kv.get(key, { type: 'text' });
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= RATE_LIMIT) return true; // limit aşılıb
    await kv.put(key, String(count + 1), { expirationTtl: RATE_WINDOW });
    return false;
  } catch (_) {
    return false; // xəta olsa keç
  }
}

function requireLogin() {
  return new Response('Giriş qadağandır', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Axtaris"',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

function checkLogin(request) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;

  let decoded = '';
  try {
    decoded = atob(auth.slice(6));
  } catch (e) {
    return false;
  }

  const p = decoded.indexOf(':');
  if (p === -1) return false;

  const user = decoded.slice(0, p);
  const pass = decoded.slice(p + 1);
  return user === ACCESS_USER && pass === ACCESS_PASS;
}

async function fetchTenderApi(q) {
  const url = 'http://34.30.56.108.nip.io/bazalar/tender-api.php?q=' + encodeURIComponent(q);
  const r = await fetch(url);
  if (!r.ok) throw new Error('TENDER API cavab vermədi: ' + r.status);
  return await r.json();
}


// ─── İDARƏ AXTARIŞ (GCP serverdə SQLite + FTS5) ──────────────────────────────
// Browser https-dir, GCP isə http — ona görə axtarış Worker üzərindən proxy olur.
// Faktiki axtarışı GCP-dəki idare-fts.php FTS5 ilə görür (idare.db birləşdirilmiş baza).
const IDARE_FTS_RELAY = 'http://34.30.56.108.nip.io/bazalar/idare-fts.php';
// SEÇİCİ (seçici siyahısı) — təmizlənmiş voters.db FTS5 ilə (GCP)
const SECICI_FTS_RELAY = 'http://34.30.56.108.nip.io/bazalar/voters-fts.php';
const VOTERS_STATS = {"umumi_secici": 6338799, "daire_sayi": 125, "menteqe_sayi": 6355, "orta_secici_menteqe": 997.5, "orta_secici_daire": 50710.4, "unvan_bos": 36, "dogum_ili_bos": 0, "daire_uzre": [{"daire": 1, "say": 49432}, {"daire": 2, "say": 50413}, {"daire": 3, "say": 47147}, {"daire": 4, "say": 49133}, {"daire": 5, "say": 48136}, {"daire": 6, "say": 45391}, {"daire": 7, "say": 52069}, {"daire": 8, "say": 47417}, {"daire": 9, "say": 51491}, {"daire": 10, "say": 52310}, {"daire": 11, "say": 54143}, {"daire": 12, "say": 48244}, {"daire": 13, "say": 50171}, {"daire": 14, "say": 49814}, {"daire": 15, "say": 50399}, {"daire": 16, "say": 47329}, {"daire": 17, "say": 41701}, {"daire": 18, "say": 48443}, {"daire": 19, "say": 48632}, {"daire": 20, "say": 49329}, {"daire": 21, "say": 46243}, {"daire": 22, "say": 50385}, {"daire": 23, "say": 49253}, {"daire": 24, "say": 49759}, {"daire": 25, "say": 48631}, {"daire": 26, "say": 52964}, {"daire": 27, "say": 53213}, {"daire": 28, "say": 49913}, {"daire": 29, "say": 52099}, {"daire": 30, "say": 46334}, {"daire": 31, "say": 49836}, {"daire": 32, "say": 50046}, {"daire": 33, "say": 50301}, {"daire": 34, "say": 52362}, {"daire": 35, "say": 47725}, {"daire": 36, "say": 52442}, {"daire": 37, "say": 45888}, {"daire": 38, "say": 53423}, {"daire": 39, "say": 50261}, {"daire": 40, "say": 51199}, {"daire": 41, "say": 48903}, {"daire": 42, "say": 47926}, {"daire": 43, "say": 48008}, {"daire": 44, "say": 48863}, {"daire": 45, "say": 48095}, {"daire": 46, "say": 51085}, {"daire": 47, "say": 51874}, {"daire": 48, "say": 50242}, {"daire": 49, "say": 49745}, {"daire": 50, "say": 60082}, {"daire": 51, "say": 53730}, {"daire": 52, "say": 53690}, {"daire": 53, "say": 52413}, {"daire": 54, "say": 49897}, {"daire": 55, "say": 50188}, {"daire": 56, "say": 46056}, {"daire": 57, "say": 46025}, {"daire": 58, "say": 49608}, {"daire": 59, "say": 50109}, {"daire": 60, "say": 50849}, {"daire": 61, "say": 51753}, {"daire": 62, "say": 55748}, {"daire": 63, "say": 52271}, {"daire": 64, "say": 50927}, {"daire": 65, "say": 53009}, {"daire": 66, "say": 48615}, {"daire": 67, "say": 54804}, {"daire": 68, "say": 52250}, {"daire": 69, "say": 53850}, {"daire": 70, "say": 51586}, {"daire": 71, "say": 50586}, {"daire": 72, "say": 48998}, {"daire": 73, "say": 48548}, {"daire": 74, "say": 53811}, {"daire": 75, "say": 49331}, {"daire": 76, "say": 49421}, {"daire": 77, "say": 46960}, {"daire": 78, "say": 48694}, {"daire": 79, "say": 49690}, {"daire": 80, "say": 45892}, {"daire": 81, "say": 51870}, {"daire": 82, "say": 52021}, {"daire": 83, "say": 55607}, {"daire": 84, "say": 52677}, {"daire": 85, "say": 52835}, {"daire": 86, "say": 55110}, {"daire": 87, "say": 48922}, {"daire": 88, "say": 51317}, {"daire": 89, "say": 52269}, {"daire": 90, "say": 52258}, {"daire": 91, "say": 52004}, {"daire": 92, "say": 50235}, {"daire": 93, "say": 54291}, {"daire": 94, "say": 54490}, {"daire": 95, "say": 51520}, {"daire": 96, "say": 54135}, {"daire": 97, "say": 50539}, {"daire": 98, "say": 53635}, {"daire": 99, "say": 52294}, {"daire": 100, "say": 51940}, {"daire": 101, "say": 54336}, {"daire": 102, "say": 56595}, {"daire": 103, "say": 52784}, {"daire": 104, "say": 49252}, {"daire": 105, "say": 52404}, {"daire": 106, "say": 47774}, {"daire": 107, "say": 49146}, {"daire": 108, "say": 47114}, {"daire": 109, "say": 44123}, {"daire": 110, "say": 52754}, {"daire": 111, "say": 51321}, {"daire": 112, "say": 48623}, {"daire": 113, "say": 54817}, {"daire": 114, "say": 54204}, {"daire": 115, "say": 54098}, {"daire": 116, "say": 54000}, {"daire": 117, "say": 55129}, {"daire": 118, "say": 63729}, {"daire": 119, "say": 59291}, {"daire": 120, "say": 55174}, {"daire": 121, "say": 58964}, {"daire": 122, "say": 6036}, {"daire": 123, "say": 56319}, {"daire": 124, "say": 47032}, {"daire": 125, "say": 56258}], "en_boyuk_daire": [{"daire": 118, "say": 63729}, {"daire": 50, "say": 60082}, {"daire": 119, "say": 59291}, {"daire": 121, "say": 58964}, {"daire": 102, "say": 56595}], "en_kicik_daire": [{"daire": 122, "say": 6036}, {"daire": 17, "say": 41701}, {"daire": 109, "say": 44123}, {"daire": 6, "say": 45391}, {"daire": 37, "say": 45888}], "onillik_uzre": {"1890": 1, "1900": 2, "1910": 12, "1920": 1279, "1930": 39213, "1940": 135823, "1950": 592418, "1960": 1036179, "1970": 1007544, "1980": 1370819, "1990": 1324815, "2000": 830694}, "yas_qruplari_2026": {"18-29": 1156592, "30-44": 2127515, "45-59": 1554070, "60-74": 1254118, "75+": 246504, "naməlum": 0}, "en_genc_dogum_ili": 2008, "en_yasli_dogum_ili": 1904, "ilk_defe_seciciler_2007_2008": 129330};

async function handleIdareSearch(url, env) {
  const CORS = { 'Content-Type': 'application/json;charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
  const json = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: CORS });

  const q = (url.searchParams.get('q') || '').trim();
  const cat = (url.searchParams.get('cat') || url.searchParams.get('idareCategory') || '').trim();
  const type = (url.searchParams.get('type') || '').trim(); // 'detail' | 'institution'
  let limit = parseInt(url.searchParams.get('limit') || '50', 10);
  if (isNaN(limit) || limit < 1) limit = 50;
  if (limit > 200) limit = 200;

  if (q.length < 2 && !cat) return json({ query: q, count: 0, results: [] });

  const relay = IDARE_FTS_RELAY
    + '?q=' + encodeURIComponent(q)
    + (cat ? '&cat=' + encodeURIComponent(cat) : '')
    + (type ? '&type=' + encodeURIComponent(type) : '')
    + '&limit=' + limit;

  try {
    const resp = await fetch(relay, EDGE_CACHE);
    const text = await resp.text();
    const trimmed = text.trim();
    if (!trimmed.startsWith('{')) {
      return json({ error: 'PHP JSON qaytarmadı: ' + trimmed.slice(0, 160), results: [] }, 502);
    }
    return new Response(trimmed, { headers: CORS });
  } catch (e) {
    return json({ error: String(e && e.message || e), results: [] }, 500);
  }
}

// ─── HOQQA: çoxlu AI xidməti (provider) dəstəyi ──────────────────────────────
const HOQQA_DEFAULT_MODELS = {
  groq:      'llama-3.3-70b-versatile',
  openai:    'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-6',
  gemini:    'gemini-3.5-flash',
  grok:      'grok-4.3'
};
const HOQQA_OPENAI_COMPAT = {
  openai: 'https://api.openai.com/v1',
  grok:   'https://api.x.ai/v1',
  groq:   'https://api.groq.com/openai/v1'
};

// Seçilmiş xidmətə müraciət edib mətn cavabı qaytarır
async function hoqqaCallAI(provider, apiKey, model, systemPrompt, userText) {
  const mdl = (model && model.trim()) || HOQQA_DEFAULT_MODELS[provider];

  // 1) OpenAI-uyğun xidmətlər (openai, grok, groq)
  if (HOQQA_OPENAI_COMPAT[provider]) {
    const r = await fetch(HOQQA_OPENAI_COMPAT[provider] + '/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: mdl,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ]
      })
    });
    if (!r.ok) throw new Error((await r.text()).slice(0, 300));
    const d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || 'Cavab boşdur.';
  }

  // 2) Anthropic (Claude)
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: mdl,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [ { role: 'user', content: userText } ]
      })
    });
    if (!r.ok) throw new Error((await r.text()).slice(0, 300));
    const d = await r.json();
    return (d.content && d.content[0] && d.content[0].text) || 'Cavab boşdur.';
  }

  // 3) Google Gemini
  if (provider === 'gemini') {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + mdl + ':generateContent?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [ { text: systemPrompt } ] },
          contents: [ { role: 'user', parts: [ { text: userText } ] } ]
        })
      }
    );
    if (!r.ok) throw new Error((await r.text()).slice(0, 300));
    const d = await r.json();
    const c = d.candidates && d.candidates[0];
    return (c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text) || 'Cavab boşdur.';
  }

  throw new Error('Naməlum xidmət: ' + provider);
}

// ─── HOQQA: sualdan axtarış sözünü ayır ──────────────────────────────────────
async function hoqqaExtractTerm(provider, apiKey, model, question) {
  try {
    const t = await hoqqaCallAI(
      provider, apiKey, model,
      'Sən axtarış açar sözü çıxaran köməkçisən. Yalnız açar sözü qaytar, başqa heç nə yazma.',
      'Aşağıdakı sualdan bazada axtarılacaq ƏSAS açar sözü çıxar (ad-soyad, VÖEN nömrəsi, avtomobil nömrəsi və ya şirkət adı). Yalnız həmin sözü qaytar, izah və durğu işarəsi yazma.\n\nSual: ' + question
    );
    const clean = (t || '').replace(/["'\n\r.]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean && clean.length >= 2 && clean.length <= 70) return clean;
  } catch (e) {}
  return question;
}

// ─── HOQQA: bütün bazalarda paralel axtarış ──────────────────────────────────
async function hoqqaSearchDatabases(term, env) {
  const enc = encodeURIComponent(term);
  // ?q= formatlı bazalar (cavabı xam JSON kimi AI-ya ötürürük)
  const jobs = [
    ['DNN',    HOQQA_BAZA_BASE + 'dnn-api.php?q='   + enc],
    ['VERGİ',  HOQQA_BAZA_BASE + 'vergi-api.php?q=' + enc],
    ['MNB',    HOQQA_BAZA_BASE + 'mnb-api.php?q='   + enc],
    ['SMAB',   HOQQA_BAZA_BASE + 'smab-api.php?q='  + enc],
    ['TENDER', HOQQA_BAZA_BASE + 'tender-api.php?q='+ enc],
    ['CBAR',   HOQQA_BAZA_BASE + 'cbar-api.php?q='  + enc],
    ['İDARƏ',  HOQQA_BAZA_BASE + 'idare-fts.php?q=' + enc + '&limit=20']
  ];
  const parts = [];
  const sources = [];

  await Promise.all(jobs.map(async ([name, u]) => {
    try {
      const r = await fetch(u, { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) return;
      let t = (await r.text()).trim();
      if (!t || (t[0] !== '{' && t[0] !== '[')) return;
      // boş nəticələri at
      if (t === '{}' || t === '[]' || /"results"\s*:\s*\[\s*\]/.test(t) || /"count"\s*:\s*0/.test(t)) return;
      if (t.length > 1800) t = t.slice(0, 1800) + ' ...';
      parts.push('[' + name + ' bazası]\n' + t);
      sources.push(name);
    } catch (e) {}
  }));

  // MSK (seçici siyahısı) — Basic auth tələb edir
  try {
    const r = await fetch(MSK_SECICI_RELAY + '?ajax=1&limit=20&q=' + enc, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Authorization': 'Basic ' + btoa(ACCESS_USER + ':' + ACCESS_PASS) }
    });
    if (r.ok) {
      let t = (await r.text()).trim();
      if (t && t[0] === '{' && !/"results"\s*:\s*\[\s*\]/.test(t) && !/"count"\s*:\s*0/.test(t)) {
        if (t.length > 1800) t = t.slice(0, 1800) + ' ...';
        parts.push('[MSK bazası]\n' + t);
        sources.push('MSK');
      }
    }
  } catch (e) {}

  // ƏLAQƏ (contacts) — token tələb edir
  try {
    const d = await contactsApiJson('search', { q: term, limit: '20' }, null, env);
    if (d && d.results && d.results.length) {
      parts.push('[ƏLAQƏ bazası]\n' + JSON.stringify(d.results).slice(0, 1800));
      sources.push('ƏLAQƏ');
    }
  } catch (e) {}

  return { context: parts.join('\n\n'), sources };
}

// ─── HOQQA: söhbət (çoxnövbəli) ──────────────────────────────────────────────
async function hoqqaChatAI(provider, apiKey, model, systemPrompt, history) {
  const mdl = (model && model.trim()) || HOQQA_DEFAULT_MODELS[provider];
  const msgs = (history || []).filter(m => m && m.content);

  if (HOQQA_OPENAI_COMPAT[provider]) {
    const r = await fetch(HOQQA_OPENAI_COMPAT[provider] + '/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: mdl, temperature: 0.4,
        messages: [{ role: 'system', content: systemPrompt }].concat(msgs)
      })
    });
    if (!r.ok) throw new Error((await r.text()).slice(0, 300));
    const d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || 'Cavab boşdur.';
  }
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: mdl, max_tokens: 1500, system: systemPrompt,
        messages: msgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      })
    });
    if (!r.ok) throw new Error((await r.text()).slice(0, 300));
    const d = await r.json();
    return (d.content && d.content[0] && d.content[0].text) || 'Cavab boşdur.';
  }
  if (provider === 'gemini') {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + mdl + ':generateContent?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
        })
      }
    );
    if (!r.ok) throw new Error((await r.text()).slice(0, 300));
    const d = await r.json();
    const c = d.candidates && d.candidates[0];
    return (c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text) || 'Cavab boşdur.';
  }
  throw new Error('Naməlum xidmət: ' + provider);
}

// ─── GeoVLM handler (Gradio Space API) ───────────────────────────────────────
// VARİANT 1: Worker yalnız POST edib event_id qaytarır (sürətli, ~1 san).
// Yavaş SSE oxumasını (proqnoz 2-5 dəqiqə çəkir) brauzer özü birbaşa
// HF Space-dən edir — beləcə Cloudflare-in ~100 san timeout limiti aradan qalxır.
async function handleGeoVLM(request) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
  try {
    const body = await request.json();
    const img = (body.image || '').trim();
    if (!img) return jres({ error: 'Şəkil yoxdur.' }, 400);
    const dataUrl = img.indexOf('data:') === 0 ? img : ('data:image/jpeg;base64,' + img);
    const headers = { 'Content-Type': 'application/json' };
    if (HF_TOKEN) headers['Authorization'] = 'Bearer ' + HF_TOKEN;

    // POST — event_id al (yalnız bu qədər; nəticəni brauzer oxuyacaq)
    const post = await fetch(GEOVLM_SPACE + '/gradio_api/call/predict_location', {
      method: 'POST', headers,
      body: JSON.stringify({ data: [{ url: dataUrl, meta: { _type: 'gradio.FileData' } }] })
    });
    const pt = await post.text();
    if (!post.ok) return jres({ error: 'GeoVLM (POST) xətası: ' + pt.slice(0, 300) }, 502);
    let eid = '';
    try { eid = JSON.parse(pt).event_id; } catch (e) {}
    if (!eid) return jres({ error: 'GeoVLM event_id alınmadı: ' + pt.slice(0, 200) }, 502);

    // event_id + Space ünvanını brauzerə qaytar
    return jres({ event_id: eid, space: GEOVLM_SPACE });
  } catch (e) {
    return jres({ error: 'Server xətası: ' + e.message }, 500);
  }
}

// ─── StreetCLIP handler (public Hugging Face Space / Gradio) ────────────────
// HF pulsuz Inference StreetCLIP-i artıq saxlamır. Ona görə bu endpoint
// token tələb etmir: Worker yalnız public Space-dən event_id alır, uzun cavabı
// isə brauzer /gradio_api/call/... axınından oxuyur (GeoVLM kimi).
async function handleSclip(request) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });

  async function sclipApiCandidates() {
    const fallback = ['predict', 'classify', 'streetclip'];
    try {
      const r = await fetch(SCLIP_SPACE + '/config', { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, cf: { cacheTtl: 60, cacheEverything: true } });
      if (!r.ok) return fallback;
      const cfg = await r.json();
      const names = [];
      const deps = Array.isArray(cfg.dependencies) ? cfg.dependencies : [];
      deps.forEach(function(d) {
        const a = d && d.api_name;
        if (a && typeof a === 'string' && a !== 'false' && names.indexOf(a.replace(/^\//, '')) < 0) names.push(a.replace(/^\//, ''));
      });
      names.sort(function(a, b) {
        const sa = /predict|classify|street|clip/i.test(a) ? 0 : 1;
        const sb = /predict|classify|street|clip/i.test(b) ? 0 : 1;
        return sa - sb;
      });
      return names.length ? names.concat(fallback.filter(x => names.indexOf(x) < 0)) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  try {
    const body = await request.json();
    const img = (body.image || '').trim();
    if (!img) return jres({ error: 'Şəkil yoxdur.' }, 400);
    const dataUrl = img.indexOf('data:') === 0 ? img : ('data:image/jpeg;base64,' + img);

    const payloads = [
      { data: [{ url: dataUrl, meta: { _type: 'gradio.FileData' } }] },
      { data: [dataUrl] }
    ];
    const apis = await sclipApiCandidates();
    let lastErr = '';

    for (const apiName of apis) {
      for (const payload of payloads) {
        try {
          const post = await fetch(SCLIP_SPACE + '/gradio_api/call/' + encodeURIComponent(apiName), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            body: JSON.stringify(payload),
            cf: { cacheTtl: 0 }
          });
          const pt = await post.text();
          if (!post.ok) { lastErr = 'API ' + apiName + ' HTTP ' + post.status + ': ' + pt.slice(0, 160); continue; }
          let eid = '';
          try { eid = JSON.parse(pt).event_id; } catch (_) {}
          if (eid) return jres({ event_id: eid, space: SCLIP_SPACE, api_name: apiName });
          lastErr = 'API ' + apiName + ' event_id qaytarmadı: ' + pt.slice(0, 160);
        } catch (e) {
          lastErr = 'API ' + apiName + ' bağlantı xətası: ' + ((e && e.message) || e);
        }
      }
    }

    return jres({ error: 'StreetCLIP Space işə düşmədi. Son xəta: ' + lastErr }, 502);
  } catch (e) {
    return jres({ error: 'Server xətası: ' + e.message }, 500);
  }
}

// ─── DÜNYA / İngiltərə handler (Companies House UK API) ───────────────────────
async function handleUK(url) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
  if (!CH_API_KEY) return jres({ error: 'Companies House açarı yoxdur. developer.company-information.service.gov.uk → pulsuz "REST API" açarı yarat → kodun başındakı CH_API_KEY sahəsinə yapışdır.' }, 500);
  const auth = 'Basic ' + btoa(CH_API_KEY + ':');
  const action = (url.searchParams.get('action') || 'search').trim();
  const q = (url.searchParams.get('q') || '').trim();
  const num = (url.searchParams.get('num') || '').trim().replace(/[^A-Za-z0-9]/g, '');
  let path = '';
  if (action === 'search') path = '/search/companies?items_per_page=30&q=' + encodeURIComponent(q);
  else if (action === 'officers') path = '/search/officers?items_per_page=30&q=' + encodeURIComponent(q);
  else if (action === 'company') path = '/company/' + encodeURIComponent(num);
  else if (action === 'company_officers') path = '/company/' + encodeURIComponent(num) + '/officers?items_per_page=60';
  else return jres({ error: 'Yanlış action.' }, 400);
  if ((action === 'search' || action === 'officers') && q.length < 2) return jres({ items: [], total_results: 0 });
  if ((action === 'company' || action === 'company_officers') && !num) return jres({ error: 'Şirkət nömrəsi yoxdur.' }, 400);
  try {
    const r = await fetch(CH_API + path, { headers: { 'Authorization': auth, 'Accept': 'application/json' } });
    const t = await r.text();
    if (r.status === 401) return jres({ error: 'CH açarı yanlışdır (401). developer.company-information.service.gov.uk açarını yoxla.' }, 502);
    if (r.status === 404) return jres({ error: 'Tapılmadı (404).' }, 404);
    if (r.status === 429) return jres({ error: 'Limit aşıldı (429). Bir az gözlə.' }, 502);
    if (!r.ok) return jres({ error: 'Companies House xətası (HTTP ' + r.status + '): ' + t.slice(0, 200) }, 502);
    let data;
    try { data = JSON.parse(t); } catch (e) { return jres({ error: 'CH cavabı oxunmadı.' }, 502); }
    return jres(data);
  } catch (e) {
    return jres({ error: 'CH bağlantı xətası: ' + (e.message || e) }, 502);
  }
}

// ─── DÜNYA / NorthData handler (HTML scraping, API yoxdur) ────────────────────
function ndDecode(s) {
  return String(s || '')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#0?183;/g, '·').replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ');
}
function parseNorthData(html) {
  const out = [];
  const parts = String(html || '').split('<div class="event"');
  for (let i = 1; i < parts.length && out.length < 40; i++) {
    const block = parts[i].slice(0, 5000);
    const tm = block.match(/<a class="title"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!tm) continue;
    const href = ndDecode(tm[1]);
    const title = ndDecode(tm[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (!title) continue;
    const em = block.match(/<div class="extra text">([\s\S]*?)<\/div>/);
    const register = em ? ndDecode(em[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
    const idm = block.match(/data-id="([^"]+)"/);
    out.push({ title, href, register, id: idm ? idm[1] : '' });
  }
  return out;
}
async function handleNorthData(url) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
  const q = (url.searchParams.get('q') || '').trim();
  let offset = parseInt(url.searchParams.get('offset') || '0', 10);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (q.length < 2) return jres({ items: [] });
  const target = 'https://www.northdata.com/' + encodeURIComponent(q) + '?offset=' + offset;
  try {
    const r = await fetch(target, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en,az;q=0.9,de;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    const html = await r.text();
    if (!r.ok) return jres({ error: 'NorthData cavab vermədi (HTTP ' + r.status + ').' }, 502);
    if (html.indexOf('class="event"') < 0) {
      return jres({ items: [], blocked: true, error: 'NorthData nəticə qaytarmadı (bot mühafizəsi ola bilər). Birbaşa açın.' });
    }
    return jres({ items: parseNorthData(html), offset });
  } catch (e) {
    return jres({ error: 'NorthData bağlantı xətası: ' + (e.message || e) }, 502);
  }
}

// ─── DÜNYA / Rusiya handler (companies.rbc.ru scraping, API yoxdur) ───────────
function rbcDecode(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?34;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
    .replace(/&#171;/g, '«').replace(/&#187;/g, '»')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&#x20bd;/gi, '₽').replace(/&#8381;/g, '₽');
}
function rbcStrip(s) {
  return rbcDecode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function rbcPick(f, keys) {
  for (let i = 0; i < keys.length; i++) { if (f[keys[i]]) return f[keys[i]]; }
  return '';
}
function parseRBC(html) {
  const out = [];
  const cards = String(html || '').split('<div class="company-card info-card">');
  for (let i = 1; i < cards.length && out.length < 30; i++) {
    const b = cards[i].slice(0, 9000);
    const am = b.match(/<a class="company-name-highlight" href="([^"]+)">([\s\S]*?)<\/a>/);
    if (!am) continue;
    const href = rbcDecode(am[1]);
    const tm = am[2].match(/<span title="([^"]*)"/);
    let name = tm ? rbcDecode(tm[1]) : rbcStrip(am[2]);
    if (!name) name = rbcStrip(am[2]);
    const sm = b.match(/<span class="company-status-badge[^"]*">([\s\S]*?)<\/span>/);
    const status = sm ? rbcStrip(sm[1]) : '';
    const f = {};
    const re = /<p class="company-card__info">\s*<span>([^<]+)<\/span>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = re.exec(b))) {
      const label = rbcStrip(m[1]).replace(/:+$/, '').trim();
      const val = rbcStrip(m[2]);
      if (label && val) f[label] = val;
    }
    out.push({
      name, href, status,
      inn: rbcPick(f, ['ИНН']),
      ogrn: rbcPick(f, ['ОГРН']),
      director: rbcPick(f, ['Генеральный Директор', 'Директор', 'Руководитель', 'Управляющий', 'Президент']),
      address: rbcPick(f, ['Юридический адрес', 'Адрес']),
      reg_date: rbcPick(f, ['Дата регистрации']),
      capital: rbcPick(f, ['Уставной капитал', 'Уставный капитал']),
      revenue: rbcPick(f, ['Выручка']),
      growth: rbcPick(f, ['Темп прироста'])
    });
  }
  return out;
}
async function handleRussia(url) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
  const q = (url.searchParams.get('q') || '').trim();
  let page = parseInt(url.searchParams.get('page') || '1', 10);
  if (isNaN(page) || page < 1) page = 1;
  if (q.length < 2) return jres({ items: [] });
  const target = 'https://companies.rbc.ru/search/?query=' + encodeURIComponent(q) + (page > 1 ? '&page=' + page : '');
  try {
    const r = await fetch(target, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    const html = await r.text();
    if (!r.ok) return jres({ error: 'RBC cavab vermədi (HTTP ' + r.status + ').' }, 502);
    if (html.indexOf('company-card info-card') < 0) {
      return jres({ items: [], blocked: true, error: 'RBC nəticə qaytarmadı (bot mühafizəsi ola bilər). Birbaşa açın.' });
    }
    return jres({ items: parseRBC(html), page });
  } catch (e) {
    return jres({ error: 'RBC bağlantı xətası: ' + (e.message || e) }, 502);
  }
}
// ─── Rusiya / şəxs axtarışı (RBC /search/persons) ────────────────────────────
function parseRBCPersons(html) {
  const out = [];
  const s = String(html || '');
  const re = /<a[^>]*href="([^"]*\/persons\/(?:inn|ogrnip)\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const matches = [];
  let m;
  while ((m = re.exec(s))) matches.push({ href: m[1], inner: m[2], end: re.lastIndex });
  const seen = {};
  for (let i = 0; i < matches.length && out.length < 30; i++) {
    const cur = matches[i];
    const href = rbcDecode(cur.href);
    if (seen[href]) continue;
    // pəncərə: bu linkdən sonrakı mətn növbəti linkə qədər (qonşu nəticə qarışmasın)
    const nextA = s.indexOf('<a', cur.end);
    let winEnd = cur.end + 400;
    if (nextA >= 0 && nextA < winEnd) winEnd = nextA;
    const after = rbcStrip(s.slice(cur.end, winEnd));
    const linkName = rbcStrip(cur.inner);
    const innm = after.match(/ИНН[:\s]*([0-9]{8,15})/);
    const ogm = after.match(/ОГРНИП[:\s]*([0-9]{10,18})/);
    let type = '';
    if (/Индивидуальный предприниматель/.test(after)) type = 'Fərdi sahibkar (ИП)';
    else if (/Физическое лицо/.test(after)) type = 'Fiziki şəxs';
    let name = after.split(/Физическое лицо|Индивидуальный предприниматель|ИНН/)[0].trim();
    if (!name || name.length < linkName.length) name = linkName;
    if (!name) continue;
    seen[href] = 1;
    out.push({ name, href, type, inn: innm ? innm[1] : '', ogrnip: ogm ? ogm[1] : '' });
  }
  return out;
}
async function handleRussiaPersons(url) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
  const q = (url.searchParams.get('q') || '').trim();
  let page = parseInt(url.searchParams.get('page') || '1', 10);
  if (isNaN(page) || page < 1) page = 1;
  if (q.length < 2) return jres({ items: [] });
  const target = 'https://companies.rbc.ru/search/persons/?query=' + encodeURIComponent(q) + (page > 1 ? '&page=' + page : '');
  try {
    const r = await fetch(target, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    const html = await r.text();
    if (!r.ok) return jres({ error: 'RBC cavab vermədi (HTTP ' + r.status + ').' }, 502);
    const items = parseRBCPersons(html);
    if (!items.length && html.indexOf('/persons/') < 0) {
      return jres({ items: [], blocked: true, error: 'RBC nəticə qaytarmadı (bot mühafizəsi ola bilər). Birbaşa açın.' });
    }
    return jres({ items, page });
  } catch (e) {
    return jres({ error: 'RBC bağlantı xətası: ' + (e.message || e) }, 502);
  }
}

// ─── DÜNYA / Çexiya handler (ARES rəsmi API) ─────────────────────────────────
async function handleCzech(url) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return jres({ items: [] });
  const base = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty';
  const isIco = /^\d{6,8}$/.test(q);
  try {
    if (isIco) {
      const ico = q.padStart(8, '0');
      const r = await fetch(base + '/' + encodeURIComponent(ico), { headers: { 'Accept': 'application/json' } });
      if (r.status === 404) return jres({ items: [], total: 0 });
      const t = await r.text();
      if (!r.ok) return jres({ error: 'ARES xətası (HTTP ' + r.status + ')' }, 502);
      const d = JSON.parse(t);
      return jres({ items: (d && d.ico) ? [d] : [], total: (d && d.ico) ? 1 : 0 });
    }
    const start = parseInt(url.searchParams.get('start') || '0', 10) || 0;
    const r = await fetch(base + '/vyhledat', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ obchodniJmeno: q, start: start, pocet: 30 })
    });
    const t = await r.text();
    if (!r.ok) return jres({ error: 'ARES axtarış xətası (HTTP ' + r.status + '): ' + t.slice(0, 160) }, 502);
    const d = JSON.parse(t);
    return jres({ items: Array.isArray(d.ekonomickeSubjekty) ? d.ekonomickeSubjekty : [], total: d.pocetCelkem || 0, start });
  } catch (e) {
    return jres({ error: 'ARES bağlantı xətası: ' + (e.message || e) }, 502);
  }
}
// ─── DÜNYA / Belarus handler (ЕГР rəsmi API, UNP üzrə) ────────────────────────
async function handleBelarus(url) {
  const jres = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
  const unp = (url.searchParams.get('q') || '').replace(/\D/g, '');
  if (unp.length < 5) return jres({ error: 'УНП nömrəsini yazın (adətən 9 rəqəm).' }, 400);
  const target = 'http://grp.nalog.gov.by/api/grp-public/data?unp=' + encodeURIComponent(unp) + '&charset=UTF-8&type=json';
  try {
    const r = await fetch(target, {
      headers: { 'Accept': 'application/json,*/*', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    const t = await r.text();
    if (!r.ok) return jres({ error: 'ЕГР cavab vermədi (HTTP ' + r.status + ').' }, 502);
    let d;
    try { d = JSON.parse(t); } catch (e) { return jres({ error: 'ЕГР JSON qaytarmadı: ' + t.slice(0, 160) }, 502); }
    return jres({ data: d });
  } catch (e) {
    return jres({ error: 'ЕГР bağlantı xətası (' + (e.message || e) + '). Belarus serveri yavaş/əlçatmaz ola bilər.' }, 502);
  }
}

// ─── HOQQA handler ───────────────────────────────────────────────────────────
async function handleHoqqa(request, env) {
  const jres = (obj, status) => new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  });
  try {
    const body = await request.json();
    const provider = (body.provider || 'groq').trim();
    let   apiKey   = (body.apiKey || '').trim();
    const model    = (body.model || '').trim();
    const mode     = (body.mode || 'research').trim();

    // Groq üçün koda yazılmış sabit açar (varsa) istifadə olunur
    if (provider === 'groq' && HOQQA_GROQ_KEY) apiKey = HOQQA_GROQ_KEY;
    if (!apiKey) return jres({ error: 'API key boşdur. Bağlantı bölməsində açarı yazın.' }, 400);

    // SALAMLAMA rejimi — açarı yoxlayır
    if (mode === 'greet') {
      try {
        // Açarı kiçik sorğu ilə yoxla, sonra sabit salamlama qaytar
        await hoqqaCallAI(provider, apiKey, model, 'Sən HOQQA-san.', 'Cavab olaraq yalnız "ok" yaz.');
        return jres({ answer: 'Salamlar, mən sənin süni zəka köməkçin HOQQA-yam, istənilən sualı yaz, "dvij" edək, araşdırmaq üçün hazıram!', ok: true });
      } catch (e) {
        return jres({ error: 'Bağlantı alınmadı: ' + e.message }, 500);
      }
    }
    // SÖHBƏT rejimi — araşdırmanı təkmilləşdir
    if (mode === 'chat') {
      const history = Array.isArray(body.messages) ? body.messages : [];
      const ctx = (body.context || '').trim();
      if (!history.length) return jres({ error: 'Söhbət tarixçəsi boşdur.' }, 400);
      const sys = 'Sən HOQQA adlı süni zəka araşdırma köməkçisisən. Əvvəlki araşdırmanı istifadəçinin göstərişlərinə uyğun təkmilləşdir. Azərbaycan dilində cavab ver. Mövcud MƏNBƏ məlumatlarına sadiq qal, uydurma əlavə etmə.' + (ctx ? '\n\nMƏNBƏ MƏLUMATLAR:\n' + ctx : '');
      try {
        const reply = await hoqqaChatAI(provider, apiKey, model, sys, history);
        return jres({ answer: reply });
      } catch (e) {
        return jres({ error: 'AI xətası: ' + e.message }, 500);
      }
    }


    // ARAŞDIRMA rejimi
    const question = (body.question || '').trim();
    const guidance = (body.guidance || '').trim();
    if (!question) return jres({ error: 'Sual boşdur.' }, 400);

    // 1) Bizim bazalarda axtarış (DNN, VERGİ, MNB, SMAB, TENDER, CBAR, İDARƏ, ƏLAQƏ)
    const term = await hoqqaExtractTerm(provider, apiKey, model, question);
    const found = await hoqqaSearchDatabases(term, env);
    let context = found.context;
    let sources = found.sources;

    const systemPrompt = 'Sən HOQQA adlı süni zəka araşdırma köməkçisisən. Sənə verilən MƏNBƏ məlumatlarına əsaslanaraq Azərbaycan dilində aydın, dəqiq və quruluşlu araşdırma materialı hazırla. Yalnız mənbələrdəki məlumatlara güvən; mənbədə cavab yoxdursa bunu açıq bildir və uydurma məlumat yazma. İstifadəçinin göstərişinə dəqiq əməl et.';
    const userText = (context ? 'MƏNBƏ MƏLUMATLAR:\n' + context + '\n\n' : 'MƏNBƏ MƏLUMAT TAPILMADI.\n\n') +
                     'SUAL / MÖVZU:\n' + question + (guidance ? '\n\nİSTİQAMƏT:\n' + guidance : '');

    try {
      const answer = await hoqqaCallAI(provider, apiKey, model, systemPrompt, userText);
      return jres({ answer, sources, term, context });
    } catch (e) {
      return jres({ error: 'AI xətası: ' + e.message }, 500);
    }
  } catch (e) {
    return jres({ error: 'Server xətası: ' + e.message }, 500);
  }
}

// ─── XƏBƏR sürətləndirilmiş loader ───────────────────────────────────────────
// "Hamısı" rejimində backend-i bir dəfə ağır çağırmaq əvəzinə mənbələri ayrı-ayrı
// qısa timeout-la paralel çağırır. Bir mənbə ilişsə, digərləri yenə görünür.
const XEBER_PARALLEL_SOURCES = ['fed', 'yeniavaz', 'qaynarinfo', 'valyuta', 'iqtisadiyyat'];

function xeberSleepTimeout(ms, value) {
  return new Promise(function(resolve) {
    setTimeout(function() { resolve(value); }, ms);
  });
}

function xeberParamsKey(params) {
  const gp = new URLSearchParams();
  gp.set('source', params.source || 'all');
  gp.set('q', params.q || '');
  gp.set('limit', String(params.limit || 45));
  return gp.toString();
}

function xeberDedupResults(list) {
  const seen = {};
  const out = [];
  (Array.isArray(list) ? list : []).forEach(function(item) {
    const u = String(item && (item.url || item.link || '') || '').trim().toLowerCase();
    const t = String(item && item.title || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const key = u || t;
    if (!key || seen[key]) return;
    seen[key] = 1;
    out.push(item);
  });
  return out;
}

async function xeberCallBackend(params, source, timeoutMs) {
  const gp = new URLSearchParams();
  gp.set('limit', String(params.limit || 45));
  if (source && source !== 'all') gp.set('source', source);
  if (params.q) gp.set('q', params.q);
  if (params.refresh) gp.set('refresh', '1');

  const relayUrl = XEBER_RELAY + '?' + gp.toString();
  const job = (async function() {
    const rr = await fetch(relayUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Authorization': 'Basic ' + btoa(ACCESS_USER + ':' + ACCESS_PASS)
      },
      cf: { cacheTtl: params.refresh ? 0 : 300, cacheEverything: !params.refresh }
    });
    const body = await rr.text();
    const t = body.trim();
    if (!t.startsWith('{')) {
      return { ok: false, source: source || 'all', error: 'JSON deyil: ' + t.slice(0, 180), results: [] };
    }
    let d;
    try {
      d = JSON.parse(t);
    } catch (e) {
      return { ok: false, source: source || 'all', error: 'JSON oxunmadı: ' + ((e && e.message) || e), results: [] };
    }
    if (d && d.ok === false) {
      return { ok: false, source: source || d.source || 'all', error: d.error || 'Backend xətası', results: [] };
    }
    const arr = Array.isArray(d.results) ? d.results : [];
    arr.forEach(function(x) {
      if (x && !x.source && source && source !== 'all') x.source = source;
    });
    return {
      ok: true,
      source: source || d.source || 'all',
      results: arr,
      total: Number(d.total || arr.length || 0),
      updated_at: d.updated_at || '',
      sources: Array.isArray(d.sources) ? d.sources : []
    };
  })();

  const timed = await Promise.race([
    job,
    xeberSleepTimeout(timeoutMs || 9000, { ok: false, source: source || 'all', timeout: true, error: 'Mənbə ' + (timeoutMs || 9000) + ' ms ərzində cavab vermədi', results: [] })
  ]);
  return timed;
}

async function xeberLoadData(params, kv) {
  params = params || {};
  params.source = params.source || 'all';
  params.limit = Number(params.limit || 45) || 45;
  params.q = String(params.q || '').trim();
  params.refresh = !!params.refresh;

  const cacheKey = 'xeber:v7:' + xeberParamsKey(params);

  if (kv && !params.refresh) {
    try {
      const cached = await kv.get(cacheKey, { type: 'text' });
      if (cached) {
        const d = JSON.parse(cached);
        d.cache_hit = true;
        return d;
      }
    } catch (_) {}
  }

  let out;
  if (params.source && params.source !== 'all') {
    const d = await xeberCallBackend(params, params.source, 12000);
    const results = normalizeXeberList(xeberDedupResults(d.results || [])).slice(0, params.limit);
    out = {
      ok: d.ok !== false,
      results: results,
      total: Number(d.total || results.length || 0),
      updated_at: d.updated_at || new Date().toISOString(),
      sources: d.sources && d.sources.length ? d.sources : [params.source],
      source_status: [{ source: params.source, ok: d.ok !== false, error: d.error || '', count: results.length, timeout: !!d.timeout }],
      error: d.ok === false ? (d.error || 'XƏBƏR mənbə xətası') : ''
    };
  } else {
    // V126: əvvəl sürətli paralel mənbə yoxlanışı; nəticə yoxdursa,
    // köhnə işlək "source=all" backend çağırışına fallback.
    // Beləliklə backend source adlarını fərqli gözləsə də xəbərlər itməsin.
    const jobs = XEBER_PARALLEL_SOURCES.map(function(src) {
      return xeberCallBackend(params, src, 12000).catch(function(e) {
        return { ok: false, source: src, error: ((e && e.message) || e), results: [] };
      });
    });
    const parts = await Promise.all(jobs);
    let all = [];
    const status = [];
    parts.forEach(function(d) {
      const arr = Array.isArray(d.results) ? d.results : [];
      all = all.concat(arr);
      status.push({ source: d.source || '', ok: d.ok !== false, error: d.error || '', count: arr.length, timeout: !!d.timeout });
    });
    let results = normalizeXeberList(xeberDedupResults(all)).slice(0, params.limit);
    let errors = status.filter(function(s) { return !s.ok; }).map(function(s) { return s.source + ': ' + s.error; });

    if (!results.length) {
      const direct = await xeberCallBackend(params, 'all', 85000).catch(function(e) {
        return { ok:false, source:'all', error: ((e && e.message) || e), results: [] };
      });
      const directResults = normalizeXeberList(xeberDedupResults(direct.results || [])).slice(0, params.limit);
      if (directResults.length) {
        results = directResults;
        status.push({ source: 'all-fallback', ok: true, error: '', count: directResults.length, timeout: false });
        errors = [];
      } else {
        status.push({ source: 'all-fallback', ok: false, error: direct.error || 'all backend nəticə qaytarmadı', count: 0, timeout: !!direct.timeout });
        errors = status.filter(function(s) { return !s.ok; }).map(function(s) { return s.source + ': ' + s.error; });
      }
    }

    out = {
      ok: results.length > 0,
      results: results,
      total: results.length,
      updated_at: new Date().toISOString(),
      sources: XEBER_PARALLEL_SOURCES,
      source_status: status,
      partial_errors: errors,
      error: results.length ? '' : (errors.length ? ('Heç bir mənbədən nəticə gəlmədi: ' + errors.join(' | ')) : 'Xəbər nəticəsi boş gəldi')
    };
  }

  if (kv) {
    try {
      const ttl = (out.results || []).length ? 600 : 90;
      await kv.put(cacheKey, JSON.stringify(out), { expirationTtl: ttl });
    } catch (_) {}
  }
  return out;
}

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  const env = process.env;
  const ctx = {};
    ACCESS_USER = env.ACCESS_USER || ACCESS_USER;
    ACCESS_PASS = env.ACCESS_PASS || ACCESS_PASS;
    CH_API_KEY  = env.CH_API_KEY  || CH_API_KEY;
    HOQQA_GROQ_KEY = env.HOQQA_GROQ_KEY || HOQQA_GROQ_KEY;
    HF_TOKEN = env.HF_TOKEN || HF_TOKEN;
    if (!checkLogin(request)) {
      return requireLogin();
    }

    const url = new URL(request.url);

    // Rate limiting
    // MSK doğum finder result polling hər 1-2 saniyədən bir çağırılır.
    // Ona görə bu iki endpoint rate-limitdən çıxarılır; əks halda frontend
    // uzun axtarış zamanı 429 alıb "Server məşğuldur" kimi görünə bilər.
    const kv = null;
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const skipRateLimit = (
      url.pathname === '/api/msk-find-birth-start' ||
      url.pathname === '/api/msk-find-birth-result'
    );

    if (!skipRateLimit && await checkRateLimit(kv, clientIp)) {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Limit</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f1117;color:#e2e8f0"><h2>⏳ Çox sorğu</h2><p>Bir dəqiqədən sonra yenidən cəhd edin.</p></body></html>',
        { status: 429, headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Retry-After': '60' } }
      );
    }
    // HOQQA — süni zəka araşdırma API
    if (url.pathname === '/api/research' && request.method === 'POST') {
      return handleHoqqa(request, env);
    }
    // GeoVLM — şəkildən coğrafi yer (Gradio Space)
    if (url.pathname === '/api/geovlm' && request.method === 'POST') {
      return handleGeoVLM(request);
    }
    // StreetCLIP — public HF Space üzərindən ölkə təxmini
    if (url.pathname === '/api/sclip' && request.method === 'POST') {
      return handleSclip(request);
    }
    // DÜNYA / İngiltərə — Companies House (UK) rəsmi API
    if (url.pathname === '/api/uk') {
      return handleUK(url);
    }
    // DÜNYA / NorthData — Avropa şirkət/şəxs axtarışı (scraping)
    if (url.pathname === '/api/northdata') {
      return handleNorthData(url);
    }
    // DÜNYA / Rusiya — companies.rbc.ru (scraping)
    if (url.pathname === '/api/russia') {
      return handleRussia(url);
    }
    // DÜNYA / Rusiya şəxs — companies.rbc.ru/search/persons (scraping)
    if (url.pathname === '/api/russia-persons') {
      return handleRussiaPersons(url);
    }
    // DÜNYA / Çexiya — ARES rəsmi API
    if (url.pathname === '/api/czech') {
      return handleCzech(url);
    }
    // DÜNYA / Belarus — ЕГР rəsmi API
    if (url.pathname === '/api/belarus') {
      return handleBelarus(url);
    }




    // -- AİLƏ AĞACI API proxy: GCP serverdəki aile-api.php ilə işləyir --
    if (url.pathname === '/api/aile') {
      const gp = new URLSearchParams(url.searchParams);
      const apiUrl = AILE_API_RELAY + (gp.toString() ? '?' + gp.toString() : '');
      const init = {
        method: request.method,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'Authorization': 'Basic ' + btoa(ACCESS_USER + ':' + ACCESS_PASS)
        },
        cf: { cacheTtl: 0 }
      };
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
        init.headers['Content-Type'] = request.headers.get('Content-Type') || 'application/json; charset=utf-8';
      }
      try {
        const rr = await fetch(apiUrl, init);
        const body = await rr.text();
        const t = body.trim();
        if (!t.startsWith('{') && !t.startsWith('[')) {
          return new Response(JSON.stringify({ ok:false, error:'AİLƏ API JSON qaytarmadı: ' + t.slice(0,180) }), {
            status: 200,
            headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
          });
        }
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok:false, error:'AİLƏ API xətası: ' + e.message }), {
          status: 200,
          headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
        });
      }
    }

    // -- İDARƏ CANLI AXTARIŞ (D1 + FTS5) — birləşdirilmiş baza, diakritikasız --
    if (url.pathname === '/api/idare/search') {
      return handleIdareSearch(url, env);
    }

    // -- SEÇİCİ CANLI AXTARIŞ (təmizlənmiş voters.db + FTS5) — GCP proxy --
    if (url.pathname === '/api/secici/search') {
      const CORS = { 'Content-Type': 'application/json;charset=UTF-8', 'Access-Control-Allow-Origin': '*' };
      const allowed = ['q','daire','menteqe','dogum_ili','limit'];
      const gp = new URLSearchParams();
      for (const k of allowed) { const v = url.searchParams.get(k); if (v) gp.set(k, v); }
      try {
        const resp = await fetch(SECICI_FTS_RELAY + '?' + gp.toString(), EDGE_CACHE);
        const text = (await resp.text()).trim();
        if (!text.startsWith('{')) {
          return new Response(JSON.stringify({ ok:false, error:'PHP JSON qaytarmadı: '+text.slice(0,160), results:[] }), { status:502, headers:CORS });
        }
        return new Response(text, { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ ok:false, error:String(e && e.message || e), results:[] }), { status:500, headers:CORS });
      }
    }


    // -- XƏBƏR API proxy: GCP-dəki xeber-api.php xəbər siyahısını qaytarır --
    // V120: "Hamısı" rejimində mənbələr ayrı-ayrı paralel çağırılır.
    // Bir mənbə ilişsə, digərləri yenə görünür.
    if (url.pathname === '/api/xeber') {
      const params = {
        source: clean(url.searchParams.get('source') || 'all') || 'all',
        q: clean(url.searchParams.get('q') || ''),
        limit: Number(url.searchParams.get('limit') || 45) || 45,
        refresh: url.searchParams.get('refresh') === '1'
      };
      if (params.limit < 1) params.limit = 45;
      if (params.limit > 80) params.limit = 80;

      const cacheKey = 'xeber:v7:' + xeberParamsKey(params);
      const JSON_H = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' };

      // V126: /api/xeber heç vaxt sonsuz "loading" qaytarmır.
      // Səhifə onsuz da dərhal açılır; xəbərlər brauzerdə ayrıca fetch ilə gəlir.
      // Cache varsa dərhal göstərilir, yoxdursa real backend cavabı gözlənilir.
      if (kv && !params.refresh) {
        try {
          const cached = await kv.get(cacheKey, { type: 'text' });
          if (cached) return new Response(cached, { status: 200, headers: JSON_H });
        } catch (_) {}
      }

      try {
        const data = await xeberLoadData(params, kv);
        return new Response(JSON.stringify(data), { status: 200, headers: JSON_H });
      } catch (e) {
        return new Response(JSON.stringify({
          ok:false,
          error:'XƏBƏR relay xətası: ' + ((e && e.message) || e),
          results:[]
        }), { status: 200, headers: JSON_H });
      }
    }

    // -- Wikidata / Wikipedia / Nominatim (açıq API) --
    if (url.pathname === '/api/wikipedia') {
      const q=(url.searchParams.get('q')||'').trim();
      const lang=((url.searchParams.get('lang')||'en').replace(/[^a-z]/g,''))||'en';
      if(!q) return new Response(JSON.stringify({query:{search:[]}}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
      try{ const r=await fetch('https://'+lang+'.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=15&srsearch='+encodeURIComponent(q),{headers:{'Accept':'application/json','User-Agent':'axtar-osint/1.0'}}); return new Response(await r.text(),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }catch(e){ return new Response(JSON.stringify({error:String((e&&e.message)||e)}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}}); }
    }
    if (url.pathname === '/api/nominatim') {
      const q=(url.searchParams.get('q')||'').trim();
      if(!q) return new Response(JSON.stringify([]),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
      try{ const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&q='+encodeURIComponent(q),{headers:{'Accept':'application/json','User-Agent':'axtar-osint/1.0 (research tool)'}}); return new Response(await r.text(),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }catch(e){ return new Response(JSON.stringify({error:String((e&&e.message)||e)}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}}); }
    }
    // -- DOMEN: subdomain (CertSpotter + crt.sh birgə) --
    if (url.pathname === '/api/crtsh') {
      const q = (url.searchParams.get('q')||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'');
      if (!q) return new Response(JSON.stringify({error:'domen yazın'}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
      const hosts = {};
      const NL = String.fromCharCode(10);
      try {
        const r = await fetch('https://api.certspotter.com/v1/issuances?include_subdomains=true&expand=dns_names&domain='+encodeURIComponent(q), { headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'} });
        if (r.ok) { const j = await r.json(); if (Array.isArray(j)) j.forEach(function(x){ (x.dns_names||[]).forEach(function(h){ h=String(h).toLowerCase(); if(h && h.indexOf('*')<0) hosts[h]=1; }); }); }
      } catch(e){}
      try {
        const r2 = await fetch('https://crt.sh/?output=json&q='+encodeURIComponent('%.'+q), { headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'} });
        const t = await r2.text();
        if (t.trim().charAt(0) === '[') { JSON.parse(t).forEach(function(it){ String(it.name_value||'').split(NL).forEach(function(h){ h=h.trim().toLowerCase(); if(h && h.indexOf('*')<0) hosts[h]=1; }); }); }
      } catch(e){}
      const list = Object.keys(hosts).sort();
      if (!list.length) return new Response(JSON.stringify({error:'Nəticə yoxdur və ya mənbələr cavab vermədi (bir az sonra yenə cəhd et)'}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
      return new Response(JSON.stringify({hosts:list, total:list.length}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    }
    // -- Wayback Machine snapshot siyahısı --
    if (url.pathname === '/api/wayback') {
      const u = (url.searchParams.get('url')||'').trim();
      if (!u) return new Response(JSON.stringify({error:'url yazın'}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
      try {
        const api = 'https://web.archive.org/cdx/search/cdx?output=json&limit=200&collapse=digest&url=' + encodeURIComponent(u);
        const r = await fetch(api, { headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'} });
        return new Response(await r.text(),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
      } catch(e){ return new Response(JSON.stringify({error:'Wayback xətası: '+(e&&e.message||e)}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}}); }
    }
    // -- ALEPH (OCCRP): axtarış + şəxs->şirkət zənginləşdirmə --
    if (url.pathname === '/api/aleph') {
      const q = (url.searchParams.get('q')||'').trim();
      const key = env.ALEPH_API_KEY || '';
      if (!key) return new Response(JSON.stringify({error:'ALEPH_API_KEY qurulmayıb (Cloudflare Secret).'}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
      if (!q) return new Response(JSON.stringify({results:[],companies:[],total:0}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
      const H = {'Accept':'application/json','Authorization':'ApiKey '+key,'User-Agent':'Mozilla/5.0'};
      const base = 'https://aleph.occrp.org/api/2/entities?limit=100&q=' + encodeURIComponent(q) + '&filter:schemata=';
      const schemata = ['Thing','Event','Document','Pages'];
      try {
        const parts = await Promise.all(schemata.map(function(sch){ return fetch(base+sch,{headers:H}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}); }));
        const seen={}; const results=[]; let total=0;
        for (const p of parts){ if(!p||!Array.isArray(p.results))continue; total+=Number(p.total||0); for(const it of p.results){ if(it&&it.id&&!seen[it.id]){seen[it.id]=1; results.push(it);} } }
        const vmap={};
        results.forEach(function(r){
          var pr=r.properties||{};
          var voen=(pr.voenCode&&pr.voenCode[0])||'';
          if(!voen){ var nm=(pr.name&&pr.name[0])||''; var m=nm.match(/(\d{8,10})/); if(m) voen=m[1]; }
          if(!voen) return;
          if(!vmap[voen]) vmap[voen]={voen:voen, dirs:{}, name:'', address:'', legalForm:'', capital:'', id:''};
          if(!vmap[voen].name && pr.name && pr.name[0] && !/^\d/.test(pr.name[0])) vmap[voen].name=pr.name[0];
          if(!vmap[voen].address && pr.address && pr.address[0]) vmap[voen].address=pr.address[0];
          if(pr.legalForm && pr.legalForm[0]) vmap[voen].legalForm=pr.legalForm[0];
          if(pr.capital && pr.capital[0]) vmap[voen].capital=pr.capital[0];
          (pr.summary||[]).forEach(function(line){ String(line).split('|').forEach(function(part){ part=part.trim(); if(/O[ĞG]LU|Q[İI]ZI/i.test(part)&&part.length<70) vmap[voen].dirs[part]=1; }); });
        });
        const voens = Object.keys(vmap).slice(0,20);
        await Promise.all(voens.map(function(v){
          var o=vmap[v];
          if(o.name && o.address) return null;
          return fetch('https://aleph.occrp.org/api/2/entities?limit=1&filter:schemata=Company&q='+encodeURIComponent(v),{headers:H})
            .then(function(x){return x.ok?x.json():null;})
            .then(function(jj){ var c=jj&&jj.results&&jj.results[0]; if(c){ var cp=c.properties||{}; if(!o.name&&cp.name&&cp.name[0])o.name=cp.name[0]; if(!o.address&&cp.address&&cp.address[0])o.address=cp.address[0]; if(!o.legalForm&&cp.legalForm&&cp.legalForm[0])o.legalForm=cp.legalForm[0]; if(!o.capital&&cp.capital&&cp.capital[0])o.capital=cp.capital[0]; o.id=c.id; } })
            .catch(function(){});
        }));
        const companies = voens.map(function(v){ var o=vmap[v]; return {voen:v, name:o.name||'', address:o.address||'', legalForm:o.legalForm||'', capital:o.capital||'', directors:Object.keys(o.dirs), id:o.id||''}; });
        return new Response(JSON.stringify({status:'ok', total:total, companies:companies, results:results}), {status:200, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
      } catch(e){ return new Response(JSON.stringify({error:'Aleph xətası: '+((e&&e.message)||e)}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}}); }
    }

    // -- DÜNYA əlavə reyestrlər: Norveç/Fransa/GLEIF (açarsız JSON proxy) --
    if (url.pathname === '/api/norway') {
      const q = (url.searchParams.get('q')||'').trim();
      const digits = q.replace(/\D/g,'');
      const api = /^\d{9}$/.test(digits)
        ? 'https://data.brreg.no/enhetsregisteret/api/enheter/' + digits
        : 'https://data.brreg.no/enhetsregisteret/api/enheter?size=10&navn=' + encodeURIComponent(q);
      try { const r = await fetch(api, { headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'}, cf:{cacheTtl:300,cacheEverything:true} }); return new Response(await r.text(),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
      catch(e){ return new Response(JSON.stringify({error:String(e)}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}}); }
    }
    if (url.pathname === '/api/france') {
      const q = (url.searchParams.get('q')||'').trim();
      const api = 'https://recherche-entreprises.api.gouv.fr/search?per_page=10&page=1&q=' + encodeURIComponent(q);
      try { const r = await fetch(api, { headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'}, cf:{cacheTtl:300,cacheEverything:true} }); return new Response(await r.text(),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
      catch(e){ return new Response(JSON.stringify({error:String(e)}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}}); }
    }
    if (url.pathname === '/api/gleif') {
      const q = (url.searchParams.get('q')||'').trim();
      const isLei = /^[A-Za-z0-9]{20}$/.test(q);
      const api = isLei
        ? 'https://api.gleif.org/api/v1/lei-records/' + encodeURIComponent(q)
        : 'https://api.gleif.org/api/v1/lei-records?page[size]=10&filter[entity.legalName]=' + encodeURIComponent(q);
      try { const r = await fetch(api, { headers:{'Accept':'application/vnd.api+json','User-Agent':'Mozilla/5.0'}, cf:{cacheTtl:300,cacheEverything:true} }); return new Response(await r.text(),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
      catch(e){ return new Response(JSON.stringify({error:String(e)}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}}); }
    }

    // -- UKRAYNA API proxy: GCP-dəki ukr-api.php (Opendatabot) -> JSON --
    if (url.pathname === '/api/ukraine') {
      const gp = new URLSearchParams();
      const q = url.searchParams.get('q') || '';
      if (q) gp.set('q', q);
      try {
        const rr = await fetch(UKR_RELAY + '?' + gp.toString(), {
          headers: { 'Accept':'application/json', 'User-Agent':'Mozilla/5.0', 'Authorization':'Basic ' + btoa(ACCESS_USER + ':' + ACCESS_PASS) },
          cf: { cacheTtl: 300, cacheEverything: true }
        });
        const body = await rr.text();
        const t = body.trim();
        if (!t.startsWith('{')) {
          return new Response(JSON.stringify({ ok:false, error:'Ukrayna backend JSON qaytarmadı: ' + t.slice(0,180) }), { status:200, headers:{ 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store' } });
        }
        return new Response(body, { status:200, headers:{ 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store' } });
      } catch (e) {
        return new Response(JSON.stringify({ ok:false, error:'Ukrayna relay xətası: ' + e.message }), { status:200, headers:{ 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store' } });
      }
    }

    // -- MSK UNVAN API proxy: GCP PHP relay ASP.NET sessiya/postback isini gorur --
    if (url.pathname === '/api/msk-unvan') {
      const allowed = ['action','rayonId','rayonName','street','house'];
      const gp = new URLSearchParams();
      for (const key of allowed) {
        const v = url.searchParams.get(key);
        if (v !== null && v !== '') gp.set(key, v);
      }
      const action = gp.get('action') || 'rayons';
      if (!['rayons','streets','houses','result'].includes(action)) {
        return new Response(JSON.stringify({ ok:false, error:'Yanlis MSK UNVAN action.' }), {
          status: 400,
          headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
        });
      }
      try {
        const rr = await fetch(MSK_UNVAN_RELAY + '?' + gp.toString(), {
          headers: { 'Accept':'application/json', 'User-Agent':'Mozilla/5.0', 'Authorization':'Basic ' + btoa(ACCESS_USER + ':' + ACCESS_PASS) },
          cf: { cacheTtl: 0 }
        });
        const body = await rr.text();
        const t = body.trim();
        if (!t.startsWith('{')) {
          return new Response(JSON.stringify({ ok:false, error:'MSK UNVAN backend JSON qaytarmadi: ' + t.slice(0,180) }), {
            status: 200,
            headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
          });
        }
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok:false, error:'MSK UNVAN relay xetasi: ' + e.message }), {
          status: 200,
          headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
        });
      }
    }


    // -- MSK SEÇİCİ API proxy: GCP-dəki msk-secici.php ajax cavabını Worker içindən çağırır --
    if (url.pathname === '/api/msk-secici') {
      const allowed = ['q','daire','menteqe','dogum_ili','limit'];
      const gp = new URLSearchParams();
      gp.set('ajax', '1');
      for (const key of allowed) {
        const v = url.searchParams.get(key);
        if (v !== null && v !== '') gp.set(key, v);
      }
      try {
        const rr = await fetch(MSK_SECICI_RELAY + '?' + gp.toString(), {
          headers: { 'Accept':'application/json', 'User-Agent':'Mozilla/5.0', 'Authorization':'Basic ' + btoa(ACCESS_USER + ':' + ACCESS_PASS) },
          cf: { cacheTtl: 0 }
        });
        const body = await rr.text();
        const t = body.trim();
        if (!t.startsWith('{')) {
          return new Response(JSON.stringify({ ok:false, error:'MSK SEÇİCİ backend JSON qaytarmadı: ' + t.slice(0,180) }), {
            status: 200,
            headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
          });
        }
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok:false, error:'MSK SEÇİCİ relay xətası: ' + e.message }), {
          status: 200,
          headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
        });
      }
    }

    // ── ETNDR API: ETNDR tabının canlı axtarış endpoint-i ──
    // Client JS bura sorğu atır (eyni origin → mixed-content yox, Basic auth avtomatik gedir).
    // Worker server tərəfdən muntezir.de/etender-api.php relay-inə ötürür (curl + proxy).
    // ── SHERLOCK API proxy: GCP backend sherlock-api.php relay ──
    // (UI server-side render istifadə edir; bu endpoint test/uyğunluq üçün saxlanılır.)
    if (url.pathname === '/api/sherlock') {
      const slUser = clean(url.searchParams.get('username') || url.searchParams.get('q') || '');
      try {
        const slResp = await fetch('http://34.30.56.108.nip.io/bazalar/sherlock-api.php?username=' + encodeURIComponent(slUser), {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        const slBody = await slResp.text();
        const slT = slBody.trim();
        if (slT.startsWith('{') || slT.startsWith('[')) {
          return new Response(slBody, {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        }
        return new Response(JSON.stringify({ ok: false, error: 'Server JSON qaytarmadı (HTTP ' + slResp.status + ')' }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: 'Sherlock proxy xətası: ' + e.message }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
    }

    // SMAB canlı axtarış proksisi — brauzer HTTPS-dən GCP HTTP-yə birbaşa gedə bilmir,
    // ona görə Worker server tərəfdən smab-api.php-yə ötürür (eyni origin → mixed-content yox).
    if (url.pathname === '/api/smab') {
      const sq = url.searchParams.get('q') || '';
      try {
        const r = await fetch('http://34.30.56.108.nip.io/bazalar/smab-api.php?q=' + encodeURIComponent(sq), {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        const body = await r.text();
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: 'SMAB əlçatmazdır: ' + e.message }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    // CORONA / CBAR canlı FTS5 axtarış proksisi (live-search.php)
    if (url.pathname === '/api/live') {
      const ldb = url.searchParams.get('db') || '';
      const lq = url.searchParams.get('q') || '';
      try {
        const r = await fetch('http://34.30.56.108.nip.io/bazalar/live-search.php?db=' + encodeURIComponent(ldb) + '&q=' + encodeURIComponent(lq), {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        const body = await r.text();
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: 'Live axtarış əlçatmazdır: ' + e.message }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    if (url.pathname === '/api/etndr') {
      const ALLOWED = ['SupplierVoen','supplierName','Keyword','EventName',
        'ContractAmountFrom','ContractAmountTo','PublishDateFrom','PublishDateTo',
        'ContractDateFrom','ContractDateTo','PageSize','PageNumber','proxy','action'];
      const relayParams = new URLSearchParams();
      for (const key of ALLOWED) {
        const v = url.searchParams.get(key);
        if (v !== null && v !== '') relayParams.set(key, v);
      }
      const relayUrl = ETENDER_RELAY + '?' + relayParams.toString();
      // Cloudflare edge bəzən muntezir.de-yə bir anlıq qoşula bilmir → 502.
      // Relay sürətli olduğu üçün (≤7s) Worker 4 dəfə təkrar edir; biri tutur.
      let lastBody = '';
      let lastErr = '';
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          const relayResp = await fetch(relayUrl, {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'az,en;q=0.9',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
            },
            cf: { cacheTtl: 0 }
          });
          lastBody = await relayResp.text();
          const t = lastBody.trim();
          const looksJson = t.startsWith('{') || t.startsWith('[');
          if (relayResp.status === 200 && looksJson) {
            return new Response(lastBody, {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
            });
          }
          lastErr = 'HTTP ' + relayResp.status;
        } catch (e) {
          lastErr = e.message;
        }
        if (attempt < 4) await new Promise(r => setTimeout(r, 350));
      }
      // 3 cəhddən sonra alınmadı — təmiz JSON xəta qaytar (qeyri-JSON 502 deyil)
      if (lastBody.trim().startsWith('{')) {
        return new Response(lastBody, {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
      return new Response(JSON.stringify({
        ok: false,
        error: 'Relay-ə qoşulmaq alınmadı (3 cəhd). Son: ' + lastErr + '. Bir az sonra yenidən cəhd et.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }


    // ── WHOIS API proxy: DNS/RDAP backend relay ──
    // Client JS bura sorğu atır (eyni origin → Basic auth avtomatik qalır).
    if (url.pathname === '/api/whois') {
      const domain = clean(url.searchParams.get('q') || url.searchParams.get('domain') || url.searchParams.get('whoisDomain') || '');

      let apiUrl = 'http://34.30.56.108.nip.io/bazalar/whois-api.php?q=' + encodeURIComponent(domain || '');
      let apiInit = {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        cf: { cacheTtl: 0 }
      };

      if (request.method === 'POST') {
        const body = await request.text();
        apiInit.method = 'POST';
        apiInit.headers = {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };
        apiInit.body = body;
      } else if (!domain) {
        return new Response(JSON.stringify({ ok: false, error: 'Domen boşdur' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }

      try {
        const apiResp = await fetch(apiUrl, apiInit);
        const body = await apiResp.text();
        const t = body.trim();
        if (!t.startsWith('{')) {
          return new Response(JSON.stringify({
            ok: false,
            error: 'WHOIS backend JSON qaytarmadı: ' + t.slice(0, 160)
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        }
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: 'WHOIS backend xətası: ' + e.message }), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
    }

    // ── TOBB PDF proxy: brauzer TOBB sessiyasız açmasın deyə PDF-i GCP relay öz cookie-si ilə çəkir ──
    if (url.pathname === '/api/tobb-pdf') {
      const token = clean(url.searchParams.get('u') || '');
      if (!token) {
        return new Response('PDF token yoxdur', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
      const pdfResp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?action=pdf&u=' + encodeURIComponent(token), {
        headers: { 'Accept': 'application/pdf,*/*', 'User-Agent': 'Mozilla/5.0' },
        cf: { cacheTtl: 0 }
      });
      const body = await pdfResp.arrayBuffer();
      return new Response(body, {
        status: pdfResp.status,
        headers: {
          'Content-Type': pdfResp.headers.get('Content-Type') || 'application/pdf',
          'Content-Disposition': 'inline; filename="tobb-gazete.pdf"',
          'Cache-Control': 'no-store'
        }
      });
    }

    // ── TOBB Güncelle proxy: captcha/session axını brauzerdə CORS/mixed-content problemi yaratmasın deyə Worker üzərindən gedir ──
    if (url.pathname === '/api/tobb-guncelle') {
      const allowed = ['action', 'sicil', 'SicilNo', 'vergi', 'VergiNo', 'token', 'captcha', 'Captcha'];
      const gp = new URLSearchParams();
      for (const key of allowed) {
        const v = url.searchParams.get(key);
        if (v !== null && v !== '') gp.set(key, v);
      }

      const action = gp.get('action') || '';
      if (!['guncelle_captcha', 'guncelle_submit'].includes(action)) {
        return new Response(JSON.stringify({ ok: false, error: 'Yanlış Güncelle action.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }

      const apiUrl = 'http://34.30.56.108.nip.io/bazalar/tobb-api.php?' + gp.toString();
      const gr = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        cf: { cacheTtl: 0 }
      });

      const gt = await gr.text();
      return new Response(gt, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }
    // ========================= MSK BIRTH FINDER (polling) =========================
    // POST /api/msk-find-birth-start  -> backend task yaradır
    // GET  /api/msk-find-birth-result -> progress/nəticə qaytarır
    //
    // Vacib:
    // - Worker yalnız proxy edir; real gün/ay döngüsü GCP backend-dədir.
    // - running/queued/not_found statusları error kimi qaytarılmır.
    // - checked/total/percent/current sahələri frontend-ə düz ötürülür.
    // - Bu endpointlər yuxarıda rate-limitdən çıxarılıb, çünki frontend polling edir.

    function mskBirthJson(obj, status = 200) {
      return new Response(JSON.stringify(obj), {
        status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    function mskBirthClean(v) {
      return String(v || '').trim();
    }

    function mskBirthUpper(v) {
      return mskBirthClean(v).toUpperCase();
    }

    function mskBirthNumber(v, fallback = 0) {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    }

    function mskBirthPickDate(data) {
      const r = data && data.result;

      if (typeof data.tarix === 'string' && data.tarix) return data.tarix;
      if (typeof data.date === 'string' && data.date) return data.date;
      if (typeof data.birth_date === 'string' && data.birth_date) return data.birth_date;

      if (typeof r === 'string' && r) return r;
      if (r && typeof r === 'object') {
        if (typeof r.birth_date === 'string' && r.birth_date) return r.birth_date;
        if (typeof r.tarix === 'string' && r.tarix) return r.tarix;
        if (typeof r.date === 'string' && r.date) return r.date;
      }

      return '';
    }

    function mskBirthNormalizeStatus(data) {
      const rawStatus = mskBirthClean(data && data.status);
      const rawError = mskBirthClean(data && data.error);

      if (rawStatus === 'queued') return 'queued';
      if (rawStatus === 'running') return 'running';
      if (rawStatus === 'found') return 'found';
      if (rawStatus === 'not_found') return 'not_found';
      if (rawStatus === 'missing') return 'missing';
      if (rawStatus === 'error') return 'error';

      if (data && data.ok === true && mskBirthPickDate(data)) return 'found';

      if (rawError === 'queued') return 'queued';
      if (rawError === 'not_ready') return 'running';
      if (rawError === 'running') return 'running';
      if (rawError === 'not_found') return 'not_found';
      if (rawError === 'task_missing') return 'missing';
      if (rawError === 'missing') return 'missing';

      if (rawStatus) return rawStatus;
      return data && data.ok === false ? 'running' : 'running';
    }

    function mskBirthVisibleError(status, backendError) {
      const e = mskBirthClean(backendError);

      // Bunlar frontend üçün xəta deyil, normal proses statusudur.
      if (status === 'queued' || status === 'running' || status === 'not_found') return '';
      if (e === 'queued' || e === 'not_ready' || e === 'running' || e === 'not_found') return '';

      return e;
    }

    if (url.pathname === '/api/msk-find-birth-start' && request.method === 'POST') {
      try {
        let body = {};
        try {
          body = await request.json();
        } catch (_) {
          body = {};
        }

        const soyad = mskBirthUpper(body.soyad || body.surname || body.lastName);
        const ad = mskBirthUpper(body.ad || body.name || body.firstName);
        const ataAdi = mskBirthUpper(body.ataAdi || body.ata_adi || body.father || body.fatherName);
        const cins = mskBirthClean(body.cins || body.gender || body.sex || 'Kişi');
        const dogumIli = mskBirthClean(body.dogumIli || body.year || body.il);

        if (!soyad || !ad || !ataAdi || !cins || !dogumIli) {
          return mskBirthJson({
            ok: false,
            status: 'error',
            error: 'Bütün sahələr tələb olunur.'
          }, 400);
        }

        if (!/^\d{4}$/.test(dogumIli)) {
          return mskBirthJson({
            ok: false,
            status: 'error',
            error: 'Doğum ili 4 rəqəm olmalıdır.'
          }, 400);
        }

        const y = Number(dogumIli);
        if (y < 1900 || y > 2008) {
          return mskBirthJson({
            ok: false,
            status: 'error',
            error: 'Doğum ili real intervalda deyil.'
          }, 400);
        }

        const backendUrl = 'http://34.30.56.108.nip.io/bazalar/msk-birth-api/start';

        const resp = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({ soyad, ad, ataAdi, cins, dogumIli }),
          cf: { cacheTtl: 0, cacheEverything: false }
        });

        const raw = await resp.text();
        const trimmed = raw.trim();

        let data;
        try {
          data = JSON.parse(trimmed);
        } catch (_) {
          return mskBirthJson({
            ok: false,
            status: 'error',
            error: 'Backend JSON qaytarmadı',
            http_status: resp.status,
            raw_head: trimmed.slice(0, 300)
          }, 200);
        }

        const taskId = data.task_id || data.id || data.taskId || '';

        if (!taskId) {
          return mskBirthJson({
            ok: false,
            status: 'error',
            error: 'Backend task_id qaytarmadı',
            backend: data
          }, 200);
        }

        const status = mskBirthNormalizeStatus(data);

        return mskBirthJson({
          ok: true,
          status: status || 'queued',
          task_id: taskId,
          id: taskId,
          checked: mskBirthNumber(data.checked, 0),
          total: mskBirthNumber(data.total, 365),
          percent: mskBirthNumber(data.percent, 0),
          current: data.current || '',
          error: '',
          message: data.message || 'Növbədə gözləyir',
          backend: data
        }, 200);

      } catch (e) {
        return mskBirthJson({
          ok: false,
          status: 'error',
          error: 'Worker start xətası: ' + (e && e.message ? e.message : String(e))
        }, 200);
      }
    }

    if (url.pathname === '/api/msk-find-birth-result' && request.method === 'GET') {
      const taskId = mskBirthClean(url.searchParams.get('id') || url.searchParams.get('task_id') || '');

      if (!taskId) {
        return mskBirthJson({
          ok: false,
          status: 'missing',
          error: 'task id tələb olunur'
        }, 400);
      }

      try {
        const backendUrl = 'http://34.30.56.108.nip.io/bazalar/msk-birth-api/result?id=' + encodeURIComponent(taskId);

        const resp = await fetch(backendUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          cf: { cacheTtl: 0, cacheEverything: false }
        });

        const raw = await resp.text();
        const trimmed = raw.trim();

        let data;
        try {
          data = JSON.parse(trimmed);
        } catch (_) {
          return mskBirthJson({
            ok: false,
            status: 'error',
            error: 'Backend JSON qaytarmadı',
            http_status: resp.status,
            raw_head: trimmed.slice(0, 300)
          }, 200);
        }

        const status = mskBirthNormalizeStatus(data);
        const foundDate = mskBirthPickDate(data);
        const checked = mskBirthNumber(data.checked || data.checked_days, 0);
        const total = mskBirthNumber(data.total || data.total_days, 365);
        const backendPercent = mskBirthNumber(data.percent, 0);
        const computedPercent = total > 0 ? Math.round((checked / total) * 1000) / 10 : 0;
        const percent = backendPercent || computedPercent;

        return mskBirthJson({
          ok: status === 'found',
          status,
          task_id: taskId,
          id: taskId,
          tarix: status === 'found' ? foundDate : '',
          result: status === 'found' ? (data.result || foundDate) : (data.result || ''),
          checked,
          total,
          percent,
          current: data.current || data.current_date || '',
          month: data.month || '',
          day: data.day || '',
          elapsed: mskBirthNumber(data.elapsed, 0),
          error: mskBirthVisibleError(status, data.error),
          message: data.message || (
            status === 'queued' ? 'Növbədə gözləyir' :
            status === 'running' ? 'Axtarılır' :
            status === 'not_found' ? 'Uyğun tarix tapılmadı' :
            status === 'found' ? 'Tapıldı' :
            ''
          ),
          backend: data
        }, 200);

      } catch (e) {
        return mskBirthJson({
          ok: false,
          status: 'error',
          error: 'Worker result xətası: ' + (e && e.message ? e.message : String(e))
        }, 200);
      }
    }

    const tin = clean(url.searchParams.get('tin') || '');
    const name = clean(url.searchParams.get('name') || '');
    const q = clean(url.searchParams.get('q') || '');
    let whoisDomain = clean(url.searchParams.get('whoisDomain') || '');
    let whoisRaw = '';
    let page = clean(url.searchParams.get('page') || 'universal');
    const osintSub = clean(url.searchParams.get('osintSub') || 'bb');
    const smabSub = clean(url.searchParams.get('smabSub') || 'smab');

    // ── ETNDR (etender.gov.az müqavilə axtarışı) filtrləri ──
    const etSupplierVoen = clean(url.searchParams.get('etSupplierVoen') || '');
    const etSupplierName = clean(url.searchParams.get('etSupplierName') || '');
    const etKeyword      = clean(url.searchParams.get('etKeyword') || '');
    const etEventName    = clean(url.searchParams.get('etEventName') || '');
    const etAmountFrom   = clean(url.searchParams.get('etAmountFrom') || '');
    const etAmountTo     = clean(url.searchParams.get('etAmountTo') || '');
    const etPublishFrom  = clean(url.searchParams.get('etPublishFrom') || '');
    const etPublishTo    = clean(url.searchParams.get('etPublishTo') || '');
    const etContractFrom = clean(url.searchParams.get('etContractFrom') || '');
    const etContractTo   = clean(url.searchParams.get('etContractTo') || '');
    const etPageSize     = clean(url.searchParams.get('etPageSize') || '15');
    const etPage         = clean(url.searchParams.get('etPage') || '1');
    const tenderMode = clean(url.searchParams.get('tenderMode') || 'events');
    const tdrDistrictId = clean(url.searchParams.get('tdrDistrictId') || '76');
    const voemPage = clean(url.searchParams.get('vp') || '');
    const provider = clean(url.searchParams.get('provider') || 'aztelekom');
    const b2bMode = clean(url.searchParams.get('b2bMode') || 'people');
    const b2bVoen = clean(url.searchParams.get('b2bVoen') || '');
    const b2bId = clean(url.searchParams.get('b2bId') || '');
    const b2bName = clean(url.searchParams.get('b2bName') || '');
    const b2bCompany = clean(url.searchParams.get('b2bCompany') || '');
    const b2bLastName = clean(url.searchParams.get('b2bLastName') || '');
    const b2bFirstName = clean(url.searchParams.get('b2bFirstName') || '');
    const b2bPatronymic = clean(url.searchParams.get('b2bPatronymic') || '');
    const city = clean(url.searchParams.get('city') || '');
    const number = clean(url.searchParams.get('number') || '');
    const idareCategory = clean(url.searchParams.get('idareCategory') || '');
    const idareId = clean(url.searchParams.get('idareId') || '');
    const idareQ = clean(url.searchParams.get('idareQ') || '');
    const idareMode = clean(url.searchParams.get('idareMode') || 'search');

    const contactsMode = clean(url.searchParams.get('contactsMode') || 'search');
    const contactsId = clean(url.searchParams.get('contactsId') || url.searchParams.get('id') || '');
    const contactsStatus = clean(url.searchParams.get('contactsStatus') || '');
    const contactsCategory = clean(url.searchParams.get('contactsCategory') || '');
    const contactsLimit = clean(url.searchParams.get('contactsLimit') || '100');

    const edvMode = clean(url.searchParams.get('mode') || 'name');
    const firstName = clean(url.searchParams.get('firstName') || '');
    const lastName = clean(url.searchParams.get('lastName') || '');
    const patronymic = clean(url.searchParams.get('patronymic') || '');

    const mskLastName = clean(url.searchParams.get('mskLastName') || '');
    const mskFirstName = clean(url.searchParams.get('mskFirstName') || '');
    const mskPatronymic = clean(url.searchParams.get('mskPatronymic') || '');
    const mskBirth = clean(url.searchParams.get('mskBirth') || '');
    const mskGender = clean(url.searchParams.get('mskGender') || '');
    const mskSub = clean(url.searchParams.get('mskSub') || 'ad');
    const mskSeciciQ = clean(url.searchParams.get('q') || '');
    const mskSeciciDaire = clean(url.searchParams.get('daire') || '');
    const mskSeciciMenteqe = clean(url.searchParams.get('menteqe') || '');
    const mskSeciciBirth = clean(url.searchParams.get('dogum_ili') || '');
    const universalQ = clean(url.searchParams.get('uq') || '');
    const xeberSource = clean(url.searchParams.get('xeberSource') || 'all');
    const xeberQ = clean(url.searchParams.get('xeberQ') || '');
    const xeberRefresh = clean(url.searchParams.get('refresh') || '');

    let records = [];
    let results = [];
    let tinResult = null;
    let dbResults = [];
    let dnnResults = [];
    let dnnMnbResults = []; // DNN tabında paralel MNB axtarışının nəticələri
    let dnnRelatedVergi = []; // DNN şəxs axtarışında avtomatik VERGİ nəticələri
    let mnbResults = [];
    let voemResults = [];
    let borcResult = null;
    let edvResults = [];
    let telResult = null;
    let b2bResult = null;
    let b2bCompanyResult = null;
    let mskResults = [];
    let mskSeciciResults = [];
    let mskSeciciTotal = '';
    let mskSeciciMessage = '';
    let terkibResults = [];
    let terkibMode = '';
    let terkibMessage = '';
    let terkibTotal = '';
    let terkibMenteqeList = [];
    let terkibDaireAdi = '';
    let vergiResults = [];
    let lsnzResults = [];
    let tdrResults = [];
    let tdrCount = '';
    let tenderResults = [];
    let tenderTotal = '';
    let tenderStats = null;
    let tenderVoenName = '';   // VÖEN üzrə tapılan şirkət adı
    let tenderVoenFound = false; // VÖEN voen_siyahi-də tapıldı mı
    let etndrResults = [];     // ETNDR (etender.gov.az) müqavilə nəticələri
    let etndrData = null;      // ETNDR tam cavab (səhifələmə üçün)
    let blackbirdLines = [];
    let blackbirdUsername = '';
    let sherlockFound = [];
    let sherlockUsername = '';
    let sherlockCount = 0;
    let whoisResult = null;
    let qidaResults = [];
    let cbarResults = [];
    let cbarStats = null;
    let coronaResults = [];
    let coronaStats = null;
    let aramResults = [];
    let aramSections = [];
    let aramTotal = 0;
    let tobbResults = [];
    let tobbBaslik = '';
    let tobbMudurlukOptions = [];
    let tobbMode = url.searchParams.get('tobbMode') || 'gazete';
    let tobbPersonData = null;
    let tobbSeedData = null;
    let tobbStatsData = null;
    let itobbData = null;
    let itobbDetailData = null;
    let guncelleInfo = null;
    let idareResults = [];
    let idareOptions = [];
    let idareSearchTotal = 0;
    let idareStats = null;
    let contactsResults = [];
    let contactsContact = null;
    let contactsPhones = [];
    let contactsEmails = [];
    let contactsStats = null;
    let contactsMessage = '';
    let universalResults = [];
    let universalDnnCount = 0, universalMnbCount = 0, universalVergiCount = 0;
    let xeberResults = [];
    let xeberTotal = 0;
    let xeberMessage = '';
    let xeberUpdated = '';
    let xeberSources = [];
    let error = '';

    if (request.method === 'POST') {
      try {
        const fd = await request.formData();
        const postPage = clean(fd.get('page') || '');
        if (postPage) page = postPage;
        if (page === 'contacts') {
          const contactsAction = clean(fd.get('contactsAction') || '');
          try {
            if (contactsAction === 'addContact') {
              const api = await contactsApiJson('addContact', {}, {
                name_clean: cleanLong(fd.get('name_clean') || '', 500),
                organization_clean: cleanLong(fd.get('organization_clean') || '', 500),
                position_clean: cleanLong(fd.get('position_clean') || '', 500),
                category: cleanLong(fd.get('category') || '', 300),
                notes: cleanLong(fd.get('notes') || '', 3000),
                review_status: cleanLong(fd.get('review_status') || 'confirmed', 120),
                phone: cleanLong(fd.get('phone') || '', 300),
                phone_type: cleanLong(fd.get('phone_type') || 'unknown', 120),
                phone_notes: cleanLong(fd.get('phone_notes') || '', 1000)
              }, env);
              contactsMessage = api.ok ? 'Yeni əlaqə əlavə edildi.' : (api.error || 'Yeni əlaqə əlavə edilmədi.');
              page = 'contacts';
            }
            if (contactsAction === 'updateContact') {
              const api = await contactsApiJson('updateContact', {}, {
                id: clean(fd.get('id') || ''),
                name_clean: cleanLong(fd.get('name_clean') || ''),
                organization_clean: cleanLong(fd.get('organization_clean') || ''),
                position_clean: cleanLong(fd.get('position_clean') || ''),
                category: cleanLong(fd.get('category') || ''),
                notes: cleanLong(fd.get('notes') || '', 5000),
                review_status: cleanLong(fd.get('review_status') || '')
              }, env);
              contactsMessage = api.ok ? 'Kontakt yeniləndi.' : (api.error || 'Kontakt yenilənmədi.');
              page = 'contacts';
            }
            if (contactsAction === 'addPhone') {
              const api = await contactsApiJson('addPhone', {}, {
                contact_id: clean(fd.get('contact_id') || ''),
                phone: cleanLong(fd.get('phone') || ''),
                phone_type: cleanLong(fd.get('phone_type') || 'unknown'),
                notes: cleanLong(fd.get('phone_notes') || '', 1000)
              }, env);
              contactsMessage = api.ok ? 'Nömrə əlavə edildi.' : (api.error || 'Nömrə əlavə edilmədi.');
              page = 'contacts';
            }
if (contactsAction === 'deletePhone') {
  const api = await contactsApiJson('deletePhone', {}, {
    id: clean(fd.get('phone_id') || fd.get('id') || '')
  }, env);
  contactsMessage = api.ok ? 'Nömrə silinmiş kimi işarələndi.' : (api.error || 'Nömrə silinmədi.');
  page = 'contacts';
}
          } catch (e) {
            error = 'CONTACTS API Xətası: ' + e.message;
          }
        }
        if (page === 'whois') {
          whoisDomain = clean(fd.get('whoisDomain') || whoisDomain || '');
          whoisRaw = String(fd.get('whoisRaw') || '').trim().slice(0, 60000);
        }
      } catch (e) {
        // POST yalnız manual WHOIS RAW üçündür. Form oxunmasa, normal GET axını davam edir.
      }
    }

    if (page === 'history' && tin) {
      try {
        const resp = await fetch(`https://new.e-taxes.gov.az/api/po/authless/public/v1/authless/taxpayer-history?tin=${encodeURIComponent(tin)}`);
        const data = await resp.json();
        records = data.taxpayerHistory || [];
      } catch (e) { error = e.message; }
    }

    if (page === 'search' && name) {
      try {
        const resp = await fetch('https://new.e-taxes.gov.az/api/po/authless/public/v1/authless/findTaxpayer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            type: 'legalEntity',
            serviceCode: 'checkLegalName',
            isStateRegistry: true
          })
        });
        const data = await resp.json();
        results = data.taxpayers || [];
      } catch (e) { error = e.message; }
    }

    if (page === 'tin' && tin) {
      try {
        const resp = await fetch('https://new.e-taxes.gov.az/api/po/authless/public/v1/authless/findTaxpayer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tin,
            type: 'legalEntity',
            serviceCode: 'checkLegalName',
            isStateRegistry: true
          })
        });
        const data = await resp.json();
        tinResult = (data.taxpayers || [])[0] || null;
      } catch (e) { error = e.message; }
    }

    if (page === 'db' && q) {
      try {
        const resp = await fetch(`http://rey.muntezir.de/api.php?q=${encodeURIComponent(q)}`);
        const text = await resp.text();

        if (text.trim().startsWith('<')) {
          throw new Error('API faylı serverə yüklənməyib. rey.muntezir.de/api.php yoxlayın.');
        }

        const data = JSON.parse(text);
        if (data.error) throw new Error(data.error);
        dbResults = data.results || [];
      } catch (e) { error = e.message; }
    }

    if (page === 'dnn' && q) {
      const plateRegex = /^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/i;
      // Çoxlu nömrə lövhəsi: vergüllə ayrılmış dəstək
      const qParts = q.split(',').map(s => s.trim().toUpperCase().replace(/\s/g,'')).filter(Boolean);
      const isMultiPlate = qParts.length > 1 && qParts.every(p => plateRegex.test(p));
      const isPlateQ = plateRegex.test(q.replace(/\s/g,''));
      try {
        if (isMultiPlate) {
          // Paralel olaraq hər lövhəni ayrıca axtar
          const settled = await Promise.allSettled(qParts.map(plate =>
            kvFetch(kv, `dnn:${plate}`, KV_TTL, () =>
              fetch(`http://34.30.56.108.nip.io/bazalar/dnn-api.php?q=${encodeURIComponent(plate)}`, EDGE_CACHE).then(r => r.text())
            )
          ));
          for (const r of settled) {
            if (r.status === 'fulfilled' && !r.value.trim().startsWith('<')) {
              try { const d = JSON.parse(r.value); if (d.results) dnnResults.push(...d.results); } catch(_) {}
            }
          }
        } else {
          // SÜRƏTLİ DNN: yalnız DNN API çağırılır.
          // MNB və VERGİ avtomatik yoxlanmır, çünki onlar səhifəni gecikdirə bilir.
          // Kartlardakı keçidlər qalır: lazım olanda ayrıca MNB/VERGİ-yə keçmək olur.
          const dnnCacheKey = `dnn:${q.toUpperCase()}`;
          const dnnText = await kvFetch(kv, dnnCacheKey, KV_TTL, () =>
            fetch(`http://34.30.56.108.nip.io/bazalar/dnn-api.php?q=${encodeURIComponent(q)}`, {
              cf: { cacheTtl: 60, cacheEverything: true },
              headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
            }).then(r => r.text())
          );
          if (dnnText.trim().startsWith('<')) {
            throw new Error('DNN API faylı işləməyib. muntezir.de/bazalar/dnn-api.php yoxlayın.');
          }
          const dnnData = JSON.parse(dnnText);
          if (dnnData.error) throw new Error(dnnData.error);
          dnnResults = dnnData.results || [];
          dnnMnbResults = [];
          dnnRelatedVergi = [];
        }
      } catch (e) { error = e.message; }
    }

    if (page === 'vergi' && q) {
      try {
        const text = await kvFetch(kv, `vergi:${q.toUpperCase()}`, KV_TTL, () =>
          fetch(`http://34.30.56.108.nip.io/bazalar/vergi-api.php?q=${encodeURIComponent(q)}`, EDGE_CACHE).then(r => r.text())
        );
        const trimmed = text.trim();
        if (!trimmed.startsWith('{')) throw new Error("PHP-dən xətalı cavab gəldi.");
        const data = JSON.parse(trimmed);
        if (data.error) throw new Error(data.error);
        vergiResults = data.results || [];
      } catch (e) {
        error = "Vergi API Xətası: " + e.message;
      }
    }


    if (page === 'universal' && universalQ) {
      try {
        const uq = universalQ.toUpperCase();
        const enc = encodeURIComponent(universalQ);
        const TIMEOUT_MS = 6000;
        // Hər sorğunu vaxt limiti ilə bük — yavaş baza səhifəni dondurmasın
        const withTimeout = (p) => Promise.race([
          p,
          new Promise((res) => setTimeout(() => res('__TIMEOUT__'), TIMEOUT_MS))
        ]);
        const getText = (u) => fetch(u, { headers: { 'Accept':'application/json','User-Agent':'Mozilla/5.0' }, cf:{ cacheTtl:300, cacheEverything:true } }).then(r => r.text());
        const B = 'http://34.30.56.108.nip.io/bazalar/';

        // 9 baza — hamısı paralel, vaxt limiti ilə
        const tasks = [
          ['DNN',    withTimeout(kvFetch(kv, `dnn:${uq}`,   KV_TTL, () => getText(B+'dnn-api.php?q='+enc)))],
          ['MNB',    withTimeout(kvFetch(kv, `mnb:${uq}`,   KV_TTL, () => getText(B+'mnb-api.php?q='+enc)))],
          ['VERGİ',  withTimeout(kvFetch(kv, `vergi:${uq}`, KV_TTL, () => getText(B+'vergi-api.php?q='+enc)))],
          ['CBAR',   withTimeout(kvFetch(kv, `cbar:${uq}`,  KV_TTL, () => getText(B+'cbar-api.php?q='+enc)))],
          ['SMAB',   withTimeout(kvFetch(kv, `smab:${uq}`,  KV_TTL, () => getText(B+'smab-api.php?q='+enc)))],
          ['TENDER', withTimeout(kvFetch(kv, `tndr:${uq}`,  KV_TTL, () => getText(B+'tender-api.php?q='+enc)))],
          ['İDARƏ',  withTimeout(kvFetch(kv, `idr:${uq}`,   KV_TTL, () => getText(B+'idare-fts.php?q='+enc+'&limit=20')))],
          ['MSK',    withTimeout(kvFetch(kv, `msk:${uq}`,   KV_TTL, () => fetch(MSK_SECICI_RELAY+'?ajax=1&limit=20&q='+enc, { headers:{ 'Accept':'application/json','User-Agent':'Mozilla/5.0','Authorization':'Basic '+btoa(ACCESS_USER+':'+ACCESS_PASS) } }).then(r => r.text())))],
          ['ƏLAQƏ',  withTimeout(contactsApiJson('search', { q: universalQ, limit: '20' }, null, env).then(d => JSON.stringify({ results: (d && d.results) || [] })).catch(() => '{"results":[]}'))]
        ];

        const settled = await Promise.allSettled(tasks.map(t => t[1]));
        settled.forEach((res, i) => {
          const src = tasks[i][0];
          if (res.status !== 'fulfilled') return;
          let txt = res.value;
          if (!txt || txt === '__TIMEOUT__') return;
          txt = String(txt).trim();
          if (txt[0] !== '{' && txt[0] !== '[') return;
          try {
            const d = JSON.parse(txt);
            const arr = Array.isArray(d) ? d : (d.results || []);
            if (arr && arr.length) arr.forEach(r => universalResults.push({ ...r, _source: src }));
          } catch (e) {}
        });

        // tam uyğunluq üstdə
        const uqNorm = universalQ.toUpperCase().trim();
        universalResults.sort((a, b) => {
          const scoreOf = r => {
            const name = (r.owner || r.name || r.ad || r.tesilci || r.temsilci || r.fullname || '').toString().toUpperCase();
            if (name === uqNorm) return 3;
            if (name.startsWith(uqNorm)) return 2;
            if (name.includes(uqNorm)) return 1;
            return 0;
          };
          return scoreOf(b) - scoreOf(a);
        });
        // köhnə sayğaclar (geriyə uyğunluq)
        universalDnnCount   = universalResults.filter(r => r._source === 'DNN').length;
        universalMnbCount   = universalResults.filter(r => r._source === 'MNB').length;
        universalVergiCount = universalResults.filter(r => r._source === 'VERGİ').length;
      } catch(e) { error = 'Universal Axtarış Xətası: ' + e.message; }
    }

    if (page === 'lsnz' && q) {
      try {
        const resp = await fetch('https://admin.lisenziya.gov.az/api/license/Registry/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({
            typeId: 2,
            value: q
          })
        });

        const text = await resp.text();
        const trimmed = text.trim();

        if (!trimmed) {
          throw new Error('LSNZ API boş cavab qaytardı.');
        }

        if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
          throw new Error('LSNZ API JSON qaytarmadı: ' + trimmed.slice(0, 160));
        }

        const data = JSON.parse(trimmed);
        if (data.error) throw new Error(data.error);
        lsnzResults = Array.isArray(data) ? data : (data.results || data.data || []);
      } catch (e) {
        error = 'LSNZ API Xətası: ' + e.message;
      }
    }


    if (page === 'tdr' && q) {
      try {
        const resp = await fetch(`https://tdr.e-tikinti.gov.az/api/search?category=permission&current=0&pageSize=25&districtId=${encodeURIComponent(tdrDistrictId || '76')}&searchText=${encodeURIComponent(tdrSearchQuery(q))}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'az,en;q=0.9,tr;q=0.8',
            'User-Agent': 'Mozilla/5.0'
          }
        });

        const text = await resp.text();
        const trimmed = text.trim();

        if (!trimmed) {
          throw new Error('TDR API boş cavab qaytardı.');
        }

        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          throw new Error('TDR API JSON qaytarmadı: ' + trimmed.slice(0, 160));
        }

        const data = JSON.parse(trimmed);
        if (data.error) throw new Error(data.error);

        tdrResults = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];
        tdrCount = data.count || String(tdrResults.length);

        tdrResults = await Promise.all(tdrResults.map(async function(item) {
          const id = item && item.id ? String(item.id) : '';
          if (!id) return item;

          try {
            const detailResp = await fetch(`https://tdr.e-tikinti.gov.az/api/permission/${encodeURIComponent(id)}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'az,en;q=0.9,tr;q=0.8',
                'User-Agent': 'Mozilla/5.0'
              }
            });

            const detailText = await detailResp.text();
            const detailTrimmed = detailText.trim();

            if (!detailTrimmed.startsWith('{')) {
              return item;
            }

            const detail = JSON.parse(detailTrimmed);
            return Object.assign({}, item, { _detail: detail });
          } catch (e) {
            return item;
          }
        }));
      } catch (e) {
        error = 'TDR API Xətası: ' + e.message;
      }
    }

    if (page === 'mnb' && q) {
      try {
        const text = await kvFetch(kv, `mnb:${q.toUpperCase()}`, KV_TTL, () =>
          fetch(`http://34.30.56.108.nip.io/bazalar/mnb-api.php?q=${encodeURIComponent(q)}`, EDGE_CACHE).then(r => r.text())
        );
        if (text.trim().startsWith('<')) throw new Error('MNB API faylı işləməyib. mnb-api_FINAL2.php yoxlayın.');
        const data = JSON.parse(text);
        if (data.error) throw new Error(data.error);
        mnbResults = data.results || [];
      } catch (e) { error = e.message; }
    }

    if (page === 'voem' && q) {
      try {
        const fixedPage = voemPage || '357';
        const resp = await fetch(`http://rey.muntezir.de/voem_api.php?q=${encodeURIComponent(q)}&vp=${encodeURIComponent(fixedPage)}`);
        const text = await resp.text();
        const trimmed = text.trim();

        if (trimmed.startsWith('<')) {
          throw new Error('VÖEM API HTML qaytardı. rey.muntezir.de/voem_api.php yoxlayın.');
        }

        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          throw new Error(trimmed.slice(0, 120) || 'VÖEM API boş cavab qaytardı.');
        }

        const data = JSON.parse(trimmed);
        if (data.error) throw new Error(data.error);
        voemResults = data.results || [];
      } catch (e) { error = e.message; }
    }

    if (page === 'b2b' && b2bMode === 'company' && b2bCompany) {
      try {
        let slug = '';
        const acResp = await fetch(`https://b2bhint.com/api/autoCompleteSearchCompany?q=${encodeURIComponent(b2bCompany)}&locale=tr&countryId=135`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'tr,az;q=0.9,en;q=0.8',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        const acText = await acResp.text();
        const acTrimmed = acText.trim();
        if (acTrimmed.startsWith('[')) {
          const companies = JSON.parse(acTrimmed);
          const nq = normText(b2bCompany);
          const list = Array.isArray(companies) ? companies : [];
          const picked = list.find(x => normText(x.name || '').includes(nq) || nq.includes(normText(x.name || ''))) || list[0];
          slug = picked?.slug || picked?.url || picked?.path || '';
          if (slug && slug.includes('/')) slug = slug.split('/').filter(Boolean).pop();
        }

        if (!slug) {
          const nqCompany = normText(b2bCompany);
          if (nqCompany.includes('osmanli') || b2bCompany === '1400925381') {
            slug = 'osmanli-yayinlari-nesriyyat-evi--1400925381';
          }
        }

        if (!slug && /^[0-9]{10}$/.test(b2bCompany)) {
          slug = `company--${b2bCompany}`;
        }

        if (!slug) slug = makeB2BCompanySlug(b2bCompany);

        const resp = await fetch(`https://b2bhint.com/_next/data/zdoIxjwzGsXs4B_WJ3u8b/tr/company/az/${encodeURIComponent(slug)}.json?countryCode=az&slug=${encodeURIComponent(slug)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'tr,az;q=0.9,en;q=0.8',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        const text = await resp.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          throw new Error('B2B şirket JSON qaytarmadı: ' + trimmed.slice(0, 160));
        }
        b2bCompanyResult = JSON.parse(trimmed);
        if (!b2bCompanyResult?.pageProps?.company?.name && slug !== 'osmanli-yayinlari-nesriyyat-evi--1400925381' && (normText(b2bCompany).includes('osmanli') || b2bCompany === '1400925381')) {
          const resp2 = await fetch('https://b2bhint.com/_next/data/zdoIxjwzGsXs4B_WJ3u8b/tr/company/az/osmanli-yayinlari-nesriyyat-evi--1400925381.json?countryCode=az&slug=osmanli-yayinlari-nesriyyat-evi--1400925381', {
            method: 'GET',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'tr,az;q=0.9,en;q=0.8',
              'User-Agent': 'Mozilla/5.0'
            }
          });
          b2bCompanyResult = JSON.parse((await resp2.text()).trim());
        }
        if (!b2bCompanyResult?.pageProps?.company?.name) throw new Error('B2B Şirkət nəticəsi tapılmadı.');
      } catch (e) { error = e.message; }
    }

    if (page === 'b2b' && b2bMode === 'people' && (b2bId || b2bName || b2bLastName || b2bFirstName || b2bPatronymic)) {
      try {
        let foundId = b2bId;
        const personQuery = (b2bName || [b2bLastName, b2bFirstName, b2bPatronymic].filter(Boolean).join(' ')).trim();

        if (!foundId && personQuery) {
          let people = [];

          for (const candidateQuery of b2bQueryVariants(personQuery)) {
            const acResp = await fetch(`https://b2bhint.com/api/autoCompleteSearchPerson?q=${encodeURIComponent(candidateQuery)}&locale=tr&countryId=`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'tr,az;q=0.9,en;q=0.8',
                'User-Agent': 'Mozilla/5.0'
              }
            });

            const acText = await acResp.text();
            const acTrimmed = acText.trim();
            if (!acTrimmed.startsWith('[') && !acTrimmed.startsWith('{')) continue;

            const parsed = JSON.parse(acTrimmed);
            const list = Array.isArray(parsed) ? parsed : [];
            if (list.length) {
              people = list;
              break;
            }
          }

          const nq = normText(personQuery);
          const qTokens = nq.split(' ').filter(w => w && !['oglu', 'qizi', 'oghlu', 'kyzy'].includes(w));
          const list = Array.isArray(people) ? people : [];

          const azExact = list.find(x => {
            const nm = normText(x.name || '');
            return String(x.countryCode || '').toLowerCase() === 'az' && qTokens.length && qTokens.every(t => nm.includes(t));
          });

          const exact = list.find(x => {
            const nm = normText(x.name || '');
            return qTokens.length && qTokens.every(t => nm.includes(t));
          });

          const az = list.find(x => String(x.countryCode || '').toLowerCase() === 'az');
          const picked = azExact || exact || az || list[0] || null;
          foundId = picked?.id ? String(picked.id) : '';

          if (!foundId) throw new Error('B2B-də bu ad üzrə İnsanlar nəticəsi tapılmadı.');
        }

        const resp = await fetch(`https://b2bhint.com/_next/data/zdoIxjwzGsXs4B_WJ3u8b/tr/officer/${encodeURIComponent(foundId)}.json?id=${encodeURIComponent(foundId)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'tr,az;q=0.9,en;q=0.8',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        const text = await resp.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          throw new Error('B2B boş və ya JSON olmayan cavab qaytardı: ' + trimmed.slice(0, 160));
        }
        b2bResult = JSON.parse(trimmed);
      } catch (e) { error = e.message; }
    }

    // B2B VÖEN axtarışı — VÖEN ilə şəxs tapır
    if (page === 'b2b' && b2bMode === 'voen' && b2bVoen) {
      try {
        const voen = b2bVoen.replace(/\D/g, '').slice(0, 10);
        if (!voen) throw new Error('VÖEN 10 rəqəmli olmalıdır.');

        const acResp = await fetch(`https://b2bhint.com/api/autoCompleteSearchPerson?q=${encodeURIComponent(voen)}&locale=tr&countryId=`, {
          headers: { 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'tr,az;q=0.9,en;q=0.8', 'User-Agent': 'Mozilla/5.0' }
        });
        const acText = (await acResp.text()).trim();
        if (!acText.startsWith('[') && !acText.startsWith('{')) throw new Error('B2B boş cavab qaytardı: ' + acText.slice(0, 120));
        const list = JSON.parse(acText);
        const people = Array.isArray(list) ? list : [];
        if (!people.length) throw new Error('Bu VÖEN üzrə B2B-də nəticə tapılmadı.');

        const picked = people.find(x => String(x.countryCode || '').toLowerCase() === 'az') || people[0];
        const foundId = picked?.id ? String(picked.id) : '';
        if (!foundId) throw new Error('B2B şəxs ID tapılmadı.');

        const resp = await fetch(`https://b2bhint.com/_next/data/zdoIxjwzGsXs4B_WJ3u8b/tr/officer/${encodeURIComponent(foundId)}.json?id=${encodeURIComponent(foundId)}`, {
          headers: { 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'tr,az;q=0.9,en;q=0.8', 'User-Agent': 'Mozilla/5.0' }
        });
        const text = (await resp.text()).trim();
        if (!text.startsWith('{') && !text.startsWith('[')) throw new Error('B2B boş və ya JSON olmayan cavab: ' + text.slice(0, 160));
        b2bResult = JSON.parse(text);
      } catch (e) { error = e.message; }
    }

    if (page === 'borc' && tin) {
      try {
        const resp = await fetch('https://new.e-taxes.gov.az/api/po/authless/public/v1/authless/debtOverdue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tin })
        });
        borcResult = await resp.json();
      } catch (e) { error = e.message; }
    }

    if (page === 'tel' && ['aztelekom','transeurocom','azeurotel'].includes(provider) && city && number) {
      try {
        const merchant = provider === 'transeurocom' ? 'transeurocom'
          : provider === 'azeurotel' ? 'azeurotel_tel'
          : 'aztelekom_baktelecom';
        const resp = await fetch(`https://hesab.az/api/pg/unregistered/merchants/${merchant}/billingInfo/?city=${encodeURIComponent(city)}&number=${encodeURIComponent(number)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'az,en-US;q=0.9,en;q=0.8,tr;q=0.7',
            'Referer': 'https://m.hesab.az/',
            'Origin': 'https://m.hesab.az',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        const text = await resp.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          throw new Error('Telefon API boş cavab qaytardı: ' + trimmed.slice(0, 160));
        }
        telResult = JSON.parse(trimmed);
      } catch (e) { error = e.message; }
    }

    if (page === 'tel' && provider === 'ultel' && number) {
      try {
        const resp = await fetch(`https://hesab.az/api/pg/unregistered/merchants/ultel/billingInfo/?service=t&phone_number=${encodeURIComponent(number)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'az,en-US;q=0.9,en;q=0.8,tr;q=0.7',
            'Referer': 'https://m.hesab.az/',
            'Origin': 'https://m.hesab.az',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        const text = await resp.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          throw new Error(trimmed.slice(0, 160) || 'Ultel API boş cavab qaytardı.');
        }
        telResult = JSON.parse(trimmed);
      } catch (e) { error = e.message; }
    }

    if (page === 'edv') {
      try {
        if (edvMode === 'tin' && tin) {
          const resp = await fetch('https://new.e-taxes.gov.az/api/po/authless/public/v1/authless/physicalVatPayersByTin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tin })
          });
          const data = await resp.json();
          edvResults = data.vatPayers || [];
        }

        if (edvMode === 'name' && firstName && lastName && patronymic) {
          const resp = await fetch('https://new.e-taxes.gov.az/api/po/authless/public/v1/authless/physicalVatPayers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lastName: lastName.toUpperCase(),
              firstName: firstName.toUpperCase(),
              patronymic: patronymic.toUpperCase()
            })
          });
          const data = await resp.json();
          edvResults = data.vatPayers || [];
        }
      } catch (e) { error = e.message; }
    }

    if (page === 'msk' && mskLastName) {
      try {
        if (!mskBirth) {
          mskResults = [];
          throw new Error('MSK bu axtarışda doğum tarixini tələb edir. Təvəllüdü DNN-dən tapıb sonra MSK-də yoxlamaq lazımdır.');
        }
        const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
        const pageResp = await fetch('https://infocenter.gov.az/e-services/adsoyad.aspx', {
          headers: {
            'User-Agent': UA,
            'Accept': 'text/html,application/xhtml+xml,*/*',
            'Accept-Language': 'az,en;q=0.9'
          }
        });

        const pageHtml = await pageResp.text();
        const cookie = (pageResp.headers.get('set-cookie') || '').split(';')[0];
        const vsMatch = pageHtml.match(/id="__VIEWSTATE"[^>]*value="([^"]+)"/);
        const vsgMatch = pageHtml.match(/id="__VIEWSTATEGENERATOR"[^>]*value="([^"]+)"/);
        const evMatch = pageHtml.match(/id="__EVENTVALIDATION"[^>]*value="([^"]+)"/);
        if (!vsMatch) throw new Error('MSK saytindan VIEWSTATE alinmadi.');

        const soyad = mskLastName.toUpperCase();
        const ad = mskFirstName.toUpperCase();
        const ata = mskPatronymic.toUpperCase();
        const birth = mskBirth.trim();
        const birthRaw = birth ? String(mskDateRaw(birth)) : 'N';
        const birthState = birth ? `${mskDateState(birth)}:${mskDateState(birth)}` : '';
        const gender = mskGender || '';

        const fd2 = new URLSearchParams();
        fd2.append('ctl00$ScriptManager1', 'ctl00$HolderBody$UpdatePanel1|ctl00$HolderBody$BtnSearch');
        fd2.append('ctl00_HolderBody_TxtSoyad_Raw', soyad);
        fd2.append('ctl00$HolderBody$TxtSoyad', soyad);
        fd2.append('ctl00_HolderBody_TxtAd_Raw', ad);
        fd2.append('ctl00$HolderBody$TxtAd', ad);
        fd2.append('ctl00_HolderBody_TxtAtaAdi_Raw', ata);
        fd2.append('ctl00$HolderBody$TxtAtaAdi', ata);
        fd2.append('ctl00_HolderBody_tevelllud_Raw', birthRaw);
        fd2.append('ctl00$HolderBody$tevelllud', birth);
        fd2.append('ctl00_HolderBody_tevelllud_DDDWS', '0:0:-1:-10000:-10000:0:-10000:-10000:1');
        fd2.append('ctl00_HolderBody_tevelllud_DDD_C_FNPWS', '0:0:-1:-10000:-10000:0:0px:-10000:1');
        fd2.append('ctl00$HolderBody$tevelllud$DDD$C', birthState);
        fd2.append('ctl00_HolderBody_CboxCins_VI', gender);
        fd2.append('ctl00$HolderBody$CboxCins', gender);
        fd2.append('ctl00_HolderBody_CboxCins_DDDWS', '0:0:-1:-10000:-10000:0:-10000:-10000:1');
        fd2.append('ctl00$HolderBody$CboxCins$DDD$L', gender);
        fd2.append('ctl00_HolderBody_CboxDaire_VI', '');
        fd2.append('ctl00$HolderBody$CboxDaire', '');
        fd2.append('ctl00_HolderBody_CboxDaire_DDDWS', '0:0:-1:-10000:-10000:0:-10000:-10000:1');
        fd2.append('ctl00$HolderBody$CboxDaire$DDD$L', '');
        fd2.append('DXScript', '1_44,2_34,2_41,1_76,1_48,1_56,2_33,1_69,1_67,2_28,2_36,2_27');
        fd2.append('__EVENTTARGET', '');
        fd2.append('__EVENTARGUMENT', '');
        fd2.append('__VIEWSTATE', vsMatch[1]);
        fd2.append('__VIEWSTATEGENERATOR', vsgMatch ? vsgMatch[1] : '');
        fd2.append('__EVENTVALIDATION', evMatch ? evMatch[1] : '');
        fd2.append('ctl00$HolderBody$BtnSearch', '');
        fd2.append('__ASYNCPOST', 'true');

        const postResp = await fetch('https://infocenter.gov.az/e-services/adsoyad.aspx', {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': '*/*',
            'Accept-Language': 'az,en;q=0.9',
            'Referer': 'https://infocenter.gov.az/e-services/adsoyad.aspx',
            'Origin': 'https://infocenter.gov.az',
            'X-MicrosoftAjax': 'Delta=true',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            'Cookie': cookie
          },
          body: fd2.toString()
        });

        const resultHtml = await postResp.text();
        mskResults = parseMskTable(resultHtml);
      } catch (e) { error = e.message; }
    }


    // MSK SEÇİCİ server-side axtarış: JS işləməsə də nəticə göstərilsin
    if (page === 'msk' && mskSub === 'secici' && (mskSeciciQ || mskSeciciDaire || mskSeciciMenteqe || mskSeciciBirth)) {
      try {
        const gp = new URLSearchParams();
        gp.set('limit', '100');
        if (mskSeciciQ) gp.set('q', mskSeciciQ);
        if (mskSeciciDaire) gp.set('daire', mskSeciciDaire);
        if (mskSeciciMenteqe) gp.set('menteqe', mskSeciciMenteqe);
        if (mskSeciciBirth) gp.set('dogum_ili', mskSeciciBirth);

        // SÜRƏTLİ: təmizlənmiş voters.db (FTS5) — köhnə canlı MSK relay əvəzinə
        const resp = await fetch(SECICI_FTS_RELAY + '?' + gp.toString(), EDGE_CACHE);
        const text = await resp.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith('{')) throw new Error('SEÇİCİ backend JSON qaytarmadı: ' + trimmed.slice(0, 160));
        const data = JSON.parse(trimmed);
        if (!data.ok) throw new Error(data.error || 'SEÇİCİ API xətası');
        mskSeciciResults = Array.isArray(data.results) ? data.results : [];
        mskSeciciTotal = String(data.total ?? mskSeciciResults.length);
        mskSeciciMessage = mskSeciciResults.length
          ? (mskSeciciTotal + ' nəticə tapıldı' + (Number(mskSeciciTotal) > mskSeciciResults.length ? ' — ilk ' + mskSeciciResults.length + ' göstərilir' : ''))
          : 'Nəticə tapılmadı.';
      } catch (e) {
        mskSeciciMessage = 'SEÇİCİ API xətası: ' + e.message;
      }
    }

    if (page === 'msk' && mskSub === 'terkib') {
      const tHasSearch = !!mskSeciciQ;
      const tHasDaire = !!mskSeciciDaire;
      if (tHasSearch || tHasDaire) {
        try {
          const gp = new URLSearchParams();
          if (tHasSearch) gp.set('q', mskSeciciQ);
          if (tHasDaire) gp.set('daire', mskSeciciDaire);
          if (mskSeciciMenteqe) gp.set('menteqe', mskSeciciMenteqe);
          const resp = await fetch(TERKIB_RELAY + '?' + gp.toString(), {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            cf: { cacheTtl: 0 }
          });
          const text = await resp.text();
          const trimmed = text.trim();
          if (!trimmed.startsWith('{')) throw new Error('TƏRKİB backend JSON qaytarmadı: ' + trimmed.slice(0, 160));
          const data = JSON.parse(trimmed);
          if (!data.ok) throw new Error(data.error || 'TƏRKİB API xətası');
          terkibResults = Array.isArray(data.results) ? data.results : [];
          terkibMode = data.mode || (tHasSearch ? 'search' : 'daire');
          terkibTotal = String(data.total ?? terkibResults.length);
          terkibMenteqeList = Array.isArray(data.menteqe_list) ? data.menteqe_list : [];
          terkibDaireAdi = data.daire_adi || '';
          terkibMessage = terkibResults.length ? (terkibTotal + ' nəticə') : 'Nəticə tapılmadı.';
        } catch (e) {
          terkibMessage = 'TƏRKİB API xətası: ' + e.message;
        }
      }
    }

    if (page === 'qida' && q) {
      try {
        const isVoen = /^\d{10}$/.test(q);
        const params = new URLSearchParams({
          IdentityNumber: isVoen ? q : '',
          SubjectName: isVoen ? '' : q,
          UnicalNumber: '',
          ActivityTypeId: '',
          ActivityDirection: '',
          OrganizationName: ''
        });
        const resp = await fetch(`https://e-afsa.gov.az/E_GovRegistration/filter/GetSubjectData?${params.toString()}`, {
          headers: { 'Accept': 'text/html,*/*', 'User-Agent': 'Mozilla/5.0' }
        });
        const text = await resp.text();
        qidaResults = parseQidaHtml(text);
      } catch(e) { error = 'QİDA API Xətası: ' + e.message; }
    }


    if (page === 'cbar') {
      const cbarApiBase = 'http://34.30.56.108.nip.io/bazalar/cbar-api.php';
      try {
        if (q) {
          const resp = await fetch(`${cbarApiBase}?q=${encodeURIComponent(q)}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            cf: { cacheTtl: 300, cacheEverything: true }
          });
          const text = await resp.text();
          const trimmed = text.trim();
          if (!trimmed.startsWith('{')) throw new Error('CBAR API JSON qaytarmadı: ' + trimmed.slice(0, 120));
          const data = JSON.parse(trimmed);
          if (data.error) throw new Error(data.error);
          cbarResults = data.results || [];
        } else if (url.searchParams.get('cbarMode') === 'stats') {
          const resp = await fetch(`${cbarApiBase}?action=stats`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            cf: { cacheTtl: 300, cacheEverything: true }
          });
          const data = JSON.parse((await resp.text()).trim());
          if (data.error) throw new Error(data.error);
          cbarStats = data;
        }
      } catch(e) { error = 'CBAR API Xətası: ' + e.message; }
    }


    if (page === 'corona' || (page === 'smab' && smabSub === 'corona')) {
      const coronaApiBase = 'http://34.30.56.108.nip.io/bazalar/corona-api.php';
      try {
        if (q) {
          const resp = await fetch(`${coronaApiBase}?q=${encodeURIComponent(q)}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            cf: { cacheTtl: 300, cacheEverything: true }
          });
          const text = await resp.text();
          const trimmed = text.trim();
          if (!trimmed.startsWith('{')) throw new Error('CORONA API JSON qaytarmadı: ' + trimmed.slice(0, 120));
          const data = JSON.parse(trimmed);
          if (data.error) throw new Error(data.error);
          coronaResults = data.results || [];
        } else if (url.searchParams.get('coronaMode') === 'stats') {
          const resp = await fetch(`${coronaApiBase}?action=stats`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            cf: { cacheTtl: 300, cacheEverything: true }
          });
          const text = await resp.text();
          const trimmed = text.trim();
          if (!trimmed.startsWith('{')) throw new Error('CORONA API JSON qaytarmadı: ' + trimmed.slice(0, 120));
          const data = JSON.parse(trimmed);
          if (data.error) throw new Error(data.error);
          coronaStats = data;
        }
      } catch(e) { error = 'CORONA API Xətası: ' + e.message; }
    }

    if (page === 'aram' && q) {
      try {
        const form = new URLSearchParams({
          include_text: q,
          sort: 'am_date4',
          order: 'desc',
          page: '1',
          perpage: '25'
        });

        const resp = await fetch('https://sc.supremecourt.gov.az/decision-search/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://sc.supremecourt.gov.az',
            'Referer': 'https://sc.supremecourt.gov.az/decision-search/',
            'User-Agent': 'Mozilla/5.0',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: form.toString()
        });

        const text = await resp.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith('{')) {
          throw new Error('ARAM API cavab vermədi: ' + trimmed.slice(0, 140));
        }

        const data = JSON.parse(trimmed);
        aramResults = Array.isArray(data?.tableDatas?.data) ? data.tableDatas.data : [];
        aramSections = Array.isArray(data?.sectionMainData) ? data.sectionMainData : [];
        aramTotal = Number(data?.tableDatas?.total || aramResults.length || 0);
      } catch(e) { error = 'ARAM API Xətası: ' + e.message; }
    }

    if (page === 'tobb') {
      tobbMode = url.searchParams.get('tobbMode') || 'gazete';
      try {
        const optResp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?action=mudurlukler', {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          cf: { cacheTtl: 86400, cacheEverything: true }
        });
        const optText = (await optResp.text()).trim();
        if (optText.startsWith('{')) {
          const optData = JSON.parse(optText);
          if (Array.isArray(optData.options)) tobbMudurlukOptions = optData.options;
        }
      } catch (_) {}
      if (!tobbMudurlukOptions.length) tobbMudurlukOptions = [{ id: '232', name: 'İSTANBUL' }];

      if (tobbMode === 'person') {
        const personQ = (url.searchParams.get('personQ') || q || '').trim();
        const personAction = url.searchParams.get('personAction') || 'search';
        if (personQ) {
          try {
            if (personAction === 'seed') {
              const tp = new URLSearchParams({ action: 'person_seed', q: personQ, SicilMudurluguId: url.searchParams.get('SicilMudurluguId') || '232', max: url.searchParams.get('max') || '30' });
              const resp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?' + tp.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
              const txt = (await resp.text()).trim();
              if (!txt.startsWith('{')) throw new Error('TOBB person_seed JSON qaytarmadı: ' + txt.slice(0, 120));
              tobbSeedData = JSON.parse(txt);
            }
            const sp = new URLSearchParams({ action: 'person', q: personQ, limit: '50' });
            const sresp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?' + sp.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
            const stxt = (await sresp.text()).trim();
            if (!stxt.startsWith('{')) throw new Error('TOBB person JSON qaytarmadı: ' + stxt.slice(0, 120));
            tobbPersonData = JSON.parse(stxt);
          } catch(e) { error = 'TOBB Şəxs Xətası: ' + e.message; }
        }
        try {
          const resp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?action=person_stats', { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
          const txt = (await resp.text()).trim();
          if (txt.startsWith('{')) tobbStatsData = JSON.parse(txt);
        } catch (_) {}
      } else if (tobbMode === 'itobb') {
        const sicil = clean(url.searchParams.get('itobbSicil') || '');
        const params = (url.searchParams.get('itobbParams') || '').trim();
        if (sicil || params) {
          try {
            const tp = new URLSearchParams({ action: 'itobb' });
            if (sicil) tp.set('sicil', sicil);
            if (params) tp.set('params', params);
            const resp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?' + tp.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
            const txt = (await resp.text()).trim();
            if (!txt.startsWith('{')) throw new Error('İTOBB JSON qaytarmadı: ' + txt.slice(0, 120));
            itobbData = JSON.parse(txt);
            if (itobbData.ok === false) throw new Error(itobbData.error || 'İTOBB xətası');

            const dp = new URLSearchParams({ action: 'itobb_detail' });
            if (sicil) dp.set('sicil', sicil);
            const detailParams = (url.searchParams.get('itobbDetailParams') || '').trim();
            if (detailParams) dp.set('params', detailParams);
            const dresp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?' + dp.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
            const dtxt = (await dresp.text()).trim();
            if (dtxt.startsWith('{')) {
              itobbDetailData = JSON.parse(dtxt);
              if (itobbDetailData.ok === false && detailParams) throw new Error(itobbDetailData.error || 'İTOBB detail xətası');
            }
          } catch(e) { error = 'İTOBB Xətası: ' + e.message; }
        }
      } else if (tobbMode === 'guncelle') {
        guncelleInfo = { ok: true };
      } else {
        const tSicil   = clean(url.searchParams.get('SicilMudurluguId') || '');
        const tSicNo   = clean(url.searchParams.get('TicSicNo') || '');
        const tUnvan   = (url.searchParams.get('TicaretUnvani') || '').trim();
        const tTarih1  = clean(url.searchParams.get('Tarih1') || '');
        const tTarih2  = clean(url.searchParams.get('Tarih2') || '');
        if (tSicil || tSicNo || tUnvan) {
          try {
            const tp = new URLSearchParams();
            if (tSicil)  tp.set('SicilMudurluguId', tSicil);
            if (tSicNo)  tp.set('TicSicNo', tSicNo);
            if (tUnvan)  tp.set('TicaretUnvani', tUnvan);
            if (tTarih1) tp.set('Tarih1', tTarih1);
            if (tTarih2) tp.set('Tarih2', tTarih2);
            tp.set('extract', '1');
            const resp = await fetch('http://34.30.56.108.nip.io/bazalar/tobb-api.php?' + tp.toString(), {
              headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
            });
            const text = await resp.text();
            const trimmed = text.trim();
            if (!trimmed.startsWith('{')) throw new Error('TOBB JSON qaytarmadı: ' + trimmed.slice(0, 120));
            const data = JSON.parse(trimmed);
            if (data.ok === false) throw new Error(data.error || 'TOBB xətası');
            tobbResults = Array.isArray(data.results) ? data.results : [];
            tobbBaslik = data.baslik || '';
          } catch(e) { error = 'TOBB Xətası: ' + e.message; }
        }
      }
    }


    if (page === 'xeber') {
      // V127: XƏBƏR tabı əvvəlki işlək server-side rejimə qaytarıldı.
      // Səhifə bir az gec açıla bilər, amma nəticə HTML-in içində gəlir;
      // artıq sonsuz "Xəbərlər yüklənir..." vəziyyəti yoxdur.
      try {
        const gp = new URLSearchParams();
        gp.set('limit', '45');
        if (xeberSource && xeberSource !== 'all') gp.set('source', xeberSource);
        if (xeberQ) gp.set('q', xeberQ);
        if (xeberRefresh) gp.set('refresh', '1');

        const relayFetch = fetch(XEBER_RELAY + '?' + gp.toString(), {
          headers: {
            'Accept':'application/json',
            'User-Agent':'Mozilla/5.0',
            'Authorization':'Basic ' + btoa(ACCESS_USER + ':' + ACCESS_PASS)
          },
          cf: { cacheTtl: xeberRefresh ? 0 : 300, cacheEverything: !xeberRefresh }
        });

        const timeout = new Promise(function(resolve){
          setTimeout(function(){ resolve('__XE_TIMEOUT__'); }, 70000);
        });
        const resp = await Promise.race([relayFetch, timeout]);
        if (resp === '__XE_TIMEOUT__') {
          throw new Error('Backend 70 saniyəyə cavab vermədi. GCP-də /var/www/bazalar/xeber-api.php yavaşdır və ya mənbə saytlarından biri ilişib.');
        }

        const text = await resp.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith('{')) throw new Error('XƏBƏR backend JSON qaytarmadı: ' + trimmed.slice(0, 160));
        const data = JSON.parse(trimmed);
        if (!data.ok) throw new Error(data.error || 'XƏBƏR API xətası');
        xeberResults = normalizeXeberList(Array.isArray(data.results) ? data.results : []);
        xeberTotal = Number(data.total || xeberResults.length || 0);
        xeberUpdated = data.updated_at || '';
        xeberSources = Array.isArray(data.sources) ? data.sources : [];
        xeberMessage = xeberResults.length ? (xeberTotal + ' xəbər tapıldı') : 'Xəbər tapılmadı.';
      } catch (e) {
        xeberMessage = 'XƏBƏR API xətası: ' + ((e && e.message) || e);
      }
    }

    if (page === 'tender') {
      const tenderApiBase = 'http://34.30.56.108.nip.io/bazalar/tender-api.php';
      try {
        if (q) {
          // VÖEN axtarışı: 10 rəqəmli sorğu gəldikdə əvvəl voen_siyahi-dən ad alıb tender-də axtarır
          let tenderQ = q;
          const isVoen = /^\d{10}$/.test(q);
          if (isVoen) {
            try {
              const voenResp = await fetch(`${tenderApiBase}?action=voen_lookup&voen=${encodeURIComponent(q)}`, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
              });
              const voenText = await voenResp.text();
              const voenTrimmed = voenText.trim();
              if (voenTrimmed.startsWith('{')) {
                const voenData = JSON.parse(voenTrimmed);
                if (voenData.ok && voenData.ad) {
                  tenderVoenFound = true;
                  tenderVoenName = voenData.ad;
                  tenderQ = voenData.ad;
                }
              }
            } catch(e) { /* VÖEN lookup uğursuz oldu, orijinal q ilə davam et */ }
          }
          const resp = await fetch(`${tenderApiBase}?q=${encodeURIComponent(tenderQ)}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            cf: { cacheTtl: 300, cacheEverything: true }
          });
          const text = await resp.text();
          const trimmed = text.trim();
          if (!trimmed.startsWith('{')) throw new Error('TENDER API JSON qaytarmadı: ' + trimmed.slice(0, 120));
          const data = JSON.parse(trimmed);
          if (!data.ok) throw new Error(data.error || 'API xətası');
          tenderResults = Array.isArray(data.results) ? data.results : [];
          tenderTotal = String(data.total || tenderResults.length);
        } else if (url.searchParams.get('tenderMode') === 'stats') {
          const resp = await fetch(`${tenderApiBase}?action=stats`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            cf: { cacheTtl: 300, cacheEverything: true }
          });
          const text = await resp.text();
          const trimmed = text.trim();
          if (!trimmed.startsWith('{')) throw new Error('TENDER API JSON qaytarmadı: ' + trimmed.slice(0, 120));
          const data = JSON.parse(trimmed);
          if (!data.ok) throw new Error(data.error || 'API xətası');
          tenderStats = data;
        }
      } catch (e) { error = 'TENDER API Xətası: ' + e.message; }
    }

    // ETNDR tabı tam client-side işləyir (/api/etndr endpoint-i + canlı status).
    // Server tərəfdə burada heç nə çəkilmir.

    if (page === 'blackbird' && osintSub === 'bb') {
      const bbBase = 'http://34.30.56.108.nip.io/api/blackbird';
      const bbKey  = 'bb-osint-2026';
      try {
        if (q) {
          blackbirdUsername = q;
          const resp = await fetch(`${bbBase}?key=${bbKey}&q=${encodeURIComponent(q)}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
          });
          const raw = await resp.text();
          const trimmed = raw.trim();
          // Server JSON yox, HTML/boş qaytarıbsa (502/522, server dayanıb və s.) — aydın mesaj
          if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
            if (/50\d|52\d/.test(trimmed) || trimmed === '') {
              throw new Error('Blackbird serveri cavab vermir. Server dayanmış ola bilər — 34.30.56.108 yoxlanmalıdır.');
            }
            throw new Error('Server JSON qaytarmadı (HTTP ' + resp.status + '): ' + trimmed.slice(0, 100));
          }
          let data;
          try { data = JSON.parse(trimmed); }
          catch (pe) { throw new Error('Cavab oxunmadı (HTTP ' + resp.status + ')'); }
          if (!data.ok) throw new Error(data.error || 'Blackbird xətası');
          blackbirdLines = Array.isArray(data.lines) ? data.lines : [];
        }
      } catch (e) { error = 'Blackbird Xətası: ' + e.message; }
    }

    if (page === 'blackbird' && osintSub === 'sherlock') {
      const slBase = 'http://34.30.56.108.nip.io/bazalar/sherlock-api.php';
      try {
        if (q) {
          sherlockUsername = q;
          const resp = await fetch(`${slBase}?username=${encodeURIComponent(q)}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
          });
          const raw = await resp.text();
          const trimmed = raw.trim();
          if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
            throw new Error('Server cavab vermədi (HTTP ' + resp.status + '). Sherlock çox uzun çəkmiş ola bilər və ya server dayanıb — 34.30.56.108 yoxlanmalıdır.');
          }
          let data;
          try { data = JSON.parse(trimmed); }
          catch (pe) { throw new Error('Cavab oxunmadı (HTTP ' + resp.status + ')'); }
          if (!data.ok) throw new Error(data.error || 'Sherlock xətası');
          sherlockFound = Array.isArray(data.found) ? data.found : [];
          sherlockCount = typeof data.count === 'number' ? data.count : sherlockFound.length;
        }
      } catch (e) { error = 'Sherlock Xətası: ' + e.message; }
    }

    if (page === 'idare' && idareMode === 'stats') {
      idareStats = {
        total_records:        31380,   // birləşdirilmiş baza (20140 detallı + 11240 idarə adı)
        total_categories:     89,
        non_empty_categories: 80,
        empty_categories:     9,
        tel_dolulugu:         '100%',
        unvan_dolulugu:       '100%',
        voen_dolulugu:        '99.9%',
        bank_kodu_dolulugu:   '62.6%',
        son_yenilenme:        '2026-06',
        top_01: 'MMC — 4100 qeyd',
        top_02: 'DÜKANLAR, MAĞAZALAR, MARKETLƏR — 3019 qeyd',
        top_03: 'MÜƏSSİSƏLƏR — 1912 qeyd',
        top_04: 'FİRMALAR, OFİSLƏR, F/ŞƏXSLƏR — 1659 qeyd',
        top_05: 'MƏRKƏZLƏR — 1606 qeyd',
        top_06: 'ŞİRKƏTLƏR, KOMPANİYALAR, LTD — 1467 qeyd',
        top_07: 'KAFE, RESTORANLAR, YEMƏKXANALAR — 986 qeyd',
        top_08: 'ƏCZAXANALAR (APTEKLƏR) — 832 qeyd',
        top_09: 'TİB/SAN.HİS, XƏST.KLİN.HOSPİTAL — 792 qeyd',
        top_10: 'İCRA HAKİMİYYƏTLƏRİ, BƏLƏDİYYƏLƏR — 784 qeyd'
      };
    }

    if (page === 'idare' && (idareCategory || idareQ)) {
      try {
        // SÜRƏT: nəhəng idare-data.json-u endirmirik. Axtarış SERVERDƏ (PHP) olur,
        // yalnız uyğun nəticələr (kiçik JSON) qayıdır. Edge cache ilə təkrar sorğular ani.
        const idareSearchBase = 'http://34.30.56.108.nip.io/bazalar/idare-search.php';
        const idareUrl = idareQ
          ? `${idareSearchBase}?q=${encodeURIComponent(idareQ)}`
          : `${idareSearchBase}?category=${encodeURIComponent(idareCategory)}${idareId ? `&idareId=${encodeURIComponent(idareId)}` : ''}`;
        const idareResp = await fetch(idareUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          cf: { cacheTtl: 86400, cacheEverything: true }
        });
        const idareText = await idareResp.text();
        const trimmed = idareText.trim();
        if (!trimmed.startsWith('{')) throw new Error('İDARƏ JSON qaytarmadı: ' + trimmed.slice(0, 120));
        const idareData = JSON.parse(trimmed);
        if (idareData.error) throw new Error(idareData.error);

        if (idareQ) {
          idareResults = idareData.results || [];
          idareSearchTotal = idareData.total != null ? idareData.total : idareResults.length;
        } else {
          idareOptions = idareData.options || [];
          idareResults = idareData.results || [];
        }
      } catch(e) { error = 'İDARƏ API Xətası: ' + e.message; }
    }



    if (page === 'contacts') {
      try {
        if (contactsMode === 'stats') {
          const data = await contactsApiJson('stats', {}, null, env);
          if (data.error) throw new Error(data.error);
          contactsStats = data.stats || null;
        } else if (contactsMode === 'review') {
          const data = await contactsApiJson('review', { limit: contactsLimit || '100' }, null, env);
          if (data.error) throw new Error(data.error);
          contactsResults = data.results || [];
        } else if (contactsMode === 'contact' && contactsId) {
          const data = await contactsApiJson('contact', { id: contactsId }, null, env);
          if (data.error) throw new Error(data.error);
          contactsContact = data.contact || null;
          contactsPhones = data.phones || [];
          contactsEmails = data.emails || [];
        } else if (q) {
          const data = await contactsApiJson('search', {
            q,
            status: contactsStatus,
            category: contactsCategory,
            limit: contactsLimit || '100'
          }, null, env);
          if (data.error) throw new Error(data.error);
          contactsResults = data.results || [];
        }
      } catch (e) {
        error = 'CONTACTS API Xətası: ' + e.message;
      }
    }

    return new Response(
      html({
        tin,
        name,
        q,
        url,
        whoisDomain,
        whoisRaw,
        page,
        error,
        records,
        results,
        tinResult,
        dbResults,
        dnnResults,
        dnnMnbResults,
        mnbResults,
        voemResults,
        telResult,
        provider,
        city,
        number,
        b2bMode,
        b2bVoen,
        b2bId,
        b2bResult,
        b2bCompanyResult,
        b2bName,
        b2bCompany,
        b2bLastName,
        b2bFirstName,
        b2bPatronymic,
        borcResult,
        edvResults,
        edvMode,
        firstName,
        lastName,
        patronymic,
        voemPage,
        mskResults,
        mskSeciciResults,
        mskSeciciTotal,
        mskSeciciMessage,
        mskSeciciQ,
        mskSeciciDaire,
        mskSeciciMenteqe,
        mskSeciciBirth,
        mskLastName,
        mskFirstName,
        mskPatronymic,
        mskBirth,
        mskGender,
        mskSub,
        terkibResults,
        terkibMode,
        terkibMessage,
        terkibTotal,
        terkibMenteqeList,
        terkibDaireAdi,
        vergiResults,
        lsnzResults,
        tdrResults,
        tdrCount,
        tdrDistrictId,
        tenderMode,
        tenderResults,
        tenderTotal,
        tenderStats,
        tenderVoenName,
        tenderVoenFound,
        etndrResults,
        etndrData,
        etSupplierVoen,
        etSupplierName,
        etKeyword,
        etEventName,
        etAmountFrom,
        etAmountTo,
        etPublishFrom,
        etPublishTo,
        etContractFrom,
        etContractTo,
        etPageSize,
        etPage,
        url_tenderMode: url.searchParams.get('tenderMode') || '',
        blackbirdLines,
        blackbirdUsername,
        sherlockFound,
        sherlockUsername,
        sherlockCount,
        osintSub,
        smabSub,
        whoisResult,
        qidaResults,
        cbarResults,
        cbarStats,
        url_cbarMode: url.searchParams.get('cbarMode') || '',
        coronaResults,
        coronaStats,
        url_coronaMode: url.searchParams.get('coronaMode') || '',
        aramResults,
        aramSections,
        aramTotal,
        tobbResults,
        tobbBaslik,
        tobbMudurlukOptions,
        tobbMode,
        tobbPersonData,
        tobbSeedData,
        tobbStatsData,
        itobbData,
        itobbDetailData,
        guncelleInfo,
        url_SicilMudurluguId: url.searchParams.get('SicilMudurluguId') || '',
        url_TicSicNo: url.searchParams.get('TicSicNo') || '',
        url_TicaretUnvani: url.searchParams.get('TicaretUnvani') || '',
        url_Tarih1: url.searchParams.get('Tarih1') || '',
        url_Tarih2: url.searchParams.get('Tarih2') || '',
        idareResults,
        idareOptions,
        idareCategory,
        idareId,
        idareQ,
        idareMode,
        idareSearchTotal,
        idareStats,
        contactsMode,
        contactsId,
        contactsStatus,
        contactsCategory,
        contactsLimit,
        contactsResults,
        contactsContact,
        contactsPhones,
        contactsEmails,
        contactsStats,
        contactsMessage,
        universalQ,
        universalResults,
        universalDnnCount,
        universalMnbCount,
        universalVergiCount,
        xeberResults,
        xeberTotal,
        xeberMessage,
        xeberUpdated,
        xeberSources,
        xeberSource,
        xeberQ,
        xeberRefresh,
        dnnRelatedVergi
      }),
      { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );
  }
};

function clean(s) {
  return String(s || '').trim().slice(0, 300);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

function fd(d) {
  if (!d) return '—';
  const p = String(d).split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : esc(d);
}

function oc(n) {
  n = (n || '').toLowerCase();
  if (n.includes('lave') || n.includes('lavə')) return 'a';
  if (n.includes('sonra') || n.includes('nce') || n.includes('yis')) return 'd';
  return 'o';
}

function copyButton(label = '') {
  return '';
}

function sourceLink(url, label = '🔗 Mənbə') {
  return url ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : '';
}

function tinCrossLinks(tin, opts = {}) {
  const t = String(tin || '').trim();
  if (!t) return '';
  const u = encodeURIComponent(t);
  const tdrQ = tdrSearchQuery(opts.tdrQuery || '', t);
  const tdrU = encodeURIComponent(tdrQ);
  const out = [];
  if (!opts.exHistory) out.push(`<a href="/?page=history&tin=${u}">📋 Tarixçə</a>`);
  if (!opts.exTin)     out.push(`<a href="/?page=tin&tin=${u}">🔎 VÖEN</a>`);
  if (!opts.exBorc)    out.push(`<a href="/?page=borc&tin=${u}">💳 BORC</a>`);
  if (!opts.exEdv)     out.push(`<a href="/?page=edv&mode=tin&tin=${u}">💸 ƏDV</a>`);
  if (!opts.exVoem)    out.push(`<a href="/?page=voem&q=${u}&vp=357">🏭 VÖEM</a>`);
  if (!opts.exB2b)     out.push(`<a href="/?page=b2b&b2bMode=company&b2bCompany=${u}">🌐 B2B</a>`);
  if (!opts.exVergi)   out.push(`<a href="/?page=vergi&q=${u}">⚖️ VERGİ</a>`);
  if (!opts.exLsnz)    out.push(`<a href="/?page=lsnz&q=${u}">📜 LSNZ</a>`);
  if (!opts.exTdr)     out.push(`<a href="/?page=tdr&q=${tdrU}">🏗️ TDR</a>`);
  if (!opts.exTender)  out.push(`<a href="/?page=tender&q=${u}&tenderMode=events">📑 TENDER</a>`);
  if (!opts.exQida)    out.push(`<a href="/?page=qida&q=${u}">🍽️ QİDA</a>`);
  return out.join('');
}

function riskFlags(flags = {}) {
  const out = [];
  if (flags.debt && Number(flags.debt) > 0) out.push(b('Borc var', 'red'));
  if (flags.risky) out.push(b('Riskli', 'yellow'));
  if (flags.vat) out.push(b('ƏDV', 'green'));
  if (flags.inactive) out.push(b('Qeyri-aktiv', 'red'));
  return out.length ? `<div class="riskbar">${out.join('')}</div>` : '';
}

function isTinValue(v) {
  return new RegExp('^[0-9]{10}$').test(String(v || '').trim());
}

function b(text, type) {
  const cls = type === 'green' ? ' good' : type === 'red' ? ' bad' : type === 'yellow' ? ' warnb' : '';
  return `<span class="badge${cls}">${esc(text)}</span>`;
}

function row(label, value) {
  if (!value || value === '—') return '';
  return `<tr>
    <td class="label">${esc(label)}</td>
    <td class="value">${value}</td>
  </tr>`;
}

function csvCell(v, quote = true) {
  if (v === null || v === undefined || v === '') return '';
  const s = String(v);
  if (!quote && /^[0-9]+$/.test(s)) return s;
  return '"' + s.replaceAll('"', '""') + '"';
}

function dnnOriginalCsv(r, d) {
  const apiOriginal =
    r.original || r.ORIGINAL ||
    r.orijinal || r.ORIJINAL ||
    r.raw_original || r.rawOriginal ||
    r.csv || r.CSV ||
    r.line || r.LINE ||
    r.rawLine || r.raw_line || '';

  if (apiOriginal) return String(apiOriginal);

  const birthPlacePhone = [d.birthPlace, d.phone].filter(Boolean).join(' ');

  return [
    csvCell(d.id, false),
    csvCell(d.plate),
    csvCell(d.model),
    csvCell(d.cert),
    csvCell(d.type),
    csvCell(d.year),
    csvCell(d.engine),
    csvCell(d.body),
    '',
    csvCell(d.color),
    csvCell(d.owner),
    csvCell(d.address),
    csvCell(d.gomruk),
    csvCell(d.regDate),
    csvCell(d.oldPlate),
    csvCell(d.nishane),
    '',
    '',
    csvCell(d.kateqoriya),
    csvCell(d.birth),
    csvCell(birthPlacePhone),
    '',
    ''
  ].join(',');
}

function isRawLabel(label) {
  const x = normText(String(label || '')).replace(/\s+/g, ' ');
  return x === 'raw'
    || x === 'original'
    || x === 'orijinal'
    || x.includes('original')
    || x.includes('orijinal');
}

function rawRow(label, value) {
  if (!value) return '';
  return `<tr class="raw-row">
    <td class="label raw-label">${esc(label || 'RAW')}</td>
    <td class="value raw-value"><pre>${esc(String(value))}</pre></td>
  </tr>`;
}

function money(v) {
  const n = Number(v || 0);
  if (n > 0) return `<span class="debt">${n.toFixed(2)} ₼</span>`;
  if (n < 0) return `<span class="plus">${n.toFixed(2)} ₼</span>`;
  return b('Borc yoxdur', 'green');
}

function dbPersonQuery(r) {
  const source = r.temsilci || r.ad || '';
  return cleanPersonName(source);
}

function dbDnnSearchLink(r, label = '🚗 DNN') {
  const q = dbPersonQuery(r);
  return q ? `<a href="/?page=dnn&q=${encodeURIComponent(q)}">${label}</a>` : '';
}

function dbCard(r) {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">🗄️</div>
      <div>
        <h2>${esc(r.ad || '—')}</h2>
        <p>VÖEN: ${esc(r.voen || '—')}</p>
      </div>
      <div class="status">
        ${b(r.menbe === 'rey' ? 'Reyestr' : 'MMC', 'gray')}
      </div>
    </div>

    <table>
      ${row('Hüquqi forma', esc(r.forma || ''))}
      ${row('Hüquqi ünvan', esc(r.unvan || ''))}
      ${row('Nizamnamə kapitalı', esc(r.kapital || ''))}
      ${row('Maliyyə ili', esc(r.maliyye || ''))}
      ${row('Qanuni təmsilçi', esc(r.temsilci || ''))}
      ${row('Təsisçilər', esc(r.tesiscilar || ''))}
      ${row('Qeydiyyat tarixi', esc(r.tarix || ''))}
    </table>

    <div class="actions">
      ${tinCrossLinks(r.voen, { tdrQuery: r.ad })}
      ${dbDnnSearchLink(r)}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  const s = String(line || '');

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];

    if (ch === '"' && q && next === '"') {
      cur += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      q = !q;
      continue;
    }

    if (ch === ',' && !q) {
      out.push(cur.trim());
      cur = '';
      continue;
    }

    cur += ch;
  }

  out.push(cur.trim());
  return out;
}

function dnnField(text, label) {
  const lines = String(text || '').replaceAll(String.fromCharCode(13), '').split(String.fromCharCode(10));
  const wanted = String(label || '').toLowerCase().replaceAll('  ', ' ').trim();

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;

    const k = line.slice(0, idx).toLowerCase().replaceAll('  ', ' ').trim();
    const v = line.slice(idx + 1).trim();

    if (k === wanted) return v;
  }

  return '';
}

function phoneFromText(text) {
  const m = String(text || '').match(/(\+?994\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|0\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|0\d{9})/g);
  return m ? [...new Set(m.map(x => x.replace(/\s+/g, '')))].join(', ') : '';
}

function isValidAzPhone(p) {
  const clean = String(p || '').replace(/[\s\-()]/g, '');
  return /^(\+?994\d{9}|0\d{9})$/.test(clean);
}

function cleanDnnPhone(phoneStr) {
  if (!phoneStr) return '';
  return String(phoneStr)
    .split(/[,;]/)
    .map(p => p.trim())
    .filter(Boolean)
    .filter(isValidAzPhone)
    .join(', ');
}

function stripPhone(text) {
  return String(text || '').replace(/(\+?994\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|0\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|0\d{9})/g, '').trim();
}

function cleanPersonName(full) {
  return String(full || '')
    .split(' ')
    .filter(w => !['OĞLU','OGLU','QIZI','QIZI.'].includes(String(w).toUpperCase()))
    .join(' ')
    .replaceAll('  ', ' ')
    .trim()
    .toUpperCase();
}

function splitPersonName(full) {
  const parts = cleanPersonName(full).split(' ').filter(Boolean);

  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    patronymic: parts[2] || ''
  };
}

function edvSearchLink(full, label = 'ƏDV') {
  const p = splitPersonName(full);
  if (!p.lastName || !p.firstName || !p.patronymic) return '';
  return `<a href="/?page=edv&mode=name&lastName=${encodeURIComponent(p.lastName)}&firstName=${encodeURIComponent(p.firstName)}&patronymic=${encodeURIComponent(p.patronymic)}">${label}</a>`;
}

function bazaPersonQuery(full) {
  const q = cleanPersonName(full || '').toUpperCase();
  const p = q.split(' ').filter(Boolean);
  if (p.length >= 3 && !looksSurname(p[0]) && looksSurname(p[1])) {
    return [p[1], p[0], ...p.slice(2)].join(' ');
  }
  return q;
}

function bazaSearchLink(full, label = '⚖️ VERGİ') {
  const q = bazaPersonQuery(full);
  return q ? `<a href="/?page=vergi&q=${encodeURIComponent(q)}">${label}</a>` : '';
}

function looksSurname(w) {
  const x = String(w || '').toUpperCase();
  return /(OV|OVA|EV|EVA|YEV|YEVA|ZADƏ|ZADE|LI|Lİ|LU|LÜ|SOY)$/.test(x);
}

function dnnPersonQuery(full) {
  const q = cleanPersonName(full || '').toUpperCase();
  const p = q.split(' ').filter(Boolean);
  if (p.length >= 3 && !looksSurname(p[0]) && looksSurname(p[1])) {
    return [p[1], p[0], ...p.slice(2)].join(' ');
  }
  return q;
}

function dnnSearchLink(full, label = '🚗 DNN') {
  const q = dnnPersonQuery(full);
  return q ? `<a href="/?page=dnn&q=${encodeURIComponent(q)}">${label}</a>` : '';
}

// ── DEĞİŞİKLİK 2: MNB axtarış linki funksiyası ──
function mnbSearchLink(full, label = '📱 MNB') {
  const q = cleanPersonName(full || '');
  return q ? `<a href="/?page=mnb&q=${encodeURIComponent(q)}">${label}</a>` : '';
}

function b2bSearchText(full) {
  return String(full || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function b2bRemoveSuffixes(s) {
  return String(s || '')
    .replace(/\b(OĞLU|OGLU|OGHLU|QIZI|KYZY)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function b2bLowerAz(s) {
  return String(s || '')
    .trim()
    .replaceAll('İ', 'i')
    .replaceAll('I', 'ı')
    .replaceAll('Ə', 'ə')
    .replaceAll('Ö', 'ö')
    .replaceAll('Ü', 'ü')
    .replaceAll('Ğ', 'ğ')
    .replaceAll('Ş', 'ş')
    .replaceAll('Ç', 'ç')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function b2bDottedI(s) {
  return String(s || '')
    .trim()
    .replaceAll('İ', 'i̇')
    .replaceAll('I', 'i̇')
    .replaceAll('ı', 'i̇')
    .replaceAll('i', 'i̇')
    .replaceAll('Ə', 'ə')
    .replaceAll('Ö', 'ö')
    .replaceAll('Ü', 'ü')
    .replaceAll('Ğ', 'ğ')
    .replaceAll('Ş', 'ş')
    .replaceAll('Ç', 'ç')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function b2bAscii(s) {
  return normText(s || '').replace(/\s+/g, ' ');
}

function b2bTitleAz(s) {
  return b2bLowerAz(s).split(' ').filter(Boolean).map(function(w){
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

function b2bQueryVariants(full) {
  const raw = b2bSearchText(full);
  const noSuffix = b2bRemoveSuffixes(raw);
  const parts = noSuffix.split(' ').filter(Boolean);

  const bases = [
    raw,
    noSuffix,
    parts.slice(0, 3).join(' '),
    parts.slice(0, 2).join(' ')
  ].filter(Boolean);

  const variants = [];
  for (const base of bases) {
    variants.push(base);
    variants.push(b2bLowerAz(base));
    variants.push(b2bTitleAz(base));
    variants.push(b2bDottedI(base));
    variants.push(b2bAscii(base));
  }

  return Array.from(new Set(variants.filter(Boolean)));
}

function b2bPersonSearchLink(full, label = 'B2B') {
  const q = b2bSearchText(full || '');
  return q ? `<a href="/?page=b2b&b2bMode=people&b2bName=${encodeURIComponent(q)}">${label}</a>` : '';
}

function personCrossLinks(full, opts = {}) {
  const edv  = opts.edv   === false ? '' : edvSearchLink(full, 'ƏDV');
  const dnn  = opts.dnn   === false ? '' : dnnSearchLink(full, '🚗 DNN');
  const vergi = opts.vergi === false ? '' : bazaSearchLink(full, '⚖️ VERGİ');
  const b2b  = opts.b2b   === false ? '' : b2bPersonSearchLink(full, 'B2B');
  // ── DEĞİŞİKLİK 2: personCrossLinks-ə MNB əlavə edildi ──
  const mnb  = opts.mnb   === false ? '' : mnbSearchLink(full, '📱 MNB');
  return `${dnn}${edv}${vergi}${b2b}${mnb}`;
}

var mskSearchLinkFixed = function(full, birth = '', gender = 'Kişi', label = '🗳️ MSK-də yoxla →') {
  const name = cleanPersonName(full || '');
  const parts = name.split(' ').filter(Boolean);
  const last = parts[0] || '';
  const first = parts[1] || '';
  const patr = parts.slice(2).join(' ');
  if (!last || !first) return '';
  const b = String(birth || '').trim();
  const birthAz = b ? (b.includes('-') ? b.split('-').reverse().join('.') : b) : '';
  return `<a href="/?page=msk&mskLastName=${encodeURIComponent(last)}&mskFirstName=${encodeURIComponent(first)}&mskPatronymic=${encodeURIComponent(patr)}${birthAz ? '&mskBirth=' + encodeURIComponent(birthAz) : ''}&mskGender=${encodeURIComponent(gender || 'Kişi')}">${label}</a>`;
}

function azDate(d) {
  const s = String(d || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split('-').reverse().join('.');
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
  return fd(s);
}

function normalizeDnnRecord(r) {
  const raw = r.metn || r.METN || r.text || r.mətn || r.raw || '';

  const d = {
    id: r.id || r.ID || '',
    raw: raw,
    owner: dnnField(raw, 'Sahibi'),
    plate: dnnField(raw, 'Qeydiyyat nisani'),
    model: dnnField(raw, 'Marka, model'),
    cert: dnnField(raw, 'Sened N'),
    type: dnnField(raw, 'Tip'),
    year: dnnField(raw, 'Buraxilis ili'),
    engine: dnnField(raw, 'Muherrik N'),
    body: dnnField(raw, 'Ban (kuzov) N'),
    color: dnnField(raw, 'Rengi'),
    address: dnnField(raw, 'Unvan'),
    regDate: dnnField(raw, 'Qeydiyyat tarixi'),
    oldPlate: dnnField(raw, 'Kohne nisan'),
    birth: dnnField(raw, 'Tevellud'),
    birthPlace: dnnField(raw, 'Doguldugu yer'),
    phone: cleanDnnPhone(dnnField(raw, 'Telefon')),
    gomruk: dnnField(raw, 'Gomruk bayan'),
    nishane: dnnField(raw, 'Nisane'),
    kateqoriya: dnnField(raw, 'Kateqoriya'),
    source: dnnField(raw, 'Menbe')
  };

  d.originalRaw = dnnOriginalCsv(r, d);
  return d;
}

function genericDbCard(r) {
  const d = normalizeDnnRecord(r);

  return `<div class="card">
    <div class="card-head">
      <div class="logo">🚗</div>
      <div>
        <h2>${esc(d.owner || 'DNN nəticəsi')}</h2>
        <p>${d.plate ? 'Qeydiyyat nişanı: ' + esc(d.plate) : 'Nəqliyyat bazası məlumatı'}</p>
      </div>
      <div class="status">
        ${b('DNN', 'gray')}
      </div>
    </div>

    <table>
      ${row('Sahibi', esc(d.owner))}
      ${row('Qeydiyyat nişanı', esc(d.plate))}
      ${row('Marka, model', esc(d.model))}
      ${row('Sənəd №', esc(d.cert))}
      ${row('Tip', esc(d.type))}
      ${row('Buraxılış ili', esc(d.year))}
      ${row('Mühərrik №', esc(d.engine))}
      ${row('Ban / kuzov №', esc(d.body))}
      ${row('Rəngi', esc(d.color))}
      ${row('Ünvan', esc(d.address))}
      ${row('Qeydiyyat tarixi', azDate(d.regDate))}
      ${row('Köhnə nişan', esc(d.oldPlate))}
      ${row('Təvəllüd', azDate(d.birth))}
      ${row('Doğulduğu yer', esc(d.birthPlace))}
      ${row('Telefon', esc(d.phone))}
      ${row('Gömrük bəyannaməsi', esc(d.gomruk))}
      ${row('Nişanə', esc(d.nishane))}
      ${row('Kateqoriya', esc(d.kateqoriya))}
      ${row('Mənbə', esc(d.source))}
      ${rawRow('Orijinal', d.originalRaw)}
    </table>

    <div class="actions">
      ${personCrossLinks(d.owner, { dnn: false })}
      ${mskSearchLinkFixed(d.owner, d.birth, 'Kişi', '🗳️ MSK (Kişi)')}
      ${mskSearchLinkFixed(d.owner, d.birth, 'Qadın', '🗳️ MSK (Qadın)')}
      <button onclick="printCard(this)">🖨️ PDF</button>
      ${cardToolbar(d.plate || d.owner, d.owner || d.plate)}
    </div>
    ${cardNote(d.plate || d.owner)}
  </div>`;
}

function cardToolbar(id, title) {
  const safeId = String(id || title || '').replace(/['"<>&]/g,'').slice(0,200);
  const safeTitle = String(title || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').slice(0,200);
  return `<button class="fav-star" title="Seçilmişlərə əlavə et" onclick="toggleFavorite(this,'${safeId}','${safeTitle}')">⭐</button>
    <button onclick="toggleNote(this,'${safeId}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:0 4px;min-height:unset" title="Qeyd əlavə et">📝</button>
    <button onclick="shareCard('${safeId}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:0 4px;min-height:unset" title="Linki kopyala">🔗</button>
    <button onclick="compareCard(this,'${safeId}','${safeTitle}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:0 4px;min-height:unset" title="Müqayisəyə əlavə et">⚖️</button>`;
}
function cardNote(id) {
  const safeId = String(id || '').replace(/['"<>&]/g,'').slice(0,200);
  return `<div class="card-note" id="note_${safeId}">
    <textarea placeholder="Qeyd yazın..." onblur="saveNote('${safeId}',this.value)" id="nta_${safeId}"></textarea>
    <div class="card-note-hint">Qeyd avtomatik yadda saxlanılır.</div>
  </div>`;
}

function looksLikeCsvDump(v) {
  const s = String(v || '');
  if (s.length < 120) return false;
  const commas = (s.match(/,/g) || []).length;
  const azeCount = (s.match(/AZE\s*\d/gi) || []).length;
  const zeroPattern = (s.match(/,0,0,0,/g) || []).length;
  if (commas >= 6 && (azeCount >= 2 || zeroPattern >= 1)) return true;
  if (s.length > 200 && commas >= 10) return true;
  return false;
}

function cleanMnbValue(v) {
  if (looksLikeCsvDump(v)) return '';
  return String(v || '');
}

function mnbCard(r) {
  const SKIP = new Set(['id', 'raw', 'name', 'Original', 'metn', 'METN', 'mətn', 'text', 'TEXT', 'original', 'ORIGINAL', 'orijinal', 'ORIJINAL', 'csv', 'CSV', 'line', 'LINE', 'rawLine', 'raw_line', 'rawOriginal', 'raw_original']);
  const AZ = {
    'Soyad': 'Soyad', 'Ad': 'Ad', 'Ata adı': 'Ata adı',
    'Telefon': 'Telefon', 'Ünvan': 'Ünvan', 'Şəhər': 'Şəhər',
    'Təvəllüd': 'Təvəllüd', 'Qeydiyyat tarixi': 'Qeydiyyat tarixi',
    'Pasport': 'Pasport', 'Mənbə': 'Mənbə'
  };
  const rows2 = Object.entries(r || {}).map(([k, v]) => {
    if (SKIP.has(k) || v === null || v === undefined || v === '') return '';
    const label = AZ[k];
    if (!label) return '';
    const cleanVal = cleanMnbValue(v);
    if (!cleanVal) return '';
    return isRawLabel(label) ? rawRow(label, cleanVal) : row(label, esc(cleanVal));
  }).join('');

  const fullName = r.name || 'MNB nəticəsi';
  const birth = r['Təvəllüd'] || '';

  return '<div class="card">' +
    '<div class="card-head">' +
      '<div class="logo">MNB</div>' +
      '<div><h2>' + esc(fullName) + '</h2><p>MNB \u2014 \u015e\u0259xs bazas\u0131</p></div>' +
      '<div class="status">' + b('MNB', 'gray') + '</div>' +
    '</div>' +
    '<table>' + rows2 + '</table>' +
    '<div class="actions">' +
      dnnSearchLink(fullName, '\uD83D\uDE97 DNN') +
      bazaSearchLink(fullName, '\u2696\uFE0F VERG\u0130') +
      b2bPersonSearchLink(fullName, 'B2B') +
      ('<a href="/?page=msk' + '&mskLastName=' + encodeURIComponent(r.Soyad || '') + '&mskFirstName=' + encodeURIComponent(r.Ad || '') + '&mskPatronymic=' + encodeURIComponent(r['Ata adı'] || '') + (birth ? '&mskBirth=' + encodeURIComponent(birth) + '&mskGender=Kişi' : '') + '">🗳️ MSK</a>') +
      '<button onclick="printCard(this)">\uD83D\uDDB8\uFE0F PDF</button>' +
      cardToolbar(fullName, fullName) +
    '</div>' +
    cardNote(fullName) +
  '</div>';
}

function htmlDecode(s) {
  return String(s || '')
    .split('&nbsp;').join(' ')
    .split('&amp;').join('&')
    .split('&lt;').join('<')
    .split('&gt;').join('>')
    .split('&quot;').join('"')
    .split('&#39;').join("'")
    .split(String.fromCharCode(10)).join(' ')
    .split(String.fromCharCode(13)).join(' ')
    .trim();
}

function stripTags(s) {
  let x = String(s || '');
  let out = '';
  let inside = false;
  for (let i = 0; i < x.length; i++) {
    const ch = x[i];
    if (ch === '<') { inside = true; out += ' '; continue; }
    if (ch === '>') { inside = false; continue; }
    if (!inside) out += ch;
  }
  return htmlDecode(out).replaceAll('  ', ' ').replaceAll('  ', ' ');
}

function partsBetween(text, startTag, endTag) {
  const out = [];
  let pos = 0;
  const s = String(text || '');
  while (true) {
    const a = s.toLowerCase().indexOf(startTag.toLowerCase(), pos);
    if (a === -1) break;
    const b1 = s.indexOf('>', a);
    if (b1 === -1) break;
    const b = s.toLowerCase().indexOf(endTag.toLowerCase(), b1 + 1);
    if (b === -1) break;
    out.push(s.slice(b1 + 1, b));
    pos = b + endTag.length;
  }
  return out;
}

function parseVoemRows(htmlText, q = '') {
  const out = [];
  const rows = partsBetween(htmlText, '<tr', '</tr>');

  for (const r of rows) {
    const rawCells = partsBetween(r, '<td', '</td>');
    if (rawCells.length < 7) continue;

    const cells = rawCells.map(stripTags);

    out.push({
      sn: cells[0] || '',
      name: cells[1] || '',
      tin: cells[2] || '',
      productType: cells[3] || '',
      commercialName: cells[4] || '',
      taxAuthority: cells[5] || '',
      region: cells[6] || '',
      address: cells[7] || ''
    });
  }

  return out;
}

function voemCard(r) {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">VÖEM</div>
      <div>
        <h2>${esc(r.name || '—')}</h2>
        <p>VÖEN: ${esc(r.tin || '—')}</p>
      </div>
      <div class="status">${b('İstehsal', 'gray')}</div>
    </div>

    <table>
      ${row('S/N', esc(r.sn || ''))}
      ${row('Vergi ödəyicisinin adı', esc(r.name || ''))}
      ${row('VÖEN', esc(r.tin || ''))}
      ${row('İstehsal etdiyi məhsulların növü', esc(r.productType || ''))}
      ${row('Məhsulun ticari adı', esc(r.commercialName || ''))}
      ${row('Aid olduğu vergi orqanı', esc(r.taxAuthority || ''))}
      ${row('Şəhər / Rayon', esc(r.region || ''))}
      ${row('İstehsal sahəsinin faktiki ünvanı', esc(r.address || ''))}
    </table>

    <div class="actions">
      ${tinCrossLinks(r.tin, { exVoem: true, tdrQuery: r.name })}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function amountManat(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return esc(String(v));
  return `${(n / 100).toFixed(2)} AZN`;
}

function telDebt(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return esc(String(v));
  return `${Math.abs(n).toFixed(2)} AZN${n < 0 ? ' avans' : ''}`;
}

function telProviderName(p) {
  return p === 'azeurotel' ? 'AzEuroTel'
    : p === 'aztelekom' ? 'Aztelekom'
    : p === 'transeurocom' ? 'TransEuroCom'
    : p === 'ultel' ? 'Ultel'
    : p;
}

function telCrossLinks(city, number, currentProvider) {
  const providers = ['azeurotel', 'aztelekom', 'transeurocom', 'ultel'];
  return providers
    .filter(p => p !== currentProvider)
    .map(p => `<a href="/?page=tel&provider=${encodeURIComponent(p)}&city=${encodeURIComponent(city || '')}&number=${encodeURIComponent(number || '')}">☎️ ${telProviderName(p)}-də axtar →</a>`)
    .join('');
}

function telecomCard(r, city, number, provider) {
  const subscriber = r?.subscriberInfo?.value || '—';
  const merchant = r?.billingMerchant?.displayName || telProviderName(provider);
  const params = r?.parameters || [];
  const cityDisplay = params.find(x => x.name === 'city')?.displayValue || city || '';
  const numberDisplay = params.find(x => x.name === 'number')?.displayValue || number || '';
  const note = Array.isArray(r?.note) ? r.note.join(' ') : '';
  const opts = Array.isArray(r?.billingOption) ? r.billingOption : [];

  const optRows = opts.map((o, i) => {
    const debt = (o.additionalInfos || []).find(x => x.name === 'currentDebt')?.value;
    const balance = o.balance !== null && o.balance !== undefined ? amountManat(o.balance) : (o.amountDue !== null && o.amountDue !== undefined ? amountManat(o.amountDue) : '—');
    return row(`${i + 1}. ${o.title || 'Xidmət'}`, `${balance} / borc: ${telDebt(debt)}`);
  }).join('');

  return `<div class="card">
    <div class="card-head">
      <div class="logo">☎️</div>
      <div>
        <h2>${esc(subscriber)}</h2>
        <p>${esc(merchant)} — ${esc(cityDisplay)} / ${esc(numberDisplay)}</p>
      </div>
      <div class="status">${b(merchant, 'gray')}</div>
    </div>

    <table>
      ${row('Abonent', esc(subscriber))}
      ${row('Şəhər kodu', esc(cityDisplay))}
      ${row('Nömrə', esc(numberDisplay))}
      ${row('Qeyd', esc(note))}
      ${optRows}
    </table>

    <div class="actions">
      ${personCrossLinks(subscriber)}
      ${telCrossLinks(city, number, provider)}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function aztelekomCard(r, city, number) {
  return telecomCard(r, city, number, 'aztelekom');
}

function transeurocomCard(r, city, number) {
  return telecomCard(r, city, number, 'transeurocom');
}

function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replaceAll('ə', 'e')
    .replaceAll('ı', 'i')
    .replaceAll('ö', 'o')
    .replaceAll('ü', 'u')
    .replaceAll('ğ', 'g')
    .replaceAll('ş', 's')
    .replaceAll('ç', 'c')
    .replaceAll('i̇', 'i')
    .split(String.fromCharCode(10)).join(' ')
    .split(String.fromCharCode(13)).join(' ')
    .split('  ').join(' ')
    .split('  ').join(' ')
    .trim();
}

function findB2BOfficerId(htmlText, query) {
  const html = String(htmlText || '');
  const q = normText(query);
  let first = '';
  let pos = 0;

  while (true) {
    const idx = html.indexOf('/tr/officer/', pos);
    if (idx === -1) break;

    const start = idx + '/tr/officer/'.length;
    let end = start;
    while (end < html.length && html.charCodeAt(end) >= 48 && html.charCodeAt(end) <= 57) end++;

    const id = html.slice(start, end);
    if (id && !first) first = id;

    const a1 = html.lastIndexOf('<a', idx);
    const a2 = html.indexOf('</a>', idx);
    const label = a1 !== -1 && a2 !== -1 ? normText(stripTags(html.slice(a1, a2))) : '';

    if (id && label && (label.includes(q) || q.includes(label))) return id;
    pos = end + 1;
  }

  return first;
}

function makeB2BCompanySlug(s) {
  return normText(s)
    .replaceAll('"', '')
    .replaceAll('mmc', '')
    .replaceAll('mehdud mesuliyyetli cemiyyeti', '')
    .replaceAll('nesriyyat evi', 'nesriyyat-evi')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function displayPersonCaps(s) {
  return cleanPersonName(s || '').toUpperCase();
}

function b2bPeopleCard(data) {
  const props = data?.pageProps || {};
  const p = props.person || {};
  const country = p.country?.translation?.tr || p.country?.name || '';
  const source = props.dataSource || {};
  const companies = Array.isArray(p.companies) ? p.companies : [];

  const companyRows = companies.map((c, i) => {
    const role = c.role?.name || '';
    const voen = c.internationalNumber || '';
    const links = voen
      ? `<br>${tinCrossLinks(voen, { exB2b: true })}`
      : '';
    return row(`${i + 1}. Şirkət`, `${esc(c.name || '')}${voen ? `<br><span class="mutedline">VÖEN: ${esc(voen)}</span>` : ''}${role ? `<br><span class="mutedline">Rol: ${esc(role)}</span>` : ''}${links}`);
  }).join('');

  return `<div class="card">
    <div class="card-head">
      <div class="logo">B2B</div>
      <div>
        <h2>${esc(displayPersonCaps(p.name || '—'))}</h2>
        <p>${esc(country || 'B2BHint')}</p>
      </div>
      <div class="status">${b('İnsanlar', 'gray')}</div>
    </div>

    <table>
      ${row('Ad', esc(displayPersonCaps(p.name || '')))}
      ${row('Ölkə', esc(country || ''))}
      ${row('Mənbə', esc(source.sourceName || ''))}
      ${row('Hüquqi əsas', esc(source.sourceLaw || ''))}
      ${row('Əlaqəli şirket sayı', esc(String(companies.length)))}
      ${companyRows}
    </table>

    <div class="actions">
      ${personCrossLinks(displayPersonCaps(p.name || ''))}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function b2bCompanyCard(data) {
  const props = data?.pageProps || {};
  const c = props.company || {};
  const source = props.companyDataSource || {};
  const type = c.type?.type || c.type?.translation?.tr || '';
  const authority = c.accountingAuthority?.providerName || '';
  const persons = Array.isArray(c.persons) ? c.persons : [];
  const personRows = persons.map((p, i) => {
    const personName = displayPersonCaps(p.person?.name || '');
    const role = p.role?.name || '';
    return row(`${i + 1}. Şəxs`, `${esc(personName)}${role ? `<br><span class="mutedline">Rol: ${esc(role)}</span>` : ''}${p.personId ? `<br><a href="/?page=b2b&b2bMode=people&b2bId=${encodeURIComponent(p.personId)}">B2B İnsanlar →</a>` : ''}`);
  }).join('');

  return `<div class="card">
    <div class="card-head">
      <div class="logo">B2B</div>
      <div>
        <h2>${esc(c.name || '—')}</h2>
        <p>VÖEN: ${esc(c.internationalNumber || '—')}</p>
      </div>
      <div class="status">${b('Şirkət', 'gray')}</div>
    </div>

    <table>
      ${row('Şirkət adı', esc(c.name || ''))}
      ${row('VÖEN', esc(c.internationalNumber || ''))}
      ${row('Brend adı', esc(c.brandName || ''))}
      ${row('Hüquqi forma', esc(type || ''))}
      ${row('Ünvan', esc(c.address || ''))}
      ${row('Nizamnamə kapitalı', esc(c.paidShareCapital || ''))}
      ${row('Maliyyə ili', esc(c.financialYear || ''))}
      ${row('Qeydiyyat tarixi', c.dateCreated ? esc(c.dateCreated.slice(0, 10)) : '')}
      ${row('Vergi orqanı', esc(authority || ''))}
      ${row('ƏDV', c.paysVat ? b('Bəli', 'green') : b('Xeyr', 'gray'))}
      ${row('Dövlət borcu', c.hasPublicDebt ? b('Var', 'red') : b('Yoxdur', 'green'))}
      ${row('Mənbə', esc(source.sourceName || ''))}
      ${personRows}
    </table>

    <div class="actions">
      ${tinCrossLinks(c.internationalNumber, { exB2b: true, tdrQuery: c.name })}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}


function lsnzDate(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const d = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d.split('-').reverse().join('.');
  return esc(s);
}

function lsnzStatus(r) {
  const active = Number(r.isActive || 0) === 1;
  const status = r.status || '';
  return active ? b(status || 'Aktiv', 'green') : b(status || 'Qeyri-aktiv', 'red');
}

function lsnzAddendumRows(list) {
  if (!Array.isArray(list) || !list.length) return '';

  return list.map((x, i) => {
    const parts = [
      x.addendumNumber ? `<b>Əlavə №:</b> ${esc(x.addendumNumber)}` : '',
      x.registrationDate ? `<b>Tarix:</b> ${lsnzDate(x.registrationDate)}` : '',
      x.addressrText ? `<b>Ünvan:</b> ${esc(x.addressrText)}` : '',
      x.serviceDirectionList ? `<b>İstiqamət:</b> ${esc(x.serviceDirectionList)}` : '',
      x.status ? `<b>Status:</b> ${esc(x.status)}` : ''
    ].filter(Boolean).join('<br>');

    return row(`${i + 1}. Əlavə`, parts);
  }).join('');
}

function lsnzCard(r) {
  const addendums = r.registryAddennumPreviewModel || [];

  return `<div class="card">
    <div class="card-head">
      <div class="logo">📜</div>
      <div>
        <h2>${esc(r.applicantName || 'LSNZ nəticəsi')}</h2>
        <p>${esc(r.serviceName || 'Lisenziya və icazə reyestri')}</p>
      </div>
      <div class="status">
        ${lsnzStatus(r)}
      </div>
    </div>

    <table>
      ${row('VÖEN', esc(r.taxNumber || ''))}
      ${row('Lisenziya / icazə', esc(r.serviceName || ''))}
      ${row('Qeydiyyat №', esc(r.registrationNumber || ''))}
      ${row('Əlavə №', esc(r.addendumNumber || ''))}
      ${row('Qeydiyyat tarixi', lsnzDate(r.registrationDate || r.inDt))}
      ${row('Status', esc(r.status || ''))}
      ${row('Müraciətçi', esc(r.applicantName || ''))}
      ${row('Müraciətçi ünvanı', esc(r.applicantAddress || ''))}
      ${row('Qurum', esc(r.organizationName || ''))}
      ${row('Qurum ünvanı', esc(r.organizationAddress || ''))}
      ${row('Xidmət tipi', esc(r.serviceType || ''))}
      ${row('Aktivlik', Number(r.isActive || 0) === 1 ? b('Aktiv', 'green') : b('Qeyri-aktiv', 'red'))}
      ${lsnzAddendumRows(addendums)}
    </table>

    <div class="actions">
      ${tinCrossLinks(r.taxNumber, { exLsnz: true, tdrQuery: r.applicantName })}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}



function tenderLocalCard(r) {
  const qiymet = r.qiymet ? Number(r.qiymet).toLocaleString('az-AZ', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' AZN' : null;
  return `<div class="card">
    <div class="card-head">
      <div class="logo" style="font-size:10px;font-weight:900;background:linear-gradient(135deg,#1e3a5f,#2563eb)">TENDER</div>
      <div>
        <h2>${esc(r.predmet || 'Tender qeydi')}</h2>
        <p>${esc(r.satinalan || '')}${r.il ? ' · ' + esc(String(r.il)) : ''}</p>
      </div>
    </div>
    <table>
      ${row('Satınalan', esc(r.satinalan || ''))}
      ${r.qalib     ? row('Qalib',       esc(r.qalib))       : ''}
      ${r.malgondaran ? row('Podratçı',  esc(r.malgondaran)) : ''}
      ${row('Predmet', esc(r.predmet || ''))}
      ${qiymet      ? row('Məbləğ',      `<b>${qiymet}</b>`) : ''}
      ${r.tarix     ? row('Tarix',       esc(r.tarix))       : ''}
      ${r.il        ? row('İl',          esc(String(r.il)))  : ''}
      ${r.menbe_fayl ? row('Mənbə',      esc(r.menbe_fayl))  : ''}
    </table>
  </div>`;
}

function tenderDate(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const d = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d.split('-').reverse().join('.');
  return esc(s);
}

function tenderMoney(v, currency = 'AZN') {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return esc(String(v));
  return n.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + esc(currency || 'AZN');
}

function tenderEventCard(r) {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">📑</div>
      <div>
        <h2>${esc(r.awardedParticipantName || 'Müsabiqə elanı')}</h2>
        <p>${esc(r.eventName || 'Dövlət satınalması')}</p>
      </div>
      <div class="status">${b('Müsabiqə', 'gray')}</div>
    </div>

    <table>
      ${row('Event ID', esc(r.eventId || ''))}
      ${row('Satınalan təşkilat', esc(r.buyerOrganizationName || ''))}
      ${row('Müsabiqənin adı', esc(r.eventName || ''))}
      ${row('Qalib iştirakçı', esc(r.awardedParticipantName || ''))}
      ${row('Qiymət', tenderMoney(r.awardedOrganizationPrice, 'AZN'))}
      ${row('Bitmə tarixi', tenderDate(r.finishDate))}
      ${row('Satınalma tipi', esc(String(r.eventType || '')))}
      ${row('Yeni versiya', r.hasNewVersion ? b('Var', 'yellow') : b('Yoxdur', 'gray'))}
    </table>

    <div class="actions">
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function tenderContractCard(r) {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">📄</div>
      <div>
        <h2>${esc(r.supplierOrganizationName || 'Bağlanmış müqavilə')}</h2>
        <p>${esc(r.tenderName || 'Dövlət satınalması müqaviləsi')}</p>
      </div>
      <div class="status">${b(r.tenderType || 'Müqavilə', 'gray')}</div>
    </div>

    <table>
      ${row('Tender ID', esc(r.publicTenderId || ''))}
      ${row('Satınalan təşkilat', esc(r.buyerOrganizationName || ''))}
      ${row('Təchizatçı', esc(r.supplierOrganizationName || ''))}
      ${row('Təchizatçı VÖEN', esc(r.supplierOrganizationVoen || ''))}
      ${row('Müqavilə məbləği', tenderMoney(r.amount, r.currency || 'AZN'))}
      ${row('Tenderin adı', esc(r.tenderName || ''))}
      ${row('Müqavilə tarixi', tenderDate(r.contractDate))}
      ${row('Bitmə tarixi', tenderDate(r.expireDate))}
      ${row('Dərc tarixi', tenderDate(r.issueDate))}
      ${row('Tender tipi', esc(r.tenderType || ''))}
      ${row('Qeyd', esc(r.comment || ''))}
    </table>

    <div class="actions">
      ${r.supplierOrganizationVoen ? tinCrossLinks(r.supplierOrganizationVoen, { exTender: true, tdrQuery: r.supplierOrganizationName }) : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function tenderCard(r, mode) {
  return mode === 'contracts' ? tenderContractCard(r) : tenderEventCard(r);
}


function tdrDate(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10).split('-').reverse().join('.');
  return esc(s);
}

function tdrCleanCustomerName(name) {
  return String(name || '')
    .replace(/"/g, '')
    .replace(/Məhdud\s+Məsuliyyətli\s+Cəmiyyəti/gi, ' ')
    .replace(/Mehdud\s+Mesuliyyetli\s+Cemiyyeti/gi, ' ')
    .replace(/Məhdud\s+Məsuliyyətli\s+Cəmiyyət/gi, ' ')
    .replace(/Mehdud\s+Mesuliyyetli\s+Cemiyyet/gi, ' ')
    .replace(/\bMMC\b/gi, ' ')
    .replace(/\bASC\b/gi, ' ')
    .replace(/\bQSC\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('az-AZ');
}

function tdrSearchQuery(value, fallback = '') {
  const q = tdrCleanCustomerName(value);
  const f = tdrCleanCustomerName(fallback);
  return q || f || String(value || fallback || '').trim().toLocaleLowerCase('az-AZ');
}

function tdrNum(v, suffix = '') {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return esc(String(v)) + suffix;
  return esc(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')) + suffix;
}

function tdrRoomsRows(rooms) {
  if (!Array.isArray(rooms) || !rooms.length) return '';

  const text = rooms.map(function(x) {
    const roomLabel = x.studio ? 'studio' : `${esc(x.rooms || '')} otaqlı`;
    const duplex = x.duplex ? ' / duplex' : '';
    return `${roomLabel}${duplex}: ${esc(x.apartments || '')} mənzil`;
  }).join('<br>');

  return row('Mənzil bölgüsü', text);
}

function tdrDetailRows(d) {
  if (!d || !Object.keys(d).length) return '';

  return `
    ${row('Podratçı', esc(d.contractor || ''))}
    ${row('İcazə verən qurum', esc(d.permissionOrganization || ''))}
    ${row('İcazə sənədi №', esc(d.permissionDocNo || ''))}
    ${row('İcazə sənədi tarixi', tdrDate(d.permissionDocDate))}
    ${row('Reyestr kodu', esc(d.code || ''))}
    ${row('Məktub / rəy №', esc(d.refNo || ''))}
    ${row('Məktub / rəy tarixi', tdrDate(d.refDate))}
    ${row('Ekspertiza rəyi №', esc(d.expertRefNo || ''))}
    ${row('Ekspertiza rəyi tarixi', tdrDate(d.expertRefDate))}
    ${row('Ekoloji ekspertiza tarixi', tdrDate(d.ecoExpRefDate))}
    ${row('Məkan planlaşdırma sənədi №', esc(d.spatialNo || ''))}
    ${row('Məkan planlaşdırma tarixi', tdrDate(d.spatialDate))}
    ${row('Bina adı', esc(d.buildingName || ''))}
    ${row('Torpaq sahəsi', tdrNum(d.areaByHa, ' ha'))}
    ${row('Tikinti sahəsi', tdrNum(d.areaByM2, ' m²'))}
    ${row('Ümumi sahə', tdrNum(d.totalArea, ' m²'))}
    ${row('Tutum', tdrNum(d.capacity, ''))}
    ${row('Mərtəbə', esc(d.floor || ''))}
    ${row('Mənzil sayı', tdrNum(d.apartmentCount, ''))}
    ${tdrRoomsRows(d.rooms)}
  `;
}

function tdrCard(r) {
  const d = r._detail || {};
  const customer = d.customer || r.customer || '';
  const cleanCustomer = tdrCleanCustomerName(customer);
  const name = d.name || r.name || 'TDR nəticəsi';
  const id = d.id || r.id || '';

  return `<div class="card">
    <div class="card-head">
      <div class="logo">🏗️</div>
      <div>
        <h2>${esc(customer || name)}</h2>
        <p>${esc(d.statusName || r.statusName || 'Tikintilərin Dövlət Reyestri')}</p>
      </div>
      <div class="status">
        ${b(d.statusName || r.statusName || 'TDR', 'gray')}
      </div>
    </div>

    <table>
      ${row('Reyestr ID', esc(id))}
      ${row('Status', esc(d.statusName || r.statusName || ''))}
      ${row('Tikinti obyekti', esc(name))}
      ${row('Sifarişçi', esc(customer))}
      ${row('Ünvan', esc(d.address || r.address || ''))}
      ${row('Reyestr tarixi', tdrDate(d.reyestrDate || r.reyestrDate))}
      ${tdrDetailRows(d)}
    </table>

    <div class="actions">
      ${cleanCustomer ? `<a href="/?page=b2b&b2bMode=company&b2bCompany=${encodeURIComponent(cleanCustomer)}">B2B</a>` : ''}
      ${cleanCustomer ? `<a href="/?page=vergi&q=${encodeURIComponent(cleanCustomer)}">⚖️ VERGİ</a>` : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function borcCard(r, tin) {
  const debt = Number(r?.debt || 0);

  return `<div class="card">
    <div class="card-head">
      <div class="logo">💳</div>
      <div>
        <h2>${esc(r?.name || '—')}</h2>
        <p>VÖEN: ${esc(tin || '—')}</p>
      </div>
      <div class="status">
        ${debt > 0 ? b('Borc var', 'red') : b('Borc yoxdur', 'green')}
      </div>
    </div>

    <table>
      ${row('Borc', money(debt))}
    </table>

    <div class="actions">
      ${tinCrossLinks(tin, { exBorc: true })}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function edvCard(r) {
  const ta = r.taxAuthorityInfo || {};
  const name = ta.name?.az || '';

  return `<div class="card">
    <div class="card-head">
      <div class="logo">ƏDV</div>
      <div>
        <h2>${esc(r.fullName || '—')}</h2>
        <p>VÖEN: ${esc(r.tin || '—')}</p>
      </div>
      <div class="status">
        ${b('ƏDV', 'green')}
      </div>
    </div>

    <table>
      ${row('Vergi orqanı', esc(name))}
      ${row('Vergi orqanı kodu', esc(ta.code || ''))}
      ${row('Ünvan', esc(ta.taxAuthorityAddress || ''))}
      ${row('Borc', money(r.debt))}
    </table>

    <div class="actions">
      ${tinCrossLinks(r.tin, { exEdv: true })}
      ${personCrossLinks(r.fullName || '', { edv: false })}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function companyCard(r, showHistory = true) {
  const s = r.legalTaxpayerStatus || {};
  const finYear =
    s.financialYearStart && s.financialYearEnd
      ? `${esc(s.financialYearStart)} — ${esc(s.financialYearEnd)}`
      : '';

  const legalFormName = s.legalForm?.name?.az || r.organizationType || '—';
  const taxAuth = r.taxOrganizationName || r.taxAuthority?.name?.az || '—';
  const debt = Number(r.debt || 0);

  return `<div class="card">
    <div class="card-head">
      <div class="logo">🏢</div>
      <div>
        <h2>${esc(r.name || '—')}</h2>
        <p>VÖEN: ${esc(r.tin || '—')}</p>
      </div>
      <div class="status">
        ${r.active ? b('Aktiv', 'green') : b('Qeyri-aktiv', 'red')}
        ${r.riskyPayer ? b('Riskli', 'yellow') : ''}
        ${r.vatPayer ? b('ƏDV', 'gray') : ''}
      </div>
    </div>

    <table>
      ${row('Vergi orqanı', esc(taxAuth))}
      ${row('Hüquqi forma', esc(legalFormName))}
      ${row('Hüquqi ünvan', esc(s.legalAddress || ''))}
      ${row('Nizamnamə kapitalı', s.charterCapital ? esc(String(s.charterCapital)) + ' ₼' : '')}
      ${row('Maliyyə ili', finYear)}
      ${row('Qanuni təmsilçi', esc(s.legitimate || ''))}
      ${row('VÖEN verilmə tarixi', fd(s.voenRegisteredAt || ''))}
      ${row('Dövlət qeydiyyatı tarixi', fd(s.stateRegisteredAt || ''))}
      ${row('Çıxarış tarixi', fd(s.extractDate || ''))}
      ${row('Riskli vergi ödəyicisi', s.riskyTaxpayer ? b('Bəli', 'yellow') : b('Xeyr', 'green'))}
      ${row('ƏDV qeydiyyatı', r.vatPayer ? b('Qeydiyyatdadır', 'green') : b('Qeydiyyatda deyil', 'gray'))}
      ${row('Status', r.active ? b('Aktiv', 'green') : b('Qeyri-aktiv', 'red'))}
      ${row('Borc', money(debt))}
    </table>

    <div class="actions">
      ${tinCrossLinks(r.tin, { exHistory: !showHistory, exTin: showHistory, tdrQuery: r.name })}
      ${personCrossLinks(s.legitimate || '')}
      <button onclick="printCard(this)">🖨️ PDF</button>
      ${cardToolbar(r.tin || r.name, r.name)}
    </div>
    ${cardNote(r.tin || r.name)}
  </div>`;
}

function mini(l, v, full) {
  return !v
    ? ''
    : `<div class="${full ? 'full' : ''}">
        <small>${esc(l)}</small>
        <strong>${esc(v)}</strong>
      </div>`;
}



function normalizeWhoisDomain(s) {
  let x = String(s || '').trim().toLowerCase();

  x = x.replace(/^https?:\/\//, '');
  x = x.replace(/^www\./, '');
  x = x.split('/')[0].split('?')[0].split('#')[0];
  x = x.replace(/:\d+$/, '');
  x = x.replace(/[^a-z0-9.-]/g, '');
  x = x.replace(/^\.+|\.+$/g, '');
  x = x.replace(/\.+/g, '.');

  if (x && !x.includes('.')) x += '.az';

  return x;
}

function tabInfo(page, osintSub) {
  const INFO = {
    universal: 'DNN, MNB və VERGİ bazaları üzrə vahid axtarış — ad, VÖEN, nömrə lövhəsi, telefon ilə',
    history: 'Vergi ödəyicisinin tarixçəsi',
    tin: 'Kommersiya qurumlarının dövlət reyestri məlumatlarının verilməsi',
    search: 'Kommersiya qurumlarının dövlət reyestri məlumatlarının verilməsi',
    edv: 'ƏDV ödəyiciləri barədə məlumatların verilməsi',
    borc: 'Borc barədə məlumatın verilməsi',
    qida: 'Qida obyekt və subyektləri haqqında reyestr məlumatları',
    dnn: 'Azərbaycan avtomobil dövlət qeydiyyat nişanları',
    voem: 'İstehsal fəaliyyəti ilə məşğul olan vergi ödəyiciləri barədə məlumatların verilməsi',
    tel: 'Azərbaycandakı stasionar telefon nömrələri və ya ev telefon nömrələri məlumatları',
    b2b: 'B2BHint portalında Azərbaycan və digər ölkələrin biznes qurumları haqqında məlumat',
    mnb: 'Azərbaycandakı mobil telefon nömrələrinin sahiblərinin məlumatları',
    msk: 'Mərkəzi Seçki Komissiyası siyahısında vətəndaş haqqında məlumat',
    vergi: '2008/2018 illər arasında Vergilər Qəzetində yeni yaranmış MMC-lərin dərc məlumatları',
    lsnz: 'Lisenziyaların və icazələrin vahid reyestri üzrə axtarış bazası',
    tdr: 'Tikintilərin Dövlət Reyestri üzrə axtarış bazası',
    tender: 'Dövlət satınalmaları portalı - Tenderlər (2010-2017-ci illər)',
    etndr: 'etender.gov.az canlı müqavilə axtarışı — VÖEN, təchizatçı, açar söz, məbləğ və tarix filtrləri ilə',
    whois: '.az və digər domenlər üzrə WHOIS, DNS və RDAP texniki yoxlama (MÜVƏQQƏTİ BAĞLIDIR)',
    cbar: 'Mərkəzi Bank reyestr məlumatları',
    corona: 'COVID-19 / karantin, ölüm, ünvan və əlaqə qeydləri üzrə daxili arxiv axtarışı',
    aram: 'Azərbaycan Respublikasının Ali Məhkəməsi üzrə axtarış sistemi',
    idare: 'İdarə adı, ünvan, VÖEN və ya telefon üzrə axtarış — Rəqəmsal İnkişaf Nazirliyi bazası',
    contacts: 'Rəsmi qurumlar, ictimai və tanınmış şəxslərin əlaqə nömrələri',
    blackbird: 'OSINT — açıq mənbə kəşfiyyatı: istifadəçi adı, ad, email və ya Facebook profili üzrə sosial şəbəkələrdə şəxs axtarışı alətləri toplusu.'
  };

  const SUB = {
    bb:       'Blackbird — istifadəçi adı və ya email üzrə 700-dən çox sosial şəbəkədə hesab axtarışı.',
    name:     'NAME — ad və soyadın müxtəlif variantları üzrə sosial media və axtarış sistemlərində axtarış.',
    sherlock: 'SHERLOCK — istifadəçi adı (username) üzrə 400-dən çox sosial mediada hesab axtarışı.',
    graph:    'FB-GRAPH — Facebook-da insanlar, postlar, şəkillər, səhifələr və s. üzrə detallı (graph) axtarış sistemi.',
    face:     'ÜZTANIMA — üz şəkillərini müqayisə və üz üzrə axtarış alətləri (Toolpie, VisageHub, FaceCheck.ID, PimEyes, Search4Faces).'
  };

  const text = INFO[page] || '';
  if (page === 'blackbird') {
    const sub = SUB[osintSub] || '';
    return (text ? `<div class="tab-info">${esc(text)}</div>` : '')
         + (sub ? `<div class="tab-info" style="margin-top:8px">${esc(sub)}</div>` : '');
  }
  return text ? `<div class="tab-info">${esc(text)}</div>` : '';
}


function cleanLong(s, max = 1000) {
  return String(s || '').trim().slice(0, max);
}

function contactsToken(env = {}) {
  return (env && env.CONTACTS_API_TOKEN) || CONTACTS_API_TOKEN_FALLBACK;
}

async function contactsApiJson(action, params = {}, body = null, env = {}) {
  const apiUrl = new URL(CONTACTS_API_BASE);
  apiUrl.searchParams.set('action', action);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && String(v) !== '') apiUrl.searchParams.set(k, String(v));
  }
  const resp = await fetch(apiUrl.toString(), {
    method: body ? 'POST' : 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Contacts-Token': contactsToken(env)
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await resp.text();
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    throw new Error('CONTACTS API JSON qaytarmadı: ' + trimmed.slice(0, 180));
  }
  const data = JSON.parse(trimmed);
  if (!resp.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + resp.status));
  return data;
}


function contactsSourceName(s) {
  let x = String(s || '');
  const map = [
    ['Maarif-Nomreler-1 (1).docx', 'Maarif Çingizoğlu'],
    ['telefon-kamran-1 (1) copy.doc', 'Kamran Mahmud'],
    ['telefonlar-arife-1 (1).docx', 'Arifə Kazımova'],
    ['hastebin-1780620117620.css', 'Milli Məclis / deputatlar'],
    ['hastebin-1780621971459.yaml', 'Əlavə əlaqə siyahısı'],
    ['manual', 'Əl ilə əlavə edilib']
  ];
  for (const [from, to] of map) x = x.split(from).join(to);
  return x;
}

function contactsMnbLinkFromPhones(phonesDisplay, label = 'MNB-də yoxla') {
  const d = String(phonesDisplay || '').replace(/\D/g, '');
  if (!d) return '';
  const q = d.length > 9 ? d.slice(-9) : d;
  return `<a href="/?page=mnb&q=${encodeURIComponent(q)}">📱 ${label}</a>`;
}

function contactsNewCard() {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">➕</div>
      <div><h2>Yeni əlaqə</h2><p>Yeni şəxs, qurum və ya nömrə əlavə et</p></div>
      <div class="status">${b('Yeni', 'green')}</div>
    </div>
    <form method="POST" class="edit-form no-print">
      <input type="hidden" name="page" value="contacts">
      <input type="hidden" name="contactsAction" value="addContact">
      <label>Ad / şəxs<input name="name_clean" placeholder="Məsələn: Ad Soyad"></label>
      <label>Qurum<input name="organization_clean" placeholder="Məsələn: Nazirlik, partiya, media, QHT..."></label>
      <label>Vəzifə<input name="position_clean" placeholder="Məsələn: mətbuat katibi, sədr, köməkçi..."></label>
      <label>İctimai status / kateqoriya<input name="category" placeholder="Məsələn: deputat, vəkil, jurnalist, ekspert..."></label>
      <label>İlk nömrə<input name="phone" placeholder="050 000 00 00"></label>
      <label>Nömrə tipi<input name="phone_type" value="unknown" placeholder="mobile / landline / unknown"></label>
      <label>Status<input name="review_status" value="confirmed" placeholder="confirmed / needs_review"></label>
      <label>Qeyd<textarea name="notes" placeholder="Mənbə, kontekst, əlavə izah..."></textarea></label>
      <label>Nömrə qeydi<input name="phone_notes" placeholder="Məsələn: köməkçi, iş nömrəsi, yeni nömrə..."></label>
      <button type="submit">Yeni əlaqəni yadda saxla</button>
    </form>
    <div class="actions"><a href="/?page=contacts&contactsMode=search">Axtarışa qayıt</a></div>
  </div>`;
}

function contactsCard(r) {
  const title = r.name_clean || r.organization_clean || 'Naməlum qeyd';
  const subtitle = [r.organization_clean, r.position_clean, r.category].filter(Boolean).join(' / ');
  const status = r.review_status || '—';
  const isReview = status.includes('review') || status.includes('raw') || status.includes('manual');
  return `<div class="card">
    <div class="card-head">
      <div class="logo">☎️</div>
      <div>
        <h2>${esc(title)}</h2>
        <p>${esc(subtitle || 'Daxili əlaqə bazası')}</p>
      </div>
      <div class="status">${b(status, isReview ? 'yellow' : 'green')}</div>
    </div>
    <table>
      ${row('Ad', esc(r.name_clean || ''))}
      ${row('Qurum', esc(r.organization_clean || ''))}
      ${row('Vəzifə/status', esc(r.position_clean || r.category || ''))}
      ${row('Nömrələr', esc(r.phones_display || ''))}
      ${row('Email', esc(r.emails || ''))}
      ${row('Qeyd', esc(r.notes || ''))}
      ${row('Mənbə', esc(contactsSourceName(r.source_files || '')))}
    </table>
    <div class="actions">
      <a href="/?page=contacts&contactsMode=contact&contactsId=${encodeURIComponent(r.id)}">Aç / redaktə et</a>
      ${r.phones_display ? `<a href="/?page=tel&number=${encodeURIComponent(String(r.phones_display).replace(/\D/g, '').slice(-7))}">TEL-də yoxla</a>` : ''}
      ${contactsMnbLinkFromPhones(r.phones_display)}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function contactsDetailCard(c, phones = [], emails = []) {
  const phoneRows = phones.map(p => row(`Nömrə #${p.id}`, `${esc(p.phone_display || p.phone_normalized || '')}<br><span class="mutedline">${esc(p.phone_type || '')} / ${esc(p.review_status || '')}</span>
    <form method="POST" class="inline-form no-print" onsubmit="return confirm('Bu nömrə silinmiş kimi işarələnsin?')">
      <input type="hidden" name="page" value="contacts">
      <input type="hidden" name="contactsAction" value="deletePhone">
      <input type="hidden" name="phone_id" value="${esc(p.id)}">
      <button type="submit">Sil</button>
    </form>`)).join('');
  const emailRows = (emails || []).map(e => row('Email', esc(e.email || ''))).join('');
  return `<div class="card">
    <div class="card-head">
      <div class="logo">☎️</div>
      <div>
        <h2>${esc(c.name_clean || c.organization_clean || 'Kontakt')}</h2>
        <p>ID: ${esc(c.id)} — ${esc(c.review_status || '')}</p>
      </div>
      <div class="status">${b('Redaktə', 'gray')}</div>
    </div>
    <form method="POST" class="edit-form no-print">
      <input type="hidden" name="page" value="contacts">
      <input type="hidden" name="contactsAction" value="updateContact">
      <input type="hidden" name="id" value="${esc(c.id)}">
      <label>Ad<input name="name_clean" value="${esc(c.name_clean || '')}"></label>
      <label>Qurum<input name="organization_clean" value="${esc(c.organization_clean || '')}"></label>
      <label>Vəzifə<input name="position_clean" value="${esc(c.position_clean || '')}"></label>
      <label>Kateqoriya / ictimai status<input name="category" value="${esc(c.category || '')}"></label>
      <label>Status<input name="review_status" value="${esc(c.review_status || '')}"></label>
      <label>Qeydlər<textarea name="notes">${esc(c.notes || '')}</textarea></label>
      <button type="submit">Yadda saxla</button>
    </form>
    <table>
      ${phoneRows}
      ${emailRows}
      ${row('Mənbə', esc(contactsSourceName(c.source_files || '')))}
    </table>
    <form method="POST" class="search-form no-print">
      <input type="hidden" name="page" value="contacts">
      <input type="hidden" name="contactsAction" value="addPhone">
      <input type="hidden" name="contact_id" value="${esc(c.id)}">
      <input name="phone" placeholder="Yeni nömrə">
      <input name="phone_type" placeholder="mobile / landline / unknown" value="unknown">
      <input name="phone_notes" placeholder="Qeyd">
      <button type="submit">Yeni nömrə əlavə et</button>
    </form>
    <div class="actions"><a href="/?page=contacts&q=${encodeURIComponent(c.name_clean || c.organization_clean || '')}">Axtarışa qayıt</a><button onclick="printCard(this)">🖨️ PDF</button></div>
  </div>`;
}

function contactsStatsLabel(k) {
  const labels = {
    source_files: 'Mənbə faylların sayı',
    raw_entries: 'Xam sətirlərin sayı',
    contacts: 'Əlaqə qeydlərinin ümumi sayı',
    phones: 'Unikal telefon nömrələrinin sayı',
    contact_phone_links: 'Əlaqə-nömrə bağlantılarının sayı',
    phone_contexts: 'Telefon kontekstlərinin sayı',
    duplicate_number_contexts: 'Təkrar nömrə kontekstləri',
    emails: 'Email qeydlərinin sayı',
    review_numbers: 'Yoxlanmalı nömrə namizədləri',
    corrections_applied: 'Avtomatik düzəldilmiş yazılar',
    unknown_numbers_added: 'Naməlum/yoxlanmalı kimi əlavə edilənlər',
    confirmed: 'Təsdiqlənmiş əlaqələr',
    needs_review: 'Yoxlanmalı əlaqələr',
    raw_candidate: 'Xam namizəd qeydlər',
    manual: 'Əl ilə əlavə olunanlar'
  };
  return labels[k] || String(k).replace(/_/g, ' ');
}

function contactsStatsCard(stats) {
  const preferred = ['contacts','phones','contact_phone_links','emails','phone_contexts','duplicate_number_contexts','review_numbers','unknown_numbers_added','corrections_applied','raw_entries','source_files'];
  const used = new Set();
  const rows = [];
  for (const k of preferred) {
    if (rows.length >= 6) break;
    if (stats && Object.prototype.hasOwnProperty.call(stats, k)) {
      rows.push(row(contactsStatsLabel(k), esc(String(stats[k]))));
      used.add(k);
    }
  }
  return `<div class="card"><div class="card-head"><div class="logo">📊</div><div><h2>Əlaqə bazasının statistikası</h2><p>Rəsmi qurumlar, ictimai və tanınmış şəxslərin əlaqə nömrələri</p></div></div><table>${rows.join('')}</table></div>`;
}


// ─── UNIVERSAL AXTARIŞ KARTLARI ───────────────────────────────────────────

function sourceBadge(src) {
  const cls = src === 'DNN' ? 'bad' : src === 'MNB' ? 'good' : 'warnb';
  return `<span class="badge ${cls}" style="font-size:12px;padding:5px 11px">${esc(src)}</span>`;
}

function universalDnnCard(d) {
  const plate = d.plate || '';
  const owner = d.owner || '';
  const birth = d.birth ? azDate(d.birth) : '';
  const addr  = d.address || '';
  const phone = d.phone || '';
  const model = d.model || '';

  return `<div class="card">
    <div class="card-head">
      <div class="logo">🚗</div>
      <div>
        <h2>${esc(owner || 'DNN nəticəsi')}</h2>
        <p>${plate ? 'Avtomobil: ' + esc(plate) : 'Nəqliyyat bazası'}</p>
      </div>
      <div class="status">${sourceBadge('DNN')}</div>
    </div>
    <table>
      ${owner    ? row('Ad-soyad-ata adı', esc(owner))  : ''}
      ${birth    ? row('Təvəllüd',          esc(birth))  : ''}
      ${addr     ? row('Ünvan',             esc(addr))   : ''}
      ${phone    ? row('Telefon',           esc(phone))  : ''}
      ${plate    ? row('Avtomobil nömrəsi', esc(plate))  : ''}
      ${model    ? row('Avtomobil markaı',  esc(model))  : ''}
    </table>
    <div class="actions">
      ${owner ? personCrossLinks(owner, {dnn: false}) : ''}
      ${plate ? `<a href="/?page=dnn&q=${encodeURIComponent(plate)}">🚗 DNN-də aç</a>` : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
      ${cardToolbar(plate || owner, owner || plate)}
    </div>
    ${cardNote(plate || owner)}
  </div>`;
}

function universalMnbCard(r) {
  const fullName = r.name || '';
  const phone    = r['Telefon'] || r.phone || '';
  const birth    = r['Təvəllüd'] || '';
  const addr     = r['Ünvan'] || '';
  const city     = r['Şəhər'] || '';
  const addrFull = [addr, city].filter(v => v && v !== addr).join(', ') || addr;

  return `<div class="card">
    <div class="card-head">
      <div class="logo" style="font-size:13px;font-weight:900">MNB</div>
      <div>
        <h2>${esc(fullName || 'MNB nəticəsi')}</h2>
        <p>Telefon bazası — ${esc(phone || '—')}</p>
      </div>
      <div class="status">${sourceBadge('MNB')}</div>
    </div>
    <table>
      ${fullName ? row('Ad-soyad-ata adı', esc(fullName))  : ''}
      ${birth    ? row('Təvəllüd',          esc(birth))     : ''}
      ${addrFull ? row('Ünvan',             esc(addrFull))  : ''}
      ${phone    ? row('Telefon',           esc(phone))     : ''}
    </table>
    <div class="actions">
      ${phone ? `<a href="/?page=mnb&q=${encodeURIComponent(phone)}">📱 MNB-də aç</a>` : ''}
      ${fullName ? dnnSearchLink(fullName, '🚗 DNN') : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
      ${cardToolbar(phone || fullName, fullName)}
    </div>
    ${cardNote(phone || fullName)}
  </div>`;
}

function universalVergiCard(r) {
  const ad        = r.ad || r.name || '—';
  const voen      = r.voen || '';
  const unvan     = r.unvan || '';
  const temsilci  = r.temsilci || '';
  const tarix     = r.tarix || '';

  return `<div class="card">
    <div class="card-head">
      <div class="logo">⚖️</div>
      <div>
        <h2>${esc(ad)}</h2>
        <p>VÖEN: ${esc(voen || '—')}</p>
      </div>
      <div class="status">${sourceBadge('VERGİ')}</div>
    </div>
    <table>
      ${ad        ? row('Şirkət adı',    esc(ad))        : ''}
      ${voen      ? row('VÖEN',          esc(voen))      : ''}
      ${unvan     ? row('Şirkət ünvanı', esc(unvan))     : ''}
      ${temsilci  ? row('Təmsilçi',      esc(temsilci))  : ''}
      ${tarix     ? row('Qeydiyyat',     esc(tarix))     : ''}
    </table>
    <div class="actions">
      ${voen ? tinCrossLinks(voen, {exVergi: true, tdrQuery: ad}) : ''}
      ${temsilci ? dnnSearchLink(temsilci, '🚗 DNN') : ''}
      <a href="/?page=vergi&q=${encodeURIComponent(ad)}">⚖️ VERGİ-də aç</a>
      <button onclick="printCard(this)">🖨️ PDF</button>
      ${cardToolbar(voen || ad, ad)}
    </div>
    ${cardNote(voen || ad)}
  </div>`;
}

// ─── STATİSTİKA KARTLARI ──────────────────────────────────────────────────

function dnnStatsCard() {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">📊</div>
      <div><h2>DNN bazasının statistikası</h2><p>Azərbaycan nəqliyyat vasitələrinin dövlət qeydiyyatı (mia.gov.az)</p></div>
    </div>
    <table>
      ${row('Ümumi qeyd sayı',         '<b>1.353.261</b>')}
      ${row('Unikal nömrə lövhəsi',    '<b>1.353.249</b>')}
      ${row('Telefon nömrəsi olan',    '<b>630.626</b>')}
      ${row('Təvəllüd tarixi olan',    '<b>885.802</b>')}
      ${row('Mənbə',                   'mia.gov.az')}
    </table>
  </div>`;
}

function mnbStatsCard() {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">📊</div>
      <div><h2>MNB bazasının statistikası</h2><p>Azərbaycan mobil telefon abonentlərinin məlumatları</p></div>
    </div>
    <table>
      ${row('Ümumi qeyd sayı',         '<b>5.413.541</b>')}
      ${row('Unikal telefon nömrəsi',  '<b>5.174.852</b>')}
      ${row('Ünvan olan qeydlər',      '<b>4.072.052</b>')}
      ${row('Təvəllüd olan qeydlər',   '<b>909.135</b>')}
      ${row('Dublikat əlavə sətir',    '<b>238.689</b>')}
      ${row('Şirkət qeydi',            '<b>60.068</b>')}
    </table>
  </div>`;
}

function vergiStatsCard() {
  return `<div class="card">
    <div class="card-head">
      <div class="logo">📊</div>
      <div><h2>VERGİ bazasının statistikası</h2><p>2008–2018 Vergilər Qəzetindəki şirkət qeydiyyatları</p></div>
    </div>
    <table>
      ${row('Ümumi şirkət sayı',  '<b>27.423</b>')}
      ${row('Unikal VÖEN sayı',   '<b>26.181</b>')}
      ${row('MMC sayı',           '<b>24.666</b>')}
      ${row('Filial sayı',        '<b>224</b>')}
      ${row('Kooperativ sayı',    '<b>155</b>')}
      ${row('Nümayəndəlik',       '<b>121</b>')}
      ${row('Digər formalar',     '<b>277</b> (QSC, ASC, kommersiya təşkilatları)')}
    </table>
  </div>`;
}


function aileAgaciPage() {
  return `
  <section class="family-page family-fullscreen" id="familyApp">
    <div class="family-topline">
      <div>
        <div class="family-eyebrow">Jurnalist araşdırma modulu</div>
        <h1>🌳 Ailə ağacı və qohumluq xəritəsi</h1>
        <p>Şəxsləri, ailələri, şübhəli və təsdiqlənmiş əlaqələri arxivlə. Məlumatlar serverdə saxlanır; başqa kompüterdən açan istifadəçilər də eyni arxivləri görə və yeniləyə bilər.</p>
      </div>
      <div class="family-top-actions">
        <select id="familyCaseSelect"></select>
        <button type="button" data-fam-action="newCase">＋ Yeni arxiv</button>
        <button type="button" data-fam-action="newPerson">＋ Şəxs</button>
        <button type="button" data-fam-action="newRelation">＋ Əlaqə</button>
        <button type="button" data-fam-action="exportJson">⬇ JSON</button>
        <button type="button" data-fam-action="importJson">⬆ Yüklə</button>
        <span id="familySyncStatus" class="family-sync">Server arxivi</span>
      </div>
    </div>

    <div class="family-map-card">
      <div class="family-map-head">
        <div class="family-searchbar">
          <input id="familySearch" placeholder="Xəritədə axtar: ad, soyad, rol, mənbə, qeyd...">
          <button type="button" data-fam-action="clearSearch">Sıfırla</button>
        </div>
        <div class="family-map-tools">
          <button type="button" data-fam-action="zoomIn">＋</button>
          <button type="button" data-fam-action="zoomOut">－</button>
          <button type="button" data-fam-action="fit">Sığdır</button>
          <button type="button" data-fam-action="arrange">Səliqələ</button>
          <button type="button" data-fam-action="resetDemo">Demo sıfırla</button>
        </div>
      </div>

      <div class="family-legend family-legend-flat">
        <span><i class="fam-dot fam-confirmed"></i>Təsdiqlənmiş</span>
        <span><i class="fam-dot fam-pending"></i>Yoxlanır</span>
        <span><i class="fam-dot fam-suspect"></i>Şübhəli</span>
        <span><i class="fam-line"></i>Təsdiqlənmiş xətt</span>
        <span><i class="fam-line dashed"></i>Şübhəli xətt</span>
      </div>

      <div class="family-stage family-stage-v5" id="familyStage">
        <svg id="familySvg" class="family-svg"></svg>
        <div id="familyNodesLayer" class="family-nodes-layer"></div>
        <div class="family-floating-tip">Node-ları yuxarı-aşağı və sağa-sola sürüklə. Şəxsə və ya xəttə kliklə detala bax.</div>
      </div>
    </div>

    <div class="family-bottom-grid">
      <div class="family-detail-panel">
        <div class="family-panel-title">Profil / əlaqə detalı</div>
        <div id="familyProfile" class="family-empty">Xəritədə şəxs və ya əlaqə xətti seç.</div>
      </div>
      <div class="family-notes-panel">
        <div class="family-panel-title">Arxiv qeydi</div>
        <textarea id="familyCaseNotes" placeholder="Bu ailə/araşdırma üzrə ümumi qeydlər..."></textarea>
      </div>
      <div class="family-stats-panel">
        <div class="family-panel-title">Xülasə</div>
        <div id="familyStats" class="family-stats"></div>
        <div class="family-mini-actions">
          <button type="button" data-fam-action="editCase">Arxivi düzəlt</button>
          <button type="button" data-fam-action="duplicateCase">Arxivi kopyala</button>
          <button type="button" data-fam-action="deleteCase">Arxivi sil</button>
        </div>
      </div>
    </div>

    <div id="familyModal" class="family-modal">
      <div class="family-modal-box">
        <div class="family-modal-head">
          <h2 id="familyModalTitle">Əlavə et</h2>
          <button type="button" data-fam-action="closeModal">×</button>
        </div>

        <div id="familyModalCase" class="family-modal-section">
          <label>Arxiv / araşdırma adı</label>
          <input id="famCaseTitle" placeholder="Məsələn: Məmmədov ailəsi — 2026">
          <label>Qısa təsvir</label>
          <textarea id="famCaseDesc" placeholder="Bu xəritə nəyə aiddir?"></textarea>
          <button type="button" class="family-primary" id="famCaseSubmit" data-fam-action="createCase">Arxiv yarat</button>
        </div>

        <div id="familyModalPerson" class="family-modal-section">
          <label>Ad soyad</label>
          <input id="famPersonName" placeholder="AD SOYAD">
          <div class="family-two">
            <div><label>Doğum tarixi</label><input id="famPersonBirth" placeholder="gg.aa.iiii"></div>
            <div><label>Status</label><select id="famPersonStatus"><option value="confirmed">Təsdiqlənib</option><option value="pending">Yoxlanır</option><option value="suspect">Şübhəli</option></select></div>
          </div>
          <label>Rol / status</label>
          <input id="famPersonRole" placeholder="məs: qardaş, biznes ortağı, direktor">
          <label>Mənbə</label>
          <input id="famPersonSource" placeholder="sənəd, müsahibə, reyestr, sosial media...">
          <label>Jurnalist qeydi</label>
          <textarea id="famPersonNotes" placeholder="Qeyd yaz..."></textarea>
          <button type="button" class="family-primary" id="famPersonSubmit" data-fam-action="addPerson">Şəxsi əlavə et</button>
        </div>

        <div id="familyModalRelation" class="family-modal-section">
          <div class="family-two">
            <div><label>Kimdən</label><select id="famRelFrom"></select></div>
            <div><label>Kimə</label><select id="famRelTo"></select></div>
          </div>
          <div class="family-two">
            <div><label>Əlaqə növü</label><select id="famRelType"><option>ata</option><option>ana</option><option>qardaş</option><option>bacı</option><option>həyat yoldaşı</option><option>övlad</option><option>keçmiş həyat yoldaşı</option><option>yaxın qohum</option><option>uzaq qohum</option><option>biznes əlaqəsi</option><option>digər</option></select></div>
            <div><label>Status</label><select id="famRelStatus"><option value="confirmed">Təsdiqlənib</option><option value="pending">Yoxlanır</option><option value="suspect">Şübhəli</option></select></div>
          </div>
          <label>Mənbə</label>
          <input id="famRelSource" placeholder="Bu əlaqənin mənbəsi">
          <label>Qeyd</label>
          <textarea id="famRelNotes" placeholder="Əlaqə haqqında qeyd..."></textarea>
          <button type="button" class="family-primary" id="famRelationSubmit" data-fam-action="addRelation">Əlaqəni əlavə et</button>
        </div>
      </div>
    </div>
  </section>

  <script>
  (function(){
    var LS_KEY='axtar_family_tree_cases_v5';
    var ACTIVE_KEY='axtar_family_tree_active_v5';
    var state={cases:[],activeId:''};
    var zoom=1, panX=0, panY=0, selectedId='';
    var editingCaseId='', editingPersonId='', editingRelationId='';
    var dragging=null;

    function byId(id){return document.getElementById(id);}
    function val(id){var el=byId(id);return el?String(el.value||'').trim():'';}
    function setVal(id,v){var el=byId(id);if(el)el.value=v||'';}
    function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
    function uid(p){return p+'_'+Math.random().toString(36).slice(2,8)+'_'+Date.now().toString(36);}
    function today(){return new Date().toISOString().slice(0,10);}
    function statusLabel(s){return s==='confirmed'?'Təsdiqlənib':s==='suspect'?'Şübhəli':'Yoxlanır';}
    function activeCase(){return state.cases.find(function(c){return c.id===state.activeId;})||state.cases[0];}
    function save(){try{localStorage.setItem(LS_KEY,JSON.stringify(state.cases));localStorage.setItem(ACTIVE_KEY,state.activeId||'');}catch(e){} scheduleServerSave();}
    var serverSaveTimer=null;
    function setSyncStatus(txt,cls){var el=byId('familySyncStatus');if(el){el.textContent=txt||'';el.className='family-sync '+(cls||'');}}
    function scheduleServerSave(){clearTimeout(serverSaveTimer);serverSaveTimer=setTimeout(serverSave,650);}
    async function serverSave(){try{setSyncStatus('Serverə yazılır...','warn');var r=await fetch('/api/aile?action=save_all',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','Accept':'application/json'},body:JSON.stringify({cases:state.cases,activeId:state.activeId})});var d=await r.json();if(!d.ok)throw new Error(d.error||'server xətası');setSyncStatus('Serverdə saxlanıldı','ok');}catch(e){setSyncStatus('Serverə yazılmadı: '+e.message,'err');}}
    function touch(){var c=activeCase();if(c)c.updatedAt=today();}

    function demo(){return {id:'case_demo',title:'Demo: Məmmədov ailəsi',description:'Test araşdırma xəritəsi',createdAt:'2026-06-16',updatedAt:'2026-06-16',notes:'Bu demo server arxivinə yazıla bilər. JSON çıxar düyməsi ehtiyat nüsxə üçündür.',people:[
      {id:'p1',name:'Əli Məmmədov',birth:'12.04.1958',role:'Ailə başçısı / keçmiş bələdiyyə üzvü',status:'confirmed',source:'Doğum şəhadətnaməsi; müsahibə',notes:'Ailənin mərkəzi fiquru.',x:-300,y:-160},
      {id:'p2',name:'Züleyxa Məmmədova',birth:'03.09.1961',role:'Həyat yoldaşı / ailə biznesi ilə əlaqəli',status:'confirmed',source:'Nikah sənədi',notes:'Formal payçı görünür.',x:120,y:-160},
      {id:'p3',name:'Rəşad Məmmədov',birth:'17.11.1985',role:'Oğul / şirkət direktoru',status:'confirmed',source:'Şirkət reyestri',notes:'Ailə şirkətində direktor.',x:-190,y:120},
      {id:'p4',name:'Leyla Məmmədova',birth:'22.01.1988',role:'Qız / hüquqşünas',status:'confirmed',source:'Müsahibə; universitet məlumatı',notes:'Tender əlaqələri yoxlanır.',x:230,y:120},
      {id:'p5',name:'Nigar Əliyeva',birth:'14.08.1987',role:'Rəşadın həyat yoldaşı / maliyyəçi',status:'confirmed',source:'Nikah sənədi',notes:'Ortaq mülkiyyət sənədləri var.',x:-520,y:120},
      {id:'p6',name:'Tural Məmmədov',birth:'05.03.2012',role:'Rəşadın oğlu',status:'confirmed',source:'Ailə sənədi',notes:'Yetkinlik yaşına çatmayıb.',x:-330,y:390},
      {id:'p7',name:'Elvin Qasımov',birth:'09.05.1983',role:'Leylanın keçmiş həyat yoldaşı / sahibkar',status:'suspect',source:'Məhkəmə sənədi fraqmenti',notes:'Nikah tarixi tam təsdiqlənməyib.',x:550,y:125},
      {id:'p8',name:'Səbinə Qasımova',birth:'30.10.1990',role:'Yaxın qohum / vasitəçi ola bilər',status:'suspect',source:'Anonim mənbə; telefon kontaktı',notes:'Biznes əlaqəsi ola bilər.',x:360,y:-360}
    ],relations:[
      {id:'r1',from:'p1',to:'p3',type:'ata',status:'confirmed',source:'Doğum sənədi',notes:'Bioloji ata'},
      {id:'r2',from:'p2',to:'p3',type:'ana',status:'confirmed',source:'Doğum sənədi',notes:'Bioloji ana'},
      {id:'r3',from:'p1',to:'p4',type:'ata',status:'confirmed',source:'Doğum sənədi',notes:''},
      {id:'r4',from:'p2',to:'p4',type:'ana',status:'confirmed',source:'Doğum sənədi',notes:''},
      {id:'r5',from:'p1',to:'p2',type:'həyat yoldaşı',status:'confirmed',source:'Nikah sənədi',notes:''},
      {id:'r6',from:'p3',to:'p5',type:'həyat yoldaşı',status:'confirmed',source:'Nikah sənədi',notes:''},
      {id:'r7',from:'p3',to:'p6',type:'ata',status:'confirmed',source:'Doğum sənədi',notes:''},
      {id:'r8',from:'p5',to:'p6',type:'ana',status:'confirmed',source:'Doğum sənədi',notes:''},
      {id:'r9',from:'p4',to:'p7',type:'keçmiş həyat yoldaşı',status:'suspect',source:'Məhkəmə sənədi fraqmenti',notes:'Yoxlanır'},
      {id:'r10',from:'p4',to:'p8',type:'yaxın qohum',status:'suspect',source:'Anonim mənbə',notes:'Dərəcə dəqiqləşdirilir'}]};}

    function load(){try{state.cases=JSON.parse(localStorage.getItem(LS_KEY)||'[]');}catch(e){state.cases=[];}if(!Array.isArray(state.cases)||!state.cases.length)state.cases=[demo()];state.activeId=localStorage.getItem(ACTIVE_KEY)||state.cases[0].id;if(!state.cases.find(function(c){return c.id===state.activeId;}))state.activeId=state.cases[0].id;}
    async function loadServer(){try{setSyncStatus('Serverdən arxivlər oxunur...','warn');var r=await fetch('/api/aile?action=list',{headers:{'Accept':'application/json'}});var d=await r.json();if(!d.ok)throw new Error(d.error||'server xətası');if(Array.isArray(d.cases)&&d.cases.length){state.cases=d.cases;var saved=localStorage.getItem(ACTIVE_KEY)||'';state.activeId=(saved&&state.cases.find(function(c){return c.id===saved;}))?saved:state.cases[0].id;try{localStorage.setItem(LS_KEY,JSON.stringify(state.cases));}catch(e){} renderSelects();fit();setSyncStatus('Server arxivi açıldı','ok');}else{setSyncStatus('Server boşdur — demo arxiv göstərilir','warn');serverSave();}}catch(e){setSyncStatus('Server oxunmadı, lokal nüsxə açıldı: '+e.message,'err');}}
    function worldToScreen(x,y){var st=byId('familyStage');var w=st.clientWidth,h=st.clientHeight;return {x:w/2+panX+x*zoom,y:h/2+panY+y*zoom};}
    function screenToWorld(x,y){var st=byId('familyStage');var r=st.getBoundingClientRect();return {x:(x-r.left-st.clientWidth/2-panX)/zoom,y:(y-r.top-st.clientHeight/2-panY)/zoom};}
    function person(id){var c=activeCase();return c.people.find(function(p){return p.id===id;});}
    function personName(id){var p=person(id);return p?p.name:'—';}

    function draw(){var c=activeCase();var svg=byId('familySvg');var layer=byId('familyNodesLayer');if(!c||!svg||!layer)return;svg.innerHTML='';layer.innerHTML='';var st=byId('familyStage');svg.setAttribute('width',st.clientWidth);svg.setAttribute('height',st.clientHeight);
      c.relations.forEach(function(r){var a=person(r.from),b=person(r.to);if(!a||!b)return;var A=worldToScreen(a.x||0,a.y||0),B=worldToScreen(b.x||0,b.y||0);var line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',A.x);line.setAttribute('y1',A.y);line.setAttribute('x2',B.x);line.setAttribute('y2',B.y);line.setAttribute('class','fam-svg-edge '+(r.status||'pending'));line.dataset.id=r.id;svg.appendChild(line);var tx=(A.x+B.x)/2,ty=(A.y+B.y)/2;var text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x',tx);text.setAttribute('y',ty-7);text.setAttribute('class','fam-svg-label');text.dataset.id=r.id;text.textContent=r.type||'əlaqə';svg.appendChild(text);});
      c.people.forEach(function(p){var P=worldToScreen(p.x||0,p.y||0);var d=document.createElement('div');d.className='fam-node '+(p.status||'pending')+(p.id===selectedId?' selected':'');d.dataset.id=p.id;d.style.left=P.x+'px';d.style.top=P.y+'px';d.innerHTML='<div class="fam-node-name">'+esc(p.name)+'</div><div class="fam-node-role">'+esc(p.role||'—')+'</div><div class="fam-node-status">'+statusLabel(p.status)+'</div>';layer.appendChild(d);});renderStats();}

    function renderSelects(){var sel=byId('familyCaseSelect');if(sel){sel.innerHTML=state.cases.map(function(c){return '<option value="'+esc(c.id)+'" '+(c.id===state.activeId?'selected':'')+'>'+esc(c.title||'Adsız arxiv')+'</option>';}).join('');}var c=activeCase();setVal('familyCaseNotes',c?c.notes:'');['famRelFrom','famRelTo'].forEach(function(id){var el=byId(id);if(!el||!c)return;el.innerHTML='<option value="">Şəxs seç</option>'+c.people.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>';}).join('');});}
    function renderStats(){var c=activeCase();var el=byId('familyStats');if(!el||!c)return;var conf=c.people.filter(function(p){return p.status==='confirmed';}).length;var sus=c.people.filter(function(p){return p.status==='suspect';}).length;el.innerHTML='<div><b>'+c.people.length+'</b><span>şəxs</span></div><div><b>'+c.relations.length+'</b><span>əlaqə</span></div><div><b>'+conf+'</b><span>təsdiqlənmiş</span></div><div><b>'+sus+'</b><span>şübhəli</span></div><p>Yaradılıb: '+esc(c.createdAt||'—')+' · Yenilənib: '+esc(c.updatedAt||'—')+'</p>';}
    function renderAll(){renderSelects();draw();var p=byId('familyProfile');if(p)p.innerHTML='Xəritədə şəxs və ya əlaqə xətti seç.';save();}
    function clearPersonForm(){['famPersonName','famPersonBirth','famPersonRole','famPersonSource','famPersonNotes'].forEach(function(id){setVal(id,'');});setVal('famPersonStatus','confirmed');}
    function clearRelationForm(){setVal('famRelFrom','');setVal('famRelTo','');setVal('famRelSource','');setVal('famRelNotes','');setVal('famRelStatus','confirmed');setVal('famRelType','ata');}
    function openModal(type, mode){
      ['Case','Person','Relation'].forEach(function(x){var el=byId('familyModal'+x);if(el)el.style.display='none';});
      var title='';
      if(type==='case'){
        byId('familyModalCase').style.display='grid';
        title=mode==='edit'?'Arxivi düzəlt':'Yeni ailə / araşdırma';
        var b=byId('famCaseSubmit'); if(b)b.textContent=mode==='edit'?'Yadda saxla':'Arxiv yarat';
      }
      if(type==='person'){
        byId('familyModalPerson').style.display='grid';
        title=mode==='edit'?'Şəxsi düzəlt':'Şəxs əlavə et';
        var bp=byId('famPersonSubmit'); if(bp)bp.textContent=mode==='edit'?'Yadda saxla':'Şəxsi əlavə et';
      }
      if(type==='relation'){
        renderSelects();
        byId('familyModalRelation').style.display='grid';
        title=mode==='edit'?'Əlaqəni düzəlt':'Əlaqə əlavə et';
        var br=byId('famRelationSubmit'); if(br)br.textContent=mode==='edit'?'Yadda saxla':'Əlaqəni əlavə et';
      }
      byId('familyModalTitle').textContent=title;
      byId('familyModal').classList.add('open');
    }
        function closeModal(){byId('familyModal').classList.remove('open');editingCaseId='';editingPersonId='';editingRelationId='';var bc=byId('famCaseSubmit');if(bc)bc.textContent='Arxiv yarat';var bp=byId('famPersonSubmit');if(bp)bp.textContent='Şəxsi əlavə et';var br=byId('famRelationSubmit');if(br)br.textContent='Əlaqəni əlavə et';}
    function fit(){var c=activeCase();if(!c||!c.people.length)return;var xs=c.people.map(function(p){return Number(p.x||0);}),ys=c.people.map(function(p){return Number(p.y||0);});var minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);var st=byId('familyStage');var zw=(st.clientWidth-180)/Math.max(300,maxX-minX);var zh=(st.clientHeight-160)/Math.max(220,maxY-minY);zoom=Math.max(.35,Math.min(1.15,Math.min(zw,zh)));panX=-((minX+maxX)/2)*zoom;panY=-((minY+maxY)/2)*zoom;draw();}
    function arrange(){var c=activeCase();if(!c)return;var levels=[[],[],[]];c.people.forEach(function(p,i){if(i<2)levels[0].push(p);else if(i<6)levels[1].push(p);else levels[2].push(p);});levels.forEach(function(arr,li){var y=[-230,70,360][li];var step=300;var start=-(arr.length-1)*step/2;arr.forEach(function(p,i){p.x=start+i*step;p.y=y;});});touch();save();fit();}
    function profilePerson(id){var c=activeCase();var p=person(id);if(!p)return;selectedId=id;var rels=c.relations.filter(function(r){return r.from===id||r.to===id;}).map(function(r){var other=r.from===id?personName(r.to):personName(r.from);return '<li><b>'+esc(other)+'</b> — '+esc(r.type)+' <span class="fam-status '+esc(r.status)+'">'+statusLabel(r.status)+'</span></li>';}).join('');byId('familyProfile').innerHTML='<div class="fam-profile-title"><h2>'+esc(p.name)+'</h2><span class="fam-status '+esc(p.status)+'">'+statusLabel(p.status)+'</span></div><table class="fam-profile-table"><tr><td>Doğum tarixi</td><td>'+esc(p.birth||'—')+'</td></tr><tr><td>Rol</td><td>'+esc(p.role||'—')+'</td></tr><tr><td>Mənbə</td><td>'+esc(p.source||'—')+'</td></tr><tr><td>Qeydlər</td><td><textarea data-note-person="'+esc(p.id)+'">'+esc(p.notes||'')+'</textarea></td></tr><tr><td>Əlaqələr</td><td><ul>'+(rels||'<li>Əlaqə yoxdur</li>')+'</ul></td></tr></table><div class="family-mini-actions"><button type="button" data-edit-person="'+esc(p.id)+'">Düzəlt</button><button type="button" data-delete-person="'+esc(p.id)+'">Şəxsi sil</button></div>';draw();}
    function profileRelation(id){var c=activeCase();var r=c.relations.find(function(x){return x.id===id;});if(!r)return;selectedId=id;byId('familyProfile').innerHTML='<div class="fam-profile-title"><h2>'+esc(r.type)+'</h2><span class="fam-status '+esc(r.status)+'">'+statusLabel(r.status)+'</span></div><table class="fam-profile-table"><tr><td>Kimdən</td><td>'+esc(personName(r.from))+'</td></tr><tr><td>Kimə</td><td>'+esc(personName(r.to))+'</td></tr><tr><td>Mənbə</td><td>'+esc(r.source||'—')+'</td></tr><tr><td>Qeyd</td><td><textarea data-note-relation="'+esc(r.id)+'">'+esc(r.notes||'')+'</textarea></td></tr></table><div class="family-mini-actions"><button type="button" data-edit-relation="'+esc(r.id)+'">Düzəlt</button><button type="button" data-delete-relation="'+esc(r.id)+'">Əlaqəni sil</button></div>';draw();}
    function editCase(){
      var c=activeCase(); if(!c)return;
      editingCaseId=c.id;
      setVal('famCaseTitle', c.title || '');
      setVal('famCaseDesc', c.description || '');
      openModal('case','edit');
    }
    function createCase(){
      var title=val('famCaseTitle');if(!title){alert('Arxiv adı yaz.');return;}
      if(editingCaseId){
        var ec=state.cases.find(function(x){return x.id===editingCaseId;});
        if(ec){ec.title=title;ec.description=val('famCaseDesc');ec.updatedAt=today();}
        editingCaseId='';
        setVal('famCaseTitle','');setVal('famCaseDesc','');
        closeModal();renderAll();return;
      }
      var c={id:uid('case'),title:title,description:val('famCaseDesc'),createdAt:today(),updatedAt:today(),notes:'',people:[],relations:[]};
      state.cases.push(c);state.activeId=c.id;setVal('famCaseTitle','');setVal('famCaseDesc','');closeModal();renderAll();
    }
    function editPerson(id){
      var p=person(id); if(!p)return;
      editingPersonId=id;
      setVal('famPersonName',p.name||'');
      setVal('famPersonBirth',p.birth||'');
      setVal('famPersonRole',p.role||'');
      setVal('famPersonStatus',p.status||'pending');
      setVal('famPersonSource',p.source||'');
      setVal('famPersonNotes',p.notes||'');
      openModal('person','edit');
    }
    function addPerson(){
      var c=activeCase(),name=val('famPersonName');if(!name){alert('Ad soyad yaz.');return;}
      if(editingPersonId){
        var ep=person(editingPersonId);
        if(ep){ep.name=name;ep.birth=val('famPersonBirth');ep.role=val('famPersonRole');ep.status=val('famPersonStatus')||'pending';ep.source=val('famPersonSource');ep.notes=val('famPersonNotes');touch();}
        editingPersonId='';
        clearPersonForm();closeModal();renderAll();profilePerson(ep.id);return;
      }
      c.people.push({id:uid('p'),name:name,birth:val('famPersonBirth'),role:val('famPersonRole'),status:val('famPersonStatus')||'pending',source:val('famPersonSource'),notes:val('famPersonNotes'),x:Math.round((Math.random()*700)-350),y:Math.round((Math.random()*460)-230)});
      clearPersonForm();touch();closeModal();renderAll();
    }
    function editRelation(id){
      var c=activeCase();var r=c.relations.find(function(x){return x.id===id;});if(!r)return;
      editingRelationId=id;
      renderSelects();
      setVal('famRelFrom',r.from||'');
      setVal('famRelTo',r.to||'');
      setVal('famRelType',r.type||'ata');
      setVal('famRelStatus',r.status||'pending');
      setVal('famRelSource',r.source||'');
      setVal('famRelNotes',r.notes||'');
      openModal('relation','edit');
    }
    function addRelation(){
      var c=activeCase(),from=val('famRelFrom'),to=val('famRelTo');if(!from||!to||from===to){alert('İki fərqli şəxs seç.');return;}
      if(editingRelationId){
        var er=c.relations.find(function(x){return x.id===editingRelationId;});
        if(er){er.from=from;er.to=to;er.type=val('famRelType')||'əlaqə';er.status=val('famRelStatus')||'pending';er.source=val('famRelSource');er.notes=val('famRelNotes');touch();}
        editingRelationId='';
        clearRelationForm();closeModal();renderAll();profileRelation(er.id);return;
      }
      c.relations.push({id:uid('r'),from:from,to:to,type:val('famRelType')||'əlaqə',status:val('famRelStatus')||'pending',source:val('famRelSource'),notes:val('famRelNotes')});
      clearRelationForm();touch();closeModal();renderAll();
    }
        function exportJson(){var blob=new Blob([JSON.stringify(state.cases,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='aile-agaci-arxiv.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);}
    function importJson(){var inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=function(){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var arr=JSON.parse(r.result);if(!Array.isArray(arr))throw new Error('JSON massiv deyil');state.cases=arr;state.activeId=arr[0]&&arr[0].id;renderAll();}catch(e){alert('JSON oxunmadı: '+e.message);}};r.readAsText(f);};inp.click();}
    function duplicateCase(){var c=activeCase();if(!c)return;var n=JSON.parse(JSON.stringify(c));n.id=uid('case');n.title=c.title+' — kopya';n.createdAt=today();n.updatedAt=today();state.cases.push(n);state.activeId=n.id;renderAll();}
    function deleteCase(){if(state.cases.length<=1){alert('Ən azı bir arxiv qalmalıdır.');return;}if(!confirm('Bu arxiv silinsin?'))return;state.cases=state.cases.filter(function(c){return c.id!==state.activeId;});state.activeId=state.cases[0].id;renderAll();}
    function search(q){q=String(q||'').toLowerCase().trim();if(!q)return;var c=activeCase();var p=c.people.find(function(p){return (p.name+' '+p.role+' '+p.source+' '+p.notes).toLowerCase().indexOf(q)!==-1;});if(p){profilePerson(p.id);var P=worldToScreen(p.x,p.y);panX+=byId('familyStage').clientWidth/2-P.x;panY+=byId('familyStage').clientHeight/2-P.y;draw();}}

    document.addEventListener('click',function(e){var btn=e.target.closest('[data-fam-action]');if(btn){var a=btn.dataset.famAction;if(a==='newCase'){editingCaseId='';setVal('famCaseTitle','');setVal('famCaseDesc','');openModal('case');}if(a==='newPerson'){editingPersonId='';clearPersonForm();openModal('person');}if(a==='newRelation'){editingRelationId='';clearRelationForm();openModal('relation');}if(a==='editCase')editCase();if(a==='closeModal')closeModal();if(a==='createCase')createCase();if(a==='addPerson')addPerson();if(a==='addRelation')addRelation();if(a==='exportJson')exportJson();if(a==='importJson')importJson();if(a==='clearSearch'){setVal('familySearch','');selectedId='';fit();byId('familyProfile').innerHTML='Xəritədə şəxs və ya əlaqə xətti seç.';}if(a==='zoomIn'){zoom=Math.min(3,zoom*1.22);draw();}if(a==='zoomOut'){zoom=Math.max(.25,zoom/1.22);draw();}if(a==='fit')fit();if(a==='arrange')arrange();if(a==='duplicateCase')duplicateCase();if(a==='deleteCase')deleteCase();if(a==='resetDemo'){if(confirm('Demo məlumatları sıfırlansın?')){state.cases=[demo()];state.activeId='case_demo';zoom=1;panX=0;panY=0;renderAll();}}return;}
      var node=e.target.closest('.fam-node');if(node){profilePerson(node.dataset.id);return;}if(e.target.classList.contains('fam-svg-edge')||e.target.classList.contains('fam-svg-label')){profileRelation(e.target.dataset.id);return;}if(e.target.id==='familyModal')closeModal();var ep=e.target.closest('[data-edit-person]');if(ep){editPerson(ep.dataset.editPerson);return;}var er=e.target.closest('[data-edit-relation]');if(er){editRelation(er.dataset.editRelation);return;}var dp=e.target.closest('[data-delete-person]');if(dp){var c=activeCase(),id=dp.dataset.deletePerson;if(confirm('Şəxs və ona bağlı əlaqələr silinsin?')){c.people=c.people.filter(function(p){return p.id!==id;});c.relations=c.relations.filter(function(r){return r.from!==id&&r.to!==id;});touch();selectedId='';renderAll();}return;}var dr=e.target.closest('[data-delete-relation]');if(dr){var c2=activeCase(),rid=dr.dataset.deleteRelation;if(confirm('Əlaqə silinsin?')){c2.relations=c2.relations.filter(function(r){return r.id!==rid;});touch();selectedId='';renderAll();}return;}});
    document.addEventListener('input',function(e){if(e.target.id==='familySearch')search(e.target.value);if(e.target.id==='familyCaseNotes'){var c=activeCase();if(c){c.notes=e.target.value;touch();save();renderStats();}}if(e.target.dataset.notePerson){var p=person(e.target.dataset.notePerson);if(p){p.notes=e.target.value;touch();save();}}if(e.target.dataset.noteRelation){var c=activeCase();var r=c.relations.find(function(x){return x.id===e.target.dataset.noteRelation;});if(r){r.notes=e.target.value;touch();save();}}});
    document.addEventListener('change',function(e){if(e.target.id==='familyCaseSelect'){state.activeId=e.target.value;selectedId='';renderAll();}});
    document.addEventListener('pointerdown',function(e){var node=e.target.closest('.fam-node');if(!node)return;var p=person(node.dataset.id);if(!p)return;e.preventDefault();var w=screenToWorld(e.clientX,e.clientY);dragging={id:p.id,dx:p.x-w.x,dy:p.y-w.y};node.setPointerCapture&&node.setPointerCapture(e.pointerId);});
    document.addEventListener('pointermove',function(e){if(!dragging)return;var p=person(dragging.id);if(!p)return;var w=screenToWorld(e.clientX,e.clientY);p.x=w.x+dragging.dx;p.y=w.y+dragging.dy;touch();draw();});
    document.addEventListener('pointerup',function(){if(dragging){dragging=null;save();}});
    window.addEventListener('resize',draw);

    load();renderSelects();fit();loadServer();
  })();
  </script>`;
}


// ─── XƏBƏR normalizasiyası: başlıqdan tarix/saatı ayır, sırala, mətni təmizlə ──
const XEBER_AZ_MONTHS = {
  yan:0, yanvar:0, fev:1, fevral:1, mar:2, mart:2, apr:3, aprel:3,
  may:4, iyn:5, iyun:5, iyl:6, iyul:6, avq:7, avqust:7,
  sen:8, sentyabr:8, okt:9, oktyabr:9, noy:10, noyabr:10, dek:11, dekabr:11
};
const XEBER_MON_SHORT = ['yan','fev','mar','apr','may','iyn','iyl','avq','sen','okt','noy','dek'];
// Mətndən "02 iyn 2026, 16:46" və ya təkbaşına "16:46" tapıb timestamp + təmiz etiket qaytarır
function xeberParseDate(str) {
  const s = String(str || '');
  const m = s.match(/(\d{1,2})\s+([A-Za-zƏəĞğİıÖöÜüŞşÇç]+)\.?\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const mon = XEBER_AZ_MONTHS[m[2].toLowerCase()];
    if (mon !== undefined) {
      const day = +m[1], year = +m[3], hasTime = m[4] != null;
      const hh = hasTime ? +m[4] : 0, mm = hasTime ? +m[5] : 0;
      const ts = Date.UTC(year, mon, day, hh, mm);
      const label = String(day).padStart(2, '0') + ' ' + XEBER_MON_SHORT[mon] + ' ' + year +
        (hasTime ? ', ' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') : '');
      return { ts, label, hasTime };
    }
  }
  const t = s.match(/^\s*(\d{1,2}):(\d{2})\b/);
  if (t) return { ts: 0, label: t[1].padStart(2, '0') + ':' + t[2], hasTime: true };
  return { ts: 0, label: '', hasTime: false };
}
function xeberCleanTitle(t) {
  let x = String(t || '').trim();
  // başdakı tam tarix (+ ola bilsin saat): "02 iyn 2026, 16:46 "
  x = x.replace(/^\s*\d{1,2}\s+[A-Za-zƏəĞğİıÖöÜüŞşÇç]+\.?\s+\d{4}\s*,?\s*(?:\d{1,2}:\d{2})?\s*[-–—:]*\s*/, '');
  // başdakı təkbaşına saat: "09:01Neft" / "16:46 "
  x = x.replace(/^\s*\d{1,2}:\d{2}\s*[-–—:]*\s*/, '');
  // sondakı "• 17 iyn 2026, 11:40" və ya "• 16:46"
  x = x.replace(/\s*[•·|]*\s*\d{1,2}\s+[A-Za-zƏəĞğİıÖöÜüŞşÇç]+\.?\s+\d{4}\s*,?\s*(?:\d{1,2}:\d{2})?\s*$/, '');
  x = x.replace(/\s*[•·|]\s*\d{1,2}:\d{2}\s*$/, '');
  return x.trim() || String(t || '').trim();
}
function xeberCleanSummary(s, title) {
  let x = String(s || '').replace(/\s+/g, ' ').trim();
  // başda təkrarlanan böyük-hərfli etiketləri yığ: "TENDER TENDER TENDER" → "TENDER"
  x = x.replace(/^((?:[A-ZƏĞİÖÜŞÇ]{3,}\s+))\1+/, '$1');
  // ardıcıl təkrar sözləri yığ
  x = x.replace(/\b([A-Za-zƏəĞğİıÖöÜüŞşÇç0-9]+)(\s+\1\b)+/gi, '$1');
  // başdakı tarix/saat parçasını at
  x = x.replace(/^\s*\d{1,2}\s+[A-Za-zƏəĞğİıÖöÜüŞşÇç]+\.?\s+\d{4}\s*,?\s*(?:\d{1,2}:\d{2})?\s*/, '');
  const tt = String(title || '').trim();
  if (tt && x.toLowerCase().indexOf(tt.toLowerCase()) === 0) x = x.slice(tt.length).trim();
  return x.trim();
}
// Mətn "ticker" (yanlış birləşmiş tender lenti) kimi görünürmü?
function xeberLooksTicker(s) {
  const x = String(s || '');
  const tenders = (x.match(/TENDER/gi) || []).length;
  const dates = (x.match(/\d{1,2}\s+[A-Za-zƏəĞğİıÖöÜüŞşÇç]+\s+\d{4}/g) || []).length;
  return tenders >= 2 || dates >= 2;
}
// Həddən uzun başlığı söz sərhədində kəs
function xeberCapTitle(t, max) {
  const x = String(t || '').trim();
  const cap = max || 150;
  if (x.length <= cap) return x;
  let cut = x.slice(0, cap);
  const sp = cut.lastIndexOf(' ');
  if (sp > Math.floor(cap * 0.5)) cut = cut.slice(0, sp);
  return cut.replace(/[\s,;:–—-]+$/, '') + '…';
}
function normalizeXeberList(list) {
  const arr = (Array.isArray(list) ? list : []).map((it, i) => {
    const o = Object.assign({}, it);
    const rawTitle = o.title || '';
    const dField = xeberParseDate(o.date_text || o.date || '');
    const dTitle = xeberParseDate(rawTitle);
    const best = dField.ts ? dField : (dTitle.ts ? dTitle : (dField.label ? dField : dTitle));
    o.title = xeberCapTitle(xeberCleanTitle(rawTitle));
    let sum = xeberCleanSummary(o.summary || '', o.title);
    // Yanlış birləşmiş tender lenti və ya başlığı təkrarlayan mətni at
    if (xeberLooksTicker(sum)) sum = '';
    o.summary = sum;
    o._dateLabel = best.label || o.date_text || o.date || '';
    const _pts = Number(o.ts || 0); o._ts = _pts > 0 ? _pts * 1000 : (best.ts || 0);
    o._ord = i;
    let img = String(o.image || '').trim();
    if (img.indexOf('//') === 0) img = 'https:' + img;
    o.image = img;
    return o;
  });
  // ən yeni yuxarıda; tarixi oxunmayanlar orijinal sırada sonda qalır
  arr.sort((a, b) => {
    if (a._ts && b._ts) return b._ts - a._ts;
    if (a._ts && !b._ts) return -1;
    if (!a._ts && b._ts) return 1;
    return a._ord - b._ord;
  });
  // Eyni mətnin müxtəlif başlıqlarda təkrarlanmasının qarşısını al (yalnız ilkində saxla)
  const seenSum = {};
  for (const o of arr) {
    const key = String(o.summary || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!key) continue;
    if (seenSum[key]) o.summary = '';
    else seenSum[key] = 1;
  }
  return arr;
}
function xeberCard(item) {
  item = item || {};
  const title = item.title || 'Başlıq yoxdur';
  const link = item.url || '#';
  let image = item.image || '';
  if (image.indexOf('//') === 0) image = 'https:' + image;
  const source = item.source_name || item.source || 'Mənbə';
  const date = item._dateLabel || item.date_text || item.date || '';
  const summary = item.summary || '';
  const tag = item.keyword || item.category || 'xəbər';
  const imgHtml = image
    ? `<a class="xeber-img" href="${esc(link)}" target="_blank" rel="noopener"><img class="xeber-thumb" src="${esc(image)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.style.display='none';this.parentNode.classList.add('xeber-img-empty')"><span class="xeber-thumb-fallback">${esc(source)}</span></a>`
    : `<a class="xeber-img xeber-img-empty" href="${esc(link)}" target="_blank" rel="noopener"><span class="xeber-thumb-fallback">${esc(source)}</span></a>`;
  return `<article class="xeber-card">
    ${imgHtml}
    <div class="xeber-body">
      <div class="xeber-meta"><span>${esc(source)}</span>${date ? `<em>${esc(date)}</em>` : ''}</div>
      <h2><a href="${esc(link)}" target="_blank" rel="noopener">${esc(title)}</a></h2>
      ${summary ? `<p>${esc(summary)}</p>` : ''}
      <div class="xeber-foot"><span>#${esc(tag)}</span><a href="${esc(link)}" target="_blank" rel="noopener">Aç →</a></div>
    </div>
  </article>`;
}

function northDataPage() {
  return `
    <div class="tab-info">🌐 NorthData — Avropa (Almaniya, Britaniya, Hollandiya, Norveç, Estoniya, Fransa və s.) şirkət və şəxs axtarışı. Ad yaz, nəticəni NorthData səhifəsində aç. Rəsmi API yoxdur — birbaşa saytdan oxunur.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="ndQ" placeholder="Şirkət və ya şəxs adı (məs: Mammadov)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="ndBtn">Axtar</button>
    </div>
    <div id="ndStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="ndResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('ndBtn')) return;
      var loaded=0;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('ndStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function row(l,v){return v?('<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(v)+'</td></tr>'):'';}
      function flag(reg){
        var r=(reg||'').toLowerCase();
        if(r.indexOf('companies house')>=0)return '🇬🇧';
        if(r.indexOf('kamer')>=0||r.indexOf('koophandel')>=0||r.indexOf('kvk')>=0)return '🇳🇱';
        if(r.indexOf('handelsregister')>=0||r.indexOf('amtsgericht')>=0)return '🇩🇪';
        if(r.indexOf('rik')>=0||r.indexOf('äriregister')>=0)return '🇪🇪';
        if(r.indexOf('brønnøy')>=0||r.indexOf('bronnoy')>=0||/(^|\\s)br\\s/.test(r))return '🇳🇴';
        if(r.indexOf('rcs')>=0||r.indexOf('infogreffe')>=0)return '🇫🇷';
        return '🏛';
      }
      function card(it){
        var u='https://www.northdata.com'+it.href;
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#0f766e,#14b8a6)">ND</div>'
          +'<div><h2>'+ec(it.title)+'</h2><p>'+(it.register?ec(it.register):'NorthData')+'</p></div>'
          +'<div class="status"><span class="badge">'+flag(it.register)+'</span></div></div>'
          +'<table>'+row('Ad / obyekt',it.title)+row('Reyestr / nömrə',it.register)+'</table>'
          +'<div class="actions"><a href="'+u+'" target="_blank" rel="noopener">NorthData səhifəsi ↗</a></div></div>';
      }
      function removeMore(){var w=$('ndMoreWrap');if(w&&w.parentNode)w.parentNode.removeChild(w);}
      function addMore(){
        removeMore();
        var w=document.createElement('div');w.id='ndMoreWrap';w.style.cssText='text-align:center;margin:14px 0';
        w.innerHTML='<button type="button" id="ndMore" style="background:var(--card2);color:var(--text);border:1px solid var(--border)">⬇ Daha çox</button>';
        $('ndResults').appendChild(w);
        $('ndMore').addEventListener('click',function(){go(false);});
      }
      function go(reset){
        var q=$('ndQ').value.trim();
        if(q.length<2){st('Ən azı 2 hərf yazın...');return;}
        if(reset){loaded=0;$('ndResults').innerHTML='';}
        removeMore();
        st(reset?'Axtarılır...':'Daha çox yüklənir...');
        fetch('/api/northdata?q='+encodeURIComponent(q)+'&offset='+loaded).then(function(r){return r.json();}).then(function(d){
          if(d.error){
            st('Xəta: '+d.error,'err');
            if(reset)$('ndResults').innerHTML='<div class="msg warn">'+ec(d.error)+' <a href="https://www.northdata.com/'+encodeURIComponent(q)+'" target="_blank" rel="noopener">Birbaşa aç ↗</a></div>';
            return;
          }
          var items=d.items||[];
          if(!items.length){ if(reset){st('Nəticə tapılmadı.','err');} else {st(loaded+' nəticə (son)','ok');} return; }
          loaded+=items.length;
          $('ndResults').insertAdjacentHTML('beforeend',items.map(card).join(''));
          st(loaded+' nəticə','ok');
          if(items.length>=10)addMore();
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('ndBtn').addEventListener('click',function(){go(true);});
      $('ndQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go(true);}});
      $('ndQ').focus();
    })();
    </script>
  `;
}
function russiaPage() {
  return `
    <div class="tab-info">🇷🇺 Rusiya — RBC reyestri (companies.rbc.ru). Rejimi seç: 🏢 Şirkət (ümumi) və ya 👤 Şəxs (tam ad-soyad-ata adı / İNN). Rusca yazılış daha dəqiq işləyir.</div>
    <div class="subtabs no-print" id="ruModeBar">
      <a class="active" data-rumode="company" style="cursor:pointer">🏢 Şirkət</a>
      <a data-rumode="person" style="cursor:pointer">👤 Şəxs</a>
    </div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="ruQ" placeholder="Şirkət/şəxs adı, İNN və ya OGRN..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="ruBtn">Axtar</button>
    </div>
    <div id="ruStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="ruResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('ruBtn')) return;
      var mode='company',page=1,seen={},curQ='',convNote='';
      function translit(s){
        var dig=[['yə','я'],['ya','я'],['yu','ю'],['yo','ё'],['ye','е']];
        var map={'a':'а','b':'б','c':'дж','ç':'ч','d':'д','e':'е','ə':'а','f':'ф','g':'г','ğ':'г','h':'х','x':'х','ı':'ы','i':'и','j':'ж','k':'к','q':'г','l':'л','m':'м','n':'н','o':'о','ö':'о','p':'п','r':'р','s':'с','ş':'ш','t':'т','u':'у','ü':'у','v':'в','y':'й','z':'з'};
        return s.split(/ +/).map(function(w){
          w=w.replace(/İ/g,'i').replace(/I/g,'ı').replace(/Ə/g,'ə').replace(/Ğ/g,'ğ').replace(/Ö/g,'ö').replace(/Ü/g,'ü').replace(/Ş/g,'ş').replace(/Ç/g,'ç').toLowerCase();
          for(var k=0;k<dig.length;k++){w=w.split(dig[k][0]).join(dig[k][1]);}
          var out='';
          for(var i=0;i<w.length;i++){var ch=w[i];out+=(map[ch]!==undefined?map[ch]:ch);}
          return out?(out.charAt(0).toUpperCase()+out.slice(1)):out;
        }).join(' ');
      }
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('ruStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function row(l,v){return v?('<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(v)+'</td></tr>'):'';}
      function badge(s){var ok=/действ/i.test(s||'');var bad=/ликвид|прекр|банкрот/i.test(s||'');return s?('<span class="badge '+(ok?'good':(bad?'bad':''))+'">'+ec(s)+'</span>'):'';}
      function companyCard(it){
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#7f1d1d,#dc2626)">RU</div>'
          +'<div><h2>'+ec(it.name||'Şirkət')+'</h2><p>'+(it.inn?('İNN: '+ec(it.inn)):'RBC')+'</p></div>'
          +'<div class="status">'+badge(it.status)+'</div></div><table>'
          +row('Ad',it.name)
          +row('Direktor',it.director)
          +row('Hüquqi ünvan',it.address)
          +row('İNN',it.inn)
          +row('OGRN',it.ogrn)
          +row('Qeydiyyat tarixi',it.reg_date)
          +row('Nizamnamə kapitalı',it.capital)
          +row('Gəlir (выручка)',it.revenue)
          +row('Artım tempi',it.growth)
          +'</table><div class="actions">'
          +(it.href?('<a href="'+ec(it.href)+'" target="_blank" rel="noopener">RBC səhifəsi ↗</a>'):'')
          +'</div></div>';
      }
      function personCard(it){
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#7f1d1d,#dc2626)">RU</div>'
          +'<div><h2>'+ec(it.name||'Şəxs')+'</h2><p>'+(it.type?ec(it.type):'Şəxs')+'</p></div>'
          +(it.inn?('<div class="status"><span class="badge">İNN '+ec(it.inn)+'</span></div>'):'')+'</div><table>'
          +row('Ad Soyad Ata adı',it.name)+row('Tip',it.type)+row('İNN',it.inn)+row('ОГРНИП',it.ogrnip)
          +'</table><div class="actions">'+(it.href?('<a href="'+ec(it.href)+'" target="_blank" rel="noopener">RBC şəxs səhifəsi ↗</a>'):'')+'</div></div>';
      }
      function setMode(m){
        if(m===mode)return;
        mode=m;page=1;seen={};
        var bar=$('ruModeBar');if(bar){var as=bar.getElementsByTagName('a');for(var i=0;i<as.length;i++){as[i].className=(as[i].getAttribute('data-rumode')===m)?'active':'';}}
        $('ruQ').placeholder=(m==='person')?'Ad Soyad Ata adı (rusca) və ya İNN...':'Şirkət/şəxs adı, İNN və ya OGRN...';
        $('ruResults').innerHTML='';st('');removeMore();$('ruQ').focus();
      }
      function removeMore(){var w=$('ruMoreWrap');if(w&&w.parentNode)w.parentNode.removeChild(w);}
      function addMore(){
        removeMore();
        var w=document.createElement('div');w.id='ruMoreWrap';w.style.cssText='text-align:center;margin:14px 0';
        w.innerHTML='<button type="button" id="ruMore" style="background:var(--card2);color:var(--text);border:1px solid var(--border)">⬇ Daha çox</button>';
        $('ruResults').appendChild(w);
        $('ruMore').addEventListener('click',function(){go(false);});
      }
      function go(reset){
        if(reset){
          var rawq=$('ruQ').value.trim();
          if(rawq.length<2){st('Ən azı 2 hərf yazın...');return;}
          var hasCyr=/[а-яёА-ЯЁ]/.test(rawq), hasLat=/[a-zA-ZəĞğıİöÖüÜşŞçÇ]/.test(rawq);
          if(hasLat && !hasCyr){ curQ=translit(rawq); convNote='🔤 Çevrildi: '+curQ+' — düz deyilsə rusca yazıb yenidən axtar'; }
          else { curQ=rawq; convNote=''; }
          page=1;seen={};$('ruResults').innerHTML='';
        } else { page++; }
        if(!curQ || curQ.length<2){st('Ən azı 2 hərf yazın...');return;}
        removeMore();
        st((reset?'Axtarılır...':'Daha çox yüklənir...')+(convNote?(' · '+convNote):''));
        var person=(mode==='person');
        var ep=person?'/api/russia-persons':'/api/russia';
        var renderCard=person?personCard:companyCard;
        var direct=person?'https://companies.rbc.ru/search/persons/?query=':'https://companies.rbc.ru/search/?query=';
        fetch(ep+'?q='+encodeURIComponent(curQ)+'&page='+page).then(function(r){return r.json();}).then(function(d){
          if(d.error){
            st('Xəta: '+d.error,'err');
            if(reset)$('ruResults').innerHTML='<div class="msg warn">'+ec(d.error)+' <a href="'+direct+encodeURIComponent(curQ)+'" target="_blank" rel="noopener">Birbaşa aç ↗</a></div>';
            return;
          }
          var raw=d.items||[];
          var items=raw.filter(function(it){var k=it.ogrn||it.inn||it.href||it.name;if(seen[k])return false;seen[k]=1;return true;});
          if(!items.length){ if(reset){st('Nəticə tapılmadı.'+(convNote?(' · '+convNote):''),'err');} else {st('Daha nəticə yoxdur.','');} return; }
          $('ruResults').insertAdjacentHTML('beforeend',items.map(renderCard).join(''));
          st((convNote?convNote+' · ':'')+'Nəticələr yükləndi (səhifə '+page+')','ok');
          if(raw.length>=10)addMore();
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('ruModeBar').addEventListener('click',function(e){var a=e.target.closest('[data-rumode]');if(a){e.preventDefault();setMode(a.getAttribute('data-rumode'));}});
      $('ruBtn').addEventListener('click',function(){go(true);});
      $('ruQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go(true);}});
      $('ruQ').focus();
    })();
    </script>
  `;
}
function czechPage() {
  return `
    <div class="tab-info">🇨🇿 Çexiya — ARES rəsmi reyestri (ares.gov.cz). Şirkət adı və ya IČO (6-8 rəqəm) ilə axtar. Pulsuz rəsmi API.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="czQ" placeholder="Şirkət adı və ya IČO..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="czBtn">Axtar</button>
    </div>
    <div id="czStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="czResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('czBtn')) return;
      var start=0,seen={};
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('czStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function row(l,v){return v?('<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(v)+'</td></tr>'):'';}
      function regStatus(d){var sr=(d.seznamRegistraci||{});var v=sr.stavZdrojeVr||sr.stavZdrojeRos||sr.stavZdrojeRes||'';if(v==='AKTIVNI')return '<span class="badge good">Aktiv</span>';if(v==='ZANIKLY')return '<span class="badge bad">Ləğv olunub</span>';return v?('<span class="badge">'+ec(v)+'</span>'):'';}
      function card(d){
        var ico=ec(d.ico||'');
        var addr=ec((d.sidlo&&d.sidlo.textovaAdresa)||'');
        var nace=(d.czNace||d.czNace2008||[]);nace=Array.isArray(nace)?nace.slice(0,12).join(', '):'';
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#11457e,#2563eb)">CZ</div>'
          +'<div><h2>'+ec(d.obchodniJmeno||'Subjekt')+'</h2><p>IČO: '+ico+'</p></div>'
          +'<div class="status">'+regStatus(d)+'</div></div><table>'
          +row('Ad',d.obchodniJmeno)+row('IČO',ico)+row('DIČ (ƏDV)',d.dic)
          +row('Ünvan',addr)+row('Hüquqi forma (kod)',d.pravniForma)+row('Yaranma tarixi',d.datumVzniku)
          +row('NACE kodları',nace)
          +'</table><div class="actions"><a href="https://ares.gov.cz/ekonomicke-subjekty?ico='+ico+'" target="_blank" rel="noopener">ARES səhifəsi ↗</a></div></div>';
      }
      function removeMore(){var w=$('czMoreWrap');if(w&&w.parentNode)w.parentNode.removeChild(w);}
      function addMore(){
        removeMore();
        var w=document.createElement('div');w.id='czMoreWrap';w.style.cssText='text-align:center;margin:14px 0';
        w.innerHTML='<button type="button" id="czMore" style="background:var(--card2);color:var(--text);border:1px solid var(--border)">⬇ Daha çox</button>';
        $('czResults').appendChild(w);
        $('czMore').addEventListener('click',function(){go(false);});
      }
      function go(reset){
        var q=$('czQ').value.trim();
        if(q.length<2){st('Ən azı 2 hərf yazın...');return;}
        var ico=/^\\d{6,8}$/.test(q);
        if(reset){start=0;seen={};$('czResults').innerHTML='';}
        removeMore();
        st(reset?'Axtarılır...':'Daha çox yüklənir...');
        fetch('/api/czech?q='+encodeURIComponent(q)+'&start='+start).then(function(r){return r.json();}).then(function(d){
          if(d.error){st('Xəta: '+d.error,'err');if(reset)$('czResults').innerHTML='<div class="msg warn">'+ec(d.error)+'</div>';return;}
          var raw=d.items||[];
          var items=raw.filter(function(it){var k=it.ico||it.obchodniJmeno;if(seen[k])return false;seen[k]=1;return true;});
          if(!items.length){ if(reset){st('Nəticə tapılmadı.','err');} else {st('Daha nəticə yoxdur.','');} return; }
          $('czResults').insertAdjacentHTML('beforeend',items.map(card).join(''));
          start+=raw.length;
          st(((d.total!=null&&d.total)?(d.total+' nəticə'):'Nəticələr')+(ico?' (IČO)':''),'ok');
          if(!ico && raw.length>=10)addMore();
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('czBtn').addEventListener('click',function(){go(true);});
      $('czQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go(true);}});
      $('czQ').focus();
    })();
    </script>
  `;
}
function wikipediaPage(){
  return `
    <div class="tab-info">📚 Wikipedia axtarışı (en). Mövzu/ad yaz — uyğun məqalələr və qısa özət. Pulsuz.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="wpQ" placeholder="Ad / mövzu..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="wpBtn">Axtar</button>
    </div>
    <div id="wpStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="wpResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('wpBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
      function strip(s){return String(s||'').replace(/<[^>]+>/g,'');}
      function st(t,c){var e=$('wpStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function go(){
        var q=$('wpQ').value.trim();if(q.length<2){st('Söz yaz.');return;}
        st('Axtarılır...');$('wpResults').innerHTML='';
        fetch('/api/wikipedia?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d&&d.error){st('Xəta: '+d.error,'err');return;}
          var list=(d&&d.query&&d.query.search)||[];
          if(!list.length){st('Nəticə tapılmadı.','err');return;}
          st(list.length+' məqalə','ok');
          $('wpResults').innerHTML=list.map(function(it){var t=it.title||'';var link='https://en.wikipedia.org/wiki/'+encodeURIComponent(t.split(' ').join('_'));return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#444,#111)">W</div><div><h2>'+ec(t)+'</h2></div></div><p style="color:var(--muted)">'+ec(strip(it.snippet))+'...</p><div class="actions"><a href="'+link+'" target="_blank" rel="noopener">Wikipedia-da aç ↗</a></div></div>';}).join('');
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('wpBtn').addEventListener('click',go);$('wpQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('wpQ').focus();
    })();
    </script>
  `;
}
function nominatimPage(){
  return `
    <div class="tab-info">📍 XƏRİTƏ (OpenStreetMap/Nominatim) — ünvan → koordinat və xəritə. Ünvan yaz, koordinat və xəritə linki al. Pulsuz.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="nmQ" placeholder="Ünvan (məs: Bakı, Nizami küçəsi 10)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="nmBtn">Axtar</button>
    </div>
    <div id="nmStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="nmResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('nmBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
      function st(t,c){var e=$('nmStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function go(){
        var q=$('nmQ').value.trim();if(q.length<3){st('Ünvan yaz.');return;}
        st('Axtarılır...');$('nmResults').innerHTML='';
        fetch('/api/nominatim?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(list){
          if(list&&list.error){st('Xəta: '+list.error,'err');return;}
          if(!Array.isArray(list)||!list.length){st('Nəticə tapılmadı.','err');return;}
          st(list.length+' nəticə','ok');
          $('nmResults').innerHTML=list.map(function(it){var la=it.lat,lo=it.lon;var g='https://www.google.com/maps?q='+la+','+lo;var o='https://www.openstreetmap.org/?mlat='+la+'&mlon='+lo+'&zoom=17';return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#0a0,#063)">📍</div><div><h2>'+ec(it.display_name||'')+'</h2><p>'+ec((it.type||''))+' · '+ec(la)+', '+ec(lo)+'</p></div></div><div class="actions"><a href="'+g+'" target="_blank" rel="noopener">Google Maps ↗</a> <a href="'+o+'" target="_blank" rel="noopener">OpenStreetMap ↗</a></div></div>';}).join('');
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('nmBtn').addEventListener('click',go);$('nmQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('nmQ').focus();
    })();
    </script>
  `;
}
function toolsPage(){
  return `
    <div class="tab-info">🧰 Xarici araşdırma alətləri — bunlar proqram/kataloqdur, saytda inteqrasiya olunmur, amma araşdırmaçı üçün çox güclüdür. Aç və istifadə et.</div>
    <div class="card">
      <table>
        <tr><td class="label">Maltego</td><td class="value"><a href="https://www.maltego.com/" target="_blank" rel="noopener">maltego.com ↗</a> — əlaqə qrafiki (şəxs↔şirkət↔nömrə) vizuallaşdırma</td></tr>
        <tr><td class="label">Bellingcat Toolkit</td><td class="value"><a href="https://bellingcat.gitbook.io/toolkit" target="_blank" rel="noopener">bellingcat toolkit ↗</a> — yüzlərlə pulsuz OSINT aləti kataloqu</td></tr>
        <tr><td class="label">OSINT Framework</td><td class="value"><a href="https://osintframework.com/" target="_blank" rel="noopener">osintframework.com ↗</a> — kateqoriyalı alət xəritəsi</td></tr>
        <tr><td class="label">IntelTechniques</td><td class="value"><a href="https://inteltechniques.com/tools/" target="_blank" rel="noopener">inteltechniques.com ↗</a> — axtarış alətləri</td></tr>
      </table>
    </div>
  `;
}
function crtshPage(){
  return `
    <div class="tab-info">🌐 DOMEN — bir domenin bütün alt-domenlərini (subdomain) tapır (Certificate Transparency: CertSpotter + crt.sh). Pulsuz.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="csQ" placeholder="Domen (məs: azercell.com)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="csBtn">Axtar</button>
    </div>
    <div id="csStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="csResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('csBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
      function st(t,c){var e=$('csStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function go(){
        var q=$('csQ').value.trim();if(q.length<3){st('Domen yaz.');return;}
        st('Axtarılır...');$('csResults').innerHTML='';
        fetch('/api/crtsh?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d&&d.error){st('Xəta: '+d.error,'err');return;}
          var hosts=(d&&d.hosts)||[];
          if(!hosts.length){st('Nəticə tapılmadı.','err');return;}
          st(hosts.length+' unikal alt-domen','ok');
          $('csResults').innerHTML='<div class="card"><table>'+hosts.map(function(h){return '<tr><td class="value"><a href="https://'+ec(h)+'" target="_blank" rel="noopener">'+ec(h)+'</a></td></tr>';}).join('')+'</table></div>';
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('csBtn').addEventListener('click',go);$('csQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('csQ').focus();
    })();
    </script>
  `;
}
function waybackPage(){
  return `
    <div class="tab-info">🕰️ Wayback Machine — istənilən saytın/səhifənin köhnə versiyaları (silinən, dəyişdirilən məzmun). Sübut saxlamaq üçün əvəzsiz. Pulsuz.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="wbQ" placeholder="URL (məs: example.com və ya example.com/page)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="wbBtn">Axtar</button>
    </div>
    <div id="wbStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="wbResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('wbBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
      function st(t,c){var e=$('wbStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function fmt(ts){if(!ts||ts.length<8)return ts;return ts.slice(0,4)+'-'+ts.slice(4,6)+'-'+ts.slice(6,8)+' '+ts.slice(8,10)+':'+ts.slice(10,12);}
      function go(){
        var q=$('wbQ').value.trim();if(q.length<3){st('URL yaz.');return;}
        st('Axtarılır...');$('wbResults').innerHTML='';
        fetch('/api/wayback?url='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(rows){
          if(rows&&rows.error){st('Xəta: '+rows.error,'err');return;}
          if(!Array.isArray(rows)||rows.length<2){st('Snapshot tapılmadı.','err');return;}
          var data=rows.slice(1).reverse();
          st(data.length+' snapshot','ok');
          $('wbResults').innerHTML='<div class="card"><table>'+data.map(function(r){var ts=r[1],orig=r[2],code=r[4];var link='https://web.archive.org/web/'+ts+'/'+orig;return '<tr><td class="label">'+ec(fmt(ts))+'</td><td class="value"><a href="'+ec(link)+'" target="_blank" rel="noopener">'+ec(orig)+'</a> <small>('+ec(code)+')</small></td></tr>';}).join('')+'</table></div>';
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('wbBtn').addEventListener('click',go);$('wbQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('wbQ').focus();
    })();
    </script>
  `;
}
function imagePage(){
  return `
    <div class="tab-info">🖼️ Tərs şəkil axtarışı + doğrulama. Şəklin URL-ini yaz → müxtəlif mühərriklərdə tərs axtar. Üz axtarışında Yandex güclüdür. Video/foto saxtakarlıq üçün InVID.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="imQ" placeholder="Şəklin URL-i (https://...jpg)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="imBtn">Aç</button>
    </div>
    <div id="imResults" style="margin-top:10px"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('imBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('"').join('&quot;');}
      var CH='display:inline-block;padding:8px 14px;border:1px solid var(--border);border-radius:9px;margin:0 8px 8px 0;color:var(--text);text-decoration:none;font-weight:700';
      function go(){
        var u=$('imQ').value.trim();if(!u){return;}
        var e=encodeURIComponent(u);
        var links=[['Yandex (üz)','https://yandex.com/images/search?rpt=imageview&url='+e],['Google Lens','https://lens.google.com/uploadbyurl?url='+e],['Bing','https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:'+e],['TinEye','https://tineye.com/search?url='+e]];
        $('imResults').innerHTML='<div class="card"><div style="margin-bottom:6px">'+links.map(function(l){return '<a style="'+CH+'" href="'+ec(l[1])+'" target="_blank" rel="noopener">'+ec(l[0])+' ↗</a>';}).join('')+'</div><p style="color:var(--muted)">Video/foto saxtakarlıq yoxlaması: <a href="https://www.invid-project.eu/tools-and-services/invid-verification-plugin/" target="_blank" rel="noopener">InVID/WeVerify ↗</a> (brauzer uzantısı)</p></div>';
      }
      $('imBtn').addEventListener('click',go);$('imQ').addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();go();}});$('imQ').focus();
    })();
    </script>
  `;
}
function alephPage(){
  return `
    <div class="tab-info">🕵️ OCCRP Aleph — şəxs adı və ya VÖEN axtar. Şəxs axtaranda onun bağlı bütün şirkətləri (ad, VÖEN, ünvan, rəhbər) açıq göstərilir. Rəsmi API.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="alQ" placeholder="Şəxsin adı və ya VÖEN..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="alBtn">Axtar</button>
    </div>
    <div id="alStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="alResults"></div>
    <div id="alPager" class="xeber-pager"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('alBtn')) return;
      var DATA=[], MODE='c', PER=10, CUR=1;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
      function st(t,c){var e=$('alStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function companyCard(c){
        var rows='';function r(l,v){if(v)rows+='<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(v)+'</td></tr>';}
        r('VÖEN',c.voen); r('Ünvan',c.address); r('Hüquqi forma',c.legalForm); r('Kapital',c.capital);
        var dir='';
        if(c.directors&&c.directors.length){dir='<div style="margin-top:12px;padding:11px 14px;background:rgba(142,203,255,.10);border:1px solid var(--border);border-radius:11px"><div style="font-weight:800;color:#8ecbff;margin-bottom:6px">👤 Rəhbər / Agent</div>'+c.directors.map(function(n){return '<div style="font-size:15px;font-weight:700;padding:2px 0">'+ec(n)+'</div>';}).join('')+'</div>';}
        var title=c.name||('VÖEN '+c.voen);
        var link=c.id?('https://aleph.occrp.org/entities/'+ec(c.id)):('https://aleph.occrp.org/search?q='+encodeURIComponent(c.voen));
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#b91c1c,#111)">AL</div><div><h2>🏢 '+ec(title)+'</h2><p>Şirkət · VÖEN '+ec(c.voen)+'</p></div></div><table>'+rows+'</table>'+dir+'<div class="actions"><a href="'+link+'" target="_blank" rel="noopener">Aleph-də aç ↗</a></div></div>';
      }
      function simpleCard(it){var p=it.properties||{};var name=it.caption||(p.name&&p.name[0])||'(adsız)';var link='https://aleph.occrp.org/entities/'+ec(it.id);return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#b91c1c,#111)">AL</div><div><h2>'+ec(name)+'</h2><p>'+ec(it.schema||'')+'</p></div></div><div class="actions"><a href="'+link+'" target="_blank" rel="noopener">Aleph-də aç ↗</a></div></div>';}
      function pages(){return Math.max(1,Math.ceil(DATA.length/PER));}
      function renderPage(){
        var s0=(CUR-1)*PER;
        $('alResults').innerHTML=DATA.slice(s0,s0+PER).map(MODE==='c'?companyCard:simpleCard).join('');
        var pg=pages(),h='';
        if(pg>1){
          h+='<button type="button" class="xeber-pagebtn" '+(CUR===1?'disabled':'')+' data-p="'+(CUR-1)+'">‹</button>';
          for(var i=1;i<=pg;i++){ if(i===1||i===pg||Math.abs(i-CUR)<=2){h+='<button type="button" class="xeber-pagebtn '+(i===CUR?'active':'')+'" data-p="'+i+'">'+i+'</button>';} else if(Math.abs(i-CUR)===3){h+='<span class="xeber-pagedots">…</span>';} }
          h+='<button type="button" class="xeber-pagebtn" '+(CUR===pg?'disabled':'')+' data-p="'+(CUR+1)+'">›</button>';
        }
        $('alPager').innerHTML=h;
        Array.prototype.forEach.call($('alPager').querySelectorAll('button[data-p]'),function(b){b.addEventListener('click',function(){CUR=+b.getAttribute('data-p');renderPage();window.scrollTo({top:0,behavior:'smooth'});});});
      }
      function go(){
        var q=$('alQ').value.trim();if(q.length<2){st('Söz yaz.');return;}
        st('Axtarılır...');$('alResults').innerHTML='';$('alPager').innerHTML='';DATA=[];CUR=1;
        fetch('/api/aleph?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d&&d.error){st('Xəta: '+d.error,'err');$('alResults').innerHTML='<div class="msg warn">'+ec(d.error)+'</div>';return;}
          var COMP=(d&&d.companies)||[]; var RES=(d&&d.results)||[];
          if(COMP.length){DATA=COMP;MODE='c';st(COMP.length+' şirkət tapıldı','ok');}
          else if(RES.length){DATA=RES;MODE='r';st(RES.length+' nəticə','ok');}
          else {st('Nəticə tapılmadı.','err');return;}
          renderPage();
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('alBtn').addEventListener('click',go);
      $('alQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});
      $('alQ').focus();
    })();
    </script>
  `;
}
function norwayPage(){
  return `
    <div class="tab-info">🇳🇴 Norveç — Brønnøysund (Enhetsregisteret) rəsmi açıq reyestri. Ad və ya təşkilat nömrəsi (9 rəqəm) ilə axtar. Açarsız, pulsuz.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="noQ" placeholder="Şirkət adı və ya org.nr (məs: Equinor / 923609016)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="noBtn">Axtar</button>
    </div>
    <div id="noStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="noResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('noBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('noStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function addr(a){ if(!a)return ''; var p=[].concat(a.adresse||[]).join(', '); return [p,(a.postnummer||'')+' '+(a.poststed||''),a.land].filter(Boolean).join(', '); }
      function card(e){
        var rows='';function r(l,v){if(v===''||v==null)return;rows+='<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(v)+'</td></tr>';}
        r('Org.nr',e.organisasjonsnummer);
        r('Forma',e.organisasjonsform&&e.organisasjonsform.beskrivelse);
        r('Ünvan',addr(e.forretningsadresse)||addr(e.postadresse));
        r('Fəaliyyət',e.naeringskode1&&(e.naeringskode1.kode+' '+e.naeringskode1.beskrivelse));
        r('İşçi sayı',e.antallAnsatte);
        r('Təsis tarixi',e.stiftelsesdato);
        r('Qeydiyyat',e.registreringsdatoEnhetsregisteret);
        if(e.kapital)r('Kapital',(e.kapital.belop||'')+' '+(e.kapital.valuta||''));
        r('Müflis',e.konkurs?'Bəli':'Xeyr');
        r('Sayt',e.hjemmeside);
        var link='https://virksomhet.brreg.no/nb/oppslag/enheter/'+ec(e.organisasjonsnummer);
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#ba0c2f,#00205b)">NO</div><div><h2>'+ec(e.navn)+'</h2><p>Org.nr '+ec(e.organisasjonsnummer)+' · Brønnøysund</p></div></div><table>'+rows+'</table><div class="actions"><a href="'+link+'" target="_blank" rel="noopener">Brønnøysund ↗</a></div></div>';
      }
      function go(){
        var q=$('noQ').value.trim();if(q.length<2){st('Ad və ya org.nr yazın.');return;}
        st('Axtarılır...');$('noResults').innerHTML='';
        fetch('/api/norway?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d.error){st('Xəta','err');$('noResults').innerHTML='<div class="msg warn">'+ec(d.error)+'</div>';return;}
          var list=d.organisasjonsnummer?[d]:((d._embedded&&d._embedded.enheter)||[]);
          if(!list.length){st('Nəticə tapılmadı.','err');return;}
          st(list.length+' nəticə','ok');$('noResults').innerHTML=list.map(card).join('');
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('noBtn').addEventListener('click',go);$('noQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('noQ').focus();
    })();
    </script>
  `;
}
function francePage(){
  return `
    <div class="tab-info">🇫🇷 Fransa — Recherche-Entreprises (dövlət reyestri, INSEE əsaslı). Ad və ya SIREN (9 rəqəm) ilə axtar. Açarsız, pulsuz.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="frQ" placeholder="Şirkət adı və ya SIREN (məs: TotalEnergies / 542051180)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="frBtn">Axtar</button>
    </div>
    <div id="frStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="frResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('frBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('frStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function card(o){
        var rows='';function r(l,v){if(v===''||v==null)return;rows+='<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(v)+'</td></tr>';}
        r('SIREN',o.siren);
        r('Ünvan',o.siege&&o.siege.adresse);
        r('Fəaliyyət (NAF)',o.activite_principale);
        r('Yaranma',o.date_creation);
        r('Status',o.etat_administratif==='A'?'Aktiv':o.etat_administratif);
        var dirs=(o.dirigeants||[]).map(function(p){return p.type_dirigeant==='personne morale'?((p.denomination||'')+' ('+(p.qualite||'')+')'):(((p.prenoms||'')+' '+(p.nom||'')).trim()+' — '+(p.qualite||''));}).slice(0,6).join('; ');
        r('Rəhbərlər',dirs);
        if(o.finances){var yr=Object.keys(o.finances).sort().pop();if(yr){var f=o.finances[yr];r('Maliyyə ('+yr+')','CA: '+(f.ca!=null?f.ca:'-')+' € · Mənfəət: '+(f.resultat_net!=null?f.resultat_net:'-')+' €');}}
        var link='https://annuaire-entreprises.data.gouv.fr/entreprise/'+ec(o.siren);
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#0055a4,#ef4135)">FR</div><div><h2>'+ec(o.nom_complet||o.nom_raison_sociale||'')+'</h2><p>SIREN '+ec(o.siren)+' · Recherche-Entreprises</p></div></div><table>'+rows+'</table><div class="actions"><a href="'+link+'" target="_blank" rel="noopener">Annuaire ↗</a></div></div>';
      }
      function go(){
        var q=$('frQ').value.trim();if(q.length<2){st('Ad və ya SIREN yazın.');return;}
        st('Axtarılır...');$('frResults').innerHTML='';
        fetch('/api/france?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d.error){st('Xəta','err');$('frResults').innerHTML='<div class="msg warn">'+ec(d.error)+'</div>';return;}
          var list=d.results||[];if(!list.length){st('Nəticə tapılmadı.','err');return;}
          st((d.total_results||list.length)+' nəticə','ok');$('frResults').innerHTML=list.map(card).join('');
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('frBtn').addEventListener('click',go);$('frQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('frQ').focus();
    })();
    </script>
  `;
}
function gleifPage(){
  return `
    <div class="tab-info">🌐 GLEIF (LEI) — qlobal hüquqi şəxs identifikatoru. İstənilən ölkənin LEI-li şirkətini ad və ya 20-simvollu LEI kodu ilə tap. Açarsız, pulsuz.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="leiQ" placeholder="Şirkət adı və ya LEI (məs: Equinor / 5967007LIEEXZX1XX72)..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="leiBtn">Axtar</button>
    </div>
    <div id="leiStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="leiResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('leiBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('leiStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function addr(a){if(!a)return '';return [[].concat(a.addressLines||[]).join(', '),(a.postalCode||'')+' '+(a.city||''),a.country].filter(Boolean).join(', ');}
      function card(rec){
        var a=rec.attributes||rec;var e=a.entity||{};
        var rows='';function r(l,v){if(v===''||v==null)return;rows+='<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(v)+'</td></tr>';}
        r('LEI',a.lei);
        r('Hüquqi ünvan',addr(e.legalAddress));
        r('Ölkə',e.legalAddress&&e.legalAddress.country);
        r('Forma',e.legalForm&&e.legalForm.id);
        r('Status',e.status);
        r('Qeydiyyat',a.registration&&a.registration.status);
        var name=(e.legalName&&e.legalName.name)||'LEI';
        var link='https://search.gleif.org/#/record/'+ec(a.lei);
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#1f6feb,#0b3d91)">LEI</div><div><h2>'+ec(name)+'</h2><p>'+ec(a.lei||'')+' · GLEIF</p></div></div><table>'+rows+'</table><div class="actions"><a href="'+link+'" target="_blank" rel="noopener">GLEIF ↗</a></div></div>';
      }
      function go(){
        var q=$('leiQ').value.trim();if(q.length<2){st('Ad və ya LEI yazın.');return;}
        st('Axtarılır...');$('leiResults').innerHTML='';
        fetch('/api/gleif?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d.errors){st('Xəta','err');$('leiResults').innerHTML='<div class="msg warn">GLEIF xətası</div>';return;}
          var list=Array.isArray(d.data)?d.data:(d.data?[d.data]:[]);
          if(!list.length){st('Nəticə tapılmadı.','err');return;}
          st(list.length+' nəticə','ok');$('leiResults').innerHTML=list.map(card).join('');
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('leiBtn').addEventListener('click',go);$('leiQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('leiQ').focus();
    })();
    </script>
  `;
}
function estoniaPage(){
  return `
    <div class="tab-info">🇪🇪 Estoniya — e-Äriregister rəsmi reyestri. Canlı API müqavilə tələb edir (SOAP), ona görə axtarışı birbaşa rəsmi açıq saytlarda açırıq (pulsuz).</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="eeQ" placeholder="Şirkət adı və ya registrikood..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="eeBtn">Aç</button>
    </div>
    <div id="eeResults" style="margin-top:10px"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('eeBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function go(){
        var q=$('eeQ').value.trim();if(!q)return;
        var u='https://ariregister.rik.ee/eng/search?name='+encodeURIComponent(q);
        $('eeResults').innerHTML='<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#0072ce,#111)">EE</div><div><h2>'+ec(q)+'</h2><p>e-Äriregister</p></div></div><div class="actions"><a href="'+u+'" target="_blank" rel="noopener">e-Äriregister ↗</a> <a href="https://www.teatmik.ee/en/search?q='+encodeURIComponent(q)+'" target="_blank" rel="noopener">Teatmik ↗</a></div></div>';
        window.open(u,'_blank','noopener');
      }
      $('eeBtn').addEventListener('click',go);$('eeQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});$('eeQ').focus();
    })();
    </script>
  `;
}
function ukrainePage(){
  return `
    <div class="tab-info">🇺🇦 Ukrayna — Opendatabot açıq reyestri (girişsiz). ЄДРПОУ kodu ilə axtar (adətən 8 rəqəm): ad, direktor, ünvan, kapital, Prozorro tenderləri, məhkəmə işləri. YouControl/Clarity linkləri də var.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="ukrQ" placeholder="ЄДРПОУ (məs: 14360570)..." style="flex:1;min-width:240px" inputmode="numeric" autocomplete="off">
      <button type="button" id="ukrBtn">Axtar</button>
    </div>
    <div id="ukrStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="ukrResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('ukrBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('ukrStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      var CH='display:inline-block;padding:5px 10px;border:1px solid var(--border);border-radius:8px;margin:0 6px 6px 0;color:var(--text);text-decoration:none;font-size:13px';
      function go(){
        var q=$('ukrQ').value.replace(/\D/g,'');
        if(q.length<6){st('ЄДРПОУ kodunu yazın (8 rəqəm).');return;}
        st('Axtarılır...');$('ukrResults').innerHTML='';
        fetch('/api/ukraine?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(!d.ok){st('Xəta: '+(d.error||'tapılmadı'),'err');$('ukrResults').innerHTML='<div class="msg warn">'+ec(d.error||'Nəticə tapılmadı')+' <a href="https://opendatabot.ua/c/'+ec(q)+'" target="_blank" rel="noopener">Opendatabot-da aç ↗</a></div>';return;}
          var rows='';(d.fields||[]).forEach(function(f){rows+='<tr><td class="label">'+ec(f.label)+'</td><td class="value">'+ec(f.value)+'</td></tr>';});
          var c=d.counts||{},L=d.links||{};
          var chips='';
          if(c.tenders)chips+='<a style="'+CH+'" href="'+ec(L.tenders)+'" target="_blank" rel="noopener">📑 '+ec(c.tenders)+' tender</a>';
          if(c.court)chips+='<a style="'+CH+'" href="'+ec(L.court)+'" target="_blank" rel="noopener">⚖️ '+ec(c.court)+' məhkəmə</a>';
          if(c.executions)chips+='<span style="'+CH+'">🧾 '+ec(c.executions)+' icra</span>';
          var acts='<a href="'+ec(L.opendatabot)+'" target="_blank" rel="noopener">Opendatabot ↗</a> <a href="'+ec(L.clarity)+'" target="_blank" rel="noopener">Clarity ↗</a> <a href="'+ec(L.youcontrol)+'" target="_blank" rel="noopener">YouControl ↗</a>';
          st('Tapıldı','ok');
          $('ukrResults').innerHTML='<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#0057b7,#ffd700);color:#0b1220">UA</div><div><h2>'+ec(d.name||('ЄДРПОУ '+q))+'</h2><p>ЄДРПОУ '+ec(d.code||q)+' · Opendatabot</p></div></div>'+(chips?'<div style="margin:10px 0">'+chips+'</div>':'')+'<table>'+rows+'</table><div class="actions">'+acts+'</div></div>';
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('ukrBtn').addEventListener('click',go);
      $('ukrQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});
      $('ukrQ').focus();
    })();
    </script>
  `;
}
function belarusPage() {
  return `
    <div class="tab-info">🇧🇾 Belarus — ЕГР rəsmi reyestri (grp.nalog.gov.by). УНП nömrəsi ilə axtar (adətən 9 rəqəm). Qeyd: Belarus serveri bəzən yavaş cavab verir.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <input id="byQ" placeholder="УНП (məs: 100582333)..." style="flex:1;min-width:240px" inputmode="numeric" autocomplete="off">
      <button type="button" id="byBtn">Axtar</button>
    </div>
    <div id="byStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="byResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('byBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('byStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function row(l,v){return (v===''||v===null||v===undefined)?'':('<tr><td class="label">'+ec(l)+'</td><td class="value">'+ec(String(v))+'</td></tr>');}
      var LABELS={vnaimp:'Tam ad',vnaimk:'Qısa ad',vnaim:'Ad',ngrn:'Qeydiyyat №',vunp:'УНП',unp:'УНП',dreg:'Qeydiyyat tarixi',vfio:'Rəhbər',dlikv:'Ləğv tarixi',vpadres:'Ünvan',vmestonahozd:'Ünvan',nsostk:'Status',vnsostk:'Status',vnsost:'Status'};
      function isScalar(v){return v===null||['string','number','boolean'].indexOf(typeof v)>=0;}
      function rowsFromObj(o){
        var html='';
        for(var k in o){ if(!Object.prototype.hasOwnProperty.call(o,k))continue; var v=o[k];
          if(isScalar(v)){ if(v===''||v===null)continue; html+=row(LABELS[k]||k,v); }
          else if(typeof v==='object'){ html+=rowsFromObj(v); }
        }
        return html;
      }
      function go(){
        var q=$('byQ').value.replace(/\\D/g,'');
        if(q.length<5){st('УНП nömrəsini yazın (9 rəqəm).');return;}
        st('Axtarılır... (Belarus serveri yavaş ola bilər)');$('byResults').innerHTML='';
        fetch('/api/belarus?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d.error){st('Xəta: '+d.error,'err');$('byResults').innerHTML='<div class="msg warn">'+ec(d.error)+' <a href="https://grp.nalog.gov.by/grp/#!ul/'+encodeURIComponent(q)+'" target="_blank" rel="noopener">ЕГР-də birbaşa aç ↗</a></div>';return;}
          var data=d.data;
          var rows=data?rowsFromObj(data):'';
          if(!rows){st('Nəticə tapılmadı.','err');return;}
          st('Tapıldı','ok');
          $('byResults').innerHTML='<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#0f7a3d,#16a34a)">BY</div><div><h2>УНП '+ec(q)+'</h2><p>ЕГР Belarus</p></div></div><table>'+rows+'</table><div class="actions"><a href="https://grp.nalog.gov.by/grp/#!ul/'+ec(q)+'" target="_blank" rel="noopener">ЕГР səhifəsi ↗</a></div></div>';
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('byBtn').addEventListener('click',go);
      $('byQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go();}});
      $('byQ').focus();
    })();
    </script>
  `;
}
function html(data) {
  const {
    tin,
    name,
    q,
    url,
    whoisDomain,
    whoisRaw = '',
    page,
    error,
    records,
    results,
    tinResult,
    dbResults,
    dnnResults,
    dnnMnbResults = [],
    mnbResults,
    voemResults,
    telResult,
    provider,
    city,
    number,
    b2bMode,
    b2bVoen = '',
    b2bId,
    b2bResult,
    b2bCompanyResult,
    b2bName,
    b2bCompany,
    b2bLastName,
    b2bFirstName,
    b2bPatronymic,
    borcResult,
    edvResults,
    edvMode,
    firstName,
    lastName,
    patronymic,
    voemPage,
    mskResults,
    mskSeciciResults = [],
    mskSeciciTotal = '',
    mskSeciciMessage = '',
    mskSeciciQ = '',
    mskSeciciDaire = '',
    mskSeciciMenteqe = '',
    mskSeciciBirth = '',
    mskLastName,
    mskFirstName,
    mskPatronymic,
    mskBirth,
    mskGender,
    mskSub = 'ad',
    terkibResults = [],
    terkibMode = '',
    terkibMessage = '',
    terkibTotal = '',
    terkibMenteqeList = [],
    terkibDaireAdi = '',
    vergiResults = [],
    lsnzResults = [],
    tdrResults = [],
    tdrCount = '',
    tdrDistrictId = '76',
    tenderMode = 'events',
    tenderResults = [],
    tenderTotal = '',
    tenderStats = null,
    tenderVoenName = '',
    tenderVoenFound = false,
    etndrResults = [],
    etndrData = null,
    etSupplierVoen = '',
    etSupplierName = '',
    etKeyword = '',
    etEventName = '',
    etAmountFrom = '',
    etAmountTo = '',
    etPublishFrom = '',
    etPublishTo = '',
    etContractFrom = '',
    etContractTo = '',
    etPageSize = '15',
    etPage = '1',
    url_tenderMode = '',
    blackbirdLines = [],
    blackbirdUsername = '',
    sherlockFound = [],
    sherlockUsername = '',
    sherlockCount = 0,
    osintSub = 'bb',
    smabSub = 'smab',
    whoisResult = null,
    qidaResults = [],
    cbarResults = [],
    cbarStats = null,
    url_cbarMode = '',
    coronaResults = [],
    coronaStats = null,
    url_coronaMode = '',
    aramResults = [],
    aramSections = [],
    aramTotal = 0,
    tobbResults = [],
    tobbBaslik = '',
    tobbMudurlukOptions = [],
    tobbMode = 'gazete',
    tobbPersonData = null,
    tobbSeedData = null,
    tobbStatsData = null,
    itobbData = null,
    itobbDetailData = null,
    guncelleInfo = null,
    url_SicilMudurluguId = '',
    url_TicSicNo = '',
    url_TicaretUnvani = '',
    url_Tarih1 = '',
    url_Tarih2 = '',
    idareResults = [],
    idareOptions = [],
    idareCategory = '',
    idareId = '',
    idareQ = '',
    idareMode = 'search',
    idareSearchTotal = 0,
    idareStats = null,
    contactsMode = 'search',
    contactsId = '',
    contactsStatus = '',
    contactsCategory = '',
    contactsLimit = '100',
    contactsResults = [],
    contactsContact = null,
    contactsPhones = [],
    contactsEmails = [],
    contactsStats = null,
    contactsMessage = '',
    universalQ = '',
    xeberSource = 'all',
    xeberQ = '',
    xeberRefresh = '',
    xeberResults = [],
    xeberTotal = 0,
    xeberMessage = '',
    xeberUpdated = '',
    xeberSources = [],
    universalResults = [],
    universalDnnCount = 0,
    universalMnbCount = 0,
    universalVergiCount = 0,
    dnnRelatedVergi = []
  } = data;

  const cn = records.length ? esc(records[0].fullName) : '';

  const tabs = [
    ['hoqqa', '🎩 HOQQA'],
    ['universal', '🔍 AXTAR'],
    ['history', 'TARİXÇƏ'],
    ['tin', 'VÖEN'],
    ['dnn', 'DNN'],
    ['mnb', 'MNB'],
    ['vergi', 'VERGİ'],
    ['smab', 'SMAB'],
    ['tdr', 'TDR'],
    ['tel', 'TEL'],
    ['b2b', 'B2B'],
    ['msk', 'MSK'],
    ['lsnz', 'LSNZ'],
    ['blackbird', 'OSINT'],
    ['tender', 'TENDER'],
    ['etndr', '🏛️ ETNDR'],
    ['cbar', 'CBAR'],
    ['qida', 'QİDA'],
    ['tobb', '🇹🇷 TOBB'],
    ['dunya', '🌍 DÜNYA'],
    ['aleph', '🕵️ ALEPH'],
    ['idare', 'İDARƏ'],
    ['contacts', 'ƏLAQƏ'],
    ['xeber', '📰 XƏBƏR'],
    ['secilmish', '⭐ FAVORİT'],
    ['aile', '🌳 AİLƏ AĞACI']
  ];

  // VÖEN qrupu - bu tablardan biri aktiv olanda VÖEN tabi da aktiv görünsün
  const voenGroup = ['tin', 'search', 'edv', 'borc', 'voem'];

  // Tab badge-lər: nəticə sayı göstər
  const tabBadges = {
    dnn: dnnResults.length || 0,
    mnb: mnbResults.length || 0,
    vergi: vergiResults.length || 0
  };

  const tabBar = tabs
    .map(([id, label]) => {
      const isActive = page === id || (id === 'tin' && voenGroup.includes(page));
      const count = tabBadges[id];
      const badge = (count > 0 && page === id)
        ? `<span style="display:inline-block;margin-left:5px;padding:1px 6px;font-size:11px;background:${isActive ? 'rgba(255,255,255,0.25)' : 'var(--blue)'};color:#fff;border-radius:9px;vertical-align:middle;line-height:1.5">${count}</span>`
        : '';
      return `<a href="/?page=${id}" class="tab ${isActive ? 'active' : ''}">${label}${badge}</a>`;
    })
    .join('');

  const historyCards = records
    .map(r => {
      const c = oc(r.operationName);
      return `<div class="timeline-row">
        <div class="dot ${c}"></div>
        <div class="hist-card">
          <div class="hist-top">
            <span>${esc(r.operationName || 'Əməliyyat')}</span>
            <em>${fd(r.operationDate)}</em>
          </div>
          <div class="hist-grid">
            ${mini('Şirkət', r.fullName)}
            ${mini('Rəhbər', r.chiefName)}
            ${mini('Ünvan', r.fullAddress, true)}
            ${mini('Kapital', r.charterCapital)}
            ${mini('Hüquqi forma', r.legalForm)}
          </div>
        </div>
      </div>`;
    })
    .join('');

  // ── Rəhbərlər bloku: tarixçədəki bütün unikal rəhbərlər + tab axtarış düymələri ──
  const leaderSeen = new Set();
  const leaderList = [];
  records.forEach(r => {
    const nm = (r.chiefName || '').trim();
    if (!nm) return;
    const keyN = nm.toLowerCase().replace(/\s+/g, ' ');
    if (leaderSeen.has(keyN)) return;
    leaderSeen.add(keyN);
    leaderList.push(nm);
  });
  const leaderSearchBtns = (nm) => {
    const u = encodeURIComponent(nm);
    return [
      `<a href="/?page=dnn&q=${u}">DNN</a>`,
      `<a href="/?page=vergi&q=${u}">VERGİ</a>`,
      `<a href="/?page=b2b&b2bMode=people&b2bName=${u}">B2B</a>`,
      `<a href="/?page=mnb&q=${u}">MNB</a>`,
      `<a href="/?page=idare&idareMode=search&idareQ=${u}">İDARƏ</a>`,
      `<a href="/?page=contacts&contactsMode=search&q=${u}">ƏLAQƏ</a>`
    ].join('');
  };
  const leadersBlock = leaderList.length ? `
    <div class="card leaders-card no-print">
      <div class="card-head">
        <div class="logo">👤</div>
        <div><h2>Rəhbərlər</h2><p>Tarixçədə qeyd olunan ${leaderList.length} rəhbər — adın yanındakı düymə ilə axtar</p></div>
      </div>
      <div class="leaders-list">
        ${leaderList.map(nm => `
          <div class="leader-row">
            <span class="leader-name">${esc(nm)}</span>
            <span class="leader-btns">${leaderSearchBtns(nm)}</span>
          </div>`).join('')}
      </div>
    </div>` : '';

  const formInput = (hidden, inputName, placeholder, val, max = '', upper = false) =>
    `<form method="GET" class="search-form">
      <input type="hidden" name="page" value="${hidden}">
      <input name="${inputName}" placeholder="${placeholder}" value="${esc(val)}"
        ${max ? `maxlength="${max}"` : ''}
        ${upper ? 'style="text-transform:uppercase;letter-spacing:.08em"' : ''}>
      <button type="submit">Axtar</button>
    </form>`;

  const msg = error ? `<div class="msg err">Xəta: ${esc(error)}</div>` : '';

  // ── DEĞİŞİKLİK 1 & 2: MSK üçün MNB link hissəsi ──
  const mskPersonQ = [mskLastName, mskFirstName, mskPatronymic].filter(Boolean).join(' ');

  return `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VÖEN Axtarış</title>
${style()}
<script>
function cleanDigitsOnlyInput(el) {
  if (!el) return;
  const v = String(el.value || '');
  if (/\d/.test(v) && !/[A-Za-zƏəĞğIıİiÖöÜüŞşÇçА-Яа-я]/.test(v)) {
    el.value = v.replace(/\D+/g, '');
  }
}
function copyCardText(btn) {
  const card = btn.closest('.card');
  if (!card) return;
  const text = card.innerText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/PDF/g, '')
    .replace(/Kopyala/g, '')
    .trim();
  navigator.clipboard.writeText(text).then(function(){
    const old = btn.textContent;
    btn.textContent = '✅ Kopyalandı';
    setTimeout(function(){ btn.textContent = old; }, 1400);
  }).catch(function(){ alert(text); });
}

// ── Avtomatik tip tanıma ──────────────────────────────────────────────────
function detectQueryType(val) {
  val = val.trim();
  if (!val) return null;
  const digits = val.replace(/\D/g, '');
  // Nömrə lövhəsi: 99AA999 formatı
  if (/^[0-9]{2}[A-Za-z]{1,3}[0-9]{2,4}$/.test(val.replace(/\s/g,''))) {
    return { label: '🚗 Nömrə lövhəsi axtarışı', color: '#f59e0b' };
  }
  // VÖEN: tam 10 rəqəm
  if (/^\d{10}$/.test(digits) && val.replace(/\D/g,'').length === 10) {
    return { label: '🏢 VÖEN axtarışı', color: '#60a5fa' };
  }
  // Telefon: 4+ rəqəm, hərfsiz
  if (digits.length >= 4 && !/[A-Za-zƏəĞğIıİiÖöÜüŞşÇç]/.test(val)) {
    return { label: '📱 Telefon axtarışı', color: '#34d399' };
  }
  // Ad: 2+ harf sözü
  if (/[A-Za-zƏəĞğIıİiÖöÜüŞşÇç]{2,}/.test(val)) {
    return { label: '👤 Ad / MMC axtarışı', color: '#a78bfa' };
  }
  return null;
}

function updateQueryLabel(input) {
  const label = document.getElementById('query-type-label');
  if (!label) return;
  const info = detectQueryType(input.value);
  if (info) {
    label.textContent = info.label;
    label.style.color = info.color;
    label.style.display = 'inline-block';
  } else {
    label.style.display = 'none';
  }
}
</script>
</head>

<body>
<header class="no-print">
  <div class="brand"><a href="/" style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:10px">🏛️ <b>AXTAR</b></a></div>
  <form method="GET" class="header-search" action="/">
    <input type="hidden" name="page" value="universal">
    <input name="uq" placeholder="Ad, VÖEN, nömrə lövhəsi..." value="${esc(universalQ)}" autocomplete="off" style="width:280px;padding:9px 14px;font-size:14px;background:var(--card2);border:1px solid var(--border);border-radius:9px;color:var(--text);outline:none" oninput="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor=''">
    <button type="submit" style="padding:9px 16px;font-size:13px">🔍 AXTAR</button>
  </form>
  <div class="head-right">
    <button id="compactToggle" class="theme-toggle" type="button" onclick="toggleCompact()" title="Kompakt/normal rejim">⊞ Kompakt</button>
    <button id="themeToggle" class="theme-toggle" type="button" onclick="toggleTheme()" title="Açıq/tünd rejim">☀️ Açıq</button>
    <small>Baza.db</small>
  </div>
</header>

<main>
  <nav class="tabs no-print">${tabBar}</nav>
  ${msg}
  ${tabInfo(page, osintSub)}
  ${page === 'hoqqa' ? `
    <div class="hoqqa-wrap" style="margin:0 auto">
      <div class="tab-info">🎩 HOQQA — sizin bazalarınızdan istifadə edən süni zəka araşdırma köməkçisi. Əvvəl aşağıdan AI xidmətini seçib açarınızı yazın, sonra sual verin.</div>

      <div style="margin-top:14px;background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:16px">
        <div style="font-weight:800;margin-bottom:10px">⚙️ Bağlantı</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
          <div style="flex:1;min-width:180px">
            <label style="display:block;font-size:12px;color:var(--muted);font-weight:700;margin-bottom:4px">AI xidməti</label>
            <select id="hoqqaProvider" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);font-size:14px">
              <option value="groq">Groq (pulsuz, sabit açar)</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google (Gemini)</option>
              <option value="grok">xAI (Grok)</option>
            </select>
          </div>
          <div style="flex:2;min-width:220px">
            <label style="display:block;font-size:12px;color:var(--muted);font-weight:700;margin-bottom:4px">API key</label>
            <input id="hoqqaKey" type="password" autocomplete="off" placeholder="açarınızı yapışdırın" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);font-size:14px">
          </div>
          <div style="flex:1;min-width:160px">
            <label style="display:block;font-size:12px;color:var(--muted);font-weight:700;margin-bottom:4px">Model (istəyə bağlı)</label>
            <input id="hoqqaModel" autocomplete="off" placeholder="standart" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);font-size:14px">
          </div>
          <button type="button" id="hoqqaStart" style="background:#22c55e;color:#06270f;border:none;padding:11px 20px;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer">Başla</button>
        </div>
        <div id="hoqqaHello" style="margin-top:10px;font-size:14px;color:#86efac;font-weight:700"></div>
      </div>

      <div style="margin-top:16px">
        <label style="display:block;font-weight:700;margin-bottom:6px">Sual / Mövzu</label>
        <textarea id="hoqqaQ" rows="3" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--card2);color:var(--text);font-size:15px" placeholder="Məs: Filan mövzu üzrə araşdırma hazırla"></textarea>
        <label style="display:block;font-weight:700;margin:14px 0 6px">İstiqamət / Göstəriş (istəyə bağlı)</label>
        <textarea id="hoqqaG" rows="2" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--card2);color:var(--text);font-size:15px" placeholder="Məs: Qısa olsun, rəsmi dildə, mənbələri göstər"></textarea>
        <button type="button" id="hoqqaBtn" style="margin-top:14px;background:var(--blue);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer">Araşdır</button>
      </div>

      <div id="hoqqaResult" style="margin-top:20px;background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:18px;white-space:pre-wrap;line-height:1.6;display:none"></div>
      <div id="hoqqaSources" style="margin-top:10px;font-size:13px;color:var(--muted)"></div>
      <div id="hoqqaChat" style="display:none;margin-top:16px;background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:14px">
        <div style="font-weight:800;margin-bottom:10px">💬 Söhbəti davam et / araşdırmanı təkmilləşdir</div>
        <div id="hoqqaChatLog" style="display:flex;flex-direction:column;gap:10px;max-height:460px;overflow:auto"></div>
        <div id="hoqqaChatStatus" style="font-size:12px;color:#fbbf24;font-weight:700;margin:6px 2px 0;min-height:16px"></div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <textarea id="hoqqaChatInput" rows="2" style="flex:1;padding:11px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);font-size:14px;resize:vertical" placeholder="Məs: bunu qısalt · rəsmi dilə çevir · əlavə təfərrüat ver · cədvəl şəklində yaz"></textarea>
          <button type="button" id="hoqqaChatSend" style="background:var(--blue);color:#fff;border:none;padding:11px 20px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap">Göndər</button>
        </div>
      </div>

    </div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      var DEF={groq:'llama-3.3-70b-versatile',openai:'gpt-4o-mini',anthropic:'claude-sonnet-4-6',gemini:'gemini-3.5-flash',grok:'grok-4.3'};
      var state={context:'',history:[]};
      function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
      function conn(){var p=$('hoqqaProvider').value;var k=$('hoqqaKey').value.trim();if(p==='groq')k='';return{provider:p,apiKey:k,model:$('hoqqaModel').value.trim()};}
      function save(){var p=$('hoqqaProvider').value;if(p!=='groq'){var k=$('hoqqaKey').value.trim();var s={};try{s=JSON.parse(localStorage.getItem('hoqqaKeys')||'{}');}catch(e){}s[p]=k;try{localStorage.setItem('hoqqaKeys',JSON.stringify(s));}catch(e){}}try{localStorage.setItem('hoqqaProvider',p);localStorage.setItem('hoqqaModel',$('hoqqaModel').value.trim());}catch(e){}}
      function provChange(){var p=$('hoqqaProvider').value;$('hoqqaModel').placeholder='standart: '+DEF[p];var k=$('hoqqaKey');if(p==='groq'){k.value='groq-built-in-key-xxxxxxxx';k.readOnly=true;k.style.opacity='0.7';k.title='Groq açarı koda yazılıb (sabit)';}else{k.readOnly=false;k.style.opacity='1';k.title='';var s={};try{s=JSON.parse(localStorage.getItem('hoqqaKeys')||'{}');}catch(e){}k.value=s[p]||'';}}
      async function greet(){var c=conn();var hi=$('hoqqaHello');var b=$('hoqqaStart');if(c.provider!=='groq'&&!c.apiKey){alert('Əvvəl API key yazın.');return;}save();b.disabled=true;b.textContent='Yoxlanılır...';hi.style.color='#fbbf24';hi.textContent='HOQQA bağlanır...';try{var r=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'greet',provider:c.provider,apiKey:c.apiKey,model:c.model})});var d=await r.json();if(d.error){hi.style.color='#f87171';hi.textContent='✖ '+d.error;}else{hi.style.color='#86efac';hi.textContent='✓ '+d.answer;}}catch(e){hi.style.color='#f87171';hi.textContent='✖ Bağlantı xətası: '+e.message;}b.disabled=false;b.textContent='Başla';}
      async function run(){var c=conn();if(c.provider!=='groq'&&!c.apiKey){alert('Əvvəl Bağlantı bölməsində API key yazıb "Başla" basın.');return;}var q=$('hoqqaQ').value.trim();if(!q){alert('Zəhmət olmasa sual yazın.');return;}var g=$('hoqqaG').value.trim();save();var b=$('hoqqaBtn'),out=$('hoqqaResult'),src=$('hoqqaSources');b.disabled=true;b.textContent='Araşdırılır...';out.style.display='block';out.textContent='HOQQA düşünür...';src.textContent='';try{var r=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:c.provider,apiKey:c.apiKey,model:c.model,question:q,guidance:g})});var d=await r.json();if(d.error){out.textContent='Xəta: '+d.error;}else{out.textContent=d.answer;var info=[];if(d.term)info.push('Axtarılan: '+d.term);if(d.sources&&d.sources.length){var u=[];d.sources.forEach(function(s){if(u.indexOf(s)<0)u.push(s);});info.push('Mənbələr: '+u.join(', '));}src.textContent=info.join('  ·  ');state.context=d.context||'';state.history=[{role:'user',content:(g?q+'\\n\\nİstiqamət: '+g:q)},{role:'assistant',content:d.answer}];$('hoqqaChatLog').innerHTML='';$('hoqqaChatStatus').textContent='';$('hoqqaChat').style.display='';}}catch(e){out.textContent='Bağlantı xətası: '+e.message;}b.disabled=false;b.textContent='Araşdır';}
      function renderChat(){var log=$('hoqqaChatLog');var h='';for(var i=2;i<state.history.length;i++){var m=state.history[i];var me=(m.role==='user');h+='<div style="align-self:'+(me?'flex-end':'flex-start')+';max-width:88%;background:'+(me?'var(--blue)':'var(--card)')+';color:'+(me?'#fff':'var(--text)')+';border:1px solid var(--border);border-radius:12px;padding:10px 12px;white-space:pre-wrap;line-height:1.55">'+esc(m.content)+'</div>';}log.innerHTML=h;log.scrollTop=log.scrollHeight;}
      async function sendChat(){var c=conn();if(c.provider!=='groq'&&!c.apiKey){alert('Əvvəl API key yazın.');return;}var inp=$('hoqqaChatInput');var t=inp.value.trim();if(!t)return;state.history.push({role:'user',content:t});inp.value='';renderChat();var b=$('hoqqaChatSend');b.disabled=true;$('hoqqaChatStatus').textContent='HOQQA yazır...';try{var r=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'chat',provider:c.provider,apiKey:c.apiKey,model:c.model,context:state.context,messages:state.history})});var d=await r.json();state.history.push({role:'assistant',content:d.error?('Xəta: '+d.error):d.answer});}catch(e){state.history.push({role:'assistant',content:'Bağlantı xətası: '+e.message});}$('hoqqaChatStatus').textContent='';renderChat();b.disabled=false;}
      function init(){
        var prov=$('hoqqaProvider'); if(!prov) return;
        try{var p=localStorage.getItem('hoqqaProvider');if(p)prov.value=p;var m=localStorage.getItem('hoqqaModel');if(m)$('hoqqaModel').value=m;}catch(e){}
        provChange();
        prov.addEventListener('change',provChange);
        $('hoqqaStart').addEventListener('click',greet);
        $('hoqqaBtn').addEventListener('click',run);
        $('hoqqaChatSend').addEventListener('click',sendChat);
        $('hoqqaChatInput').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}});
      }
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
    })();
    </script>
  ` : ''}


  ${page === 'universal' ? `
    <div class="universal-search-box no-print">
      <form method="GET" action="/">
        <input type="hidden" name="page" value="universal">
        <div class="univ-form">
          <input id="univ-input" name="uq" placeholder="AD SOYAD ATA ADI · VÖEN · MMC adı · avtomobil nömrəsi..." value="${esc(universalQ)}" autocomplete="off" style="text-transform:uppercase;letter-spacing:.04em" oninput="cleanDigitsOnlyInput(this);updateQueryLabel(this)" onpaste="setTimeout(()=>{cleanDigitsOnlyInput(this);updateQueryLabel(this)},0)">
          <button type="submit">🔍 AXTAR</button>
        </div>
        <div style="margin-top:6px;min-height:20px">
          <span id="query-type-label" style="display:${universalQ ? 'inline-block' : 'none'};font-size:12px;font-weight:600;padding:2px 10px;border-radius:20px;background:rgba(255,255,255,0.08)">${(() => {
            const v = universalQ.trim();
            if (!v) return '';
            if (/^[0-9]{2}[A-Za-z]{1,3}[0-9]{2,4}$/.test(v.replace(/\s/g,''))) return '🚗 Nömrə lövhəsi axtarışı';
            if (/^\d{10}$/.test(v.replace(/\D/g,''))) return '🏢 VÖEN axtarışı';
            if (v.replace(/\D/g,'').length >= 4 && !/[A-Za-zƏəĞğIıİiÖöÜüŞşÇç]/.test(v)) return '📱 Telefon axtarışı';
            if (/[A-Za-zƏəĞğIıİiÖöÜüŞşÇç]{2,}/.test(v)) return '👤 Ad / MMC axtarışı';
            return '';
          })()}</span>
        </div>
      </form>
    </div>

    ${universalQ && (universalResults.length > 0 || error) ? `
      <div class="count" style="margin-bottom:20px">
        ${universalResults.length} ümumi nəticə —
        ${(() => {
          const order = ['DNN','MNB','VERGİ','CBAR','SMAB','TENDER','İDARƏ','MSK','ƏLAQƏ'];
          const cnt = {};
          universalResults.forEach(r => { cnt[r._source] = (cnt[r._source]||0)+1; });
          return order.filter(s => cnt[s]).map(s => `<span style="color:var(--blue)">${s}: ${cnt[s]}</span>`).join(' · ');
        })()}
        — <b>"${esc(universalQ)}"</b>
      </div>
    ` : ''}

    ${universalQ && universalResults.length === 0 && !error ? `<div class="msg err">[${esc(universalQ)}] - Heç bir nəticə tapılmadı.</div>` : ''}

    ${(() => {
      const genericCard = (r) => {
        const fields = Object.keys(r).filter(k => k !== '_source' && r[k] != null && r[k] !== '' && typeof r[k] !== 'object');
        const rows = fields.map(k => `<tr><td style="color:var(--muted);white-space:nowrap;padding-right:14px;vertical-align:top">${esc(k)}</td><td>${esc(String(r[k]))}</td></tr>`).join('');
        return `<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#334155,#64748b)">📁</div><div><h2>${esc(r._source)}</h2><p>baza nəticəsi</p></div></div><table>${rows}</table></div>`;
      };
      const cards = universalResults.map(r => {
        if (r._source === 'DNN') { const d = normalizeDnnRecord(r); return universalDnnCard(d); }
        if (r._source === 'MNB') return universalMnbCard(r);
        if (r._source === 'VERGİ') return universalVergiCard(r);
        return genericCard(r);
      });
      const BATCH = 10;
      const first = cards.slice(0, BATCH).join('');
      const rest  = cards.slice(BATCH).join('');
      return first +
        (rest ? `<div id="univMore" style="display:none">${rest}</div>
          <div id="univMoreWrap" style="text-align:center;margin:12px 0">
            <button onclick="document.getElementById('univMore').style.display='';document.getElementById('univMoreWrap').style.display='none'" style="background:var(--card2);color:var(--text);border:1px solid var(--border)">
              ⬇ Daha çox (${cards.length - BATCH} nəticə daha)
            </button>
          </div>` : '');
    })()}

    ${!universalQ ? `
      <div class="card" style="margin-top:8px">
        <div class="card-head">
          <div class="logo" style="font-size:20px;background:linear-gradient(135deg,#1e3a5f,#3b82f6)">🔍</div>
          <div>
            <h2>Universal Axtarış</h2>
            <p>9 baza — DNN · MNB · VERGİ · CBAR · SMAB · TENDER · İDARƏ · MSK · ƏLAQƏ — eyni anda</p>
          </div>
        </div>
        <table>
          ${row('Nə yaza bilərsiniz?', 'Ad Soyad Ata adı — DNN və MNB bazalarında axtarır')}
          ${row('', 'VÖEN (10 rəqəm) — VERGİ bazasında axtarır')}
          ${row('', 'MMC adı — VERGİ bazasında axtarır')}
          ${row('', 'Avtomobil nömrəsi (məs: 90AA123) — DNN bazasında axtarır')}
          ${row('', 'Telefon nömrəsi — MNB bazasında axtarır')}
          ${row('Bazalar', 'DNN: 1.353.261 avtomobil qeydi (mia.gov.az)')}
          ${row('', 'MNB: 4.595.525 telefon abonent qeydi')}
          ${row('', 'VERGİ: 27.423 şirkət qeydi (vergi qəzeti)')}
        </table>
      </div>
    ` : ''}
  ` : ''}

  ${page === 'history' ? `
    ${formInput('history', 'tin', 'VÖEN daxil edin...', tin, '10')}
    ${records.length ? `
      <section class="title">
        <div class="logo">🏢</div>
        <div><h1>${cn}</h1><p>VÖEN: ${esc(tin)}</p></div>
        <button onclick="window.print()">🖨️ PDF</button>
      </section>
      ${leadersBlock}
      <div style="margin-bottom:16px;display:flex;gap:10px;align-items:center">
        <input id="histFilterInput" type="text" placeholder="Tarixçədə axtar..." style="max-width:320px;margin:0" oninput="filterHistory(this.value)">
        <span id="histFilterCount" style="font-family:monospace;font-size:12px;color:var(--muted)"></span>
      </div>
      <div class="timeline" id="histTimeline">${historyCards}</div>
    ` : tin && !error ? `<div class="msg err">[${esc(tin)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}

  ${voenGroup.includes(page) ? `
    <div class="subtabs no-print">
      <a class="${page === 'tin' ? 'active' : ''}" href="/?page=tin${tin ? '&tin=' + encodeURIComponent(tin) : ''}">VÖEN</a>
      <a class="${page === 'search' ? 'active' : ''}" href="/?page=search${name ? '&name=' + encodeURIComponent(name) : ''}">MMC AD</a>
      <a class="${page === 'edv' ? 'active' : ''}" href="/?page=edv&mode=${edvMode}">ƏDV</a>
      <a class="${page === 'borc' ? 'active' : ''}" href="/?page=borc${tin ? '&tin=' + encodeURIComponent(tin) : ''}">BORC</a>
      <a class="${page === 'voem' ? 'active' : ''}" href="/?page=voem${q ? '&q=' + encodeURIComponent(q) : ''}">VÖEM</a>
    </div>
  ` : ''}

  ${page === 'tin' ? `
    ${formInput('tin', 'tin', 'VÖEN daxil edin...', tin, '10')}
    ${tinResult ? companyCard(tinResult, true) : tin && !error ? `<div class="msg err">[${esc(tin)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}

  ${page === 'search' ? `
    ${formInput('search', 'name', 'MMC adı daxil edin...', name)}
    ${results.length
      ? `<div class="count">${results.length} nəticə — "${esc(name)}"</div>${results.map(r => companyCard(r, true)).join('')}`
      : name && !error ? `<div class="msg err">[${esc(name)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}

  ${page === 'db' ? `
    ${formInput('db', 'q', 'BÖYÜK HƏRFLƏ YAZ', q, '', true)}
    ${dbResults.length
      ? `<div class="count">${dbResults.length} nəticə — "${esc(q)}"</div>${dbResults.map(dbCard).join('')}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div><div class="actions extra-actions">${dnnSearchLink(q)}</div>` : ''}
  ` : ''}

  ${page === 'dnn' ? `
    ${formInput('dnn', 'q', 'DNN BAZASINDA AXTAR', q, '', true)}
    <div id="liveZone">

    ${dnnMnbResults.length > 0 && q ? `
      <div style="margin-bottom:12px;padding:10px 16px;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-size:18px">📱</span>
        <span style="color:#34d399;font-weight:600">MNB-də ${dnnMnbResults.length} nəticə tapıldı</span>
        <span style="color:var(--muted);font-size:13px">"${esc(q)}" üzrə telefon bazasında da qeyd var</span>
        <a href="/?page=mnb&q=${encodeURIComponent(q)}" style="margin-left:auto;padding:5px 14px;background:#34d399;color:#0f1117;border-radius:7px;font-weight:700;font-size:13px;text-decoration:none">MNB-yə keç →</a>
      </div>` : ''}
    ${dnnResults.length
      ? `<div class="count">${dnnResults.length} nəticə — "${esc(q)}"</div>${dnnResults.map(genericDbCard).join('')}
         <div class="actions extra-actions" style="margin-top:8px">
           ${personCrossLinks(q, { dnn: false })}
           <a href="/?page=mnb&q=${encodeURIComponent(q)}">📱 MNB-də axtar →</a>
           ${mskSearchLinkFixed(q, '', 'Kişi', '🗳️ MSK (Kişi)')}
           ${mskSearchLinkFixed(q, '', 'Qadın', '🗳️ MSK (Qadın)')}
         </div>
         ${dnnRelatedVergi.length > 0 ? `
         <div style="margin-top:20px">
           <div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">
             🏢 Bu şəxsə bağlı şirkətlər — ${dnnRelatedVergi.length} nəticə (VERGİ bazası)
           </div>
           ${dnnRelatedVergi.map(r => companyCard(r, true)).join('')}
         </div>` : ''}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div><div class="actions extra-actions">${personCrossLinks(q, { dnn: false })}<a href="/?page=mnb&q=${encodeURIComponent(q)}">📱 MNB →</a>${mskSearchLinkFixed(q, '', 'Kişi', '🗳️ MSK (Kişi)')}${mskSearchLinkFixed(q, '', 'Qadın', '🗳️ MSK (Qadın)')}</div>` : ''}
    </div>
    ${!q ? dnnStatsCard() : ''}
  ` : ''}

  ${page === 'borc' ? `
    ${formInput('borc', 'tin', 'VÖEN daxil edin...', tin, '10')}
    ${borcResult ? borcCard(borcResult, tin) : tin && !error ? `<div class="msg err">[${esc(tin)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}

  ${page === 'edv' ? `
    <div class="subtabs no-print">
      <a class="${edvMode === 'name' ? 'active' : ''}" href="/?page=edv&mode=name">AD-SOYAD-ATA</a>
      <a class="${edvMode === 'tin' ? 'active' : ''}" href="/?page=edv&mode=tin">VÖEN</a>
    </div>

    ${edvMode === 'name' ? `
      <form method="GET" class="search-form three">
        <input type="hidden" name="page" value="edv">
        <input type="hidden" name="mode" value="name">
        <input name="lastName" placeholder="SOYAD" value="${esc(lastName)}" style="text-transform:uppercase">
        <input name="firstName" placeholder="AD" value="${esc(firstName)}" style="text-transform:uppercase">
        <input name="patronymic" placeholder="ATA ADI" value="${esc(patronymic)}" style="text-transform:uppercase">
        <button type="submit">Axtar</button>
      </form>
    ` : `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="edv">
        <input type="hidden" name="mode" value="tin">
        <input name="tin" placeholder="VÖEN daxil edin..." value="${esc(tin)}" maxlength="10">
        <button type="submit">Axtar</button>
      </form>
    `}

    ${edvResults.length
      ? `<div class="count">${edvResults.length} nəticə</div>${edvResults.map(edvCard).join('')}`
      : ((edvMode === 'tin' && tin) || (edvMode === 'name' && firstName && lastName && patronymic)) && !error
      ? (edvMode === 'tin' ? `<div class="msg err">[${esc(tin)}] - Heç bir nəticə tapılmadı.</div>` : `<div class="msg err">[${esc(lastName + ' ' + firstName + ' ' + patronymic)}] - Heç bir nəticə tapılmadı.</div>`)
      : ''}
  ` : ''}

  ${page === 'voem' ? `
    <form method="GET" class="search-form three">
      <input type="hidden" name="page" value="voem">
      <input name="q" placeholder="VÖEN və ya ad daxil edin..." value="${esc(q)}" style="text-transform:uppercase;letter-spacing:.08em">
      <input name="vp" placeholder="SƏHİFƏ № (məs: 357)" value="${esc(voemPage || '357')}">
      <button type="submit">Axtar</button>
    </form>
    ${voemResults.length
      ? `<div class="count">İstehsal fəaliyyəti ilə məşğul olan vergi ödəyiciləri barədə məlumatlar<br>${voemResults.length} nəticə — "${esc(q)}"</div>${voemResults.map(voemCard).join('')}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}
  ${page === 'tel' ? `
    <div class="subtabs no-print">
      <a class="${provider === 'azeurotel' ? 'active' : ''}" href="/?page=tel&provider=azeurotel">AzEuroTel</a>
      <a class="${provider === 'aztelekom' ? 'active' : ''}" href="/?page=tel&provider=aztelekom">Aztelekom</a>
      <a class="${provider === 'transeurocom' ? 'active' : ''}" href="/?page=tel&provider=transeurocom">TransEuroCom</a>
      <a class="${provider === 'ultel' ? 'active' : ''}" href="/?page=tel&provider=ultel">Ultel</a>
    </div>

    ${['aztelekom','transeurocom','azeurotel'].includes(provider) ? `
      <form method="GET" class="search-form three">
        <input type="hidden" name="page" value="tel">
        <input type="hidden" name="provider" value="${esc(provider)}">
        <input name="city" placeholder="ŞƏHƏR KODU (məs: 12)" value="${esc(city)}">
        <input name="number" placeholder="NÖMRƏ (məs: 5618225)" value="${esc(number)}">
        <button type="submit">Axtar</button>
      </form>
      ${telResult ? telecomCard(telResult, city, number, provider) : city && number && !error ? `<div class="msg err">[${esc(city + '-' + number)}] - Heç bir nəticə tapılmadı.</div>` : ''}
    ` : provider === 'ultel' ? `
      <form method="GET" class="search-form three">
        <input type="hidden" name="page" value="tel">
        <input type="hidden" name="provider" value="ultel">
        <input name="number" placeholder="TELEFON NÖMRƏSİ" value="${esc(number)}">
        <button type="submit">Axtar</button>
      </form>
      ${telResult ? telecomCard(telResult, 'Ultel', number, provider) : number && !error ? `<div class="msg err">[${esc(number)}] - Heç bir nəticə tapılmadı.</div>` : ''}
    ` : `<div class="msg warn">${esc(provider)} sub-tabı hazırdır. API məlumatını göndərəndə qoşarıq.</div>`}
  ` : ''}

  ${page === 'b2b' ? `
    <div class="subtabs no-print">
      <a class="${b2bMode === 'company' ? 'active' : ''}" href="/?page=b2b&b2bMode=company">Şirkət</a>
      <a class="${b2bMode === 'people' ? 'active' : ''}" href="/?page=b2b&b2bMode=people">İnsanlar</a>
      <a class="${b2bMode === 'voen' ? 'active' : ''}" href="/?page=b2b&b2bMode=voen">VÖEN</a>
    </div>

    ${b2bMode === 'people' ? `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="b2b">
        <input type="hidden" name="b2bMode" value="people">
        <input name="b2bName" placeholder="Soyad ad ata adı" value="${esc(b2bName || [b2bLastName, b2bFirstName, b2bPatronymic].filter(Boolean).join(' '))}">
        <button type="submit">Axtar</button>
      </form>
      ${b2bResult ? b2bPeopleCard(b2bResult) : (b2bId || b2bName || b2bLastName || b2bFirstName || b2bPatronymic) && !error ? `<div class="msg err">[${esc(b2bName || (b2bLastName + ' ' + b2bFirstName + ' ' + b2bPatronymic))}] - Heç bir nəticə tapılmadı.</div>` : ''}
    ` : b2bMode === 'voen' ? `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="b2b">
        <input type="hidden" name="b2bMode" value="voen">
        <input name="b2bVoen" placeholder="VÖEN (10 rəqəm)" value="${esc(b2bVoen)}" maxlength="10" style="letter-spacing:.08em">
        <button type="submit">Axtar</button>
      </form>
      ${b2bResult ? b2bPeopleCard(b2bResult) : b2bVoen && !error ? `<div class="msg err">[${esc(b2bVoen)}] - Heç bir nəticə tapılmadı.</div>` : ''}
    ` : `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="b2b">
        <input type="hidden" name="b2bMode" value="company">
        <input name="b2bCompany" placeholder="ŞİRKƏT ADI" value="${esc(b2bCompany)}" style="text-transform:uppercase;letter-spacing:.08em">
        <button type="submit">Axtar</button>
      </form>
      ${b2bCompanyResult ? b2bCompanyCard(b2bCompanyResult) : b2bCompany && !error ? `<div class="msg err">[${esc(b2bCompany)}] - Heç bir nəticə tapılmadı.</div>` : ''}
    `}
  ` : ''}

  ${page === 'msk' ? `
    <div class="subtabs no-print">
      <a class="${mskSub !== 'unvan' && mskSub !== 'secici' ? 'active' : ''}" href="/?page=msk">Ad-soyad</a>
      <a class="${mskSub === 'unvan' ? 'active' : ''}" href="/?page=msk&mskSub=unvan">ÜNVAN</a>
      <a class="${mskSub === 'secici' ? 'active' : ''}" href="/?page=msk&mskSub=secici">SEÇİCİ</a>
      <a class="${mskSub === 'secici-stat' ? 'active' : ''}" href="/?page=msk&mskSub=secici-stat">SEÇİCİ STAT</a>
      <a class="${mskSub === 'terkib' ? 'active' : ''}" href="/?page=msk&mskSub=terkib">TƏRKİB</a>
    </div>

    ${mskSub === 'secici-stat' ? votersStatsHtml() : mskSub === 'terkib' ? `      <div class="tab-info">Seçki dairə və məntəqələrinin tərkibi (DSK / MnSK). Ad-soyad ilə axtar, və ya dairə nömrəsini (1–125) seç.</div>
      <form method="GET" action="/" class="search-form three">
        <input type="hidden" name="page" value="msk">
        <input type="hidden" name="mskSub" value="terkib">
        <input name="q" placeholder="SOYAD AD ATA ADI" value="${esc(mskSeciciQ)}" style="text-transform:uppercase;letter-spacing:.06em">
        <input name="daire" placeholder="Dairə №" value="${esc(mskSeciciDaire)}">
        <input name="menteqe" placeholder="Məntəqə №" value="${esc(mskSeciciMenteqe)}">
        <button type="submit">Axtar</button>
      </form>
      ${mskSeciciQ
        ? `<div class="msg ${terkibResults.length ? 'ok' : 'err'}">${terkibResults.length ? esc(terkibMessage) : `[${esc(mskSeciciQ)}] - Heç bir nəticə tapılmadı.`}</div>${terkibResults.map(terkibSearchRow).join('')}`
        : mskSeciciDaire
          ? `
            <div class="terkib-nav"><span class="terkib-nav-label">Dairəni seçin:</span>${Array.from({length:125},(_,i)=>i+1).map(n=>`<a class="${String(n)===String(mskSeciciDaire)?'cur':''}" href="/?page=msk&mskSub=terkib&daire=${n}">${n}</a>`).join('')}</div>
            ${terkibMenteqeList.length ? `<div class="terkib-nav"><span class="terkib-nav-label">Məntəqə seçin:</span><a class="${!mskSeciciMenteqe?'cur':''}" href="/?page=msk&mskSub=terkib&daire=${esc(mskSeciciDaire)}">DSK</a>${terkibMenteqeList.map(m=>`<a class="${String(m)===String(mskSeciciMenteqe)?'cur':''}" href="/?page=msk&mskSub=terkib&daire=${esc(mskSeciciDaire)}&menteqe=${m}">${m}</a>`).join('')}</div>` : ''}
            ${terkibResults.length ? terkibDaireRender(terkibResults) : `<div class="msg err">[Dairə ${esc(mskSeciciDaire)}${mskSeciciMenteqe ? ' - Məntəqə ' + esc(mskSeciciMenteqe) : ''}] - Heç bir nəticə tapılmadı.</div>`}`
          : `<div class="msg warn">Ad-soyad yazın və ya dairə nömrəsini (1–125) seçin.</div><div class="terkib-nav"><span class="terkib-nav-label">Dairəni seçin:</span>${Array.from({length:125},(_,i)=>i+1).map(n=>`<a href="/?page=msk&mskSub=terkib&daire=${n}">${n}</a>`).join('')}</div>`}
` : mskSub === 'unvan' ? `
      <div class="tab-info">MSK ünvan axtarışı GCP relay vasitəsilə işləyir. Əvvəl rayon/şəhər, sonra küçə/kənd/prospekt, sonra ev seçilir.</div>
      <div class="msk-unvan-shell" id="mskUnvanApp">
        <div class="msk-unvan-row">
          <select id="mskUvRayon" class="msk-unvan-select"><option value="">Rayon / şəhər seç</option></select>
          <select id="mskUvStreet" class="msk-unvan-select" disabled><option value="">Əvvəl rayon seç</option></select>
          <select id="mskUvHouse" class="msk-unvan-select" disabled><option value="">Əvvəl küçə seç</option></select>
          <button type="button" id="mskUvBtn">Axtar</button>
        </div>
        <div id="mskUvStatus" class="msg warn">Rayon/şəhər seçin.</div>
        <div id="mskUvResult"></div>
      </div>
    ` : mskSub === 'secici' ? `
      <div class="tab-info">MSK-nın 2026-cı il üçün seçicilərin siyahısı.</div>
      <div class="msk-secici-shell" id="mskSeciciApp">
        <form method="GET" action="/" class="search-form msk-secici-form" id="mskSeciciForm">
          <input type="hidden" name="page" value="msk">
          <input type="hidden" name="mskSub" value="secici">
          <input id="mskSeciciQ" name="q" placeholder="AD, SOYAD və ATA ADI" value="${esc(mskSeciciQ)}" style="text-transform:uppercase;letter-spacing:.06em">
          <input id="mskSeciciDaire" name="daire" placeholder="Dairə" value="${esc(mskSeciciDaire)}">
          <input id="mskSeciciMenteqe" name="menteqe" placeholder="Məntəqə" value="${esc(mskSeciciMenteqe)}">
          <input id="mskSeciciBirth" name="dogum_ili" placeholder="Doğum ili" value="${esc(mskSeciciBirth)}">
          <button type="submit">Axtar</button>
        </form>
        ${mskSeciciQ || mskSeciciDaire || mskSeciciMenteqe || mskSeciciBirth
          ? `<div id="mskSeciciStatus" class="msg ${mskSeciciResults.length ? 'ok' : 'err'}">${mskSeciciResults.length ? esc(mskSeciciMessage) : `[${esc(mskSeciciQ || mskSeciciDaire + '-' + mskSeciciMenteqe || mskSeciciBirth)}] - Heç bir nəticə tapılmadı.`}</div>`
          : `<div id="mskSeciciStatus" class="msg warn">Axtarış üçün ad/ünvan yazın və ya dairə/məntəqə/doğum ili seçin.</div>`}
        <div id="mskSeciciResult">${mskSeciciResults.map(mskSeciciCard).join('')}</div>
      </div>
    ` : `
      <form method="GET" class="search-form three">
        <input type="hidden" name="page" value="msk">
        <input name="mskLastName" placeholder="SOYAD" value="${esc(mskLastName)}" style="text-transform:uppercase">
        <input name="mskFirstName" placeholder="AD" value="${esc(mskFirstName)}" style="text-transform:uppercase">
        <input name="mskPatronymic" placeholder="ATA ADI" value="${esc(mskPatronymic)}" style="text-transform:uppercase">
        <input name="mskBirth" placeholder="DOĞUM TARİXİ: 20.04.1976" value="${esc(mskBirth)}">
        <select name="mskGender" class="selectbox">
          <option value="" ${!mskGender ? 'selected' : ''}>CİNS</option>
          <option value="Kişi" ${mskGender === 'Kişi' ? 'selected' : ''}>Kişi</option>
          <option value="Qadın" ${mskGender === 'Qadın' ? 'selected' : ''}>Qadın</option>
        </select>
        <button type="submit">Axtar</button>
      </form>

      ${mskResults.length
        ? `<div class="count">${mskResults.length} nəticə</div>
           ${mskResults.map(mskCard).join('')}
           <div class="actions extra-actions" style="margin-top:8px">
             <a href="/?page=mnb&q=${encodeURIComponent(mskPersonQ)}">📱 MNB-də axtar →</a>
           </div>`
        : mskLastName && !error
          ? `<div class="msg err">[${esc(mskPersonQ)}] - Heç bir nəticə tapılmadı.</div>
             <div class="actions extra-actions">
               ${personCrossLinks(mskPersonQ)}
               <a href="/?page=mnb&q=${encodeURIComponent(mskPersonQ)}">📱 MNB →</a>
             </div>`
          : ''}
      ${error && error.includes('doğum tarixini tələb edir')
        ? `<div class="msg warn">${esc(error)}</div>
           <div class="actions extra-actions">
             ${personCrossLinks(mskPersonQ)}
             <a href="/?page=mnb&q=${encodeURIComponent(mskPersonQ)}">📱 MNB →</a>
           </div>`
        : ''}
    `}
  ` : ''}

  ${page === 'mnb' ? `
    <form method="GET" class="search-form">
      <input type="hidden" name="page" value="mnb">
      <input name="q" placeholder="MNB BAZASINDA AXTAR" value="${esc(q)}" style="text-transform:uppercase;letter-spacing:.08em" oninput="cleanDigitsOnlyInput(this)" onpaste="setTimeout(() => cleanDigitsOnlyInput(this), 0)">
      <button type="submit">Axtar</button>
    </form>
    <div id="liveZone">
    ${mnbResults.length
      ? `<div class="count">${mnbResults.length} nəticə — "${esc(q)}"</div>${mnbResults.map(mnbCard).join('')}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
    </div>
    ${!q ? mnbStatsCard() : ''}
  ` : ''}
    
  ${page === 'vergi' ? `
    <form method="GET" class="search-form">
      <input type="hidden" name="page" value="vergi">
      <input name="q" placeholder="VÖEN və ya AD daxil edin..." value="${esc(q)}" style="text-transform:uppercase">
      <button type="submit">Axtar</button>
    </form>
    ${!q ? vergiStatsCard() : ''}

    <div id="liveZone">
    ${(typeof vergiResults !== 'undefined' && vergiResults.length > 0) ? `
      <div class="count">${vergiResults.length} nəticə tapıldı</div>
      ${vergiResults.map(r => {
        const cleanTemsilci = String(r.temsilci || '').replace(/\b(OĞLU|OGLU|OGHLU|QIZI|KYZY|oğlu|qızı)\b/gi, ' ').replace(/\s+/g, ' ').trim();
        const b2bPersonName = cleanTemsilci || r.temsilci || '';
        return `
        <div class="card">
          <div class="card-head">
            <div class="logo">⚖️</div>
            <div><h2>${esc(r.ad)}</h2><p>VÖEN: ${esc(r.voen)}</p></div>
          </div>
          <table>
            <tr><td class="label">Təmsilçi</td><td class="value">${esc(r.temsilci)}</td></tr>
            <tr><td class="label">Təsisçilər</td><td class="value">${esc(r.tesisciler)}</td></tr>
            <tr><td class="label">Ünvan</td><td class="value">${esc(r.unvan)}</td></tr>
            <tr><td class="label">Qeydiyyat</td><td class="value">${esc(r.tarix)}</td></tr>
          </table>
          <div class="actions">
             ${tinCrossLinks(r.voen, { exVergi: true, tdrQuery: r.ad })}
             ${b2bPersonName ? `<a href="/?page=b2b&b2bMode=people&b2bName=${encodeURIComponent(b2bPersonName)}">🌐 B2B</a>` : ''}
             ${cleanTemsilci ? `<a href="/?page=dnn&q=${encodeURIComponent(cleanTemsilci)}">🚗 DNN</a>` : ''}
             <button onclick="printCard(this)">🖨️ PDF</button>
             ${cardToolbar(r.voen || r.ad, r.ad)}
          </div>
          ${cardNote(r.voen || r.ad)}
        </div>
      `;}).join('')}
    ` : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
    </div>
  ` : ''}


  ${page === 'lsnz' ? `
    <form method="GET" class="search-form">
      <input type="hidden" name="page" value="lsnz">
      <input name="q" placeholder="VÖEN daxil edin..." value="${esc(q)}" maxlength="10">
      <button type="submit">Axtar</button>
    </form>

    ${lsnzResults.length
      ? `<div class="count">${lsnzResults.length} nəticə — "${esc(q)}"</div>${lsnzResults.map(lsnzCard).join('')}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}


  ${page === 'tdr' ? `
    <form method="GET" class="search-form three">
      <input type="hidden" name="page" value="tdr">
      <input name="q" placeholder="Şirkət və ya obyekt adı..." value="${esc(q)}">
      <input name="tdrDistrictId" placeholder="Rayon ID: 76" value="${esc(tdrDistrictId || '76')}">
      <button type="submit">Axtar</button>
    </form>

    ${tdrResults.length
      ? `<div class="count">${esc(String(tdrCount || tdrResults.length))} nəticə — "${esc(q)}"</div>${tdrResults.map(tdrCard).join('')}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}


  ${page === 'aleph' ? alephPage() : ''}
  ${page === 'xeber' ? `
    <section class="xeber-panel no-print">
      <div class="xeber-titlebar">
        <div>
          <h1>XƏBƏR monitorinqi</h1>
          <p>FED.az, Yeniavaz, Qaynarinfo, Valyuta.az və İqtisadiyyat.az üzrə tender/satınalma materialları.</p>
        </div>
        <div class="xeber-status">${xeberMessage ? esc(xeberMessage) : 'Hazırdır'}${xeberUpdated ? `<small>Yenilənib: ${esc(xeberUpdated)}</small>` : ''}</div>
      </div>
      <form method="GET" class="xeber-filter">
        <input type="hidden" name="page" value="xeber">
        <input name="xeberQ" placeholder="Açar söz: tender, satınalma, qurum, şirkət..." value="${esc(xeberQ)}">
        <select name="xeberSource" class="selectbox">
          <option value="all" ${xeberSource === 'all' ? 'selected' : ''}>Hamısı</option>
          <option value="fed" ${xeberSource === 'fed' ? 'selected' : ''}>FED.az</option>
          <option value="yeniavaz" ${xeberSource === 'yeniavaz' ? 'selected' : ''}>Yeniavaz</option>
          <option value="qaynarinfo" ${xeberSource === 'qaynarinfo' ? 'selected' : ''}>Qaynarinfo</option>
          <option value="valyuta" ${xeberSource === 'valyuta' ? 'selected' : ''}>Valyuta.az</option>
          <option value="iqtisadiyyat" ${xeberSource === 'iqtisadiyyat' ? 'selected' : ''}>İqtisadiyyat.az</option>
        </select>
        <button type="submit">Axtar</button>
        <a class="xeber-refresh" href="/?page=xeber&refresh=1${xeberQ ? '&xeberQ=' + encodeURIComponent(xeberQ) : ''}${xeberSource && xeberSource !== 'all' ? '&xeberSource=' + encodeURIComponent(xeberSource) : ''}">Yenilə</a>
      </form>
    </section>

    ${xeberResults.length
      ? `<div class="xeber-grid" id="xeberGrid">${xeberResults.map(xeberCard).join('')}</div><div class="xeber-pager" id="xeberPager"></div><style>.xeber-pager{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:26px 0 10px}.xeber-pagebtn{min-width:38px;height:38px;padding:0 12px;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:9px;cursor:pointer;font-size:15px;font-weight:700}.xeber-pagebtn:hover:not(:disabled){border-color:var(--blue);color:var(--blue)}.xeber-pagebtn.active{background:var(--blue);color:#fff;border-color:var(--blue)}.xeber-pagebtn:disabled{opacity:.4;cursor:default}.xeber-pagedots{align-self:center;color:var(--muted);padding:0 4px}</style><script>(function(){var PER=15;var grid=document.getElementById('xeberGrid');var pager=document.getElementById('xeberPager');if(!grid)return;var cards=[].slice.call(grid.children);var pages=Math.max(1,Math.ceil(cards.length/PER));var cur=1;function dots(){var s=document.createElement('span');s.className='xeber-pagedots';s.textContent='…';return s;}function btn(t,p,o){o=o||{};var b=document.createElement('button');b.type='button';b.textContent=t;b.className='xeber-pagebtn'+(o.active?' active':'');if(o.disabled){b.disabled=true;}else{b.addEventListener('click',function(){show(p);});}return b;}function build(){pager.innerHTML='';if(pages<=1)return;pager.appendChild(btn('‹',cur-1,{disabled:cur===1}));var a=Math.max(1,cur-2),e=Math.min(pages,cur+2);if(a>1){pager.appendChild(btn('1',1,{active:cur===1}));if(a>2)pager.appendChild(dots());}for(var p=a;p<=e;p++)pager.appendChild(btn(String(p),p,{active:p===cur}));if(e<pages){if(e<pages-1)pager.appendChild(dots());pager.appendChild(btn(String(pages),pages,{active:cur===pages}));}pager.appendChild(btn('›',cur+1,{disabled:cur===pages}));}function show(p){cur=Math.min(Math.max(1,p),pages);cards.forEach(function(c,i){c.style.display=(Math.floor(i/PER)+1===cur)?'':'none';});build();try{window.scrollTo({top:(grid.getBoundingClientRect().top+window.pageYOffset)-90,behavior:'smooth'});}catch(_){}}show(1);})();</script>`
      : `<div class="msg warn">${xeberMessage ? esc(xeberMessage) : 'Xəbər siyahısı boşdur. Backend faylı yüklənməyibsə və ya saytlar cavab vermirsə: /var/www/bazalar/xeber-api.php'}</div>`}
  ` : ''}


  ${page === 'tender' ? `
    <div class="subtabs no-print">
      <a class="${!url_tenderMode || url_tenderMode === 'search' ? 'active' : ''}" href="/?page=tender">Axtarış</a>
      <a class="${url_tenderMode === 'stats' ? 'active' : ''}" href="/?page=tender&tenderMode=stats">Statistika</a>
    </div>

    ${url_tenderMode !== 'stats' ? `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="tender">
        <input name="q" placeholder="Satınalan təşkilat, podratçı, müqavilə predmeti..." value="${esc(q)}">
        <button type="submit">Axtar</button>
      </form>
      <div id="liveZone">
      ${tenderResults.length
        ? `<div class="count">${tenderTotal} nəticə — "${esc(tenderVoenName || q)}"</div>${tenderResults.map(tenderLocalCard).join('')}`
        : q && !error && /^\d{10}$/.test(q) && tenderVoenFound
          ? `<div class="msg err">[${esc(tenderVoenName)} / ${esc(q)}] - Heç bir nəticə tapılmadı.</div>`
        : q && !error && /^\d{10}$/.test(q) && !tenderVoenFound
          ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>`
        : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>`
        : '<div class="msg warn">Satınalan təşkilat, podratçı, müqavilə predmeti üzrə axtar.</div>'}
      </div>
    ` : ''}

    ${url_tenderMode === 'stats' && tenderStats ? tenderStatsCard(tenderStats)
      : url_tenderMode === 'stats' && error ? ''
      : url_tenderMode === 'stats' ? '<div class="msg warn">Statistika yüklənir...</div>' : ''}
  ` : ''}


  ${page === 'etndr' ? `
    <div class="etndr-proxy-wrap no-print">
      <button type="button" class="tab etndr-proxy-toggle" id="etProxyToggle">⚙️ Proxy yoxlama bölməsini aç/bağla</button>
      <div class="etndr-proxy" id="etProxyBox" hidden>
        <input id="etProxy" placeholder="Opsional proxy. Boş saxla = sistem default Froxy proxy rotasiyasını işlətsin" spellcheck="false" autocomplete="off">
        <button type="button" class="tab" id="etProxyTest">Proxy yoxla</button>
        <span id="etProxyResult" class="etndr-status"></span>
      </div>
    </div>

    <form id="etForm" class="search-form etndr-form">
      <input id="et_SupplierVoen" placeholder="VÖEN" inputmode="numeric">
      <input id="et_supplierName" placeholder="Şirkət / təchizatçı adı">
      <input id="et_Keyword" placeholder="Açar söz">
      <input id="et_EventName" placeholder="Satınalma adı">
      <input id="et_AmountFrom" placeholder="Məbləğdən" inputmode="decimal">
      <input id="et_AmountTo" placeholder="Məbləğə" inputmode="decimal">
      <input id="et_ContractFrom" type="date" title="Müqavilə tarixi (başlanğıc)">
      <input id="et_ContractTo" type="date" title="Müqavilə tarixi (bitiş)">
      <input id="et_PublishFrom" type="date" title="Dərc tarixi (başlanğıc)">
      <input id="et_PublishTo" type="date" title="Dərc tarixi (bitiş)">
      <select id="et_PageSize" class="selectbox" title="Sətir sayı">
        <option value="15">15 sətir (API maksimumu)</option>
        <option value="10">10 sətir</option>
        <option value="5">5 sətir</option>
      </select>
      <button type="submit" id="etSearchBtn">Axtar</button>
    </form>

    <div id="etStatus" class="etndr-status">Hazırdır</div>
    <div id="etResults"><div class="msg warn">VÖEN, şirkət adı, açar söz, məbləğ və ya tarix üzrə dövlət müqavilələrini axtar (etender.gov.az).</div></div>
    <div id="etPager" class="etndr-pager no-print"></div>

    <script>
    (function(){
      // muntezir HTTPS işləyir → brauzer birbaşa qoşulur (Cloudflare ayağı yox → 502/525 yox).
      var RELAY = 'https://muntezir.de/bazalar/etender-api.php';
      var PROXY_KEY = 'etndr_proxy';
      var proxyToggle = document.getElementById('etProxyToggle');
      var proxyBox = document.getElementById('etProxyBox');
      var proxyInput = document.getElementById('etProxy');
      var proxyTestBtn = document.getElementById('etProxyTest');
      var proxyResult = document.getElementById('etProxyResult');
      var form = document.getElementById('etForm');
      var statusEl = document.getElementById('etStatus');
      var resultsEl = document.getElementById('etResults');
      var pagerEl = document.getElementById('etPager');
      var searchBtn = document.getElementById('etSearchBtn');
      var curPage = 1;

      proxyToggle.addEventListener('click', function(){
        proxyBox.hidden = !proxyBox.hidden;
        proxyToggle.textContent = proxyBox.hidden ? '⚙️ Proxy yoxlama bölməsini aç/bağla' : '⚙️ Proxy yoxlama bölməsini gizlət';
      });

      proxyInput.value = localStorage.getItem(PROXY_KEY) || '';
      proxyInput.addEventListener('input', function(){
        var v = proxyInput.value.trim();
        if(v) localStorage.setItem(PROXY_KEY, v);
        else localStorage.removeItem(PROXY_KEY);
      });

      function ec(s){
        return String(s == null ? '' : s)
          .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;')
          .split('"').join('&quot;').split("'").join('&#039;');
      }
      function fdate(v){
        if(!v) return '';
        var d = String(v).slice(0,10);
        if(/^\\d{4}-\\d{2}-\\d{2}$/.test(d)) return d.split('-').reverse().join('.');
        return ec(v);
      }
      function fmoney(a, cur){
        if(a==null || a==='') return '';
        var n = Number(a);
        if(!isFinite(n)) return ec(a);
        return n.toLocaleString('az-AZ',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ' + ec(cur||'AZN');
      }
      var lastTotalItems = 0, lastTotalPages = 1;
      function yearOf(r){
        var y = parseInt(String(r.contractDate || r.issueDate || '').slice(0,4), 10);
        return (y >= 1990 && y <= 2100) ? String(y) : '';
      }
      function moneyWords(amount){
        var cents = Math.round(Number(amount) * 100);
        if(!isFinite(cents) || cents < 0) return '';
        var qep = cents % 100;
        var man = Math.floor(cents / 100);
        var mlrd = Math.floor(man / 1e9);
        var mln  = Math.floor(man % 1e9 / 1e6);
        var min  = Math.floor(man % 1e6 / 1e3);
        var qal  = man % 1000;
        var parts = [];
        if(mlrd) parts.push(mlrd + ' milyard');
        if(mln)  parts.push(mln + ' milyon');
        if(min)  parts.push(min + ' min');
        if(qal || !parts.length) parts.push(String(qal));
        var str = parts.join(' ') + ' manat';
        if(qep) str += ' ' + qep + ' qəpik';
        return str;
      }
      function wordsSpan(amount, cur){
        if(cur && cur !== 'AZN') return '';
        var w = moneyWords(amount);
        return w ? ' <span style="color:var(--muted);font-size:12px;font-weight:600">(' + w + ')</span>' : '';
      }
      function sumParts(sums, withWords){
        var keys = Object.keys(sums).sort();
        var out = [];
        for(var i=0;i<keys.length;i++){
          out.push('<b>' + fmoney(sums[keys[i]], keys[i]) + '</b>' + (withWords ? wordsSpan(sums[keys[i]], keys[i]) : ''));
        }
        return out.length ? out.join(' + ') : '—';
      }
      function statsHtml(items, scopeNote, showAllBtn){
        if(!items.length) return '';
        var byYear = {}, noDate = null;
        items.forEach(function(r){
          var y = yearOf(r);
          var cur = r.currency || 'AZN';
          var n = Number(r.amount);
          var bucket;
          if(y){ if(!byYear[y]) byYear[y] = {count:0, sums:{}}; bucket = byYear[y]; }
          else { if(!noDate) noDate = {count:0, sums:{}}; bucket = noDate; }
          bucket.count++;
          if(isFinite(n)) bucket.sums[cur] = (bucket.sums[cur]||0) + n;
        });
        var years = Object.keys(byYear).sort().reverse();
        var totalCount = 0, totalSums = {};
        function addTotals(e){
          totalCount += e.count;
          Object.keys(e.sums).forEach(function(c){ totalSums[c] = (totalSums[c]||0) + e.sums[c]; });
        }
        var rows = '';
        years.forEach(function(y){
          var e = byYear[y]; addTotals(e);
          rows += '<tr><td class="label">' + y + '</td><td class="value">' + e.count + ' müqavilə — ' + sumParts(e.sums, true) + '</td></tr>';
        });
        if(noDate){
          addTotals(noDate);
          rows += '<tr><td class="label">Tarixsiz</td><td class="value">' + noDate.count + ' müqavilə — ' + sumParts(noDate.sums, true) + '</td></tr>';
        }
        rows += '<tr><td class="label" style="color:var(--green)">CƏMİ</td><td class="value"><b>' + totalCount + ' müqavilə — ' + sumParts(totalSums, true) + '</b></td></tr>';
        return '<div class="card" id="etStats"><div class="card-head">' +
          '<div class="logo" style="font-size:16px;font-weight:900;background:linear-gradient(135deg,#14532d,#16a34a)">Σ</div>' +
          '<div><h2>İllər üzrə statistika</h2><p>' + ec(scopeNote) + '</p></div>' +
          '<div class="status">' + (Object.keys(totalSums).length ? '<span class="badge good">' + sumParts(totalSums).split('<b>').join('').split('</b>').join('') + '</span>' : '') + '</div></div>' +
          '<table>' + rows + '</table>' +
          (showAllBtn ? '<div class="actions no-print"><button type="button" id="etFetchAll">Σ Bütün nəticələri topla (' + lastTotalItems + ' müqavilə)</button></div>' : '') +
          '</div>';
      }
      function fetchAllStats(){
        var MAX_PAGES = 50; // 50×15 = maks. 750 müqavilə
        var btn = document.getElementById('etFetchAll');
        var pages = Math.max(1, Math.min(Math.ceil(lastTotalItems / 15), MAX_PAGES));
        if(btn) btn.disabled = true;
        var all = [], done = 0, queue = [], failedErr = null;
        for(var i = 1; i <= pages; i++) queue.push(i);
        function pull(){
          if(failedErr || !queue.length) return Promise.resolve();
          var pageNo = queue.shift();
          var params = buildParams();
          params.set('PageSize', '15');
          params.set('PageNumber', String(pageNo));
          return fetch(RELAY + '?' + params.toString())
            .then(function(r){ return r.text(); })
            .then(function(t){
              var d; try { d = JSON.parse(t); } catch(e){ throw new Error('Cavab JSON deyil'); }
              if(d && d.ok === false) throw new Error(d.error || d.message || 'Naməlum xəta');
              all = all.concat(d.items || (Array.isArray(d) ? d : []));
              done++;
              if(btn) btn.textContent = 'Yığılır… ' + done + '/' + pages + ' səhifə';
            })
            .catch(function(e){ failedErr = e; })
            .then(pull);
        }
        Promise.all([pull(), pull(), pull()]).then(function(){
          if(failedErr){
            if(btn){ btn.disabled = false; btn.textContent = '⚠️ Alınmadı (' + failedErr.message + ') — yenidən cəhd et'; }
            return;
          }
          var note = 'Bütün nəticələr üzrə — ' + all.length + ' müqavilə' +
            (lastTotalItems > MAX_PAGES * 15 ? ' (ilk ' + (MAX_PAGES * 15) + ' ilə məhdudlaşdı)' : '');
          var st = document.getElementById('etStats');
          if(st) st.outerHTML = statsHtml(all, note, false);
        });
      }
      function toIso(v){
        if(!v) return '';
        if(/^\\d{4}-\\d{2}-\\d{2}$/.test(v)) return new Date(v + 'T00:00:00.000Z').toISOString();
        return v;
      }
      function rowHtml(label, val){
        if(val===undefined || val===null || val==='' || val==='<b></b>') return '';
        return '<tr><td class="label">' + ec(label) + '</td><td class="value">' + val + '</td></tr>';
      }
      function cardHtml(r){
        var voen = String(r.supplierOrganizationVoen || '').trim();
        var uv = encodeURIComponent(voen);
        var actions = '<div class="actions no-print">' +
          (voen ? '<a href="/?page=history&tin=' + uv + '">📋 Tarixçə</a>' +
                  '<a href="/?page=tin&tin=' + uv + '">🔎 VÖEN</a>' : '') +
          '<button onclick="printCard(this)">🖨️ PDF çap et</button>' +
          '</div>';
        return '<div class="card"><div class="card-head">' +
          '<div class="logo" style="font-size:10px;font-weight:900;background:linear-gradient(135deg,#1e3a5f,#2563eb)">ETNDR</div>' +
          '<div><h2>' + ec(r.supplierOrganizationName || 'Müqavilə') + '</h2>' +
          '<p>' + ec(r.tenderName || 'Dövlət satınalması müqaviləsi') + '</p></div>' +
          '<div class="status">' + (r.amount != null ? '<span class="badge good">' + fmoney(r.amount, r.currency) + '</span>' : '') + '</div></div>' +
          '<table>' +
          rowHtml('Satınalan təşkilat', ec(r.buyerOrganizationName||'')) +
          rowHtml('Təchizatçı', ec(r.supplierOrganizationName||'')) +
          rowHtml('Təchizatçı VÖEN', ec(voen)) +
          rowHtml('Müqavilə məbləği', '<b>' + fmoney(r.amount, r.currency) + '</b>' + wordsSpan(r.amount, r.currency)) +
          rowHtml('Tenderin adı', ec(r.tenderName||'')) +
          rowHtml('Müqavilə tarixi', fdate(r.contractDate)) +
          rowHtml('Bitmə tarixi', fdate(r.expireDate)) +
          rowHtml('Dərc tarixi', fdate(r.issueDate)) +
          rowHtml('Tip', ec(r.tenderType||'')) +
          rowHtml('Qeyd', ec(r.comment||'')) +
          '</table>' + actions + '</div>';
      }
      function buildParams(){
        var p = new URLSearchParams();
        var v;
        v = document.getElementById('et_SupplierVoen').value.trim(); if(v) p.set('SupplierVoen', v);
        v = document.getElementById('et_supplierName').value.trim(); if(v) p.set('supplierName', v);
        v = document.getElementById('et_Keyword').value.trim();      if(v) p.set('Keyword', v);
        v = document.getElementById('et_EventName').value.trim();    if(v) p.set('EventName', v);
        v = document.getElementById('et_AmountFrom').value.trim();   if(v) p.set('ContractAmountFrom', v);
        v = document.getElementById('et_AmountTo').value.trim();     if(v) p.set('ContractAmountTo', v);
        v = document.getElementById('et_ContractFrom').value.trim(); if(v) p.set('ContractDateFrom', toIso(v));
        v = document.getElementById('et_ContractTo').value.trim();   if(v) p.set('ContractDateTo', toIso(v));
        v = document.getElementById('et_PublishFrom').value.trim();  if(v) p.set('PublishDateFrom', toIso(v));
        v = document.getElementById('et_PublishTo').value.trim();    if(v) p.set('PublishDateTo', toIso(v));
        p.set('PageSize', document.getElementById('et_PageSize').value || '15');
        p.set('PageNumber', String(curPage));
        var px = proxyInput.value.trim();
        if(px) p.set('proxy', px);
        return p;
      }
      function setStatus(msg, cls){
        statusEl.textContent = msg;
        statusEl.className = 'etndr-status' + (cls ? ' ' + cls : '');
      }
      function renderPager(d){
        var tp = Number(d.totalPages || 1);
        var cp = Number(d.currentPage || curPage);
        if(tp <= 1){ pagerEl.innerHTML = ''; return; }
        var html = '';
        if(cp > 1) html += '<button type="button" class="tab" data-go="' + (cp-1) + '">← Geri</button>';
        html += '<span class="count" style="margin:0">Səhifə ' + cp + ' / ' + tp + '</span>';
        if(cp < tp) html += '<button type="button" class="tab" data-go="' + (cp+1) + '">Növbəti →</button>';
        pagerEl.innerHTML = html;
        Array.prototype.forEach.call(pagerEl.querySelectorAll('[data-go]'), function(btn){
          btn.addEventListener('click', function(){ curPage = Number(btn.getAttribute('data-go')); doSearch(); });
        });
      }
      function doSearch(){
        var params = buildParams();
        setStatus('Sorğu göndərilir…');
        searchBtn.disabled = true;
        pagerEl.innerHTML = '';
        fetch(RELAY + '?' + params.toString())
          .then(function(r){ return r.text(); })
          .then(function(text){
            var data;
            try { data = JSON.parse(text); }
            catch(e){ throw new Error('Cavab JSON deyil: ' + text.slice(0,160)); }
            if(data && data.ok === false) throw new Error(data.error || data.message || 'Naməlum xəta');
            var items = data.items || (Array.isArray(data) ? data : []);
            var total = (data.totalItems != null) ? data.totalItems : items.length;
            if(!items.length){
              var searchParams = buildParams().toString();
              var searchValue = new URLSearchParams(searchParams).get('SupplierVoen') || new URLSearchParams(searchParams).get('supplierName') || new URLSearchParams(searchParams).get('Keyword') || 'sorğu';
              resultsEl.innerHTML = '<div class="msg err">[' + ec(searchValue) + '] - Heç bir nəticə tapılmadı.</div>';
              setStatus('Cavab alındı');
              return;
            }
            lastTotalItems = Number(total) || items.length;
            lastTotalPages = Number(data.totalPages || 1);
            var head = '<div class="count">' + ec(String(total)) + ' nəticə' +
              (lastTotalPages > 1 ? ' — səhifə ' + Number(data.currentPage||curPage) + '/' + lastTotalPages : '') +
              '</div>';
            var scope = lastTotalPages > 1
              ? 'Bu səhifədəki ' + items.length + ' müqavilə üzrə (tam cəm üçün aşağıdakı düyməni basın)'
              : 'Bütün ' + items.length + ' müqavilə üzrə';
            resultsEl.innerHTML = head + statsHtml(items, scope, lastTotalPages > 1) + items.map(cardHtml).join('');
            var ab = document.getElementById('etFetchAll');
            if(ab) ab.addEventListener('click', fetchAllStats);
            renderPager(data);
            setStatus('Cavab alındı');
          })
          .catch(function(err){
            resultsEl.innerHTML = '<div class="msg err">' + ec(err.message) + '</div>';
            setStatus('Xəta: etender cavab vermədi', 'err');
          })
          .then(function(){ searchBtn.disabled = false; });
      }
      form.addEventListener('submit', function(e){ e.preventDefault(); curPage = 1; doSearch(); });

      proxyTestBtn.addEventListener('click', function(){
        var px = proxyInput.value.trim();
        if(px) localStorage.setItem(PROXY_KEY, px);
        else localStorage.removeItem(PROXY_KEY);
        proxyResult.textContent = 'Yoxlanılır…';
        proxyResult.className = 'etndr-status';
        proxyTestBtn.disabled = true;
        var u = RELAY + '?action=test' + (px ? '&proxy=' + encodeURIComponent(px) : '');
        fetch(u).then(function(r){ return r.text(); }).then(function(text){
          var d; try { d = JSON.parse(text); } catch(e){ d = { ok:false, message:'Cavab JSON deyil' }; }
          var ok = d.ok === true;
          proxyResult.textContent = d.message || (ok ? 'İşləyir' : 'İşləmir');
          proxyResult.className = 'etndr-status ' + (ok ? 'ok' : 'err');
        }).catch(function(err){
          proxyResult.textContent = 'Test alınmadı: ' + err.message;
          proxyResult.className = 'etndr-status err';
        }).then(function(){ proxyTestBtn.disabled = false; });
      });
    })();
    </script>
  ` : ''}


  ${page === 'blackbird' ? `
    <div class="osint-nav no-print">
      <div class="osint-group"><span class="osint-glabel">👤 Şəxs & Hesab</span><div class="osint-links">
        <a class="${osintSub === 'bb' ? 'active' : ''}" href="/?page=blackbird&osintSub=bb">BlackBird</a>
        <a class="${osintSub === 'name' ? 'active' : ''}" href="/?page=blackbird&osintSub=name">NAME</a>
        <a class="${osintSub === 'sherlock' ? 'active' : ''}" href="/?page=blackbird&osintSub=sherlock">🔍 Sherlock</a>
        <a class="${osintSub === 'graph' ? 'active' : ''}" href="/?page=blackbird&osintSub=graph">🌐 FB-Graph</a>
      </div></div>
      <div class="osint-group"><span class="osint-glabel">🌍 Coğrafiya & Şəkil</span><div class="osint-links">
        <a class="${osintSub === 'geovlm' ? 'active' : ''}" href="/?page=blackbird&osintSub=geovlm">🌍 GeoVLM</a>
        <a class="${osintSub === 'sclip' ? 'active' : ''}" href="/?page=blackbird&osintSub=sclip">📍 SCLIP</a>
        <a class="${osintSub === 'foto' ? 'active' : ''}" href="/?page=blackbird&osintSub=foto">📷 FOTO</a>
        <a class="${osintSub === 'face' ? 'active' : ''}" href="/?page=blackbird&osintSub=face">🧑 Üztanıma</a>
        <a class="${osintSub === 'xerite' ? 'active' : ''}" href="/?page=blackbird&osintSub=xerite">📍 Xəritə</a>
        <a class="${osintSub === 'sekil' ? 'active' : ''}" href="/?page=blackbird&osintSub=sekil">🖼️ Şəkil</a>
      </div></div>
      <div class="osint-group"><span class="osint-glabel">🌐 Web & Sənəd</span><div class="osint-links">
        <a class="${osintSub === 'domen' ? 'active' : ''}" href="/?page=blackbird&osintSub=domen">🌐 Domen</a>
        <a class="${osintSub === 'arxiv' ? 'active' : ''}" href="/?page=blackbird&osintSub=arxiv">🕰️ Arxiv</a>
        <a class="${osintSub === 'wikipedia' ? 'active' : ''}" href="/?page=blackbird&osintSub=wikipedia">📚 Wiki</a>
      </div></div>
      <div class="osint-group"><span class="osint-glabel">🧰 Alətlər</span><div class="osint-links">
        <a class="${osintSub === 'aletler' ? 'active' : ''}" href="/?page=blackbird&osintSub=aletler">🧰 Alətlər kataloqu</a>
        <a class="${osintSub === 'reclip' ? 'active' : ''}" href="/?page=blackbird&osintSub=reclip">🧭 RECLIP</a>
      </div></div>
    </div>

    ${osintSub === 'domen' ? crtshPage() : ''}
    ${osintSub === 'arxiv' ? waybackPage() : ''}
    ${osintSub === 'sekil' ? imagePage() : ''}
    ${osintSub === 'wikipedia' ? wikipediaPage() : ''}
    ${osintSub === 'xerite' ? nominatimPage() : ''}
    ${osintSub === 'aletler' ? toolsPage() : ''}
    ${osintSub === 'geovlm' ? `
      <div style="max-width:820px">
        <div class="tab-info">🌍 GeoVLM — şəkli yüklə, süni zəka onun harada çəkildiyini (şəhər, region, ölkə, koordinat) təxmin etsin. Sorğu əvvəl Worker-ə gedir, Worker HF Space-dən event_id alır; uzun cavabı brauzer oxuyur.</div>
        <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input type="file" id="gvFile" accept="image/*" style="font-size:14px">
          <button type="button" id="gvBtn" style="background:var(--blue);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Yeri təyin et</button>
        </div>
        <img id="gvPrev" style="display:none;max-width:340px;margin-top:12px;border-radius:10px;border:1px solid var(--border)">
        <div id="gvStatus" style="margin-top:10px;font-size:13px;color:#fbbf24;font-weight:700"></div>
        <div id="gvResult" style="margin-top:14px;white-space:pre-wrap;line-height:1.6"></div>
        <div id="gvMap" style="margin-top:14px"></div>
      </div>
      <script>
      (function(){
        var $=function(id){return document.getElementById(id);};
        var f=$('gvFile'); if(!f) return;
        var curDataUrl='';
        f.addEventListener('change',function(){var file=f.files&&f.files[0];if(!file)return;var rd=new FileReader();rd.onload=function(){curDataUrl=String(rd.result||'');$('gvPrev').src=curDataUrl;$('gvPrev').style.display='block';};rd.readAsDataURL(file);});
        async function readSSE(space,apiName,eventId,onTick){
          var res=await fetch(space+'/gradio_api/call/'+apiName+'/'+encodeURIComponent(eventId));
          if(!res.ok||!res.body)throw new Error('Axın alınmadı ('+res.status+')');
          var reader=res.body.getReader();var dec=new TextDecoder();var buf='';var ev='';
          while(true){var rr=await reader.read();if(rr.done)break;buf+=dec.decode(rr.value,{stream:true});var i;
            while((i=buf.indexOf('\\n'))>=0){var line=buf.slice(0,i);buf=buf.slice(i+1);
              if(line.indexOf('event:')===0){ev=line.slice(6).trim();}
              else if(line.indexOf('data:')===0){var payload=line.slice(5).trim();
                if(ev==='complete'){return JSON.parse(payload);}
                if(ev==='error'){throw new Error(payload||'Space xətası');}
                if(onTick)onTick();
              }
            }
          }
          throw new Error('Cavab tamamlanmadı');
        }
        $('gvBtn').addEventListener('click',async function(){
          if(!curDataUrl){alert('Əvvəl şəkil seçin.');return;}
          var b=$('gvBtn');b.disabled=true;b.textContent='Təyin edilir...';
          $('gvResult').textContent='';$('gvMap').innerHTML='';
          var t0=Date.now();
          var timer=setInterval(function(){var sec=Math.floor((Date.now()-t0)/1000);$('gvStatus').textContent='GeoVLM analiz edir... '+sec+' san (pulsuz CPU, 2-5 dəq çəkə bilər)';},1000);
          function done(){clearInterval(timer);b.disabled=false;b.textContent='Yeri təyin et';}
          try{
            var r=await fetch('/api/geovlm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:curDataUrl})});
            var d=await r.json();
            if(d.error)throw new Error(d.error);
            if(!d.event_id)throw new Error('event_id alınmadı');
            var out=await readSSE(d.space||'https://acexroux-geovlm.hf.space','predict_location',d.event_id);
            $('gvStatus').textContent='';
            $('gvResult').textContent=((out&&out[0])||'Nəticə boşdur.');
            if(out&&out[1])$('gvMap').innerHTML=out[1];
          }catch(e){$('gvStatus').textContent='Xəta: '+(e&&e.message?e.message:String(e));}
          done();
        });
      })();
      </script>
    ` : ''}

    ${osintSub === 'sclip' ? `
      <div style="max-width:820px">
        <div class="tab-info">📍 StreetCLIP — şəkli yüklə, model ən ehtimallı ölkələri faizlə göstərsin. Bu hissə artıq tokenli HF Inference yox, sənin public Space-in üzərindən işləyir: <b>muntezir/StreetCLIP</b>. Cloudflare-də <b>HF_TOKEN</b> tələb etmir.</div>
        <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input type="file" id="scFile" accept="image/*" style="font-size:14px">
          <button type="button" id="scBtn" style="background:var(--blue);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Ölkəni təyin et</button>
        </div>
        <img id="scPrev" style="display:none;max-width:340px;margin-top:12px;border-radius:10px;border:1px solid var(--border)">
        <div id="scStatus" style="margin-top:10px;font-size:13px;color:#fbbf24;font-weight:700"></div>
        <div id="scResult" style="margin-top:14px"></div>
      </div>
      <script>
      (function(){
        var $=function(id){return document.getElementById(id);};
        var f=$('scFile'); if(!f) return;
        var curDataUrl='';
        f.addEventListener('change',function(){var file=f.files&&f.files[0];if(!file)return;var rd=new FileReader();rd.onload=function(){curDataUrl=String(rd.result||'');$('scPrev').src=curDataUrl;$('scPrev').style.display='block';};rd.readAsDataURL(file);});
        function escHtml(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
        function normalizeResults(d){
          var x=(d&&d.results)||d||[];
          if(!Array.isArray(x))return [];
          if(x.length&&x[0]&&Array.isArray(x[0]))x=x[0];
          return x;
        }
        function textToResults(txt){
          var lines=String(txt||'').split(/\\n+/).map(function(x){return x.trim();}).filter(Boolean);
          return lines.map(function(line){
            var m=line.match(/^(.+?)[\s:–-]+([0-9]+(?:\.[0-9]+)?)\s*%?$/);
            if(m)return {label:m[1].trim(),score:Number(m[2])/100};
            return {label:line,score:0};
          });
        }
        async function readSSE(space,apiName,eventId,onTick){
          var res=await fetch(space+'/gradio_api/call/'+apiName+'/'+encodeURIComponent(eventId));
          if(!res.ok||!res.body)throw new Error('Axın alınmadı ('+res.status+')');
          var reader=res.body.getReader();var dec=new TextDecoder();var buf='';var ev='';
          while(true){var rr=await reader.read();if(rr.done)break;buf+=dec.decode(rr.value,{stream:true});var i;
            while((i=buf.indexOf('\\n'))>=0){var line=buf.slice(0,i);buf=buf.slice(i+1);
              if(line.indexOf('event:')===0){ev=line.slice(6).trim();}
              else if(line.indexOf('data:')===0){var payload=line.slice(5).trim();
                if(ev==='complete'){return JSON.parse(payload);}
                if(ev==='error'){throw new Error(payload||'Space xətası');}
                if(onTick)onTick();
              }
            }
          }
          throw new Error('Cavab tamamlanmadı');
        }
        $('scBtn').addEventListener('click',async function(){
          if(!curDataUrl){alert('Əvvəl şəkil seçin.');return;}
          var b=$('scBtn');b.disabled=true;b.textContent='Təyin edilir...';
          $('scResult').innerHTML='';
          var t0=Date.now();var timer=setInterval(function(){var sec=Math.floor((Date.now()-t0)/1000);$('scStatus').textContent='StreetCLIP analiz edir... '+sec+' san (model soyuqdursa yavaş ola bilər)';},1000);
          try{
            var r=await fetch('/api/sclip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:curDataUrl})});
            var d=await r.json();
            if(d.error)throw new Error(d.error);
            if(!d.event_id)throw new Error('event_id alınmadı');
            var out=await readSSE(d.space||'https://muntezir-streetclip.hf.space',d.api_name||'predict',d.event_id,function(){});
            clearInterval(timer);$('scStatus').textContent='';
            var arr=normalizeResults(out);
            if(!arr.length && typeof out==='string')arr=textToResults(out);
            if(!arr.length && Array.isArray(out)&&typeof out[0]==='string')arr=textToResults(out[0]);
            arr=arr.slice(0,10);var h='';
            arr.forEach(function(it){var label=it.label||it.name||it.country||it[0]||'';var score=Number(it.score||it.confidence||it.probability||it[1]||0);if(score>1)score=score/100;var pct=Math.max(0,Math.min(100,Math.round(score*100)));h+='<div style="margin:7px 0"><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:3px"><span>'+escHtml(label)+'</span><span>'+pct+'%</span></div><div style="height:9px;background:var(--border);border-radius:5px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--blue)"></div></div></div>';});
            $('scResult').innerHTML=h||'<pre style="white-space:pre-wrap">'+escHtml(JSON.stringify(out,null,2))+'</pre>';
          }catch(e){clearInterval(timer);$('scStatus').textContent='Xəta: '+(e&&e.message?e.message:String(e));}
          b.disabled=false;b.textContent='Ölkəni təyin et';
        });
      })();
      </script>
    ` : ''}

    ${osintSub === 'foto' ? `
      <style>
        .rc-wrap{max-width:920px}.rc-upload{border:2px dashed var(--border);border-radius:14px;background:var(--card2);padding:18px;margin-top:14px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}.rc-prev{display:none;max-width:300px;max-height:230px;border-radius:12px;border:1px solid var(--border);object-fit:contain}.rc-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.rc-actions a,.rc-actions button{padding:10px 14px;border-radius:10px;background:var(--blue);color:#fff;text-decoration:none;border:0;font-weight:800;font-size:13px;cursor:pointer}.rc-actions button{background:#16a34a}.rc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:16px}.rc-card{border:1px solid var(--border);border-radius:12px;background:var(--card2);padding:14px}.rc-card h3{margin:0 0 7px;font-size:15px}.rc-card p{margin:0;color:var(--muted);font-size:12.5px;line-height:1.5}.rc-note{margin-top:14px;color:var(--muted);font-size:12.5px;line-height:1.6}
      </style>
      <div class="rc-wrap">
        <div class="tab-info">📷 FOTO — şəkil üzrə OSİNT yönləndirici. Şəkli seç, önbaxış açılacaq; sonra reverse image, metadata və coğrafiya yoxlaması üçün uyğun alətləri yeni pəncərədə aç. Şəkil bu səhifədən serverə göndərilmir.</div>
        <div class="rc-upload">
          <input type="file" id="rcFile" accept="image/*" style="font-size:14px">
          <button type="button" id="rcClear" style="display:none">Təmizlə</button>
          <span id="rcInfo" style="color:var(--muted);font-size:13px">Şəkil seçilməyib.</span>
          <img id="rcPrev" class="rc-prev" alt="">
        </div>
        <div class="rc-actions">
          <a href="https://lens.google.com/" target="_blank" rel="noopener">Google Lens aç</a>
          <a href="https://yandex.com/images/" target="_blank" rel="noopener">Yandex Images aç</a>
          <a href="https://www.bing.com/visualsearch" target="_blank" rel="noopener">Bing Visual Search aç</a>
          <a href="https://tineye.com/" target="_blank" rel="noopener">TinEye aç</a>
          <a href="https://jimpl.com/" target="_blank" rel="noopener">EXIF / metadata aç</a>
          <button type="button" id="rcCopy">Yoxlama siyahısını kopyala</button>
        </div>
        <div class="rc-grid">
          <div class="rc-card"><h3>1) Reverse image</h3><p>Google Lens, Yandex, Bing və TinEye ilə eyni şəkil və oxşar kadrlara bax.</p></div>
          <div class="rc-card"><h3>2) Metadata</h3><p>EXIF varsa GPS, cihaz, tarix və redaktə izlərini ayrıca yoxla.</p></div>
          <div class="rc-card"><h3>3) Coğrafiya</h3><p>GeoVLM və SCLIP nəticələrini bu tabdan ayrıca müqayisə et; tək nəticəyə güvənmə.</p></div>
          <div class="rc-card"><h3>4) Üz / obyekt</h3><p>Üz varsa Üztanıma subtabında müqayisə et; bina, lövhə, nömrə, vitrin kimi detalları ayrıca qeyd et.</p></div>
        </div>
        <div class="rc-note">Qeyd: Brauzerlər təhlükəsizlik səbəbi ilə lokal yüklənmiş faylı avtomatik başqa saytlara ötürməyə icazə vermir. Ona görə RECLIP alətləri açır, şəkli həmin saytlarda manual yükləmək lazımdır.</div>
      </div>
      <script>
      (function(){
        var $=function(id){return document.getElementById(id);};
        var f=$('rcFile'); if(!f) return;
        var p=$('rcPrev'), info=$('rcInfo'), clear=$('rcClear');
        f.addEventListener('change',function(){
          var file=f.files&&f.files[0];
          if(!file){return;}
          info.textContent=file.name+' — '+Math.round(file.size/1024)+' KB';
          clear.style.display='inline-block';
          var rd=new FileReader();
          rd.onload=function(){p.src=String(rd.result||'');p.style.display='block';};
          rd.readAsDataURL(file);
        });
        clear.addEventListener('click',function(){f.value='';p.removeAttribute('src');p.style.display='none';info.textContent='Şəkil seçilməyib.';clear.style.display='none';});
        $('rcCopy').addEventListener('click',function(){
          var txt='FOTO yoxlama siyahısı:\\n1. Google Lens / Yandex / Bing / TinEye reverse image\\n2. EXIF metadata: tarix, GPS, cihaz\\n3. GeoVLM + SCLIP müqayisəsi\\n4. Üz varsa Üztanıma müqayisəsi\\n5. Görünən yazı, lövhə, bina, nömrə, vitrin, hava və kölgə detalları';
          if(navigator.clipboard){navigator.clipboard.writeText(txt);}
          this.textContent='Kopyalandı ✓'; var b=this; setTimeout(function(){b.textContent='Yoxlama siyahısını kopyala';},1500);
        });
      })();
      </script>
    ` : ''}

    ${osintSub === 'reclip' ? `
      <style>
        .reclip-frame-wrap{max-width:1180px}.reclip-frame-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}.reclip-open{display:inline-block;padding:10px 14px;border-radius:10px;background:var(--blue);color:#fff;text-decoration:none;font-weight:800}.reclip-iframe{width:100%;height:78vh;min-height:650px;border:1px solid var(--border);border-radius:14px;background:#fff}.reclip-note{color:var(--muted);font-size:12.5px;line-height:1.6;margin-top:10px}
      </style>
      <div class="reclip-frame-wrap">
        <div class="reclip-frame-head">
          <div class="tab-info" style="margin:0;flex:1;min-width:280px">🧭 RECLIP — ayrıca qurulmuş analiz paneli. Aşağıdakı pəncərə trycloudflare tunelindən açılır.</div>
          <a class="reclip-open" href="https://morgan-cruises-greetings-judge.trycloudflare.com" target="_blank" rel="noopener noreferrer">Yeni pəncərədə aç ↗</a>
        </div>
        <iframe class="reclip-iframe" src="https://morgan-cruises-greetings-judge.trycloudflare.com" loading="lazy" referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write; camera; microphone; fullscreen"></iframe>
        <div class="reclip-note">Əgər iframe boş görünərsə, tunel CORS/X-Frame qoruması tətbiq edə bilər. O halda “Yeni pəncərədə aç” düyməsindən istifadə et.</div>
      </div>
    ` : ''}


    ${osintSub === 'bb' ? `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="blackbird">
        <input type="hidden" name="osintSub" value="bb">
        <input name="q" placeholder="İstifadəçi adı yaxud email (username)..." value="${esc(q)}">
        <button type="submit">Axtar</button>
      </form>
      ${error
        ? `<div class="msg err">${esc(error)}</div>`
        : blackbirdLines.length
          ? `<div class="count">${esc(blackbirdUsername)} üçün nəticələr</div>
             <div class="card">
               <div class="card-head">
                 <div class="logo">🐦</div>
                 <div><h2>${esc(blackbirdUsername)}</h2><p>Sosial şəbəkə axtarışı</p></div>
               </div>
               <pre style="background:transparent;padding:8px 0;margin:0;font-size:13px;line-height:1.7">${blackbirdLines.map(l => esc(l)).join('\n')}</pre>
             </div>`
          : q
            ? '<div class="msg err">Nəticə tapılmadı.</div>'
            : '<div class="msg warn">İstifadəçi adı yaxud email (username or test@test.com) daxil edin. Bir az gözləməlisiniz...</div>'}
    ` : ''}

    ${osintSub === 'sherlock' ? `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="blackbird">
        <input type="hidden" name="osintSub" value="sherlock">
        <input name="q" placeholder="İstifadəçi adı (username)..." value="${esc(q)}">
        <button type="submit">Axtar</button>
      </form>
      ${error
        ? `<div class="msg err">${esc(error)}</div>`
        : sherlockFound.length
          ? `<div class="count">${esc(sherlockUsername)} — ${sherlockCount} hesab tapıldı</div>
             <div class="card">
               <div class="card-head">
                 <div class="logo">🔍</div>
                 <div><h2>${esc(sherlockUsername)}</h2><p>Sherlock — istifadəçi adı üzrə hesablar</p></div>
               </div>
               <div style="display:flex;flex-direction:column;gap:6px;padding:8px 0">
                 ${sherlockFound.map(function(it){
                   var site = '', link = '';
                   if (it && typeof it === 'object') {
                     site = it.site || it.name || it.title || '';
                     link = it.url || it.link || it.uri || '';
                   } else {
                     link = String(it);
                     try { site = new URL(link).hostname.replace(/^www\./,''); } catch(e) { site = link; }
                   }
                   if (!site) { try { site = new URL(link).hostname.replace(/^www\./,''); } catch(e) { site = link; } }
                   var safeLink = esc(link);
                   return '<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:var(--card2);border:1px solid var(--border);border-radius:8px">'
                     + '<span style="font-weight:700;min-width:130px">' + esc(site) + '</span>'
                     + (link ? '<a href="' + safeLink + '" target="_blank" rel="noopener" style="color:var(--blue);text-decoration:none;word-break:break-all;font-size:13px">' + safeLink + '</a>' : '')
                     + '</div>';
                 }).join('')}
               </div>
             </div>`
          : q
            ? '<div class="msg err">Nəticə tapılmadı.</div>'
            : '<div class="msg warn">İstifadəçi adı daxil edin (məs: testuser123). Axtarış bir neçə saniyə çəkə bilər.</div>'}
    ` : ''}

    ${osintSub === 'name' ? `
      <style>
        .nv-wrap{display:flex;gap:28px;align-items:flex-start}
        .nv-left{flex:0 0 360px;min-width:0}
        .nv-right{flex:1;min-width:0}
        .nv-input-box{background:var(--card2);border:2px solid var(--border);border-radius:10px;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;cursor:text;min-height:52px;transition:border-color .15s}
        .nv-input-box:focus-within{border-color:var(--blue)}
        .nv-chip{background:var(--blue);color:#fff;border-radius:20px;padding:5px 12px 5px 14px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:7px;white-space:nowrap}
        .nv-chip-x{background:none;border:none;color:#fff;cursor:pointer;font-size:16px;padding:0;line-height:1;opacity:.7;font-weight:400}
        .nv-chip-x:hover{opacity:1}
        .nv-text-input{border:none;background:transparent;color:var(--text);font-size:15px;outline:none;min-width:140px;flex:1;padding:2px 0}
        .nv-hint{font-size:12px;color:var(--muted);margin-top:7px}
        .nv-stitle{font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:22px 0 12px}
        .nv-suggestion{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--border)}
        .nv-suggestion:last-child{border-bottom:none}
        .nv-sugg-name{flex:1;font-size:15px;font-weight:600;color:var(--text)}
        .nv-add-btn{font-size:12px;font-weight:700;padding:4px 11px;border-radius:7px;background:var(--card2);border:1px solid var(--border);color:var(--muted);cursor:pointer;white-space:nowrap;flex-shrink:0}
        .nv-add-btn:hover{background:var(--green);color:#052e16;border-color:var(--green)}
        .nv-eng{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;font-size:12px;font-weight:800;color:#fff;text-decoration:none;flex-shrink:0}
        .nv-eng-g{background:#EA4335}.nv-eng-b{background:#FF6900}.nv-eng-y{background:#FC3F1D}
        .nv-eng-li{background:#0A66C2}.nv-eng-fb{background:#1877F2}.nv-eng-x{background:#111}
        .nv-eng-ok{background:#EE8208}.nv-eng-vk{background:#0077FF}
        .nv-sites{display:flex;flex-direction:column;gap:10px}
        .nv-site-row{display:flex;align-items:center;gap:10px;font-size:15px;cursor:pointer}
        .nv-site-row input[type=checkbox]{accent-color:var(--blue);width:16px;height:16px;cursor:pointer}
        .nv-result-card{background:var(--card2);border:1px solid var(--border);border-radius:10px;margin-bottom:10px;padding:16px 18px;transition:border-color .15s}
        .nv-result-card:hover{border-color:var(--blue)}
        .nv-result-name{font-size:16px;font-weight:700;color:var(--text);margin-bottom:10px}
        .nv-result-links{display:flex;flex-wrap:wrap;gap:7px}
        .nv-result-link{display:inline-flex;align-items:center;padding:5px 13px;border-radius:7px;font-size:13px;font-weight:600;text-decoration:none;color:#fff}
        .nv-link-g{background:#EA4335}.nv-link-b{background:#FF6900}.nv-link-y{background:#FC3F1D}
        .nv-link-li{background:#0A66C2}.nv-link-fb{background:#1877F2}.nv-link-x{background:#111}
        .nv-link-ok{background:#EE8208}.nv-link-vk{background:#0077FF}
        .nv-empty{color:var(--muted);font-size:14px;padding:36px 0;text-align:center}
        @media(max-width:760px){.nv-wrap{flex-direction:column}.nv-left{flex:none;width:100%}}
      </style>

      <div class="nv-wrap">
        <div class="nv-left">
          <div class="nv-stitle">Ad üzrə axtar</div>
          <div class="nv-input-box" id="nvBox">
            <input id="nvRawInput" class="nv-text-input" placeholder="Ad Soyad yazın, Enter basın..." autocomplete="off">
          </div>
          <div class="nv-hint">Enter — adı etiket kimi əlavə edin. Bir neçə ad əlavə edə bilərsiniz.</div>

          <div class="nv-stitle">Təkliflər</div>
          <div id="nvSugg"><div class="nv-empty">Ad daxil edin</div></div>

          <div class="nv-stitle">Saytlar</div>
          <div class="nv-sites">
            <label class="nv-site-row"><input type="checkbox" id="ck_g" checked><span class="nv-eng nv-eng-g">G</span>Google</label>
            <label class="nv-site-row"><input type="checkbox" id="ck_b" checked><span class="nv-eng nv-eng-b">B</span>Bing</label>
            <label class="nv-site-row"><input type="checkbox" id="ck_y" checked><span class="nv-eng nv-eng-y">Y</span>Yandex</label>
            <label class="nv-site-row"><input type="checkbox" id="ck_li" checked><span class="nv-eng nv-eng-li">in</span>LinkedIn</label>
            <label class="nv-site-row"><input type="checkbox" id="ck_fb" checked><span class="nv-eng nv-eng-fb">f</span>Facebook</label>
            <label class="nv-site-row"><input type="checkbox" id="ck_x" checked><span class="nv-eng nv-eng-x">X</span>Twitter / X</label>
            <label class="nv-site-row"><input type="checkbox" id="ck_ok" checked><span class="nv-eng nv-eng-ok">OK</span>OK.ru</label>
            <label class="nv-site-row"><input type="checkbox" id="ck_vk" checked><span class="nv-eng nv-eng-vk">VK</span>VK.com</label>
          </div>
        </div>

        <div class="nv-right">
          <div class="nv-stitle" id="nvResTitle">Nəticələr</div>
          <div id="nvRes"><div class="nv-empty">Sol tərəfdən ad daxil edib Enter sıxın.</div></div>
        </div>
      </div>

      <script>
      (function(){
        var chips = [];
        var _suggs = [];

        var ENGS = [
          {id:'ck_g',  cls:'nv-link-g',  lbl:'Google',   url:function(v){return 'https://www.google.com/search?q='+encodeURIComponent('"'+v+'"');}},
          {id:'ck_b',  cls:'nv-link-b',  lbl:'Bing',     url:function(v){return 'https://www.bing.com/search?q='+encodeURIComponent('"'+v+'"');}},
          {id:'ck_y',  cls:'nv-link-y',  lbl:'Yandex',   url:function(v){return 'https://yandex.com/search/?text='+encodeURIComponent('"'+v+'"');}},
          {id:'ck_li', cls:'nv-link-li', lbl:'LinkedIn',  url:function(v){return 'https://www.linkedin.com/search/results/people/?keywords='+encodeURIComponent(v);}},
          {id:'ck_fb', cls:'nv-link-fb', lbl:'Facebook',  url:function(v){return 'https://www.facebook.com/search/top?q='+encodeURIComponent(v);}},
          {id:'ck_x',  cls:'nv-link-x',  lbl:'Twitter/X', url:function(v){return 'https://twitter.com/search?q='+encodeURIComponent('"'+v+'"');}},
          {id:'ck_ok', cls:'nv-link-ok', lbl:'OK.ru',     url:function(v){return 'https://ok.ru/search?q='+encodeURIComponent(v)+'&st.cmd=searchResult';}},
          {id:'ck_vk', cls:'nv-link-vk', lbl:'VK.com',    url:function(v){return 'https://vk.com/search?c[q]='+encodeURIComponent(v)+'&c[section]=people';}}
        ];

        var SUGG_ENGS = [
          {cls:'nv-eng-g',lbl:'G',url:function(v){return 'https://www.google.com/search?q='+encodeURIComponent('"'+v+'"');}},
          {cls:'nv-eng-fb',lbl:'f',url:function(v){return 'https://www.facebook.com/search/top?q='+encodeURIComponent(v);}},
          {cls:'nv-eng-x',lbl:'X',url:function(v){return 'https://twitter.com/search?q='+encodeURIComponent('"'+v+'"');}},
          {cls:'nv-eng-ok',lbl:'OK',url:function(v){return 'https://ok.ru/search?q='+encodeURIComponent(v)+'&st.cmd=searchResult';}},
          {cls:'nv-eng-vk',lbl:'VK',url:function(v){return 'https://vk.com/search?c[q]='+encodeURIComponent(v)+'&c[section]=people';}}
        ];

        function latinToCyrillic(s) {
          var map = [
            ['sh','ш'],['ch','ч'],['zh','ж'],['kh','х'],['ts','ц'],
            ['ya','я'],['yu','ю'],['ye','е'],
            ['ş','ш'],['ç','ч'],['ğ','г'],['ə','э'],['ı','ы'],
            ['ö','о'],['ü','у'],
            ['a','а'],['b','б'],['c','дж'],['d','д'],['e','е'],
            ['f','ф'],['g','г'],['h','х'],['i','и'],['j','й'],
            ['k','к'],['l','л'],['m','м'],['n','н'],['o','о'],
            ['p','п'],['q','к'],['r','р'],['s','с'],['t','т'],
            ['u','у'],['v','в'],['x','х'],['y','й'],['z','з']
          ];
          var r = s.toLowerCase();
          map.forEach(function(p){ r = r.split(p[0]).join(p[1]); });
          return r.replace(/(^|\s)\S/g, function(c){ return c.toUpperCase(); });
        }

        function variants(raw) {
          var p = raw.trim().toLowerCase().split(' ').filter(function(x){return x.length>0;});
          if(!p.length) return [];
          if(p.length===1) return [p[0]];
          var f=p[0], l=p[p.length-1], ma=p.slice(1,-1), m=ma.join(' ');
          var fi=f[0], mi=ma.length?ma[0][0]:null;
          var s=new Set();
          s.add(f+' '+l);
          if(m){s.add(f+' '+m+' '+l);s.add(f+' '+mi+' '+l);}
          s.add(fi+' '+l);
          if(m){s.add(fi+' '+m+' '+l);if(mi){s.add(fi+' '+mi+' '+l);s.add(fi+mi+' '+l);}}
          s.add(l+', '+f);
          if(m){s.add(l+', '+f+' '+m);s.add(l+', '+f+' '+mi);}
          s.add(l+' '+f);
          if(m) s.add(l+' '+f+' '+m);
          return Array.from(s).filter(Boolean);
        }

        function allVariants() {
          var a=[];
          chips.forEach(function(c){variants(c).forEach(function(v){if(a.indexOf(v)<0)a.push(v);});});
          /* Kiril transliterasiyası */
          chips.forEach(function(c){
            var cyr = latinToCyrillic(c);
            if(cyr !== c) {
              variants(cyr).forEach(function(v){if(a.indexOf(v)<0)a.push(v);});
            }
          });
          return a;
        }

        function renderChips() {
          var box=document.getElementById('nvBox');
          var inp=document.getElementById('nvRawInput');
          if(inp.parentNode===box) box.removeChild(inp);
          while(box.firstChild) box.removeChild(box.firstChild);
          chips.forEach(function(c,i){
            var d=document.createElement('div'); d.className='nv-chip';
            var s=document.createElement('span'); s.textContent=c;
            var b=document.createElement('button'); b.className='nv-chip-x'; b.textContent='×'; b.title='Sil';
            b.setAttribute('data-i',i);
            d.appendChild(s); d.appendChild(b); box.appendChild(d);
          });
          box.appendChild(inp); inp.focus();
        }

        function renderSugg() {
          var box=document.getElementById('nvSugg');
          if(!chips.length){box.innerHTML='<div class="nv-empty">Ad daxil edin</div>';return;}
          _suggs=allVariants();
          box.innerHTML=_suggs.map(function(v,i){
            var icons=SUGG_ENGS.map(function(e){
              return '<a href="'+e.url(v)+'" target="_blank" rel="noopener" class="nv-eng '+e.cls+'" title="'+e.lbl+'">'+e.lbl+'</a>';
            }).join('');
            return '<div class="nv-suggestion">'+
              '<button class="nv-add-btn" data-si="'+i+'">+ Əlavə et</button>'+
              '<span class="nv-sugg-name">'+v+'</span>'+
              '<div style="display:flex;gap:5px">'+icons+'</div>'+
            '</div>';
          }).join('');
        }

        function renderRes() {
          var box=document.getElementById('nvRes');
          var title=document.getElementById('nvResTitle');
          if(!chips.length){box.innerHTML='<div class="nv-empty">Sol tərəfdən ad daxil edib Enter sıxın.</div>';title.textContent='Nəticələr';return;}
          var all=allVariants();
          title.textContent=all.length+' variant';
          var active=ENGS.filter(function(e){return document.getElementById(e.id).checked;});
          box.innerHTML=all.map(function(v){
            var links=active.map(function(e){
              return '<a href="'+e.url(v)+'" target="_blank" rel="noopener" class="nv-result-link '+e.cls+'">'+e.lbl+'</a>';
            }).join('');
            return '<div class="nv-result-card"><div class="nv-result-name">'+v+'</div><div class="nv-result-links">'+links+'</div></div>';
          }).join('');
        }

        function refresh(){renderChips();renderSugg();renderRes();}

        /* Enter to add chip */
        document.getElementById('nvRawInput').addEventListener('keydown',function(e){
          if(e.key==='Enter'){
            e.preventDefault();
            var v=this.value.trim();
            if(!v) return;
            if(chips.indexOf(v)<0) chips.push(v);
            this.value='';
            refresh();
          } else if(e.key==='Backspace'&&this.value===''&&chips.length){
            chips.pop(); refresh();
          }
        });

        /* click on nvBox focuses input */
        document.getElementById('nvBox').addEventListener('click',function(e){
          if(e.target===this||e.target.id==='nvRawInput') document.getElementById('nvRawInput').focus();
        });

        /* delegate: remove chip */
        document.getElementById('nvBox').addEventListener('click',function(e){
          var b=e.target.closest('.nv-chip-x');
          if(!b) return;
          chips.splice(parseInt(b.getAttribute('data-i')),1);
          refresh();
        });

        /* delegate: add suggestion */
        document.getElementById('nvSugg').addEventListener('click',function(e){
          var b=e.target.closest('.nv-add-btn');
          if(!b) return;
          var v=_suggs[parseInt(b.getAttribute('data-si'))];
          if(v&&chips.indexOf(v)<0){chips.push(v);refresh();}
        });

        /* site checkboxes */
        ENGS.forEach(function(e){document.getElementById(e.id).addEventListener('change',renderRes);});

      })();
      </script>
    ` : ''}

    ${osintSub === 'graph' ? `
      <style>
        .bg-wrap{max-width:920px}
        .bg-types{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
        .bg-type{padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--card2);color:var(--muted);cursor:pointer;font-size:14px;font-weight:600;user-select:none}
        .bg-type.on{background:#1877F2;color:#fff;border-color:#1877F2}
        .bg-field{margin-bottom:14px}
        .bg-field label{display:block;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
        .bg-field input,.bg-field select{width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--card2);color:var(--text);font-size:14px;box-sizing:border-box}
        .bg-row{display:flex;gap:12px;flex-wrap:wrap}
        .bg-row .bg-field{flex:1;min-width:140px}
        .bg-hide{display:none}
        .bg-note{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.55}
        .bg-go{margin-top:8px;padding:12px 22px;border:none;border-radius:9px;background:#1877F2;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
        .bg-out{margin-top:18px;padding:14px;border:1px solid var(--border);border-radius:10px;background:var(--card2);display:none}
        .bg-out a{color:var(--blue);word-break:break-all;font-size:13px;text-decoration:none}
        .bg-copy{margin-top:10px;padding:7px 14px;border:1px solid var(--border);border-radius:7px;background:var(--card);color:var(--text);cursor:pointer;font-size:12px;font-weight:700}
        .bg-sec{font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 10px}
      </style>
      <div class="bg-wrap">
        <p style="color:var(--muted);font-size:13px;margin:0 0 14px;line-height:1.6">Facebook Graph axtarışı — axtarış tipini seçin, açar söz və filtrləri doldurun, link yaradılıb Facebook-da açılacaq.</p>

        <div class="bg-types" id="bgTypes">
          <span class="bg-type on" data-t="people">İnsanlar</span>
          <span class="bg-type" data-t="posts">Postlar</span>
          <span class="bg-type" data-t="photos">Şəkillər</span>
          <span class="bg-type" data-t="videos">Videolar</span>
          <span class="bg-type" data-t="pages">Səhifələr</span>
          <span class="bg-type" data-t="places">Yerlər</span>
          <span class="bg-type" data-t="events">Tədbirlər</span>
          <span class="bg-type" data-t="top">Top</span>
        </div>

        <div class="bg-field">
          <label>Açar söz (q) — məcburidir</label>
          <input id="bgQ" placeholder="məs: ad, söz, mövzu..." value="${esc(q)}">
        </div>

        <div class="bg-grp" data-for="people">
          <div class="bg-row">
            <div class="bg-field"><label>Şəhər ID</label><input id="bgCity" placeholder="city FB ID"></div>
            <div class="bg-field"><label>Məktəb ID</label><input id="bgSchool" placeholder="school FB ID"></div>
          </div>
          <div class="bg-row">
            <div class="bg-field"><label>İş yeri ID</label><input id="bgEmployer" placeholder="employer FB ID"></div>
            <div class="bg-field"><label>Dostluq</label>
              <select id="bgFriends">
                <option value="">—</option>
                <option value="users_friends">Dostları</option>
                <option value="users_friends_of_friends">Dostlarının dostları</option>
                <option value="users_friends_of_people">Bu şəxslə dost olanlar</option>
              </select>
            </div>
          </div>
          <div class="bg-field bg-hide" id="bgFriendIdWrap"><label>Şəxs ID (dostluq üçün)</label><input id="bgFriendId" placeholder="person FB ID"></div>
        </div>

        <div class="bg-grp bg-hide" data-for="posts photos videos top">
          <div class="bg-row">
            <div class="bg-field"><label>Səhifə/İstifadəçi ID (müəllif)</label><input id="bgAuthor" placeholder="page/user FB ID"></div>
            <div class="bg-field"><label>Qrup ID</label><input id="bgGroup" placeholder="group FB ID"></div>
          </div>
          <div class="bg-field"><label>Yer (location) ID</label><input id="bgLoc" placeholder="location FB ID"></div>
          <div class="bg-field bg-hide" data-for="videos"><label>Video mənbəyi</label>
            <select id="bgVidSrc"><option value="">—</option><option value="videos_live">Canlı</option><option value="videos_episode">Epizodlar</option><option value="videos_feed">Dostlar və qruplar</option></select>
          </div>
          <div class="bg-sec">Tarix aralığı (istəyə görə)</div>
          <div class="bg-row">
            <div class="bg-field"><label>Başlanğıc: il / ay / gün</label><div class="bg-row"><input id="bgSY" placeholder="2019" style="flex:1"><input id="bgSM" placeholder="ay" style="width:64px"><input id="bgSD" placeholder="gün" style="width:64px"></div></div>
            <div class="bg-field"><label>Son: il / ay / gün</label><div class="bg-row"><input id="bgEY" placeholder="2019" style="flex:1"><input id="bgEM" placeholder="ay" style="width:64px"><input id="bgED" placeholder="gün" style="width:64px"></div></div>
          </div>
        </div>

        <div class="bg-grp bg-hide" data-for="pages">
          <div class="bg-field"><label>Kateqoriya</label>
            <select id="bgCat"><option value="">—</option><option value="1006">Yerli biznes / Yer</option><option value="1013">Şirkət / Təşkilat</option><option value="1009">Brend / Məhsul</option><option value="1007,180164648685982">Sənətçi / İctimai şəxs</option><option value="1019">Əyləncə</option><option value="2612">İcma</option></select>
          </div>
          <div class="bg-field"><label style="text-transform:none;letter-spacing:0;font-weight:600;color:var(--text)"><input type="checkbox" id="bgVerified" style="width:auto;margin-right:8px;vertical-align:middle">Yalnız təsdiqlənmiş səhifələr</label></div>
        </div>

        <button class="bg-go" id="bgGo">🔍 Facebook linkini yarat</button>

        <div class="bg-out" id="bgOut">
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:700">Yaradılan link:</div>
          <a id="bgLink" href="#" target="_blank" rel="noopener"></a>
          <div><button class="bg-copy" id="bgCopy">Kopyala</button></div>
        </div>

        <div class="bg-note">
          FB ID tapmaq üçün: <a href="https://findmyfbid.com" target="_blank" rel="noopener" style="color:var(--blue)">findmyfbid.com</a> və ya <a href="https://lookup-id.com" target="_blank" rel="noopener" style="color:var(--blue)">lookup-id.com</a>. Açar söz hər zaman məcburidir. Bəzi axtarışlar Facebook hesabına daxil olmağı tələb edə bilər.
        </div>
      </div>

      <script>
      (function(){
        var curType = 'people';
        function pick(id){ return document.getElementById(id); }
        function show(el,on){ if(el){ el.classList.toggle('bg-hide', !on); } }

        function applyType(){
          var grps = document.querySelectorAll('.bg-grp');
          for (var i=0;i<grps.length;i++){
            var fr = grps[i].getAttribute('data-for').split(' ');
            show(grps[i], fr.indexOf(curType) !== -1);
          }
          var subs = document.querySelectorAll('.bg-grp [data-for]');
          for (var j=0;j<subs.length;j++){
            var f2 = subs[j].getAttribute('data-for').split(' ');
            show(subs[j], f2.indexOf(curType) !== -1);
          }
        }

        var typeWrap = pick('bgTypes');
        typeWrap.addEventListener('click', function(e){
          var t = e.target.getAttribute('data-t');
          if(!t) return;
          curType = t;
          var els = typeWrap.querySelectorAll('.bg-type');
          for (var i=0;i<els.length;i++){ els[i].classList.toggle('on', els[i]===e.target); }
          applyType();
        });

        var fsel = pick('bgFriends');
        if(fsel){ fsel.addEventListener('change', function(){
          show(pick('bgFriendIdWrap'), fsel.value === 'users_friends_of_people');
        }); }

        function F(name,args){ return JSON.stringify({ name:name, args: args || '' }); }
        function b64(s){
          var bytes = unescape(encodeURIComponent(s));
          return btoa(bytes).replace(/=+$/,'');
        }
        function val(id){ var e=pick(id); return e ? e.value.trim() : ''; }

        function build(){
          var q = val('bgQ');
          if(!q){ alert('Açar söz (q) məcburidir.'); return null; }
          var type = curType;
          var f = {};

          if(type === 'people'){
            if(val('bgCity'))     f.city     = F('users_location', val('bgCity'));
            if(val('bgSchool'))   f.school   = F('users_school',   val('bgSchool'));
            if(val('bgEmployer')) f.employer = F('users_employer', val('bgEmployer'));
            var fr = val('bgFriends');
            if(fr){
              var arg = (fr === 'users_friends_of_people') ? val('bgFriendId') : '';
              f.friends = F(fr, arg);
            }
          } else if(type === 'pages'){
            if(pick('bgVerified').checked) f.verified = F('pages_verified','');
            if(val('bgCat'))               f.category = F('pages_category', val('bgCat'));
          } else if(type === 'posts' || type === 'photos' || type === 'videos' || type === 'top'){
            if(val('bgAuthor')) f.rp_author   = F('author', val('bgAuthor'));
            if(val('bgGroup'))  f.rp_group    = F('group_posts', val('bgGroup'));
            if(val('bgLoc'))    f.rp_location = F('location', val('bgLoc'));
            if(type === 'videos' && val('bgVidSrc')) f.videos_source = F(val('bgVidSrc'),'');
            var sy = val('bgSY'), ey = val('bgEY');
            if(sy && ey){
              var sm = val('bgSM')||'1', sd = val('bgSD')||'1', em = val('bgEM')||'12', ed = val('bgED')||'31';
              var inner = JSON.stringify({
                start_year: sy, start_month: sy+'-'+sm, end_year: ey, end_month: ey+'-'+em,
                start_day: sy+'-'+sm+'-'+sd, end_day: ey+'-'+em+'-'+ed
              });
              f.rp_creation_time = F('creation_time', inner);
            }
          }

          var url = 'https://www.facebook.com/search/' + type + '/?q=' + encodeURIComponent(q) + '&epa=FILTERS';
          var keys = [];
          for (var k in f){ if(f.hasOwnProperty(k)) keys.push(k); }
          if(keys.length){ url += '&filters=' + b64(JSON.stringify(f)); }
          return url;
        }

        pick('bgGo').addEventListener('click', function(){
          var url = build();
          if(!url) return;
          var link = pick('bgLink');
          link.href = url; link.textContent = url;
          pick('bgOut').style.display = 'block';
          window.open(url, '_blank', 'noopener');
        });
        pick('bgCopy').addEventListener('click', function(){
          var t = pick('bgLink').textContent;
          if(navigator.clipboard){ navigator.clipboard.writeText(t); }
          pick('bgCopy').textContent = 'Kopyalandı ✓';
          setTimeout(function(){ pick('bgCopy').textContent = 'Kopyala'; }, 1500);
        });

        applyType();
      })();
      </script>
    ` : ''}

    ${osintSub === 'face' ? `
      <style>
        .uz-wrap{max-width:900px}
        .uz-intro{color:var(--muted);font-size:13px;line-height:1.6;margin:0 0 16px}
        .uz-slots{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .uz-slot{display:flex;flex-direction:column;gap:8px}
        .uz-slot-title{font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
        .uz-box{position:relative;border:2px dashed var(--border);border-radius:12px;background:var(--card2);min-height:220px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;transition:border-color .15s}
        .uz-box:hover,.uz-box.uz-drag{border-color:var(--blue)}
        .uz-ph{color:var(--muted);font-size:13px;text-align:center;padding:18px;line-height:1.6}
        .uz-prev{display:none;max-width:100%;max-height:300px;object-fit:contain}
        .uz-go{margin:18px 0 0;padding:13px 26px;border:none;border-radius:10px;background:#16a34a;color:#fff;font-size:15px;font-weight:800;cursor:pointer}
        .uz-go:disabled{opacity:.55;cursor:default}
        .uz-status{margin-top:14px;font-size:13px;color:var(--muted)}
        .uz-status.err{color:#f87171}.uz-status.info{color:var(--blue)}
        .uz-result{display:none;margin-top:16px;border:1px solid var(--border);border-radius:14px;background:var(--card2);padding:20px;text-align:center}
        .uz-pct{font-size:46px;font-weight:900;line-height:1;margin:0}
        .uz-verdict{font-size:17px;font-weight:800;margin:10px 0 4px}
        .uz-bar{height:12px;border-radius:8px;background:var(--card);overflow:hidden;margin:14px auto 6px;max-width:420px}
        .uz-bar-in{height:100%;width:0;border-radius:8px;transition:width .5s}
        .uz-dist{font-size:12px;color:var(--muted)}
        .uz-sec{font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:30px 0 12px;border-top:1px solid var(--border);padding-top:20px}
        .uz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
        .uz-card{border:1px solid var(--border);border-radius:12px;background:var(--card2);padding:14px 16px;display:flex;flex-direction:column;gap:7px}
        .uz-card h3{margin:0;font-size:15px;color:var(--text);display:flex;align-items:center;gap:7px;flex-wrap:wrap}
        .uz-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:var(--card);border:1px solid var(--border);color:var(--muted)}
        .uz-card p{margin:0;font-size:12.5px;color:var(--muted);line-height:1.5;flex:1}
        .uz-open{margin-top:4px;align-self:flex-start;padding:8px 16px;border-radius:8px;background:var(--blue);color:#fff;font-size:12.5px;font-weight:700;text-decoration:none}
        .uz-note{font-size:12px;color:var(--muted);margin-top:16px;line-height:1.6}
        @media(max-width:640px){.uz-slots{grid-template-columns:1fr}}
      </style>
      <div class="uz-wrap">
        <p class="uz-intro">İki üz şəklini yükləyin və <b>Müqayisə et</b> düyməsinə basın. Müqayisə birbaşa bu səhifədə, brauzerinizdə aparılır — şəkillər heç bir serverə göndərilmir. İlk dəfə AI modeli yüklənərkən bir neçə saniyə gözləmək lazım ola bilər.</p>

        <div class="uz-slots">
          <div class="uz-slot">
            <div class="uz-slot-title">1-ci şəkil</div>
            <div class="uz-box" id="uzBox0">
              <div class="uz-ph" id="uzPh0">📷 Şəkil seçmək üçün klikləyin<br>və ya bura sürükləyin</div>
              <img class="uz-prev" id="uzPrev0" alt="">
            </div>
            <input type="file" id="uzFile0" accept="image/*" style="display:none">
          </div>
          <div class="uz-slot">
            <div class="uz-slot-title">2-ci şəkil</div>
            <div class="uz-box" id="uzBox1">
              <div class="uz-ph" id="uzPh1">📷 Şəkil seçmək üçün klikləyin<br>və ya bura sürükləyin</div>
              <img class="uz-prev" id="uzPrev1" alt="">
            </div>
            <input type="file" id="uzFile1" accept="image/*" style="display:none">
          </div>
        </div>

        <button class="uz-go" id="uzGo">🔍 Müqayisə et</button>
        <div class="uz-status" id="uzStatus"></div>

        <div class="uz-result" id="uzResult">
          <p class="uz-pct" id="uzPct">—</p>
          <div class="uz-verdict" id="uzVerdict"></div>
          <div class="uz-bar"><div class="uz-bar-in" id="uzBarIn"></div></div>
          <div class="uz-dist" id="uzDist"></div>
        </div>

        <div class="uz-note">⚠️ Üz tanıma alqoritmi 100% dəqiq deyil — nəticə başlanğıc nöqtə kimi qəbul edilməli, mühüm hallarda insan yoxlamasından keçirilməlidir. Eynək, maska, profil bucağı və ya çox fərqli yaş nəticəni poza bilər.</div>

        <div class="uz-sec">Digər üz alətləri (xarici saytlar)</div>
        <div class="uz-grid">
          <div class="uz-card">
            <h3>🔍 Toolpie <span class="uz-badge">Müqayisə</span></h3>
            <p>İki üz şəklini müqayisə edən rəsmi sayt (oxşarlıq faizi). Qeydiyyat tələb etmir.</p>
            <a class="uz-open" href="https://facecomparison.toolpie.com/" target="_blank" rel="noopener noreferrer">Aç ↗</a>
          </div>
          <div class="uz-card">
            <h3>🧩 VisageHub <span class="uz-badge">Müqayisə</span></h3>
            <p>İki şəkli müqayisə edir, üzün hər hissəsi üzrə ayrıca uyğunluq faizi və izah verir.</p>
            <a class="uz-open" href="https://www.visagehub.com/compare" target="_blank" rel="noopener noreferrer">Aç ↗</a>
          </div>
          <div class="uz-card">
            <h3>🧑‍🤝‍🧑 Search4Faces <span class="uz-badge">Sosial</span></h3>
            <p>Üz şəkli üzrə sosial şəbəkə (VK / OK) profillərini axtarır.</p>
            <a class="uz-open" href="https://search4faces.com/" target="_blank" rel="noopener noreferrer">Aç ↗</a>
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
      <script>
      (function(){
        var MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        var modelsReady = false;
        var imgs = [null, null];
        function pick(id){ return document.getElementById(id); }
        function setStatus(t, cls){ var e = pick('uzStatus'); if(e){ e.textContent = t; e.className = 'uz-status ' + (cls || ''); } }

        function bindSlot(idx){
          var input = pick('uzFile' + idx), box = pick('uzBox' + idx);
          function loadFile(f){
            if(!f || !/^image\\//.test(f.type)){ setStatus('Yalnız şəkil faylı seçin.', 'err'); return; }
            var r = new FileReader();
            r.onload = function(ev){
              pick('uzPrev' + idx).src = ev.target.result;
              pick('uzPrev' + idx).style.display = 'block';
              pick('uzPh' + idx).style.display = 'none';
              imgs[idx] = ev.target.result;
            };
            r.readAsDataURL(f);
          }
          box.addEventListener('click', function(){ input.click(); });
          input.addEventListener('change', function(){ loadFile(input.files && input.files[0]); });
          box.addEventListener('dragover', function(e){ e.preventDefault(); box.classList.add('uz-drag'); });
          box.addEventListener('dragleave', function(){ box.classList.remove('uz-drag'); });
          box.addEventListener('drop', function(e){ e.preventDefault(); box.classList.remove('uz-drag'); loadFile(e.dataTransfer.files && e.dataTransfer.files[0]); });
        }
        bindSlot(0); bindSlot(1);

        function loadImage(src){ return new Promise(function(res, rej){ var im = new Image(); im.onload = function(){ res(im); }; im.onerror = function(){ rej(new Error('şəkil oxunmadı')); }; im.src = src; }); }

        function ensureModels(){
          if(modelsReady) return Promise.resolve(true);
          if(typeof faceapi === 'undefined'){ setStatus('AI kitabxanası yüklənmədi — internet bağlantısını yoxlayın.', 'err'); return Promise.resolve(false); }
          setStatus('AI modeli yüklənir... (ilk dəfə bir neçə saniyə çəkə bilər)', 'info');
          return faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
            .then(function(){ return faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); })
            .then(function(){ return faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); })
            .then(function(){ modelsReady = true; return true; });
        }

        function descriptor(src){
          return loadImage(src).then(function(im){
            return faceapi.detectSingleFace(im).withFaceLandmarks().withFaceDescriptor();
          }).then(function(det){ return det ? det.descriptor : null; });
        }

        function simPct(dist){
          var s;
          if(dist <= 0.6){ s = 100 - (dist / 0.6) * 20; }
          else { s = 80 - ((dist - 0.6) / 0.5) * 80; }
          return Math.round(Math.max(0, Math.min(100, s)));
        }

        function showResult(dist){
          var pct = simPct(dist);
          var same = dist < 0.6;
          var col = same ? '#16a34a' : (pct >= 55 ? '#f59e0b' : '#ef4444');
          pick('uzPct').textContent = pct + '%';
          pick('uzPct').style.color = col;
          pick('uzVerdict').textContent = same ? '✓ Çox güman eyni şəxsdir' : '✗ Çox güman fərqli şəxslərdir';
          pick('uzVerdict').style.color = col;
          var bar = pick('uzBarIn'); bar.style.background = col; bar.style.width = pct + '%';
          pick('uzDist').textContent = 'Məsafə (distance): ' + dist.toFixed(3) + ' · həddi 0.60-dan kiçik = eyni şəxs';
          pick('uzResult').style.display = 'block';
        }

        function run(){
          if(!imgs[0] || !imgs[1]){ setStatus('Hər iki şəkli yükləyin.', 'err'); return; }
          pick('uzGo').disabled = true;
          pick('uzResult').style.display = 'none';
          ensureModels().then(function(ok){
            if(!ok){ pick('uzGo').disabled = false; return; }
            setStatus('Üzlər analiz edilir...', 'info');
            var d1, d2;
            descriptor(imgs[0]).then(function(d){ d1 = d; return descriptor(imgs[1]); }).then(function(d){
              d2 = d;
              if(!d1){ setStatus('1-ci şəkildə üz tapılmadı — daha aydın, düz baxan şəkil seçin.', 'err'); pick('uzGo').disabled = false; return; }
              if(!d2){ setStatus('2-ci şəkildə üz tapılmadı — daha aydın, düz baxan şəkil seçin.', 'err'); pick('uzGo').disabled = false; return; }
              var dist = faceapi.euclideanDistance(d1, d2);
              setStatus('', '');
              showResult(dist);
              pick('uzGo').disabled = false;
            }).catch(function(e){ setStatus('Xəta: ' + (e && e.message ? e.message : e), 'err'); pick('uzGo').disabled = false; });
          }).catch(function(e){ setStatus('Model yüklənmədi: ' + (e && e.message ? e.message : e), 'err'); pick('uzGo').disabled = false; });
        }

        pick('uzGo').addEventListener('click', run);
      })();
      </script>
    ` : ''}
  ` : ''}
  ${page === 'whois' ? `
    <style>
      .whois-shell{border:1px solid var(--border);border-radius:18px;background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(17,24,39,.92));box-shadow:0 14px 40px rgba(0,0,0,.22);padding:18px}
      .whois-hero{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
      .whois-hero h2{margin:0;color:var(--text);font-size:22px;line-height:1.2}
      .whois-hero p{margin:8px 0 0;color:var(--muted);font-size:14px;line-height:1.55;max-width:760px}
      .whois-panel{margin-top:16px;padding:16px;border:1px solid var(--border);border-radius:16px;background:rgba(2,6,23,.28)}
      .whois-form{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:12px;align-items:end}
      .whois-field{display:flex;flex-direction:column;gap:7px}
      .whois-field span{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
      .whois-field input{background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:13px 14px;font-size:15px;color:var(--text);outline:none;width:100%}
      .whois-field input:focus{border-color:rgba(59,130,246,.55);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
      .whois-result{margin-top:16px}
      .whois-card{margin-top:14px;border-color:rgba(59,130,246,.28)}
      .whois-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
      .whois-head h2{margin:0;color:var(--text);font-size:20px;line-height:1.25}
      .whois-head p{margin:6px 0 0;color:var(--muted);font-size:13px}
      .whois-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
      .whois-grid div{background:rgba(15,23,42,.72);border:1px solid var(--border);border-radius:14px;padding:11px 12px}
      .whois-grid b{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}
      .whois-grid span{display:block;color:var(--text);font-size:14px;font-weight:800;word-break:break-word}
      .whois-boxes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
      .whois-box{border:1px solid var(--border);border-radius:14px;background:rgba(15,23,42,.55);padding:12px}
      .whois-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.10em;color:var(--muted);font-weight:900;margin-bottom:8px}
      .whois-list{display:grid;gap:8px}
      .whois-list-item{border:1px solid var(--border);background:var(--card2);border-radius:10px;padding:9px 11px;color:var(--text);font-size:13px;font-weight:700;word-break:break-word}
      .whois-empty{color:var(--muted);font-size:14px}
      .whois-raw{margin-top:12px}
      .whois-raw summary{cursor:pointer;font-weight:900;color:var(--blue)}
      .whois-raw pre{margin:10px 0 0;padding:12px;background:var(--card2);border:1px solid var(--border);border-radius:10px;white-space:pre-wrap;word-break:break-word;color:var(--text);font-size:12px;line-height:1.55;max-height:340px;overflow:auto}
      @media(max-width:760px){.whois-form,.whois-grid,.whois-boxes{grid-template-columns:1fr}}
    </style>

    <div class="tab-info no-print">WHOIS — domen üçün DNS və RDAP məlumatlarını göstərir. Hazırkı backend <b>DNS/RDAP</b> mənbəyindən işləyir; .az domenlərdə RDAP boş gələ bilər, amma DNS məlumatları göstərilir.</div>

    <section class="card whois-shell">
      <div class="whois-hero">
        <div>
          <div class="eyebrow">DNS / RDAP</div>
          <h2>Domen yoxlaması</h2>
          <p>Domeni yaz, sistem DNS, nameserver, MX, A/AAAA və RDAP qeydiyyat məlumatlarını kart şəklində göstərəcək.</p>
        </div>
      </div>

      <div class="whois-panel no-print">
        <form id="whoisForm" class="whois-form">
          <label class="whois-field">
            <span>Domen</span>
            <input id="whoisInput" name="whoisDomain" placeholder="Məs: google.az, meydan.tv" value="${esc(whoisDomain || q || '')}" autocomplete="off">
          </label>
          <button id="whoisBtn" type="submit">Axtar</button>
        </form>
      </div>

      <div class="whois-panel no-print" style="margin-top:12px">
        <div class="whois-field">
          <span>Raw WHOIS mətni</span>
          <textarea id="whoisRawInput" placeholder="whois.az nəticəsini buraya yapışdır: Info for domain... Email... Name..." style="width:100%;min-height:180px;background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:13px 14px;color:var(--text);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.5;outline:none"></textarea>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <button id="whoisRawBtn" type="button">Raw mətni parse et</button>
          <span style="color:var(--muted);font-size:12px;align-self:center">Captcha varsa, whois.az nəticəsini kopyalayıb burada karta çevir.</span>
        </div>
      </div>

      <div id="whoisResult" class="whois-result"></div>
    </section>

    <script>
    (function(){
      function ge(s){
        return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
          return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
        });
      }
      function arr(v){
        return Array.isArray(v) ? v.filter(Boolean) : [];
      }
      function eventDate(data, name){
        var ev = arr(data && data.events);
        var hit = ev.find(function(x){ return String(x.eventAction || '').toLowerCase() === name; });
        return hit ? String(hit.eventDate || '').slice(0, 19).replace('T', ' ') : '';
      }
      function rdapRegistrar(data){
        var ents = arr(data && data.entities);
        for (var i = 0; i < ents.length; i++) {
          var roles = arr(ents[i].roles).map(function(x){ return String(x).toLowerCase(); });
          if (roles.indexOf('registrar') !== -1 || roles.indexOf('sponsor') !== -1) {
            var vc = ents[i].vcardArray;
            if (Array.isArray(vc) && Array.isArray(vc[1])) {
              for (var j = 0; j < vc[1].length; j++) {
                if (vc[1][j][0] === 'fn') return vc[1][j][3] || '';
              }
            }
          }
        }
        return '';
      }
      function listHtml(items){
        items = arr(items);
        if (!items.length) return '<div class="whois-empty">Tapılmadı</div>';
        return '<div class="whois-list">' + items.map(function(x){
          return '<div class="whois-list-item">' + ge(x) + '</div>';
        }).join('') + '</div>';
      }
      function dnsBox(label, items){
        return '<div class="whois-box"><span class="whois-label">' + ge(label) + '</span>' + listHtml(items) + '</div>';
      }
      function contactBox(c){
        c = c || {};
        var rows = [
          ['Handle', c.handle],
          ['Status', c.status],
          ['Email', c.email],
          ['Telefon', c.phone],
          ['Fax', c.fax],
          ['Organisation', c.organisation],
          ['Name', c.name],
          ['Country', c.country],
          ['Province', c.province],
          ['City', c.city],
          ['Street', c.street],
          ['Postal code', c.postal_code]
        ].filter(function(x){ return x[1] && String(x[1]).trim() && String(x[1]).indexOf('[Not published]') === -1; });
        if (!rows.length) return '';
        return '<div class="whois-box"><span class="whois-label">Contact: ' + ge(c.handle || '—') + '</span><div class="whois-list">' +
          rows.map(function(r){ return '<div class="whois-list-item"><b style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em">' + ge(r[0]) + '</b><br>' + ge(r[1]) + '</div>'; }).join('') +
          '</div></div>';
      }
      function setResult(html){
        var el = document.getElementById('whoisResult');
        if (el) el.innerHTML = html;
      }
      async function runWhois(domain){
        domain = String(domain || '').trim();
        if (!domain) {
          setResult('<div class="msg err">Domen yaz.</div>');
          return;
        }
        setResult('<div class="msg info">WHOIS / DNS məlumatları alınır...</div>');
        try {
          var r = await fetch('/api/whois?q=' + encodeURIComponent(domain), { cache: 'no-store' });
          var j = await r.json();
          if (!j.ok) {
            setResult('<div class="msg err">WHOIS alınmadı: ' + ge(j.error || 'naməlum xəta') + '</div>');
            return;
          }
          var dns = j.dns || {};
          var parsed = j.parsed || {};
          var rd = j.rdapDomain && Object.keys(j.rdapDomain).length ? j.rdapDomain : {};
          var statuses = arr(parsed.statuses).concat(arr(rd.status));
          var contacts = arr(parsed.contacts);
          var registrar = rdapRegistrar(rd) || parsed.organisation || '';
          var ownerName = parsed.name || arr(parsed.names)[0] || '';
          var ownerEmail = parsed.email || arr(parsed.emails)[0] || '';
          var created = parsed.created || eventDate(rd, 'registration') || '';
          var updated = parsed.updated || eventDate(rd, 'last changed') || eventDate(rd, 'last update of RDAP database') || '';
          var expires = parsed.expires || eventDate(rd, 'expiration') || '';
          var nameservers = arr(parsed.nameServers).length ? arr(parsed.nameServers) : arr(dns.NS);

          setResult(
            '<div class="itobb-detail-card whois-card">' +
              '<div class="whois-head">' +
                '<div>' +
                  '<div class="eyebrow">WHOIS nəticəsi</div>' +
                  '<h2>' + ge(j.domain || domain) + '</h2>' +
                  '<p>' + ge(j.source || 'DNS/RDAP') + '</p>' +
                '</div>' +
                '<div class="guncelle-badges">' +
                  (statuses.length ? '<span class="rel-badge check">' + ge(statuses[0]) + '</span>' : '<span class="rel-badge good">DNS tapıldı</span>') +
                '</div>' +
              '</div>' +
              '<div class="whois-grid">' +
                '<div><b>Ad / registrant</b><span>' + ge(ownerName || '—') + '</span></div>' +
                '<div><b>Email</b><span>' + ge(ownerEmail || '—') + '</span></div>' +
                '<div><b>Registrar / qurum</b><span>' + ge(registrar || '—') + '</span></div>' +
                '<div><b>Bitmə tarixi</b><span>' + ge(expires || '—') + '</span></div>' +
              '</div>' +
              '<div class="whois-boxes">' +
                dnsBox('Name servers', nameservers) +
                dnsBox('A records', arr(dns.A)) +
                dnsBox('AAAA records', arr(dns.AAAA)) +
                dnsBox('MX records', arr(dns.MX)) +
                dnsBox('TXT records', arr(dns.TXT)) +
                dnsBox('Status', statuses) +
              '</div>' +
              (contacts.length ? '<div class="whois-boxes">' + contacts.map(contactBox).join('') + '</div>' : '') +
              '<details class="whois-raw"><summary>RDAP / raw JSON</summary><pre>' + ge(JSON.stringify(j, null, 2)) + '</pre></details>' +
            '</div>'
          );
        } catch(e) {
          setResult('<div class="msg err">WHOIS sorğusu alınmadı: ' + ge(e.message || e) + '</div>');
        }
      }

      async function parseRawWhois(){
        var rawEl = document.getElementById('whoisRawInput');
        var input = document.getElementById('whoisInput');
        var raw = rawEl ? rawEl.value.trim() : '';
        var domain = input ? input.value.trim() : '';
        if (!raw) {
          setResult('<div class="msg err">Raw WHOIS mətnini yapışdır.</div>');
          if (rawEl) rawEl.focus();
          return;
        }
        setResult('<div class="msg info">Raw WHOIS parse edilir...</div>');
        try {
          var body = new URLSearchParams({ raw: raw, q: domain });
          var r = await fetch('/api/whois?q=' + encodeURIComponent(domain), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: body.toString(),
            cache: 'no-store'
          });
          var j = await r.json();
          if (!j.ok) {
            setResult('<div class="msg err">Raw parse alınmadı: ' + ge(j.error || 'naməlum xəta') + '</div>');
            return;
          }
          // Eyni kart rendererindən istifadə etmək üçün süni inputla yenidən render:
          var oldFetch = window.fetch;
          setResult('<div class="msg info">Kart hazırlanır...</div>');
          // kart kodunu təkrarlamamaq üçün aşağıda lokal render hissəsini çağırırıq:
          renderWhoisResult(j, domain);
        } catch(e) {
          setResult('<div class="msg err">Raw parse sorğusu alınmadı: ' + ge(e.message || e) + '</div>');
        }
      }

      function renderWhoisResult(j, domain){
        form.addEventListener('submit', function(e){
          e.preventDefault();
          runWhois(input ? input.value : '');
        });
      }
      if (input && input.value.trim()) runWhois(input.value);
    })();
    </script>
  ` : ''}


  ${page === 'cbar' ? `
    <div class="subtabs no-print">
      <a class="${!url_cbarMode || url_cbarMode === 'search' ? 'active' : ''}" href="/?page=cbar">Axtarış</a>
      <a class="${url_cbarMode === 'stats' ? 'active' : ''}" href="/?page=cbar&cbarMode=stats">Statistika</a>
    </div>

    ${url_cbarMode !== 'stats' ? `
      <div class="msg warn no-print">Bank/şirkət adı, VÖEN, lisenziya, ünvan yazın — <b>yazdıqca axtarır</b> (FTS5).</div>
      <div class="search-form">
        <input id="cbarLiveInput" placeholder="Bank/şirkət adı, VÖEN, lisenziya, ünvan... — yazdıqca axtarır" autocomplete="off" spellcheck="false" style="flex:1">
      </div>
      <div id="cbarLiveStatus" class="etndr-status" style="margin:8px 2px">Ən azı 2 hərf yazın...</div>
      <div id="cbarLiveResults"></div>
      <script>
      (function(){
        var inp=document.getElementById('cbarLiveInput'), out=document.getElementById('cbarLiveResults'), st=document.getElementById('cbarLiveStatus'), timer, lastReq=0;
        function se(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
        function rx(l,v){ return v?('<tr><td class="label">'+l+'</td><td class="value">'+se(v)+'</td></tr>'):''; }
        function card(r){
          var sb=r.status?('<span class="badge '+(/aktiv/i.test(r.status)?'good':'bad')+'">'+se(r.status)+'</span>'):'';
          return '<div class="card"><div class="card-head"><div class="logo" style="font-size:11px;font-weight:900;background:linear-gradient(135deg,#1e3a8a,#3b82f6)">CBAR</div>'+
            '<div><h2>'+se(r.ad||'Qurum')+'</h2><p>'+se(r.kateqoriya||'CBAR reyestr')+'</p></div><div class="status">'+sb+'</div></div><table>'+
            rx('Ad', r.ad)+rx('Kateqoriya', r.kateqoriya)+rx('Huquqi forma', r.huquqi_forma)+rx('VOEN', r.voen)+
            rx('Lisenziya', r.lis_no)+rx('Lisenziya tarixi', r.lis_tarix)+rx('Legv tarixi', r.legv_tarix)+rx('Status', r.status)+
            rx('Unvan', r.unvan)+rx('Telefon', r.telefon)+rx('Website', r.website)+rx('Email', r.email)+rx('Faaliyet', r.faaliyet)+
            '</table></div>';
        }
        function run(q){ var my=++lastReq;
          fetch('/api/live?db=cbar&q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
            if(my!==lastReq)return; if(d&&d.ok===false){st.textContent='Xeta: '+(d.error||'');out.innerHTML='';return;}
            var res=(d&&d.results)||[]; if(!res.length){st.textContent='Netice tapilmadi';out.innerHTML='';return;}
            st.textContent=res.length+' netice'+(res.length>=40?'+ (ilk 40)':''); out.innerHTML=res.map(card).join('');
          }).catch(function(){ if(my===lastReq) st.textContent='Axtaris alinmadi'; });
        }
        inp.addEventListener('input',function(){ clearTimeout(timer); var q=inp.value.trim();
          if(q.length<2){st.textContent='En azi 2 herf yazin...';out.innerHTML='';return;}
          st.textContent='Axtarilir...'; timer=setTimeout(function(){run(q);},220); });
        inp.focus();
      })();
      </script>
    ` : ''}

    ${url_cbarMode === 'stats' && cbarStats ? `
      <div class="card">
        <div class="card-head">
          <div class="logo" style="font-size:11px;font-weight:900;background:linear-gradient(135deg,#1e3a8a,#3b82f6)">CBAR</div>
          <div><h2>CBAR bazasının statistikası</h2><p>Mərkəzi Bank reyestr məlumatları — birləşdirilmiş baza</p></div>
        </div>
        <table>
          ${row('Ümumi qeyd sayı',    esc(String(cbarStats.stats?.umumi_qeyd || '')))}
          ${row('Aktiv',              esc(String(cbarStats.stats?.aktiv || '')))}
          ${row('Ləğv edilmiş',       esc(String(cbarStats.stats?.legv_edilmis || '')))}
          ${row('Rəhbər qeydləri',    esc(String(cbarStats.stats?.rehber_qeydleri || '')))}
          ${row('VÖEN olan',          esc(String(cbarStats.stats?.voen_olan || '')))}
          ${row('Vebsayt olan',       esc(String(cbarStats.stats?.website_olan || '')))}
          ${row('Son yenilənmə',      esc(String(cbarStats.stats?.son_yenilenme || '')))}
          ${(cbarStats.categories || []).map(c => row(esc(c.kateqoriya), `<b>${esc(String(c.sayi))}</b> qeyd`)).join('')}
        </table>
      </div>
    ` : url_cbarMode === 'stats' && error ? '' : url_cbarMode === 'stats' ? '<div class="msg warn">Statistika yüklənir...</div>' : ''}
  ` : ''}


  ${page === 'smab' ? `
    <div class="subtabs no-print">
      <a class="${smabSub !== 'corona' ? 'active' : ''}" href="/?page=smab">🔎 SMAB Axtarış</a>
      <a class="${smabSub === 'corona' ? 'active' : ''}" href="/?page=smab&smabSub=corona">🦠 CORONA</a>
    </div>
    ${smabSub === 'corona' ? `
      <div class="msg warn no-print">Korona dövrü sosial yardım bazası — ad, telefon, ünvan, pasport/ID, diaqnoz, həkim yazın — <b>yazdıqca axtarır</b> (FTS5).</div>
      <div class="search-form">
        <input id="coronaLiveInput" placeholder="AD SOYAD, telefon, ünvan, diaqnoz... — yazdıqca axtarır" autocomplete="off" spellcheck="false" style="text-transform:uppercase;letter-spacing:.04em;flex:1">
      </div>
      <div id="coronaLiveStatus" class="etndr-status" style="margin:8px 2px">Ən azı 2 hərf yazın...</div>
      <div id="coronaLiveResults"></div>
      <script>
      (function(){
        var inp=document.getElementById('coronaLiveInput'), out=document.getElementById('coronaLiveResults'), st=document.getElementById('coronaLiveStatus'), timer, lastReq=0;
        function se(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
        function rx(l,v){ return v?('<tr><td class="label">'+l+'</td><td class="value">'+se(v)+'</td></tr>'):''; }
        function card(r){
          return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#7c2d12,#ea580c)">CRN</div>'+
            '<div><h2>'+se(r.full_name||'Qeyd')+'</h2><p>Korona qeydi'+(r.event_date?' - '+se(r.event_date):'')+'</p></div></div><table>'+
            rx('Ad Soyad', r.full_name)+rx('Dogum', r.birth_date)+rx('Yas', r.age)+rx('Telefon', r.phone)+
            rx('Unvan', r.address)+rx('Diaqnoz', r.diagnosis)+rx('Xestexana', r.hospitalization)+rx('Sobe', r.department)+
            rx('Hekim', r.doctor)+rx('Pasport/ID', r.id_passport)+rx('Tarix', r.event_date)+rx('Menbe fayl', r.source_file)+
            '</table></div>';
        }
        function run(q){ var my=++lastReq;
          fetch('/api/live?db=corona&q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
            if(my!==lastReq)return; if(d&&d.ok===false){st.textContent='Xeta: '+(d.error||'');out.innerHTML='';return;}
            var res=(d&&d.results)||[]; if(!res.length){st.textContent='Netice tapilmadi';out.innerHTML='';return;}
            st.textContent=res.length+' netice'+(res.length>=40?'+ (ilk 40)':''); out.innerHTML=res.map(card).join('');
          }).catch(function(){ if(my===lastReq) st.textContent='Axtaris alinmadi'; });
        }
        inp.addEventListener('input',function(){ clearTimeout(timer); var q=inp.value.trim();
          if(q.length<2){st.textContent='En azi 2 herf yazin...';out.innerHTML='';return;}
          st.textContent='Axtarilir...'; timer=setTimeout(function(){run(q);},220); });
        inp.focus();
      })();
      </script>
    ` : `
      <div class="msg warn no-print">Sosial Müavinət Axtarış Bazası — ad-soyad yazın, <b>yazdıqca axtarır</b> (600.000 qeyd, FTS5).</div>
      <div class="search-form">
        <input id="smabInput" placeholder="AD SOYAD ATA ADI yazın — yazdıqca axtarır..." autocomplete="off" spellcheck="false" style="text-transform:uppercase;letter-spacing:.04em;flex:1">
      </div>
      <div id="smabStatus" class="etndr-status" style="margin:8px 2px">Ən azı 2 hərf yazın...</div>
      <div id="smabResults"></div>
      <script>
      (function(){
        var inp=document.getElementById('smabInput');
        var out=document.getElementById('smabResults');
        var st=document.getElementById('smabStatus');
        var timer, lastReq=0;
        function se(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');}
        function card(r){
          return '<div class="card"><div class="card-head">'+
            '<div class="logo" style="background:linear-gradient(135deg,#0e7490,#06b6d4)">SMAB</div>'+
            '<div><h2>'+se(r.name)+'</h2><p>Sosial müavinət alıcısı</p></div></div>'+
            '<table>'+
            '<tr><td class="label">Ad Soyad Ata adı</td><td class="value">'+se(r.name)+'</td></tr>'+
            '<tr><td class="label">Şəxsiyyət (gizli)</td><td class="value">'+se(r.masked_id)+'</td></tr>'+
            '<tr><td class="label">Tarix</td><td class="value">'+se(r.tarix)+'</td></tr>'+
            '</table></div>';
        }
        function run(q){
          var my=++lastReq;
          fetch('/api/smab?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
            if(my!==lastReq) return;
            if(d && d.ok===false){ st.textContent='Xeta: '+(d.error||''); out.innerHTML=''; return; }
            var res=(d&&d.results)||[];
            if(!res.length){ st.textContent='Netice tapilmadi'; out.innerHTML=''; return; }
            st.textContent=res.length+' netice'+(res.length>=40?'+ (ilk 40)':'');
            out.innerHTML=res.map(card).join('');
          }).catch(function(){ if(my===lastReq){ st.textContent='Axtaris alinmadi'; } });
        }
        inp.addEventListener('input', function(){
          clearTimeout(timer);
          var q=inp.value.trim();
          if(q.length<2){ st.textContent='En azi 2 herf yazin...'; out.innerHTML=''; return; }
          st.textContent='Axtarilir...';
          timer=setTimeout(function(){ run(q); }, 220);
        });
        inp.focus();
      })();
      </script>
    `}
  ` : ''}

  ${page === 'corona' ? `
    <div class="subtabs no-print">
      <a class="${!url_coronaMode || url_coronaMode === 'search' ? 'active' : ''}" href="/?page=corona">Axtarış</a>
      <a class="${url_coronaMode === 'stats' ? 'active' : ''}" href="/?page=corona&coronaMode=stats">Statistika</a>
    </div>

    ${url_coronaMode !== 'stats' ? `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="corona">
        <input name="q" placeholder="AD SOYAD ATA ADI, telefon, ünvan, pasport/ID, diaqnoz, həkim..." value="${esc(q)}" style="text-transform:uppercase;letter-spacing:.04em">
        <button type="submit">Axtar</button>
      </form>
      <div id="liveZone">
      ${coronaResults.length
        ? `<div class="count">${coronaResults.length} nəticə — "${esc(q)}"</div>${coronaResults.map(coronaCard).join('')}`
        : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>`
        : '<div class="msg warn">Ad, telefon, ünvan, pasport/ID, diaqnoz, həkim və ya fayl adı üzrə axtar. Adlar nəticədə CAPS LOCK göstərilir.</div>'}
      </div>
    ` : ''}

    ${url_coronaMode === 'stats' && coronaStats ? coronaStatsCard(coronaStats)
      : url_coronaMode === 'stats' && error ? ''
      : url_coronaMode === 'stats' ? '<div class="msg warn">Statistika yüklənir...</div>' : ''}
  ` : ''}

  ${page === 'aram' ? `
    <form method="GET" class="search-form">
      <input type="hidden" name="page" value="aram">
      <input name="q" placeholder="Qərar mətni, iş nömrəsi, hakim adı..." value="${esc(q)}">
      <button type="submit">Axtar</button>
    </form>
    <div class="msg warn">ARAM burada stabil axtarış rejimində işləyir. Tam qərar mətni və PDF üçün rəsmi ARAM keçidindən istifadə edin.</div>
    ${aramSections.length ? `
      <div class="card">
        <div class="actions">
          ${aramSections.map(s => b(`${s.title || 'Bölmə'}: ${s.count || 0}`, 'gray')).join('')}
        </div>
      </div>
    ` : ''}
    ${aramResults.length
      ? `<div class="count">${esc(String(aramTotal || aramResults.length))} nəticə — "${esc(q)}"</div>${aramResults.map(r => aramCard(r, q)).join('')}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}


  ${page === 'tobb' ? (() => {
    const active = tobbMode || 'gazete';
    const tSicil = esc(url_SicilMudurluguId || '');
    const tSicNo = esc(url_TicSicNo || '');
    const tUnvan = esc(url_TicaretUnvani || '');
    const tT1 = esc(url_Tarih1 || '');
    const tT2 = esc(url_Tarih2 || '');
    const personQ = esc(url.searchParams.get('personQ') || q || '');
    const itobbSicil = esc(url.searchParams.get('itobbSicil') || '');
    const itobbParams = esc(url.searchParams.get('itobbParams') || '');
    const itobbDetailParams = esc(url.searchParams.get('itobbDetailParams') || '');
    const searched = !!(url_SicilMudurluguId || url_TicSicNo || url_TicaretUnvani);
    return `
    <div class="subtabs no-print">
      <a class="${active === 'gazete' ? 'active' : ''}" href="/?page=tobb&tobbMode=gazete">TOBB Qəzetə</a>
      <a class="${active === 'person' ? 'active' : ''}" href="/?page=tobb&tobbMode=person">TOBB Şəxs axtarışı</a>
      <a class="${active === 'itobb' ? 'active' : ''}" href="/?page=tobb&tobbMode=itobb">İTOBB</a>
      <a class="${active === 'guncelle' ? 'active' : ''}" href="/?page=tobb&tobbMode=guncelle">Güncelle</a>
    </div>

    ${active === 'gazete' ? `
      <div class="msg warn no-print">🇹🇷 Türkiyə Ticarət Sicili Qəzetəsi elanları — Sicil Müdürlüğü siyahıdan seçilir; İstanbul birinci göstərilir.</div>
      <form method="GET" class="search-form etndr-form">
        <input type="hidden" name="page" value="tobb">
        <input type="hidden" name="tobbMode" value="gazete">
        <select name="SicilMudurluguId" class="selectbox tobb-select" required>
          ${(tobbMudurlukOptions && tobbMudurlukOptions.length ? tobbMudurlukOptions : [{id:'232', name:'İSTANBUL'}]).map(o => `<option value="${esc(o.id || '')}" ${(String(o.id || '') === String(url_SicilMudurluguId || '232')) ? 'selected' : ''}>${esc(o.name || o.id || '')}</option>`).join('')}
        </select>
        <input name="TicSicNo" placeholder="Sicil No (məs: 465218-5)" value="${tSicNo}">
        <input name="TicaretUnvani" placeholder="Ticarət Ünvanı (şirkət adı)" value="${tUnvan}">
        <input name="Tarih1" placeholder="gg.aa.yyyy (başlanğıc)" value="${tT1}">
        <input name="Tarih2" placeholder="gg.aa.yyyy (son)" value="${tT2}">
        <button type="submit">Axtar</button>
      </form>
      ${tobbResults.length ? `<div class="count">${esc(tobbBaslik || (tobbResults.length + ' elan'))}</div>${tobbResults.map(tobbCard).join('')}` : searched && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
    ` : ''}

    ${active === 'person' ? `
      <div class="msg warn no-print">TOBB Şəxs axtarışı — OCR ilə artıq oxunmuş PDF indeksində şəxsin qurucu, müdür və ya mətndə keçən izlərini axtarır. Yeni namizədlər “Namizəd PDF-ləri topla” ilə queue-ya əlavə olunur; cron onları arxa planda oxuyur.</div>
      <form method="GET" class="search-form etndr-form">
        <input type="hidden" name="page" value="tobb">
        <input type="hidden" name="tobbMode" value="person">
        <input name="personQ" placeholder="Ad Soyad (məs: Ahmet Dündar)" value="${personQ}" required>
        <select name="SicilMudurluguId" class="selectbox tobb-select">
          ${(tobbMudurlukOptions && tobbMudurlukOptions.length ? tobbMudurlukOptions : [{id:'232', name:'İSTANBUL'}]).map(o => `<option value="${esc(o.id || '')}" ${(String(o.id || '') === String(url_SicilMudurluguId || '232')) ? 'selected' : ''}>${esc(o.name || o.id || '')}</option>`).join('')}
        </select>
        <select name="personAction" class="selectbox">
          <option value="search" ${(url.searchParams.get('personAction') || 'search') === 'search' ? 'selected' : ''}>İndeksdə axtar</option>
          <option value="seed" ${url.searchParams.get('personAction') === 'seed' ? 'selected' : ''}>Namizəd PDF-ləri topla</option>
        </select>
        <input name="max" placeholder="max" value="${esc(url.searchParams.get('max') || '30')}" style="max-width:90px">
        <button type="submit">İcra et</button>
      </form>
      ${tobbStatsData ? `<div class="mini-grid">${b('Queue: ' + ((tobbStatsData.queue && tobbStatsData.queue.queued) || 0), 'gray')}${b('Done: ' + ((tobbStatsData.queue && tobbStatsData.queue.done) || 0), 'green')}${b('OCR index: ' + ((tobbStatsData.index && tobbStatsData.index.indexed_docs) || 0), 'gray')}${b('Əlaqə: ' + ((tobbStatsData.index && tobbStatsData.index.relations) || 0), 'blue')}</div>` : ''}
      ${tobbStatsData ? tobbPersonStatsBox(tobbStatsData) : ''}
      ${tobbSeedData ? tobbSeedBox(tobbSeedData) : ''}
      ${tobbPersonData ? tobbPersonBox(tobbPersonData) : (personQ && !error ? `<div class="msg err">[${esc(personQ)}] - Heç bir nəticə tapılmadı.</div>` : '')}
    ` : ''}

    ${active === 'itobb' ? `
      <div class="msg warn no-print">İstanbul Ticaret Odası Bilgi Bankası məlumatları. Axtarış nəticəsi <code>commerce-reg-no</code>, şirkət kartı isə <code>company-detail</code> API-dən gəlir. 1107659 üçün test params əlavə olunub.</div>
      <form method="GET" class="search-form etndr-form">
        <input type="hidden" name="page" value="tobb">
        <input type="hidden" name="tobbMode" value="itobb">
        <input name="itobbSicil" placeholder="Sicil No (məs: 1107659)" value="${itobbSicil}">
        <input name="itobbParams" placeholder="İTOBB commerce-reg-no params" value="${itobbParams}">
        <input name="itobbDetailParams" placeholder="İTOBB company-detail params" value="${itobbDetailParams}">
        <button type="submit">İTOBB axtar</button>
      </form>
      ${itobbData ? itobbBox(itobbData, itobbDetailData) : ''}
    ` : ''}

    ${active === 'guncelle' ? `
      <style>
        .guncelle-shell{border:1px solid var(--border);border-radius:18px;background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(17,24,39,.92));box-shadow:0 14px 40px rgba(0,0,0,.22);padding:18px}
        .guncelle-hero{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
        .guncelle-hero h2{margin:0;color:var(--text);font-size:22px;line-height:1.2}
        .guncelle-hero p{margin:8px 0 0;color:var(--muted);font-size:14px;line-height:1.55;max-width:760px}
        .guncelle-steps{display:flex;flex-wrap:wrap;gap:8px}
        .guncelle-step{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(59,130,246,.10);border:1px solid rgba(59,130,246,.25);color:var(--text);font-size:12px;font-weight:800;letter-spacing:.02em}
        .guncelle-step b{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:rgba(59,130,246,.18);color:var(--blue);font-size:11px}
        .guncelle-panel{margin-top:16px;padding:16px;border:1px solid var(--border);border-radius:16px;background:rgba(2,6,23,.28)}
        .guncelle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .guncelle-field{display:flex;flex-direction:column;gap:7px}
        .guncelle-field span{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
        .guncelle-field small{font-size:11px;font-weight:700;color:var(--soft);text-transform:none;letter-spacing:0}
        .guncelle-field input{background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:13px 14px;font-size:15px;color:var(--text);outline:none;width:100%}
        .guncelle-field input:focus{border-color:rgba(59,130,246,.55);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .guncelle-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px}
        .guncelle-btn.secondary{background:var(--card2);border:1px solid var(--border);color:var(--text)}
        .guncelle-tip{font-size:12px;color:var(--muted)}
        .guncelle-captcha-box{margin-top:16px;border-top:1px solid var(--border);padding-top:16px}
        .guncelle-captcha-box[hidden]{display:none!important}
        .guncelle-captcha-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
        .guncelle-captcha-head strong{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--text)}
        .guncelle-captcha-head span{font-size:12px;color:var(--muted)}
        .guncelle-captcha-row{display:grid;grid-template-columns:180px minmax(0,1fr);gap:12px;align-items:start}
        .guncelle-captcha-preview{display:flex;align-items:center;justify-content:center;min-height:88px;padding:10px;border-radius:14px;background:#fff;border:1px solid var(--border)}
        .guncelle-captcha-preview img{max-width:100%;height:auto;display:block}
        .guncelle-result{margin-top:16px}
        .guncelle-company-card{margin-top:14px;border-color:rgba(34,197,94,.28)}
        .guncelle-company-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
        .guncelle-company-head h2{margin:0;color:var(--text);font-size:20px;line-height:1.25}
        .guncelle-company-head p{margin:6px 0 0;color:var(--muted);font-size:13px}
        .guncelle-badges{display:flex;flex-wrap:wrap;gap:8px}
        .guncelle-contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
        .guncelle-contact-box{border:1px solid var(--border);border-radius:14px;background:rgba(15,23,42,.55);padding:12px}
        .guncelle-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.10em;color:var(--muted);font-weight:900;margin-bottom:8px}
        .guncelle-list{display:grid;gap:8px}
        .guncelle-list-item{border:1px solid var(--border);background:var(--card2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:15px;font-weight:700;word-break:break-word}
        .guncelle-list-item a{color:var(--blue);text-decoration:none;word-break:break-word}
        .guncelle-list-item a:hover{text-decoration:underline}
        .guncelle-empty{color:var(--muted);font-size:14px}
        .guncelle-raw{margin-top:12px}
        .guncelle-raw summary{cursor:pointer;font-weight:900;color:var(--blue)}
        .guncelle-raw pre{margin:10px 0 0;padding:12px;background:var(--card2);border:1px solid var(--border);border-radius:10px;white-space:pre-wrap;word-break:break-word;color:var(--text);font-size:12px;line-height:1.55;max-height:280px;overflow:auto}
        @media(max-width:760px){
          .guncelle-grid,.guncelle-contact-grid,.guncelle-captcha-row{grid-template-columns:1fr}
          .guncelle-step{width:100%}
        }
      </style>

      <div class="tab-info no-print">Güncelle — İTO Güncelle sistemindən captcha ilə şirkətin telefon və e-mail məlumatını çəkir. Sıra belədir: <b>1)</b> Sicil No yaz, <b>2)</b> Captcha gətir, <b>3)</b> kodu yazıb axtar.</div>

      <section class="card guncelle-shell">
        <div class="guncelle-hero">
          <div>
            <div class="eyebrow">İTO Güncelle</div>
            <h2>Güncelle əlaqə axtarışı</h2>
            <p>Bu hissə İTO Güncelle nəticəsindən əlaqə məlumatlarını çıxarır. Dizayn indi TOBB / İTOBB kartları ilə eyni üsluba salınıb.</p>
          </div>
          <div class="guncelle-steps no-print">
            <span class="guncelle-step"><b>1</b> Sicil No</span>
            <span class="guncelle-step"><b>2</b> Captcha gətir</span>
            <span class="guncelle-step"><b>3</b> Kodu yaz və axtar</span>
          </div>
        </div>

        <div class="guncelle-panel">
          <div class="guncelle-grid">
            <label class="guncelle-field">
              <span>Sicil No</span>
              <input id="gunSicil" type="text" inputmode="numeric" placeholder="Məs: 1107659" value="${esc(url.searchParams.get('SicilNo') || url.searchParams.get('itobbSicil') || '')}">
            </label>

            <label class="guncelle-field">
              <span>Vergi No <small>istəyə bağlı</small></span>
              <input id="gunVergi" type="text" inputmode="numeric" placeholder="Boş qala bilər" value="${esc(url.searchParams.get('VergiNo') || '')}">
            </label>
          </div>

          <div class="guncelle-actions no-print">
            <button id="gunCaptchaBtn" type="button">Captcha gətir</button>
            <span class="guncelle-tip">Əvvəl captcha gətir, sonra aşağıda 4 hərfli kodu daxil et.</span>
          </div>

          <div id="gunCaptchaBox" class="guncelle-captcha-box" hidden>
            <input id="gunToken" type="hidden">

            <div class="guncelle-captcha-head">
              <div>
                <strong>Captcha yoxlaması</strong><br>
                <span>Şəkildəki kodu olduğu kimi daxil et.</span>
              </div>
              <button id="gunRefreshBtn" type="button" class="guncelle-btn secondary no-print">Yenilə</button>
            </div>

            <div class="guncelle-captcha-row">
              <div class="guncelle-captcha-preview"><img id="gunCaptchaImg" alt="Captcha"></div>

              <div>
                <label class="guncelle-field">
                  <span>Captcha kodu</span>
                  <input id="gunCaptchaText" type="text" maxlength="4" placeholder="Məs: ABCD" autocomplete="off">
                </label>

                <div class="guncelle-actions no-print">
                  <button id="gunSubmitBtn" type="button">Axtar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="gunResult" class="guncelle-result"></div>
      </section>

      <script>
      (function(){
        function ge(s){
          return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
          });
        }

        function telHref(v){
          return String(v == null ? '' : v).replace(/[^\d+]/g, '');
        }

        function setResult(html){
          var result = document.getElementById('gunResult');
          if (result) result.innerHTML = html;
        }

        function showCaptchaBox(show){
          var box = document.getElementById('gunCaptchaBox');
          if (!box) return;
          if (show) box.removeAttribute('hidden');
          else box.setAttribute('hidden', 'hidden');
        }

        async function loadCaptcha(){
          var sicilEl = document.getElementById('gunSicil');
          var sicil = sicilEl ? sicilEl.value.trim() : '';

          if (!sicil) {
            setResult('<div class="msg err">Əvvəlcə Sicil No yaz.</div>');
            if (sicilEl) sicilEl.focus();
            return;
          }

          setResult('<div class="msg info">Captcha gətirilir...</div>');

          try {
            var url = '/api/tobb-guncelle?action=guncelle_captcha&sicil=' + encodeURIComponent(sicil);
            var r = await fetch(url, { cache: 'no-store' });
            var j = await r.json();

            if (!j.ok) {
              setResult('<div class="msg err">Captcha alınmadı: ' + ge(j.error || 'naməlum xəta') + '</div>');
              showCaptchaBox(false);
              return;
            }

            document.getElementById('gunToken').value = j.token || '';
            document.getElementById('gunCaptchaImg').src = j.captcha_data_url || '';
            document.getElementById('gunCaptchaText').value = '';
            showCaptchaBox(true);
            setResult('<div class="msg ok">Captcha hazırdır. İndi kodu yazıb axtar düyməsini bas.</div>');
            document.getElementById('gunCaptchaText').focus();
          } catch(e) {
            setResult('<div class="msg err">Captcha sorğusu alınmadı: ' + ge(e.message || e) + '</div>');
            showCaptchaBox(false);
          }
        }

        async function submitGuncelle(){
          var sicilEl = document.getElementById('gunSicil');
          var captchaEl = document.getElementById('gunCaptchaText');

          var sicil = (sicilEl || {}).value || '';
          var vergi = (document.getElementById('gunVergi') || {}).value || '';
          var token = (document.getElementById('gunToken') || {}).value || '';
          var captcha = (captchaEl || {}).value || '';

          sicil = sicil.trim();
          vergi = vergi.trim();
          token = token.trim();
          captcha = captcha.trim();

          if (!sicil) {
            setResult('<div class="msg err">Sicil No boş ola bilməz.</div>');
            if (sicilEl) sicilEl.focus();
            return;
          }
          if (!token) {
            setResult('<div class="msg err">Əvvəlcə Captcha gətir düyməsini bas.</div>');
            return;
          }
          if (!captcha) {
            setResult('<div class="msg err">Captcha kodunu daxil et.</div>');
            if (captchaEl) captchaEl.focus();
            return;
          }

          setResult('<div class="msg info">Güncelle nəticəsi alınır...</div>');

          try {
            var qs = new URLSearchParams({
              action: 'guncelle_submit',
              sicil: sicil,
              vergi: vergi,
              token: token,
              captcha: captcha
            });

            var r = await fetch('/api/tobb-guncelle?' + qs.toString(), { cache: 'no-store' });
            var j = await r.json();

            if (!j.ok) {
              setResult('<div class="msg err"><b>Nəticə alınmadı.</b><br>' + ge(j.error || 'Captcha səhv ola bilər. Yenidən captcha gətir.') + '</div>');
              return;
            }

            var c = j.company || {};
            var contact = j.contact || {};
            var phones = Array.isArray(contact.phones) ? contact.phones : [];
            var emails = Array.isArray(contact.emails) ? contact.emails : [];

            var phoneHtml = phones.length
              ? '<div class="guncelle-list">' + phones.map(function(p){
                  var clean = telHref(p);
                  return '<div class="guncelle-list-item">' + (clean ? '<a href="tel:' + ge(clean) + '">' + ge(p) + '</a>' : ge(p)) + '</div>';
                }).join('') + '</div>'
              : '<div class="guncelle-empty">Telefon / GSM tapılmadı</div>';

            var emailHtml = emails.length
              ? '<div class="guncelle-list">' + emails.map(function(e){
                  return '<div class="guncelle-list-item"><a href="mailto:' + ge(e) + '">' + ge(e) + '</a></div>';
                }).join('') + '</div>'
              : '<div class="guncelle-empty">E-mail tapılmadı</div>';

            var statusBadge = c.guncellenmismi === '1'
              ? '<span class="rel-badge good">Güncellenmiş</span>'
              : (c.guncellenmismi ? '<span class="rel-badge check">Güncellenmişmi: ' + ge(c.guncellenmismi) + '</span>' : '');

            setResult(
              '<div class="msg ok">Nəticə uğurla alındı.</div>' +
              '<div class="itobb-detail-card guncelle-company-card">' +
                '<div class="guncelle-company-head">' +
                  '<div>' +
                    '<div class="eyebrow">Güncelle nəticəsi</div>' +
                    '<h2>' + ge(c.unvan || 'Şirkət') + '</h2>' +
                    '<p>İTO Güncelle nəticəsindən çıxarılan əlaqə məlumatları</p>' +
                  '</div>' +
                  '<div class="guncelle-badges">' + statusBadge + '</div>' +
                '</div>' +
                '<div class="itobb-grid detail-grid" style="margin-top:14px">' +
                  '<div><b>Sicil No</b><span>' + ge(c.sicil_no || sicil) + '</span></div>' +
                  '<div><b>Vergi No</b><span>' + ge(c.vergi_no || vergi || '—') + '</span></div>' +
                  '<div><b>Firma ID</b><span>' + ge(c.firma_id || '—') + '</span></div>' +
                  '<div><b>Mənbə</b><span>guncelle.ito.org.tr</span></div>' +
                '</div>' +
                '<div class="guncelle-contact-grid">' +
                  '<div class="guncelle-contact-box"><span class="guncelle-label">Telefon / GSM</span>' + phoneHtml + '</div>' +
                  '<div class="guncelle-contact-box"><span class="guncelle-label">E-mail</span>' + emailHtml + '</div>' +
                '</div>' +
                '<details class="guncelle-raw"><summary>Raw mətnə bax</summary><pre>' + ge(contact.plain_text || '') + '</pre></details>' +
              '</div>'
            );
          } catch(e) {
            setResult('<div class="msg err">Sorğu alınmadı: ' + ge(e.message || e) + '</div>');
          }
        }

        var capBtn = document.getElementById('gunCaptchaBtn');
        var refBtn = document.getElementById('gunRefreshBtn');
        var subBtn = document.getElementById('gunSubmitBtn');
        var capText = document.getElementById('gunCaptchaText');
        var sicilEl = document.getElementById('gunSicil');

        if (capBtn) capBtn.addEventListener('click', loadCaptcha);
        if (refBtn) refBtn.addEventListener('click', loadCaptcha);
        if (subBtn) subBtn.addEventListener('click', submitGuncelle);
        if (capText) capText.addEventListener('keydown', function(e){ if (e.key === 'Enter') submitGuncelle(); });
        if (sicilEl) sicilEl.addEventListener('keydown', function(e){ if (e.key === 'Enter') loadCaptcha(); });
      })();
      </script>
    ` : ''} `; })() : ''}


  ${page === 'qida' ? `
    <form method="GET" class="search-form">
      <input type="hidden" name="page" value="qida">
      <input name="q" placeholder="VÖEN və ya ad daxil edin..." value="${esc(q)}" style="text-transform:uppercase;letter-spacing:.08em">
      <button type="submit">Axtar</button>
    </form>
    ${qidaResults.length
      ? `<div class="count">${qidaResults.length} nəticə — "${esc(q)}"</div>${qidaResults.map(qidaCard).join('')}`
      : q && !error ? `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}


  ${page === 'contacts' ? `
    <div class="subtabs no-print">
      <a class="${contactsMode === 'search' ? 'active' : ''}" href="/?page=contacts&contactsMode=search">Axtarış</a>
      <a class="${contactsMode === 'review' ? 'active' : ''}" href="/?page=contacts&contactsMode=review">Yoxlanmalı</a>
      <a class="${contactsMode === 'stats' ? 'active' : ''}" href="/?page=contacts&contactsMode=stats">Statistika</a>
      <a class="${contactsMode === 'new' ? 'active' : ''}" href="/?page=contacts&contactsMode=new">Yeni Əlaqə</a>
    </div>

    ${contactsMessage ? `<div class="msg ok">${esc(contactsMessage)}</div>` : ''}

    ${contactsMode === 'search' ? `
      <form method="GET" class="search-form three">
        <input type="hidden" name="page" value="contacts">
        <input type="hidden" name="contactsMode" value="search">
        <input name="q" placeholder="Ad, nömrə, qurum, vəzifə, status, region, qeyd..." value="${esc(q)}">
        <input name="contactsStatus" placeholder="Status filteri" value="${esc(contactsStatus)}">
        <input name="contactsCategory" placeholder="Kateqoriya filteri" value="${esc(contactsCategory)}">
        <input name="contactsLimit" placeholder="Limit" value="${esc(contactsLimit || '100')}">
        <button type="submit">Axtar</button>
      </form>
      ${q ? `<div class="count">${contactsResults.length} nəticə — "${esc(q)}"</div>${contactsResults.map(contactsCard).join('') || `<div class="msg err">[${esc(q)}] - Heç bir nəticə tapılmadı.</div>`}` : '<div class="msg warn">Telefon, ad-soyad, dövlət qurumu, vəzifə, ictimai status, region və ya qeyddən söz yaz.</div>'}
    ` : ''}

    ${contactsMode === 'review' ? `
      <form method="GET" class="search-form">
        <input type="hidden" name="page" value="contacts">
        <input type="hidden" name="contactsMode" value="review">
        <input name="contactsLimit" placeholder="Limit" value="${esc(contactsLimit || '100')}">
        <button type="submit">Göstər</button>
      </form>
      <div class="count">${contactsResults.length} yoxlanmalı qeyd</div>
      ${contactsResults.map(contactsCard).join('') || `<div class="msg err">[] - Heç bir nəticə tapılmadı.</div>`}
    ` : ''}

    ${contactsMode === 'contact' && contactsContact ? contactsDetailCard(contactsContact, contactsPhones, contactsEmails) : ''}

    ${contactsMode === 'new' ? contactsNewCard() : ''}

    ${contactsMode === 'stats' && contactsStats ? contactsStatsCard(contactsStats) : ''}
  ` : ''}

  ${page === 'idare' ? `
    <div class="subtabs no-print">
      <a class="${idareMode === 'search' ? 'active' : ''}" href="/?page=idare&idareMode=search">Ad, Ünvan, VÖEN ilə axtar</a>
      <a class="${idareMode === 'category' ? 'active' : ''}" href="/?page=idare&idareMode=category">Kateqoriyaya görə axtar</a>
      <a class="${idareMode === 'stats' ? 'active' : ''}" href="/?page=idare&idareMode=stats">Statistika</a>
    </div>

    ${idareMode === 'search' ? `
      <form method="GET" class="search-form" id="idareLiveForm" style="flex-wrap:wrap;margin-bottom:6px">
        <input type="hidden" name="page" value="idare">
        <input type="hidden" name="idareMode" value="search">
        <input id="idareQ" name="idareQ" autocomplete="off" placeholder="Ad, ünvan, VÖEN və ya telefon ilə axtar... (yazdıqca axtarır)" value="${esc(idareQ)}" style="flex:3;min-width:220px">
        <button type="submit">Axtar</button>
      </form>
      <div id="idareLiveHint" class="tab-info no-print" style="margin:0 2px 12px;font-size:12px;color:var(--muted)">Ən azı 2 hərf yazın — nəticələr yazdıqca görünəcək.</div>
      <div id="idareLiveZone"></div>
    ` : ''}

    ${idareMode === 'stats' ? `
      ${idareStats ? `<div class="card">
        <div class="card-head">
          <div class="logo">📊</div>
          <div><h2>İdarələr bazasının statistikası</h2><p>Rəqəmsal İnkişaf Nazirliyi bazası — Rabita.az</p></div>
        </div>
        <table>
          ${row('Ümumi qeyd sayı',            esc(String(idareStats.total_records)))}
          ${row('Ümumi kateqoriya sayı',       esc(String(idareStats.total_categories)))}
          ${row('Məlumat olan kateqoriyalar',  esc(String(idareStats.non_empty_categories)))}
          ${row('Boş kateqoriyalar',           esc(String(idareStats.empty_categories)))}
          ${row('Telefon doluluğu',            esc(idareStats.tel_dolulugu))}
          ${row('Ünvan doluluğu',              esc(idareStats.unvan_dolulugu))}
          ${row('VÖEN doluluğu',               esc(idareStats.voen_dolulugu))}
          ${row('Bank kodu doluluğu',          esc(idareStats.bank_kodu_dolulugu))}
          ${row('Son yenilənmə',               esc(idareStats.son_yenilenme))}
          ${row('1. Ən çox qeyd',  esc(idareStats.top_01))}
          ${row('2. Ən çox qeyd',  esc(idareStats.top_02))}
          ${row('3. Ən çox qeyd',  esc(idareStats.top_03))}
          ${row('4. Ən çox qeyd',  esc(idareStats.top_04))}
          ${row('5. Ən çox qeyd',  esc(idareStats.top_05))}
          ${row('6. Ən çox qeyd',  esc(idareStats.top_06))}
          ${row('7. Ən çox qeyd',  esc(idareStats.top_07))}
          ${row('8. Ən çox qeyd',  esc(idareStats.top_08))}
          ${row('9. Ən çox qeyd',  esc(idareStats.top_09))}
          ${row('10. Ən çox qeyd', esc(idareStats.top_10))}
        </table>
      </div>` : ''}
    ` : ''}

    ${idareMode === 'category' ? `<form method="GET" class="search-form" style="flex-wrap:wrap">
      <input type="hidden" name="page" value="idare">
      <input type="hidden" name="idareMode" value="category">
      <select name="idareCategory" class="selectbox" onchange="this.form.submit()" style="flex:2;min-width:200px">
        <option value="">— Kateqoriya seçin —</option>
        <option value="115190000" ${idareCategory==='115190000'?'selected':''}>AGENTLİKLƏR</option>
        <option value="115220000" ${idareCategory==='115220000'?'selected':''}>AKADEMİYALAR,RƏSƏDXANALAR</option>
        <option value="115720000" ${idareCategory==='115720000'?'selected':''}>ARXİVLƏR</option>
        <option value="115080000" ${idareCategory==='115080000'?'selected':''}>ASSOSİASİYALAR</option>
        <option value="115870000" ${idareCategory==='115870000'?'selected':''}>AVTODƏSTƏ</option>
        <option value="115850000" ${idareCategory==='115850000'?'selected':''}>AVTOMÜƏSSİSƏLƏR,DAYANACAQLAR</option>
        <option value="115840000" ${idareCategory==='115840000'?'selected':''}>BAKMETROPOLİTEN</option>
        <option value="115050000" ${idareCategory==='115050000'?'selected':''}>BANKLAR</option>
        <option value="115290000" ${idareCategory==='115290000'?'selected':''}>BAYTARLIQ İDARƏSİ</option>
        <option value="115200000" ${idareCategory==='115200000'?'selected':''}>BAZALAR</option>
        <option value="115670000" ${idareCategory==='115670000'?'selected':''}>BAZARLAR,AMBAR,YARMARKALAR</option>
        <option value="115620000" ${idareCategory==='115620000'?'selected':''}>BƏRBƏRXANALAR,SALONLAR</option>
        <option value="115830000" ${idareCategory==='115830000'?'selected':''}>BİLYARD ZALLAR</option>
        <option value="115240000" ${idareCategory==='115240000'?'selected':''}>BİRJALAR</option>
        <option value="115450000" ${idareCategory==='115450000'?'selected':''}>BİRLİKLƏR</option>
        <option value="115100000" ${idareCategory==='115100000'?'selected':''}>BÜROLAR</option>
        <option value="115760000" ${idareCategory==='115760000'?'selected':''}>CAMAŞIRXANALAR MƏNTƏQƏLƏR</option>
        <option value="115630000" ${idareCategory==='115630000'?'selected':''}>DAXİLİ İŞLƏR ORQANLARI</option>
        <option value="115260000" ${idareCategory==='115260000'?'selected':''}>DƏMİRYOLU,DƏNİZ LİMANI</option>
        <option value="115390000" ${idareCategory==='115390000'?'selected':''}>DENDROPAR,QURUQL,ZOOP,PARK,CIDIR</option>
        <option value="115650000" ${idareCategory==='115650000'?'selected':''}>DOĞUM EVLƏR,TƏCİLİ YARDIM XİD.</option>
        <option value="115970000" ${idareCategory==='115970000'?'selected':''}>DÖVLƏT QURUMLARI</option>
        <option value="115060000" ${idareCategory==='115060000'?'selected':''}>DÜKANLAR,MAĞAZALAR,MARKETLƏR</option>
        <option value="115500000" ${idareCategory==='115500000'?'selected':''}>DÜŞƏRGƏLƏR</option>
        <option value="115690000" ${idareCategory==='115690000'?'selected':''}>ƏCZAXANALAR (APTEKLƏR)</option>
        <option value="115950000" ${idareCategory==='115950000'?'selected':''}>EKSPEDİSİYALAR</option>
        <option value="115340000" ${idareCategory==='115340000'?'selected':''}>EKSPERTİZA İDARƏLƏRİ</option>
        <option value="115520000" ${idareCategory==='115520000'?'selected':''}>EMALATX,SEXL,KİM.TƏM,ATELYE,FOTO</option>
        <option value="115380000" ${idareCategory==='115380000'?'selected':''}>EVLƏR</option>
        <option value="115930000" ${idareCategory==='115930000'?'selected':''}>FERMER TƏSƏRRÜF,SOVXOZLAR</option>
        <option value="115010000" ${idareCategory==='115010000'?'selected':''}>FİRMALAR,OFİSLƏR,F/ŞƏXSLƏR</option>
        <option value="115920000" ${idareCategory==='115920000'?'selected':''}>FONDLAR,FEDERASİYALAR</option>
        <option value="115300000" ${idareCategory==='115300000'?'selected':''}>GİMNAZ,KOLLEC,SEMİN,LİSEY,KURSLA</option>
        <option value="115210000" ${idareCategory==='115210000'?'selected':''}>HAMAMLAR,SAUNALAR,HOVUZLAR</option>
        <option value="115610000" ${idareCategory==='115610000'?'selected':''}>HƏMKARLAR İTTİFAQI</option>
        <option value="115280000" ${idareCategory==='115280000'?'selected':''}>HƏRBİ KOMİSSARLIQLAR</option>
        <option value="115640000" ${idareCategory==='115640000'?'selected':''}>İCRA HAKİMİYYƏTLƏRİ,BƏLƏDİYYƏLƏR</option>
        <option value="115120000" ${idareCategory==='115120000'?'selected':''}>İNSTİTUTLAR,UNİVERSİTETLƏR</option>
        <option value="115780000" ${idareCategory==='115780000'?'selected':''}>İŞIQ,QAZ,SU,KOMMUN.XİDMƏTLƏRİ</option>
        <option value="115750000" ${idareCategory==='115750000'?'selected':''}>İTTİFAQLAR,XİDMƏTLƏR</option>
        <option value="115420000" ${idareCategory==='115420000'?'selected':''}>KAFE,RESTORANLAR,YEMƏKXANALAR</option>
        <option value="115360000" ${idareCategory==='115360000'?'selected':''}>KİLSƏL,MƏCİDLƏR,DİNİ CƏMİYYƏT</option>
        <option value="115470000" ${idareCategory==='115470000'?'selected':''}>KİNOSTUDİYA,TEATR,STUDİYALAR</option>
        <option value="115230000" ${idareCategory==='115230000'?'selected':''}>KİTABXANALAR</option>
        <option value="115480000" ${idareCategory==='115480000'?'selected':''}>KLUBLAR</option>
        <option value="115170000" ${idareCategory==='115170000'?'selected':''}>KOMBİNATLAR</option>
        <option value="115960000" ${idareCategory==='115960000'?'selected':''}>KOMİS,MİLLİ MƏC,PREZ.AP,PALATAL</option>
        <option value="115140000" ${idareCategory==='115140000'?'selected':''}>KOMİTƏLƏR</option>
        <option value="115980000" ${idareCategory==='115980000'?'selected':''}>KONTORALAR</option>
        <option value="115070000" ${idareCategory==='115070000'?'selected':''}>KOOPERATİVLƏR</option>
        <option value="115530000" ${idareCategory==='115530000'?'selected':''}>LABORATORİYALAR</option>
        <option value="115510000" ${idareCategory==='115510000'?'selected':''}>LOMBARDLAR</option>
        <option value="115660000" ${idareCategory==='115660000'?'selected':''}>MƏHKƏMƏLƏR</option>
        <option value="115310000" ${idareCategory==='115310000'?'selected':''}>MEHMANXANALAR</option>
        <option value="115770000" ${idareCategory==='115770000'?'selected':''}>MƏKTƏBLƏR</option>
        <option value="115130000" ${idareCategory==='115130000'?'selected':''}>MƏRKƏZLƏR</option>
        <option value="115490000" ${idareCategory==='115490000'?'selected':''}>MƏSLƏHƏTXANALAR KONTORLAR</option>
        <option value="115250000" ${idareCategory==='115250000'?'selected':''}>MİS,MKİS</option>
        <option value="115040000" ${idareCategory==='115040000'?'selected':''}>MMC</option>
        <option value="115020000" ${idareCategory==='115020000'?'selected':''}>MÜƏSSİSƏLƏR</option>
        <option value="115430000" ${idareCategory==='115430000'?'selected':''}>MÜFƏTTİŞLİKLƏR</option>
        <option value="115550000" ${idareCategory==='115550000'?'selected':''}>MUZEYLƏR,SƏRGİLƏR</option>
        <option value="115180000" ${idareCategory==='115180000'?'selected':''}>NAZİRLİKLƏR</option>
        <option value="115410000" ${idareCategory==='115410000'?'selected':''}>NƏŞRİYYAT MƏTBƏƏLƏR</option>
        <option value="115680000" ${idareCategory==='115680000'?'selected':''}>NÜMAYƏNDƏLİKLƏR</option>
        <option value="115590000" ${idareCategory==='115590000'?'selected':''}>PARTİYALAR</option>
        <option value="115570000" ${idareCategory==='115570000'?'selected':''}>POÇT ŞÖBƏLƏRİ,TELEQRAF</option>
        <option value="115740000" ${idareCategory==='115740000'?'selected':''}>PROKURORLUQ</option>
        <option value="115710000" ${idareCategory==='115710000'?'selected':''}>RABİTƏ MÜƏSSİSƏLƏRİ VƏ BİRLİKLƏR</option>
        <option value="115160000" ${idareCategory==='115160000'?'selected':''}>REDAKSİYALAR</option>
        <option value="115600000" ${idareCategory==='115600000'?'selected':''}>SANATOR.PANSİONAT.İSTİRAHƏT EVİ</option>
        <option value="115320000" ${idareCategory==='115320000'?'selected':''}>SARAYLAR</option>
        <option value="115730000" ${idareCategory==='115730000'?'selected':''}>SƏFİRLİKLƏR</option>
        <option value="115030000" ${idareCategory==='115030000'?'selected':''}>ŞİRKƏTLƏR,KOMPANİYALAR,LTD</option>
        <option value="115790000" ${idareCategory==='115790000'?'selected':''}>STADİONLAR</option>
        <option value="115800000" ${idareCategory==='115800000'?'selected':''}>TEATR,SİRK,ORKESTRL,FİLARMON</option>
        <option value="115880000" ${idareCategory==='115880000'?'selected':''}>TELESTUDİYALAR</option>
        <option value="115560000" ${idareCategory==='115560000'?'selected':''}>TƏŞKİLATLAR</option>
        <option value="115810000" ${idareCategory==='115810000'?'selected':''}>TEXNİKUM,PEŞƏ MƏKTƏBLƏRİ</option>
        <option value="115270000" ${idareCategory==='115270000'?'selected':''}>TİB/SAN.HİS,XƏST.KLİN.HOSPİTAL</option>
        <option value="115540000" ${idareCategory==='115540000'?'selected':''}>TİBB MƏRKƏZLƏRİ,POLİKLİNİKALAR</option>
        <option value="115940000" ${idareCategory==='115940000'?'selected':''}>TİKİNTİ DƏSTƏLƏR</option>
        <option value="115440000" ${idareCategory==='115440000'?'selected':''}>TRESTLƏR</option>
        <option value="115350000" ${idareCategory==='115350000'?'selected':''}>UŞAQ BAĞÇALARI</option>
        <option value="115460000" ${idareCategory==='115460000'?'selected':''}>XƏRİTƏÇƏKMƏ İDARƏSİ</option>
        <option value="115580000" ${idareCategory==='115580000'?'selected':''}>YANĞINDAN MÜHAFİZƏ</option>
        <option value="115150000" ${idareCategory==='115150000'?'selected':''}>YATAQXANALAR</option>
        <option value="115400000" ${idareCategory==='115400000'?'selected':''}>ZALLAR</option>
        <option value="115110000" ${idareCategory==='115110000'?'selected':''}>ZAVODLAR,FABRİKLƏR</option>
      </select>
      ${idareOptions.length ? `
        <select name="idareId" class="selectbox" onchange="this.form.submit()" style="flex:2;min-width:200px">
          <option value="">— Bütün idarələr (${idareOptions.length}) —</option>
          ${idareOptions.map(o => `<option value="${esc(o.value)}" ${idareId===o.value?'selected':''}>${esc(o.label)}</option>`).join('')}
        </select>
      ` : ''}
      <button type="submit">Axtar</button>
    </form>` : ''}

    ${idareResults.length
      ? `<div class="count">${idareQ
          ? `${idareResults.length} nəticə${idareSearchTotal > idareResults.length ? ' (ilk ' + idareResults.length + ', cəmi ' + idareSearchTotal + ')' : ''} — "${esc(idareQ)}"`
          : `${idareResults.length} qeyd${idareId ? ' — ' + esc(idareId) : ''}`
        }</div>
         <div style="overflow-x:auto;margin-bottom:24px">
           <table style="width:100%;border-collapse:collapse;font-size:13px;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden">
             <thead>
               <tr style="background:var(--blue);color:#fff;font-family:monospace;font-size:12px;text-transform:uppercase;letter-spacing:.04em">
                 <th style="padding:12px 14px;text-align:left;white-space:nowrap">Telefon №</th>
                 <th style="padding:12px 14px;text-align:left">Adı</th>
                 <th style="padding:12px 14px;text-align:left">Ünvan</th>
                 ${idareQ ? '<th style="padding:12px 14px;text-align:left">Kateqoriya</th>' : '<th style="padding:12px 14px;text-align:left;white-space:nowrap">Bank kodu</th>'}
                 <th style="padding:12px 14px;text-align:left">VÖEN</th>
               </tr>
             </thead>
             <tbody>
               ${idareResults.map((r, idx) => `
                 <tr style="background:${idx % 2 === 0 ? 'var(--card)' : 'var(--card2)'};border-top:1px solid var(--border)">
                   <td style="padding:10px 14px;font-family:monospace;white-space:nowrap">${esc(r.tel)}</td>
                   <td style="padding:10px 14px;font-weight:600">${esc(r.name)}</td>
                   <td style="padding:10px 14px;color:var(--muted)">${esc(r.address)}</td>
                   <td style="padding:10px 14px;font-family:monospace;color:var(--muted);font-size:12px">${idareQ ? esc(r._category || '') : esc(r.bankCode || '')}</td>
                   <td style="padding:10px 14px;font-family:monospace">${
                     /^\d{10}$/.test(r.voen || '')
                       ? `<a href="/?page=history&tin=${encodeURIComponent(r.voen)}" style="color:var(--blue)">${esc(r.voen)}</a>`
                       : esc(r.voen || '')
                   }</td>
                 </tr>`).join('')}
             </tbody>
           </table>
         </div>`
      : idareQ && !error ? `<div class="msg err">[${esc(idareQ)}] - Heç bir nəticə tapılmadı.</div>`
      : idareCategory && !error ? `<div class="msg err">[${esc(idareCategory)}] - Heç bir nəticə tapılmadı.</div>` : ''}
  ` : ''}

  ${page === 'dunya' ? (() => {
    const dunyaSub = clean(url.searchParams.get('dunyaSub') || 'uk');
    return `
    <div class="subtabs no-print">
      <a class="${(dunyaSub !== 'northdata' && dunyaSub !== 'russia' && dunyaSub !== 'czech' && dunyaSub !== 'belarus' && dunyaSub !== 'ukraine' && dunyaSub !== 'norway' && dunyaSub !== 'france' && dunyaSub !== 'estonia' && dunyaSub !== 'gleif') ? 'active' : ''}" href="/?page=dunya&dunyaSub=uk">🇬🇧 İngiltərə</a>
      <a class="${dunyaSub === 'northdata' ? 'active' : ''}" href="/?page=dunya&dunyaSub=northdata">🌐 NorthData</a>
      <a class="${dunyaSub === 'russia' ? 'active' : ''}" href="/?page=dunya&dunyaSub=russia">🇷🇺 Rusiya</a>
      <a class="${dunyaSub === 'czech' ? 'active' : ''}" href="/?page=dunya&dunyaSub=czech">🇨🇿 Çexiya</a>
      <a class="${dunyaSub === 'belarus' ? 'active' : ''}" href="/?page=dunya&dunyaSub=belarus">🇧🇾 Belarus</a>
      <a class="${dunyaSub === 'ukraine' ? 'active' : ''}" href="/?page=dunya&dunyaSub=ukraine">🇺🇦 Ukrayna</a>
      <a class="${dunyaSub === 'norway' ? 'active' : ''}" href="/?page=dunya&dunyaSub=norway">🇳🇴 Norveç</a>
      <a class="${dunyaSub === 'france' ? 'active' : ''}" href="/?page=dunya&dunyaSub=france">🇫🇷 Fransa</a>
      <a class="${dunyaSub === 'estonia' ? 'active' : ''}" href="/?page=dunya&dunyaSub=estonia">🇪🇪 Estoniya</a>
      <a class="${dunyaSub === 'gleif' ? 'active' : ''}" href="/?page=dunya&dunyaSub=gleif">🌐 GLEIF</a>
    </div>
    ${dunyaSub === 'northdata' ? northDataPage() : dunyaSub === 'russia' ? russiaPage() : dunyaSub === 'czech' ? czechPage() : dunyaSub === 'belarus' ? belarusPage() : dunyaSub === 'ukraine' ? ukrainePage() : dunyaSub === 'norway' ? norwayPage() : dunyaSub === 'france' ? francePage() : dunyaSub === 'estonia' ? estoniaPage() : dunyaSub === 'gleif' ? gleifPage() : `
    <div class="tab-info">🇬🇧 İngiltərə — Companies House (rəsmi Britaniya şirkət reyestri). Şirkət adı/nömrəsi və ya şəxs (direktor) adı ilə axtar; şirkətə klikləyib direktorları və ünvanı gör.</div>
    <div class="search-form" style="flex-wrap:wrap;gap:10px">
      <select id="ukMode" class="selectbox" style="max-width:200px;flex:0 0 auto">
        <option value="company">🏢 Şirkət axtar</option>
        <option value="officer">👤 Şəxs (direktor) axtar</option>
      </select>
      <input id="ukQ" placeholder="Şirkət adı, qeydiyyat nömrəsi və ya şəxs adı..." style="flex:1;min-width:240px" autocomplete="off">
      <button type="button" id="ukBtn">Axtar</button>
    </div>
    <div id="ukStatus" class="etndr-status" style="margin:6px 2px"></div>
    <div id="ukResults"></div>
    <script>
    (function(){
      var $=function(id){return document.getElementById(id);};
      if(!$('ukBtn')) return;
      function ec(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
      function st(t,c){var e=$('ukStatus');e.textContent=t||'';e.className='etndr-status'+(c?' '+c:'');}
      function row(l,v){return v?('<tr><td class="label">'+ec(l)+'</td><td class="value">'+v+'</td></tr>'):'';}
      function badge(s){var ok=/active/i.test(s||'');return '<span class="badge '+(ok?'good':'bad')+'">'+ec(s||'—')+'</span>';}
      function chLink(p,t){return '<a href="https://find-and-update.company-information.service.gov.uk'+p+'" target="_blank" rel="noopener">'+t+'</a>';}
      function companyCard(c){
        var num=ec(c.company_number||'');
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6)">UK</div>'
          +'<div><h2>'+ec(c.title||c.company_name||'Şirkət')+'</h2><p>№ '+num+'</p></div>'
          +'<div class="status">'+badge(c.company_status)+'</div></div><table>'
          +row('Qeydiyyat nömrəsi',num)
          +row('Status',ec(c.company_status||''))
          +row('Tip',ec(c.company_type||c.type||''))
          +row('Ünvan',ec(c.address_snippet||''))
          +row('Qeydiyyat tarixi',ec(c.date_of_creation||''))
          +'</table><div class="actions">'
          +'<button type="button" class="uk-open" data-num="'+num+'">🏢 Detal / direktorlar</button>'
          +chLink('/company/'+num,'Rəsmi səhifə ↗')
          +'</div></div>';
      }
      function officerCard(o){
        var dob=o.date_of_birth?ec((o.date_of_birth.month||'')+'/'+(o.date_of_birth.year||'')):'';
        var self=(o.links&&o.links.self)?o.links.self:'';
        return '<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#7c3aed,#a78bfa)">👤</div>'
          +'<div><h2>'+ec(o.title||'Şəxs')+'</h2><p>'+ec(o.description||'Officer')+'</p></div></div><table>'
          +row('Ad',ec(o.title||''))
          +row('Doğum (ay/il)',dob)
          +row('Təyinat sayı',ec(String(o.appointment_count||'')))
          +row('Ünvan',ec(o.address_snippet||''))
          +'</table>'+(self?('<div class="actions">'+chLink(ec(self),'Şəxsin səhifəsi ↗')+'</div>'):'')+'</div>';
      }
      function offRow(o){
        var dob=o.date_of_birth?ec((o.date_of_birth.month||'')+'/'+(o.date_of_birth.year||'')):'';
        var p=[];
        if(o.officer_role)p.push('Rol: '+ec(o.officer_role));
        if(o.appointed_on)p.push('Təyin: '+ec(o.appointed_on));
        if(o.resigned_on)p.push('İstefa: '+ec(o.resigned_on));
        if(o.nationality)p.push('Vətəndaşlıq: '+ec(o.nationality));
        if(o.occupation)p.push('Peşə: '+ec(o.occupation));
        if(dob)p.push('Doğum: '+dob);
        return row(ec(o.name||'Direktor'),p.join('<br>'));
      }
      function doSearch(){
        var q=$('ukQ').value.trim(),mode=$('ukMode').value;
        if(q.length<2){st('Ən azı 2 hərf yazın...');return;}
        st('Axtarılır...');$('ukResults').innerHTML='';
        var act=mode==='officer'?'officers':'search';
        fetch('/api/uk?action='+act+'&q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(d){
          if(d.error){st('Xəta: '+d.error,'err');return;}
          var items=d.items||[];
          if(!items.length){st('Nəticə tapılmadı.','err');return;}
          st((d.total_results||items.length)+' nəticə','ok');
          $('ukResults').innerHTML=items.map(mode==='officer'?officerCard:companyCard).join('');
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      function openCompany(num){
        if(!num)return;
        st('Şirkət yüklənir...');$('ukResults').innerHTML='';
        Promise.all([
          fetch('/api/uk?action=company&num='+encodeURIComponent(num)).then(function(r){return r.json();}),
          fetch('/api/uk?action=company_officers&num='+encodeURIComponent(num)).then(function(r){return r.json();})
        ]).then(function(res){
          var c=res[0]||{},off=(res[1]&&res[1].items)||[];
          if(c.error){st('Xəta: '+c.error,'err');return;}
          st('');
          var a=c.registered_office_address||{};
          var addr=[a.address_line_1,a.address_line_2,a.locality,a.region,a.postal_code,a.country].filter(Boolean).map(ec).join(', ');
          var sic=(c.sic_codes||[]).map(ec).join(', ');
          var h='<div class="card"><div class="card-head"><div class="logo" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6)">UK</div>'
            +'<div><h2>'+ec(c.company_name||'')+'</h2><p>№ '+ec(c.company_number||num)+'</p></div>'
            +'<div class="status">'+badge(c.company_status)+'</div></div><table>'
            +row('Qeydiyyat nömrəsi',ec(c.company_number||num))
            +row('Status',ec(c.company_status||''))
            +row('Tip',ec(c.type||''))
            +row('Qeydiyyat tarixi',ec(c.date_of_creation||''))
            +row('Ünvan',addr)
            +row('SIC (fəaliyyət) kodları',sic)
            +row('Aktiv direktor sayı',ec(String((res[1]&&res[1].active_count)||'')))
            +'</table><div class="actions">'+chLink('/company/'+ec(c.company_number||num),'Rəsmi səhifə ↗')
            +'<button type="button" class="uk-back">← Axtarışa qayıt</button></div></div>';
          if(off.length){
            h+='<div class="card"><div class="card-head"><div class="logo">👥</div><div><h2>Direktorlar / officers</h2><p>'+off.length+' qeyd</p></div></div><table>'+off.map(offRow).join('')+'</table></div>';
          }
          $('ukResults').innerHTML=h;
        }).catch(function(e){st('Bağlantı xətası: '+e.message,'err');});
      }
      $('ukBtn').addEventListener('click',doSearch);
      $('ukQ').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();doSearch();}});
      $('ukResults').addEventListener('click',function(e){
        var o=e.target.closest('.uk-open');if(o){openCompany(o.getAttribute('data-num'));return;}
        if(e.target.closest('.uk-back')){doSearch();}
      });
      $('ukQ').focus();
    })();
    </script>
    `}
    `;
  })() : ''}
  ${page === 'aile' ? aileAgaciPage() : ''}

  ${page === 'secilmish' ? `
    <div id="secilmishWrap">
      <div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">
        ⭐ Favorit — localStorage-dan
      </div>
      <div id="secilmishList"><div class="msg warn">Hələ heç bir kart seçilməyib. Axtarış nəticələrindəki ⭐ düyməsini basın.</div></div>
      <button onclick="clearFavorites()" style="background:var(--card2);color:var(--red);border:1px solid var(--border);margin-top:12px">🗑️ Bütün seçilmişləri sil</button>
    </div>
  ` : ''}

</main>
<script>${script()}</script>
<script>${page === 'msk' && mskSub === 'unvan' ? mskUnvanClientScript() : ''}</script>
<script>${page === 'msk' && mskSub === 'secici' ? mskSeciciClientScript() : ''}</script>
<script>
/* CANLI AXTARIŞ — vergi & tender (yazdıqca, debounce 300ms, FTS backend) */
(function(){
  var pageEl = document.querySelector('form.search-form input[name="page"]');
  var page = pageEl ? pageEl.value : '';
  if (['vergi','tender','dnn','mnb','corona','cbar'].indexOf(page) === -1) return;
  var form = document.querySelector('form.search-form');
  if (!form) return;
  var input = form.querySelector('input[name="q"]');
  var zone = document.getElementById('liveZone');
  if (!input || !zone) return;
  input.setAttribute('autocomplete','off');
  var timer = null, lastQ = null, ctrl = null;
  function run(){
    var v = input.value.trim();
    if (v === lastQ) return;
    lastQ = v;
    if (v.length < 2) return;
    if (ctrl) { try { ctrl.abort(); } catch(e){} }
    ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    zone.style.opacity = '0.45';
    var u = '/?page=' + page + '&q=' + encodeURIComponent(v) + '&live=1';
    fetch(u, ctrl ? { signal: ctrl.signal } : {})
      .then(function(r){ return r.text(); })
      .then(function(html){
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var nz = doc.getElementById('liveZone');
        if (nz) zone.innerHTML = nz.innerHTML;
        zone.style.opacity = '';
        try { history.replaceState(null, '', '/?page=' + page + '&q=' + encodeURIComponent(v)); } catch(e){}
      })
      .catch(function(e){ zone.style.opacity = ''; });
  }
  input.addEventListener('input', function(){
    clearTimeout(timer);
    timer = setTimeout(run, 300);
  });
})();
</script>
<script>
/* İDARƏ CANLI AXTARIŞ — D1 + FTS5 (yazdıqca, debounce 180ms) */
(function(){
  var input = document.getElementById('idareQ');
  var zone  = document.getElementById('idareLiveZone');
  var hint  = document.getElementById('idareLiveHint');
  var form  = document.getElementById('idareLiveForm');
  if (!input || !zone) return;
  if (form) form.addEventListener('submit', function(e){ e.preventDefault(); run(); }); // tam submit-i blokla
  var timer = null, lastQ = null, ctrl = null, seq = 0;

  function ec(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function rows(items){
    return items.map(function(r, idx){
      var voen = /^\d{10}$/.test(r.voen||'')
        ? '<a href="/?page=history&tin='+encodeURIComponent(r.voen)+'" style="color:var(--blue)">'+ec(r.voen)+'</a>'
        : ec(r.voen||'');
      return '<tr style="background:'+(idx%2===0?'var(--card)':'var(--card2)')+';border-top:1px solid var(--border)">'
        + '<td style="padding:10px 14px;font-family:monospace;white-space:nowrap">'+ec(r.tel)+'</td>'
        + '<td style="padding:10px 14px;font-weight:600">'+ec(r.name)+'</td>'
        + '<td style="padding:10px 14px;color:var(--muted)">'+ec(r.address)+'</td>'
        + '<td style="padding:10px 14px;font-family:monospace;color:var(--muted);font-size:12px">'+ec(r._category||'')+'</td>'
        + '<td style="padding:10px 14px;font-family:monospace">'+voen+'</td>'
        + '</tr>';
    }).join('');
  }
  function table(items, q){
    return '<div class="count">'+items.length+' nəticə — "'+ec(q)+'"</div>'
      + '<div style="overflow-x:auto;margin-bottom:24px">'
      + '<table style="width:100%;border-collapse:collapse;font-size:13px;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
      + '<thead><tr style="background:var(--blue);color:#fff;font-family:monospace;font-size:12px;text-transform:uppercase;letter-spacing:.04em">'
      + '<th style="padding:12px 14px;text-align:left;white-space:nowrap">Telefon №</th>'
      + '<th style="padding:12px 14px;text-align:left">Adı</th>'
      + '<th style="padding:12px 14px;text-align:left">Ünvan</th>'
      + '<th style="padding:12px 14px;text-align:left">Kateqoriya</th>'
      + '<th style="padding:12px 14px;text-align:left">VÖEN</th>'
      + '</tr></thead><tbody>'+rows(items)+'</tbody></table></div>';
  }

  function run(){
    var v = input.value.trim();
    if (v === lastQ) return;
    lastQ = v;
    if (v.length < 2){ zone.innerHTML=''; if(hint) hint.style.display=''; return; }
    if (hint) hint.style.display='none';
    if (ctrl){ try{ ctrl.abort(); }catch(e){} }
    ctrl = (typeof AbortController!=='undefined') ? new AbortController() : null;
    var my = ++seq;
    zone.style.opacity = '0.45';
    fetch('/api/idare/search?q='+encodeURIComponent(v)+'&limit=50', ctrl?{signal:ctrl.signal}:{})
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (my !== seq) return;
        zone.style.opacity = '';
        if (data.error){ zone.innerHTML = '<div class="msg err">'+ec(data.error)+'</div>'; return; }
        var items = data.results || [];
        zone.innerHTML = items.length ? table(items, v)
          : '<div class="msg err">['+ec(v)+'] - Heç bir nəticə tapılmadı.</div>';
        try { history.replaceState(null,'','/?page=idare&idareMode=search&idareQ='+encodeURIComponent(v)); } catch(e){}
      })
      .catch(function(e){ if (my===seq) zone.style.opacity=''; });
  }
  input.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(run, 180); });
  if (input.value.trim().length >= 2) run(); // səhifə açılışında doldurulubsa
})();
</script>
<script>
(function() {
  // Düymələrə klik hadisəsi əlavə et
  function escHtml(x) {
    return String(x == null ? '' : x)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function attachBirthButtons() {
    document.querySelectorAll('.find-birth-btn').forEach(btn => {
      if (btn.hasListener) return;
      btn.hasListener = true;
      btn.addEventListener('click', async function(e) {
        const cardId = this.getAttribute('data-cardid');
        const resultDiv = document.getElementById('birthResult_' + cardId);
        const wrap = this.closest('.birth-finder');
        if (!resultDiv || !wrap) return;

        // Formdakı (avtomatik dolu) sahələri oxu
        const soyad = (wrap.querySelector('.bf-soyad').value || '').trim().toUpperCase();
        const ad = (wrap.querySelector('.bf-ad').value || '').trim().toUpperCase();
        const ataAdi = (wrap.querySelector('.bf-ata').value || '').trim().toUpperCase();
        const dogumIli = (wrap.querySelector('.bf-il').value || '').trim();
        const cins = wrap.querySelector('.bf-cins').value || 'Kişi';

        if (!soyad || !ad) {
          resultDiv.innerHTML = '<div class="msg err">Soyad və ad mütləqdir.</div>';
          return;
        }
        if (!/^[0-9]{4}$/.test(dogumIli)) {
          resultDiv.innerHTML = '<div class="msg err">Doğum ili düzgün deyil (mis: 1975).</div>';
          return;
        }

        // Axtarış sorgusu göstər
        document.getElementById('searchQuery_' + cardId).style.display = 'block';
        document.getElementById('notFoundMsg_' + cardId).style.display = 'none';
        document.getElementById('searchName_' + cardId).textContent = soyad + ' ' + ad + ' ' + ataAdi;
        document.getElementById('searchYear_' + cardId).textContent = dogumIli;

        resultDiv.innerHTML = '<div class="birth-loading">Axtarılır (1-3 dəqiqə)...</div>';

        let taskId = null;
        try {
          // 1. İşə sal
          const startResp = await fetch('/api/msk-find-birth-start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ soyad, ad, ataAdi, cins, dogumIli })
          });
          const startData = await startResp.json();
          if (!startData.ok && startData.status !== 'queued' && startData.status !== 'running') {
            throw new Error(startData.error || startData.message || 'İşə salma xətası');
          }
          taskId = startData.task_id;
          if (!taskId) throw new Error('Backend task_id qaytarmadı');
          const startTime = Date.now();
          resultDiv.innerHTML = '<div class="birth-loading">⏳ Axtarış başladı... Səhifəni bağlamayın.</div>';

          // 2. Polling (hər 3 saniyə, maks 3000 dəfə ≈ 150 dəqiqə)
          let attempts = 0;
          const maxAttempts = 3000;
          const interval = setInterval(async () => {
            attempts++;
            try {
              const checkResp = await fetch('/api/msk-find-birth-result?id=' + encodeURIComponent(taskId));
              const checkData = await checkResp.json();

              // Vacib: queued/not_ready xəta deyil, davam edən prosesdir.
              // Ona görə error sahəsinə statusdan əvvəl baxırıq.
              const status =
                (checkData.ok === true && (checkData.tarix || checkData.result)) ? 'found' :
                (checkData.error === 'queued') ? 'queued' :
                (checkData.error === 'not_ready') ? 'running' :
                (checkData.error === 'not_found') ? 'not_found' :
                (checkData.error === 'task_missing') ? 'missing' :
                (checkData.status === 'queued') ? 'queued' :
                (checkData.status === 'running') ? 'running' :
                (checkData.status === 'found') ? 'found' :
                (checkData.status === 'not_found') ? 'not_found' :
                (checkData.status === 'missing') ? 'missing' :
                (checkData.status === 'error') ? 'error' :
                (checkData.error ? 'error' : 'running');

              if (status === 'found' && (checkData.tarix || checkData.result)) {
                clearInterval(interval);

                var t = String(checkData.tarix || checkData.result).trim();
                var m = t.match(/^([0-9]{4})[-./]([0-9]{1,2})[-./]([0-9]{1,2})$/);
                if (m) t = ('0' + m[3]).slice(-2) + '.' + ('0' + m[2]).slice(-2) + '.' + m[1];

                var cacheKey = 'birth_' + soyad + '_' + ad + '_' + ataAdi;
                localStorage.setItem(cacheKey, JSON.stringify({
                  tarix: t,
                  source: '🔎 Avtomatik tapıldı'
                }));

                resultDiv.innerHTML =
                  '<div class="msg ok"><strong>✅ Doğum tarixi (gün.ay.il):</strong> ' + escHtml(t) + '<br>' +
                  '<small style="opacity:0.7">🔎 Avtomatik tapıldı</small></div>';
                return;
              }

              if (status === 'not_found') {
                clearInterval(interval);

                document.getElementById('notFoundMsg_' + cardId).style.display = 'block';
                document.getElementById('notFoundYear_' + cardId).textContent = dogumIli;

                var nfChecked = checkData.checked || 0;
                var nfTotal = checkData.total || 365;
                var nfCur = checkData.current || '';

                resultDiv.innerHTML =
                  '<div class="msg err">❌ ' + escHtml(dogumIli) + ' ili üçün uyğun tarix tapılmadı.' +
                  '<br><small>Yoxlanılan günlər: ' + nfChecked + '/' + nfTotal + (nfCur ? ' · Son yoxlanan: ' + escHtml(nfCur) : '') + '</small></div>';
                return;
              }

              if (status === 'error' || status === 'missing') {
                clearInterval(interval);

                resultDiv.innerHTML =
                  '<div class="msg err">Xəta: ' + escHtml(checkData.error || checkData.message || 'Naməlum xəta') + '</div>';
                return;
              }

              if (attempts >= maxAttempts) {
                clearInterval(interval);

                resultDiv.innerHTML =
                  '<div class="msg err">⏱ Axtarış hələ davam edə bilər, amma brauzer gözləmə limiti bitdi.' +
                  '<br><small>Bu, “tapılmadı” demək deyil. Bir az sonra yenidən yoxla.</small></div>';
                return;
              }

              // queued/running — irəliləyişi göstər
              var checked = Number(checkData.checked || 0);
              var totalDays = Number(checkData.total || 365);
              if (!totalDays || totalDays < 1) totalDays = 365;

              var pct = Math.max(0, Math.min(100, Math.round((checked / totalDays) * 100)));
              var secs = Math.round((Date.now() - startTime) / 1000);
              var cur = checkData.current || '';
              var msg = checkData.message || (status === 'queued' ? 'Növbədə gözləyir' : 'Axtarılır');

              var barLen = 20;
              var filled = Math.round((checked / totalDays) * barLen);
              if (filled < 0) filled = 0;
              if (filled > barLen) filled = barLen;

              var bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
              var eta = checked > 0 ? Math.round(secs * (totalDays - checked) / checked) : 0;

              resultDiv.innerHTML =
                '<div class="birth-loading"><strong>🔎 ' + escHtml(msg) + '</strong><br>' +
                '[<strong>' + escHtml(bar) + '</strong>] ' + pct + '% · ' + checked + '/' + totalDays + '<br>' +
                (cur ? '📅 ' + escHtml(cur) + ' · ' : '') + '⏱ ' + secs + 's' + (checked > 0 ? ' · 🕐 ETA: ~' + eta + 's' : '') + '</div>';

            } catch (err) {
              if (attempts >= maxAttempts) {
                clearInterval(interval);
                resultDiv.innerHTML = '<div class="msg err">Şəbəkə xətası: ' + escHtml(err.message) + '</div>';
              }
            }
          }, 3000);
        } catch (err) {
          resultDiv.innerHTML = '<div class="msg err">Xəta: ' + escHtml(err.message) + '</div>';
        }
      });
    });
  }

  // Manuel tarix saxlama
  function attachManualSaveButtons() {
    document.querySelectorAll('.bf-manual-save').forEach(btn => {
      if (btn.hasListener) return;
      btn.hasListener = true;
      btn.addEventListener('click', function(e) {
        const cardId = this.getAttribute('data-cardid');
        const wrap = document.querySelector('.birth-finder[data-cardid="' + cardId + '"]');
        if (!wrap) return;

        const day = (wrap.querySelector('.bf-manual-day').value || '').trim().padStart(2, '0');
        const month = (wrap.querySelector('.bf-manual-month').value || '').trim().padStart(2, '0');
        const year = (wrap.querySelector('.bf-manual-year').value || '').trim();
        const errorDiv = wrap.querySelector('.bf-manual-error');

        errorDiv.style.display = 'none';

        if (!day || !month || !year || parseInt(day) > 31 || parseInt(month) > 12) {
          errorDiv.textContent = '❌ Düzgün tarix daxil edin (gün 01-31, ay 01-12)';
          errorDiv.style.display = 'block';
          return;
        }

        const tarix = day + '.' + month + '.' + year;
        const soyad = (wrap.querySelector('.bf-soyad').value || '').trim().toUpperCase();
        const ad = (wrap.querySelector('.bf-ad').value || '').trim().toUpperCase();
        const ataAdi = (wrap.querySelector('.bf-ata').value || '').trim().toUpperCase();

        const cacheKey = 'birth_' + soyad + '_' + ad + '_' + ataAdi;
        localStorage.setItem(cacheKey, JSON.stringify({tarix: tarix, source: '📝 Əllə qeyd edilmiş'}));

        const resultDiv = document.getElementById('birthResult_' + cardId);
        resultDiv.innerHTML = '<div class="msg ok"><strong>✅ Doğum tarixi (gün.ay.il):</strong> ' + tarix + '<br><small style="opacity:0.7">📝 Əllə qeyd edilmiş</small></div>';

        wrap.querySelector('.bf-manual-day').value = '';
        wrap.querySelector('.bf-manual-month').value = '';
        wrap.querySelector('.bf-manual-year').value = '';
      });
    });
  }

  // Dinamik yüklənən nəticələr üçün MutationObserver
  const targetNode = document.getElementById('mskSeciciResult') || document.body;
  const observer = new MutationObserver(function(mutations) {
    attachBirthButtons();
    attachManualSaveButtons();
  });
  observer.observe(targetNode, { childList: true, subtree: true });
  attachBirthButtons();
  attachManualSaveButtons();
})();
</script>
</body>
</html>`;
}


function terkibSearchRow(r) {
  const full = String(r && r.soyad_ad_ata || '').trim();
  const qq = encodeURIComponent(full.trim());
  const yer = (r && r.menteqe_no) ? (r.menteqe_no + ' saylı məntəqə') : 'Dairə komissiyası (DSK)';
  return `<div class="card">
    <div class="card-head">
      <div class="logo">🗳</div>
      <div>
        <h2>${esc(full || '—')}</h2>
        <p>Dairə ${esc((r && r.daire_no) || '')}${(r && r.daire_adi) ? ' · ' + esc(r.daire_adi) : ''} · ${esc(yer)}</p>
      </div>
      <div class="status">${b(esc((r && r.vezife) || ''), 'green')}</div>
    </div>
    <table>
      ${row('Soyad, ad, ata adı', esc(full))}
      ${row('Vəzifə', esc((r && r.vezife) || ''))}
      ${row('Dairə', esc(((r && r.daire_no) || '') + ((r && r.daire_adi) ? ' — ' + r.daire_adi : '')))}
      ${row('Məntəqə', (r && r.menteqe_no) ? esc(r.menteqe_no) : '— (dairə komissiyası)')}
      ${row('Komissiya', esc((r && r.komissiya) || ''))}
    </table>
    <div class="actions">
      <a href="/?page=dnn&q=${qq}">🚗 DNN</a>
      <a href="/?page=mnb&q=${qq}">📱 MNB</a>
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function terkibDaireRender(rows) {
  if (!rows || !rows.length) return '';
  const groups = []; const byKey = {};
  for (const r of rows) {
    const key = (r.menteqe_no == null || r.menteqe_no === '') ? 'DSK' : ('M' + r.menteqe_no);
    if (!byKey[key]) { byKey[key] = { title: r.basliq || '', menteqe: r.menteqe_no, rows: [] }; groups.push(byKey[key]); }
    byKey[key].rows.push(r);
  }
  return groups.map(g => `
    <div class="terkib-block">
      <div class="terkib-title">${esc(g.title || (g.menteqe == null ? 'Dairə seçki komissiyası' : (g.menteqe + ' saylı məntəqə')))}</div>
      <table class="terkib-table">
        <tr><th>Soyadı, adı və atasının adı</th><th>Vəzifəsi</th></tr>
        ${g.rows.map(r => `<tr><td>${esc(r.soyad_ad_ata || '')}</td><td class="vz">${esc(r.vezife || '')}</td></tr>`).join('')}
      </table>
    </div>`).join('');
}

function mskSeciciCard(r) {
  const full = String(r?.ad_soyad_ata || '').trim();
  const q = encodeURIComponent(full.replace(/\.$/, '').trim());
  const dogumIli = r?.dogum_ili || '';
  const uniqueId = 'mskCard_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  // Ad-soyad-ata adını ayır (format: "SOYAD AD ATA ADI")
  const _np = full.replace(/\.$/, '').trim().split(/\s+/);
  const bfSoyad = _np[0] || '';
  const bfAd = _np[1] || '';
  const bfAta = _np.slice(2).join(' ');
  return `<div class="card msk-secici-card" data-card-id="${uniqueId}">
    <div class="card-head">
      <div class="logo">SEÇ</div>
      <div>
        <h2>${esc(full || 'Seçici')}</h2>
        <p>Dairə ${esc(r?.daire || '')} · Məntəqə ${esc(r?.menteqe || '')}</p>
      </div>
      <div class="status">${b('SEÇİCİ', 'green')}</div>
    </div>
    <table>
      ${row('Ad soyad ata adı', esc(full))}
      ${row('Dairə', esc(r?.daire || ''))}
      ${row('Məntəqə', esc(r?.menteqe || ''))}
      ${row('Doğum ili', esc(dogumIli || ''))}
      ${row('Ünvan', esc(r?.unvan || ''))}
      ${row('Yenilənmə', esc(r?.scrape_time || ''))}
    </table>
    <details class="birth-finder" data-cardid="${uniqueId}">
      <summary>🎂 Doğum ilinə görə dəqiq tarixi tap</summary>
      <div class="birth-finder-body">
        <div id="searchQuery_${uniqueId}" style="display:none; margin-bottom:12px; padding:10px; background:rgba(59,130,246,0.1); border-radius:8px; font-size:13px; color:var(--muted);">
          <strong>Axtarılır:</strong> <span id="searchName_${uniqueId}"></span> (<span id="searchYear_${uniqueId}"></span>)
        </div>
        <div id="notFoundMsg_${uniqueId}" style="display:none; margin-bottom:12px; padding:10px; background:rgba(239,68,68,0.1); border-radius:8px; font-size:13px; color:#ef4444;">
          ❌ <span id="notFoundYear_${uniqueId}"></span> ili üçün uyğun tarix tapılmadı
        </div>
        <div class="birth-finder-grid">
          <label>Soyad<input type="text" class="bf-soyad" value="${esc(bfSoyad)}" placeholder="SOYAD" style="text-transform:uppercase"></label>
          <label>Ad<input type="text" class="bf-ad" value="${esc(bfAd)}" placeholder="AD" style="text-transform:uppercase"></label>
          <label>Ata adı<input type="text" class="bf-ata" value="${esc(bfAta)}" placeholder="ATA ADI" style="text-transform:uppercase"></label>
          <label>Doğum ili<input type="text" class="bf-il" value="${esc(dogumIli)}" placeholder="mis: 1975" readonly></label>
          <label>Cins<select class="bf-cins"><option value="Kişi">Kişi</option><option value="Qadın">Qadın</option></select></label>
        </div>
        <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; margin-bottom:12px;">
          <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">📝 Doğum tarixini bilirsiniz?</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" class="bf-manual-day" placeholder="Gün" maxlength="2" style="width:50px;">
            <span style="color:var(--muted);">.</span>
            <input type="text" class="bf-manual-month" placeholder="Ay" maxlength="2" style="width:50px;">
            <span style="color:var(--muted);">.</span>
            <input type="text" class="bf-manual-year" placeholder="İl" maxlength="4" style="width:70px;">
            <button type="button" class="bf-manual-save" data-cardid="${uniqueId}" style="padding:8px 12px; background:rgba(34,197,94,0.3); border:1px solid rgba(34,197,94,0.5); border-radius:6px; color:#86efac; cursor:pointer; font-size:12px; font-weight:bold;">💾 Qeyd et</button>
          </div>
          <div class="bf-manual-error" style="color:#ef4444; font-size:11px; margin-top:4px; display:none;"></div>
        </div>
        <button type="button" class="find-birth-btn" data-cardid="${uniqueId}">🔍 Təvəllüdü tap</button>
        <div id="birthResult_${uniqueId}" class="birth-result">
          <script>
            (function() {
              var cacheKey = 'birth_${esc(bfSoyad)}_${esc(bfAd)}_${esc(bfAta)}';
              var cached = localStorage.getItem(cacheKey);
              if (cached) {
                try {
                  var data = JSON.parse(cached);
                  document.getElementById('birthResult_${uniqueId}').innerHTML = '<div class="msg ok" style="opacity:0.9"><strong>✅ Doğum tarixi (gün.ay.il):</strong> ' + data.tarix + '<br><small style="opacity:0.7">' + (data.source || '💾 Kəşdən') + '</small></div>';
                } catch(e) {}
              }
            })();
          </script>
        </div>
      </div>
    </details>
    <div class="actions">
      ${(r?.daire) ? `<a class="voters-link" href="https://www.infocenter.gov.az/page/voters/?s=${encodeURIComponent(r?.daire || '')}&sm=${encodeURIComponent(r?.menteqe || '')}" target="_blank" rel="noopener">🗳 Seçici siyahısı (Dairə ${esc(r?.daire || '')}, Məntəqə ${esc(r?.menteqe || '')})</a>` : ''}
      <a href="/?page=dnn&q=${q}">🚗 DNN</a>
      <a href="/?page=mnb&q=${q}">📱 MNB</a>
      <a href="/?page=vergi&q=${q}">⚖️ VERGİ</a>
      <a href="/?page=b2b&b2bMode=people&b2bName=${q}">B2B</a>
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function votersStatsHtml(){
  var S = VOTERS_STATS;
  function fmt(n){ return (n==null?'':String(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' '); }
  function tbl(title, rows){
    return '<div class="card" style="margin-bottom:16px"><div class="card-head"><div class="logo">İ</div><div><h2>'+title+'</h2></div></div>'
      + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
      + rows.map(function(r){ return '<tr style="border-top:1px solid var(--border)">'
          + '<td style="padding:8px 12px;color:var(--muted)">'+r[0]+'</td>'
          + '<td style="padding:8px 12px;text-align:right;font-weight:600;font-family:monospace">'+r[1]+'</td></tr>'; }).join('')
      + '</table></div>';
  }
  var umumi=[
    ['Ümumi seçici', fmt(S.umumi_secici)],
    ['Dairə sayı', fmt(S.daire_sayi)],
    ['Məntəqə sayı', fmt(S.menteqe_sayi)],
    ['Orta seçici / məntəqə', fmt(S.orta_secici_menteqe)],
    ['Orta seçici / dairə', fmt(S.orta_secici_daire)],
    ['Ən gənc (doğum ili)', S.en_genc_dogum_ili],
    ['Ən yaşlı (doğum ili)', S.en_yasli_dogum_ili],
    ['İlk dəfə səsverənlər (2007–2008)', fmt(S.ilk_defe_seciciler_2007_2008)],
    ['Boş ünvan', fmt(S.unvan_bos)],
    ['Boş/yanlış doğum ili', fmt(S.dogum_ili_bos)]
  ];
  var yas=Object.keys(S.yas_qruplari_2026).map(function(k){ return [k, fmt(S.yas_qruplari_2026[k])]; });
  var onil=Object.keys(S.onillik_uzre).map(function(k){ return [k+'-ci illər', fmt(S.onillik_uzre[k])]; });
  var boyuk=S.en_boyuk_daire.map(function(d){ return ['Dairə '+d.daire, fmt(d.say)]; });
  var kicik=S.en_kicik_daire.map(function(d){ return ['Dairə '+d.daire, fmt(d.say)]; });
  var hamisi=S.daire_uzre.map(function(d){ return ['Dairə '+d.daire, fmt(d.say)]; });
  return '<div class="tab-info">SEÇİCİ siyahısı — statistika (təmizlənmiş baza).</div>'
    + tbl('Ümumi', umumi)
    + tbl('Yaş qrupları (2026)', yas)
    + tbl('Doğum onilliyi üzrə', onil)
    + tbl('Ən böyük 5 dairə', boyuk)
    + tbl('Ən kiçik 5 dairə', kicik)
    + tbl('Bütün dairələr üzrə', hamisi);
}

function mskSeciciClientScript() {
  return `
(function(){
  var form = document.getElementById('mskSeciciForm');
  var status = document.getElementById('mskSeciciStatus');
  var result = document.getElementById('mskSeciciResult');
  if(!form || !status || !result) return;
  var seq = 0, liveTimer = null;

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
  function copyVal(v){ try { navigator.clipboard.writeText(String(v || '')); } catch(e){} }
  window.mskSeciciCopy = copyVal;

  function card(r){
    var full = r.ad_soyad_ata || '';
    var q = encodeURIComponent(full.replace(/\.$/,'').trim());
    return '<div class="card msk-secici-card">'
      + '<div class="card-head"><div class="logo">SEÇ</div><div><h2>'+esc(full || 'Seçici')+'</h2><p>Dairə '+esc(r.daire || '')+' · Məntəqə '+esc(r.menteqe || '')+'</p></div><div class="status"><span class="badge">SEÇİCİ</span></div></div>'
      + '<table>'
      + '<tr><td class="label">Ad soyad ata adı</td><td class="value">'+esc(full)+'</td></tr>'
      + '<tr><td class="label">Dairə</td><td class="value">'+esc(r.daire)+'</td></tr>'
      + '<tr><td class="label">Məntəqə</td><td class="value">'+esc(r.menteqe)+'</td></tr>'
      + '<tr><td class="label">Doğum ili</td><td class="value">'+esc(r.dogum_ili || '')+'</td></tr>'
      + '<tr><td class="label">Ünvan</td><td class="value">'+esc(r.unvan || '')+'</td></tr>'
      + '<tr><td class="label">Yenilənmə</td><td class="value">'+esc(r.scrape_time || '')+'</td></tr>'
      + '</table>'
      + '<div class="actions">'
      + '<a href="/?page=dnn&q='+q+'">🚗 DNN</a>'
      + '<a href="/?page=mnb&q='+q+'">📱 MNB</a>'
      + '<a href="/?page=vergi&q='+q+'">⚖️ VERGİ</a>'
      + '<a href="/?page=b2b&b2bMode=people&b2bName='+q+'">B2B</a>'
      + '<button type="button" onclick="mskSeciciCopy(\''+esc(full).replace(/&#39;/g,"\\'")+ '\')">📋 Adı kopyala</button>'
      + '<button type="button" onclick="printCard(this)">🖨️ PDF</button>'
      + '</div>'
      + '</div>';
  }

  function paramsFromForm(){
    var p = new URLSearchParams();
    ['q','daire','menteqe','dogum_ili'].forEach(function(name){
      var el = form.querySelector('[name="'+name+'"]');
      if(el && el.value.trim()) p.set(name, el.value.trim());
    });
    p.set('limit','100');
    return p;
  }

  function syncUrl(p){
    try{
      var u = new URL(location.href);
      u.search = '';
      u.searchParams.set('page','msk');
      u.searchParams.set('mskSub','secici');
      ['q','daire','menteqe','dogum_ili'].forEach(function(k){ if(p.get(k)) u.searchParams.set(k,p.get(k)); });
      history.replaceState(null, '', u.toString());
    }catch(e){}
  }

  async function run(){
    var p = paramsFromForm();
    syncUrl(p);
    if(!p.get('q') && !p.get('daire') && !p.get('menteqe') && !p.get('dogum_ili')){
      status.className = 'msg warn';
      status.textContent = 'Axtarış üçün ad/ünvan yazın və ya dairə/məntəqə/doğum ili seçin.';
      result.innerHTML = '';
      return;
    }
    // SÜRƏT: qısa söz (1-2 hərf) milyonlarla sətrə uyğun gəlir → yalnız 3+ hərfdə axtar
    var _qv = (p.get('q') || '');
    var _hasF = p.get('daire') || p.get('menteqe') || p.get('dogum_ili');
    if(_qv && _qv.length < 3 && !_hasF){
      status.className = 'msg warn';
      status.textContent = 'Ən azı 3 hərf yazın...';
      result.innerHTML = '';
      return;
    }
    var myseq = ++seq;
    status.className = 'msg warn';
    status.textContent = 'Axtarılır...';
    try{
      var r = await fetch('/api/secici/search?' + p.toString(), { headers: { 'Accept':'application/json' } });
      var data = await r.json();
      if(myseq !== seq) return; // daha yeni sorğu gəlib — köhnəni at
      if(!data.ok) throw new Error(data.error || 'API xətası');
      var rows = data.results || [];
      status.className = rows.length ? 'msg ok' : 'msg err';
      status.textContent = rows.length ? ((data.total || rows.length) + ' nəticə tapıldı' + (data.total > rows.length ? ' — ilk '+rows.length+' göstərilir' : '')) : '[' + ((form.querySelector('[name="q"]')||{}).value || 'axtarış') + '] - Heç bir nəticə tapılmadı.';
      result.innerHTML = rows.map(card).join('');
    }catch(e){
      if(myseq !== seq) return;
      status.className = 'msg err';
      status.textContent = 'SEÇİCİ API xətası: ' + e.message;
    }
  }

  window.mskSeciciRun = run;
  form.addEventListener('submit', function(ev){ ev.preventDefault(); run(); });
  // YAZDIQCA AXTAR — bütün sahələrdə (debounce 300ms)
  ['mskSeciciQ','mskSeciciDaire','mskSeciciMenteqe','mskSeciciBirth'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ el.setAttribute('autocomplete','off');
      el.addEventListener('input', function(){ clearTimeout(liveTimer); liveTimer = setTimeout(run, 300); }); }
  });
  try {
    var sp = new URLSearchParams(location.search);
    ['q','daire','menteqe','dogum_ili'].forEach(function(k){
      if(sp.get(k) && form.querySelector('[name="'+k+'"]')) form.querySelector('[name="'+k+'"]').value = sp.get(k);
    });
    if(sp.get('q') || sp.get('daire') || sp.get('menteqe') || sp.get('dogum_ili')) run();
  } catch(e) {}
})();`;
}

// ── DEĞİŞİKLİK 3: parseMskTable — birth sahəsi əlavə edildi ──
function parseMskTable(htmlText) {
  const out = [];
  const tbl = htmlText.match(/<table[^>]*id="ctl00_HolderBody_GridNetice"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tbl) return out;
  const rowRe = /<tr[^>]*style="[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while ((rm = rowRe.exec(tbl[1])) !== null) {
    const rh = rm[1];
    const cells = [];
    const cdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cm;
    while ((cm = cdRe.exec(rh)) !== null) cells.push(mskStrip(cm[1]));
    if (cells.length >= 4 && cells[0] && cells[0].trim() && !cells[0].includes('Ad, soyad')) {
      const lm = rh.match(/href="(https:\/\/gomap\.az[^"]+)"/i);

      const daireText = cells[1] || '';
      const menteqeText = cells[3] || '';

      const daireMatch = daireText.match(/(\d+)\s*saylı/i);
      const daireNum = daireMatch ? daireMatch[1] : '';

      const menteqeMatch = menteqeText.match(/(\d+)\s*saylı/i);
      const menteqeNum = menteqeMatch ? menteqeMatch[1] : '';

      // MSK cədvəlindəki 4-cü (0-based index 4) sütun doğum ilidir
      const birthRaw = cells[4] ? cells[4].trim() : '';

      out.push({
        name: cells[0].trim(),
        birth: birthRaw,
        daire: cells[1] ? cells[1].trim() : '',
        daireNum: daireNum,
        mentege: cells[3] ? cells[3].trim() : '',
        menteqeNum: menteqeNum,
        unvan: cells[5] ? cells[5].trim() : '',
        mentegeLink: lm ? lm[1] : ''
      });
    }
  }
  return out;
}

function mskDateRaw(s) {
  const p = String(s || '').split('.');
  if (p.length !== 3) return 'N';
  const d = Number(p[0]);
  const m = Number(p[1]) - 1;
  const y = Number(p[2]);
  if (!d || m < 0 || !y) return 'N';
  return Date.UTC(y, m, d);
}

function mskDateState(s) {
  const p = String(s || '').split('.');
  if (p.length !== 3) return '';
  return `${p[1]}/${p[0]}/${p[2]}`;
}

function mskStrip(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .trim();
}

function mskSearchLinkNoBirth(full, label) {
  label = label || '🗳️ MSK-da axtar →';
  const parts = cleanPersonName(full).split(' ').filter(Boolean);
  if (!parts[0]) return '';
  return '<a href="/?page=msk&mskLastName=' + encodeURIComponent(parts[0]) +
    '&mskFirstName=' + encodeURIComponent(parts[1] || '') +
    '&mskPatronymic=' + encodeURIComponent(parts[2] || '') + '">' + label + '</a>';
}

// ── DEĞİŞİKLİK 3: mskCard — birth sahəsi göstərilir ──
function mskCard(r) {
  const dl = r.daire.split('\n').map(function(l){return l.trim();}).filter(Boolean);
  const ml = r.mentege.split('\n').map(function(l){return l.trim();}).filter(Boolean);

  const seckiDairesiLink = (r.daireNum && r.menteqeNum)
    ? `<a href="https://www.infocenter.gov.az/page/voters/default.aspx?s=${encodeURIComponent(r.daireNum)}&sm=${encodeURIComponent(r.menteqeNum)}" target="_blank" rel="noopener" style="color:var(--blue)">Seçki Dairəsinin Keçidi 🔗</a>`
    : '';

  return '<div class="card">' +
    '<div class="card-head">' +
      '<div class="logo">\uD83D\uDDF3\uFE0F</div>' +
      '<div><h2>' + esc(r.name) + '</h2><p>Se\u00E7ici m\u0259lumat\u0131</p></div>' +
      '<div class="status">' + b('MSK', 'gray') + '</div>' +
    '</div>' +
    '<table>' +
      row('Ad, soyad, ata adı', esc(r.name)) +
      (r.birth ? row('Doğum ili', esc(r.birth)) : '') +
      row('Seçki dairəsi', esc(dl[0] || '')) +
      row('Dairə ünvanı', esc(dl.slice(1).join(', '))) +
      (r.mentegeLink
        ? row('Seçki məntəqəsi', '<a href="' + esc(r.mentegeLink) + '" target="_blank" style="color:var(--blue)">' + esc(ml[0] || '') + ' \uD83D\uDDFA\uFE0F</a>')
        : row('Seçki məntəqəsi', esc(ml[0] || ''))) +
      row('Məntəqə ünvanı', esc(ml.slice(1).join(', '))) +
      row('Seçicinin ünvanı', esc(r.unvan)) +
      (seckiDairesiLink ? row('Seçki Dairəsinin Keçidi', seckiDairesiLink) : '') +
    '</table>' +
    '<div class="actions">' +
      personCrossLinks(r.name) +
      '<button onclick="printCard(this)">\uD83D\uDDB8\uFE0F PDF \u00E7ap et</button>' +
    '</div>' +
  '</div>';
}

function script() {
  return `
  function printCard(btn){
    var card = btn.closest('.card');
    var w = window.open('', '', 'width=900,height=700');
    w.document.write('<html><head><title>PDF</title>' + document.querySelector('style').outerHTML + '</head><body class="print-one"><main>' + card.outerHTML + '</main></body></html>');
    w.document.close();
    setTimeout(function(){ w.print(); }, 250);
  }

  async function copyText(value){
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(value || ''));
        return;
      }
    } catch (err) {
    }

    try {
      var input = document.createElement('textarea');
      input.value = String(value || '');
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    } catch (err2) {
      alert('Kopyalama alınmadı');
    }
  }

  function getTheme(){
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch(e) {
      return 'dark';
    }
  }

  function saveTheme(theme){
    try {
      localStorage.setItem('theme', theme);
    } catch(e) {}
  }

  function setClass(el, cls, on){
    if (!el) return;
    if (el.classList) {
      el.classList.toggle(cls, !!on);
      return;
    }
    var cur = ' ' + (el.className || '') + ' ';
    var has = cur.indexOf(' ' + cls + ' ') !== -1;
    if (on && !has) el.className = (el.className ? el.className + ' ' : '') + cls;
    if (!on && has) el.className = cur.replace(' ' + cls + ' ', ' ').trim();
  }

  function applyTheme(){
    var isLight = getTheme() === 'light';

    setClass(document.documentElement, 'light', isLight);
    if (document.body) setClass(document.body, 'light', isLight);

    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = isLight ? '🌙 Tünd' : '☀️ Açıq';
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    }
  }

  function toggleTheme(){
    var current = getTheme();
    saveTheme(current === 'light' ? 'dark' : 'light');
    applyTheme();
    return false;
  }

  window.printCard = printCard;
  window.copyText = copyText;
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;

  applyTheme();

  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.onclick = function(e){
      if (e && e.preventDefault) e.preventDefault();
      return toggleTheme();
    };
  }

  /* ── Kompakt rejim ── */
  function toggleCompact() {
    var on = document.body.classList.toggle('compact');
    var b = document.getElementById('compactToggle');
    if (b) b.textContent = on ? '⊟ Normal' : '⊞ Kompakt';
    try { localStorage.setItem('compact', on ? '1' : '0'); } catch(_) {}
  }
  (function(){
    try {
      if (localStorage.getItem('compact') === '1') {
        document.body.classList.add('compact');
        var b = document.getElementById('compactToggle');
        if (b) b.textContent = '⊟ Normal';
      }
    } catch(_) {}
  })();
  window.toggleCompact = toggleCompact;

  /* ── Qeydlər ── */
  function toggleNote(btn, id) {
    var note = document.getElementById('note_' + id);
    if (!note) return;
    note.classList.toggle('open');
    if (note.classList.contains('open')) {
      var ta = document.getElementById('nta_' + id);
      if (ta) {
        try { ta.value = localStorage.getItem('note_' + id) || ''; } catch(_) {}
        ta.focus();
      }
    }
  }
  function saveNote(id, val) {
    try {
      if (val && val.trim()) localStorage.setItem('note_' + id, val);
      else localStorage.removeItem('note_' + id);
    } catch(_) {}
  }
  window.toggleNote = toggleNote;
  window.saveNote = saveNote;

  /* ── Favoritlər ── */
  var _favs = {};
  try { _favs = JSON.parse(localStorage.getItem('favs') || '{}'); } catch(_) { _favs = {}; }

  function toggleFavorite(btn, id, title) {
    if (_favs[id]) {
      delete _favs[id];
      btn.classList.remove('active');
      btn.title = 'Seçilmişlərə əlavə et';
    } else {
      _favs[id] = { title: title, url: location.href, time: Date.now() };
      btn.classList.add('active');
      btn.title = 'Seçilmişlərdən çıxar';
    }
    try { localStorage.setItem('favs', JSON.stringify(_favs)); } catch(_) {}
  }
  function clearFavorites() {
    if (!confirm('Bütün seçilmişlər silinsin?')) return;
    _favs = {};
    try { localStorage.removeItem('favs'); } catch(_) {}
    var list = document.getElementById('secilmishList');
    if (list) list.innerHTML = '<div class="msg warn">Seçilmişlər silindi.</div>';
  }
  window.toggleFavorite = toggleFavorite;
  window.clearFavorites = clearFavorites;

  // Seçilmişlər səhifəsini render et
  (function(){
    var list = document.getElementById('secilmishList');
    if (!list) return;
    var keys = Object.keys(_favs);
    if (!keys.length) { list.innerHTML = '<div class="msg warn">Hələ heç bir kart seçilməyib. Axtarış nəticələrindəki ⭐ düyməsini basın.</div>'; return; }
    list.innerHTML = keys.sort(function(a,b){ return (_favs[b].time||0) - (_favs[a].time||0); }).map(function(id){
      var f = _favs[id];
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">' +
        '<span style="flex:1;font-weight:600">' + (f.title||id) + '</span>' +
        '<a href="' + (f.url||'#') + '" style="color:var(--blue);font-size:13px">Aç →</a>' +
        '<button onclick="removeFav(\\'' + id + '\\',this)" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:0 4px">✕</button>' +
      '</div>';
    }).join('');
  })();

  function removeFav(id, btn) {
    delete _favs[id];
    try { localStorage.setItem('favs', JSON.stringify(_favs)); } catch(_) {}
    var row = btn && btn.parentNode;
    if (row) row.remove();
  }
  window.removeFav = removeFav;

  // Mövcud ulduzları aktiv et
  document.querySelectorAll('.fav-star').forEach(function(s){
    var id = s.getAttribute('onclick').match(/'([^']+)'/);
    if (id && _favs[id[1]]) s.classList.add('active');
  });

  /* ── Paylaşma linki ── */
  function shareCard(id) {
    var url = location.origin + location.pathname + location.search;
    var btn = document.querySelector('[onclick="shareCard(\\'' + id + '\\')"]');
    copyText(url).then(function(){
      if (btn) { var old = btn.textContent; btn.textContent = '✓ Kopyalandı'; setTimeout(function(){ btn.textContent = old; }, 1600); }
    }).catch(function(){
      if (btn) { var old = btn.textContent; btn.textContent = url; setTimeout(function(){ btn.textContent = old; }, 3000); }
    });
  }
  window.shareCard = shareCard;

  /* ── Müqayisə rejimi ── */
  var _compareItems = [];
  function compareCard(btn, id, title) {
    var idx = _compareItems.findIndex(function(c){ return c.id === id; });
    if (idx !== -1) {
      _compareItems.splice(idx, 1);
      btn.style.opacity = '';
    } else {
      if (_compareItems.length >= 2) { alert('Maksimum 2 kart müqayisə oluna bilər.'); return; }
      _compareItems.push({ id: id, title: title });
      btn.style.opacity = '1';
      btn.style.color = 'var(--yellow)';
    }
    updateCompareBar();
  }
  function updateCompareBar() {
    var bar = document.getElementById('compareBar');
    if (!bar) return;
    if (_compareItems.length === 0) { bar.classList.remove('visible'); return; }
    bar.classList.add('visible');
    document.getElementById('compareItems').innerHTML = _compareItems.map(function(c,i){
      return '<div class="compare-item">' + c.title +
        '<button onclick="removeCompare(' + i + ')">✕</button></div>';
    }).join('');
  }
  function removeCompare(i) {
    _compareItems.splice(i, 1);
    updateCompareBar();
  }
  function doCompare() {
    if (_compareItems.length < 2) { alert('Müqayisə üçün 2 kart seçin.'); return; }
    var c1 = document.getElementById('note_' + _compareItems[0].id);
    var c2 = document.getElementById('note_' + _compareItems[1].id);
    // Scroll to both cards
    var cards = document.querySelectorAll('.card');
    var matched = [];
    cards.forEach(function(card){
      var actions = card.querySelector('.actions');
      if (!actions) return;
      var txt = actions.innerHTML || '';
      if (_compareItems.some(function(c){ return txt.indexOf(c.id) !== -1; })) matched.push(card);
    });
    if (matched.length >= 2) {
      matched[0].style.outline = '2px solid var(--blue)';
      matched[1].style.outline = '2px solid var(--yellow)';
      matched[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert('Kartlar bu səhifədə tapılmadı. Axtarış nəticəsini açın.');
    }
  }
  window.compareCard = compareCard;
  window.removeCompare = removeCompare;
  window.doCompare = doCompare;

  /* ── Boş axtarış xəbərdarlığı ── */
  (function(){
    var q = (location.search.match(/[?&]q=([^&]*)/) || [])[1];
    if (!q) q = (location.search.match(/[?&]uq=([^&]*)/) || [])[1];
    if (!q) return;
    q = decodeURIComponent(q.replace(/[+]/g,' ')).toUpperCase();
    var noResult = document.querySelector('.msg.err');
    if (!noResult) return;
    try {
      var key = 'emptySearch_' + q;
      var cnt = parseInt(localStorage.getItem(key) || '0') + 1;
      localStorage.setItem(key, cnt);
      if (cnt >= 10) {
        var w = document.createElement('div');
        w.className = 'empty-warn';
        w.style.display = 'block';
        w.textContent = '⚠️ "' + q + '" üzrə ' + cnt + ' dəfə boş nəticə qaytarıldı. Bu bazada bu qeyd yoxdur.';
        noResult.parentNode.insertBefore(w, noResult);
      }
    } catch(_) {}
  })();

  /* ── Tarixçə filtri ── */
  function filterHistory(val) {
    var rows = document.querySelectorAll('#histTimeline .timeline-row');
    var v = val.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function(r){
      var txt = r.textContent.toLowerCase();
      var match = !v || txt.indexOf(v) !== -1;
      r.style.display = match ? '' : 'none';
      if (match) shown++;
    });
    var cnt = document.getElementById('histFilterCount');
    if (cnt) cnt.textContent = v ? shown + ' / ' + rows.length + ' nəticə' : '';
  }
  window.filterHistory = filterHistory;

  /* ── DNN prefetch (400ms debounce) ── */
  (function(){
    var dnnInput = document.querySelector('input[name="q"]');
    var pageInput = document.querySelector('input[name="page"][value="dnn"]');
    if (!dnnInput || !pageInput) return;
    var _timer = null;
    var _cache = {};
    dnnInput.addEventListener('input', function(){
      clearTimeout(_timer);
      var v = this.value.trim();
      if (v.length < 3) return;
      _timer = setTimeout(function(){
        if (_cache[v]) return;
        _cache[v] = 'loading';
        fetch('/?page=dnn&q=' + encodeURIComponent(v), { credentials: 'same-origin' })
          .then(function(r){ return r.text(); })
          .then(function(html){ _cache[v] = html; })
          .catch(function(){ delete _cache[v]; });
      }, 400);
    });
  })();

  /* ── Müqayisə paneli DOM inject ── */
  (function(){
    var bar = document.createElement('div');
    bar.id = 'compareBar';
    bar.className = 'compare-bar';
    bar.innerHTML = '<span style="font-weight:800;font-size:13px">⚖️ Müqayisə:</span>' +
      '<div id="compareItems" style="display:flex;gap:8px;flex-wrap:wrap;flex:1"></div>' +
      '<button onclick="doCompare()" style="background:var(--blue);color:#fff">Müqayisə et</button>' +
      '<button onclick="clearCompare()" style="background:var(--card2);color:var(--text);border:1px solid var(--border)">Sıfırla</button>';
    document.body.appendChild(bar);
    window.clearCompare = function(){ _compareItems = []; updateCompareBar(); document.querySelectorAll('.card').forEach(function(c){ c.style.outline=''; }); };
  })();
  `;
}



// ── CORONA CARD ────────────────────────────────────────────────────────
function coronaKindLabel(k) {
  const map = {
    confirmed_covid_quarantine: 'Təsdiqlənmiş COVID / karantin',
    covid_related: 'COVID əlaqəli',
    death_related: 'Ölüm əlaqəli',
    person_related: 'Şəxs əlaqəli',
    refusal_or_exception: 'İmtina / istisna'
  };
  return map[k] || k || 'CORONA qeyd';
}

function coronaSourceText(r) {
  return [r.source_folder, r.source_file].filter(Boolean).join(' / ');
}

function coronaCard(r) {
  const fullName = displayPersonCaps(r.full_name || '');
  const kind = coronaKindLabel(r.record_kind || '');
  const source = coronaSourceText(r);
  const raw = String(r.raw_record || '').trim();

  return `<div class="card">
    <div class="card-head">
      <div class="logo" style="font-size:10px;font-weight:900;background:linear-gradient(135deg,#7f1d1d,#ef4444)">CORONA</div>
      <div>
        <h2>${esc(fullName || 'CORONA QEYDİ')}</h2>
        <p>${esc(kind)}${r.event_date ? ' — ' + esc(azDate(r.event_date)) : ''}</p>
      </div>
      <div class="status">
        ${b(kind, r.record_kind === 'death_related' ? 'red' : r.record_kind === 'confirmed_covid_quarantine' ? 'yellow' : 'gray')}
      </div>
    </div>

    <table>
      ${row('Ad soyad ata adı', esc(fullName))}
      ${row('Hadisə tarixi', esc(azDate(r.event_date || '')))}
      ${row('Təvəllüd', esc(azDate(r.birth_date || '')))}
      ${row('Yaş / qrup', esc([r.age, r.age_bucket].filter(v => v !== null && v !== undefined && String(v) !== '').join(' / ')))}
      ${row('Telefon', esc(r.phone || ''))}
      ${row('ID / pasport', esc(r.id_passport || ''))}
      ${row('Ünvan', esc(r.address || ''))}
      ${row('Qeydiyyat ünvanı', esc(r.registration_address || ''))}
      ${row('Ölüm ünvanı', esc(r.death_address || ''))}
      ${row('Diaqnoz', esc(r.diagnosis || ''))}
      ${row('Hospitalizasiya', esc(r.hospitalization || ''))}
      ${row('Şöbə / bölmə', esc(r.department || ''))}
      ${row('Yaxma tarixi', esc(azDate(r.swab_date || '')))}
      ${row('Həkim', esc(r.doctor || ''))}
      ${row('Mənbə fayl', esc(source))}
      ${raw ? rawRow('Xam qeyd', raw) : ''}
    </table>

    <div class="actions">
      ${fullName ? personCrossLinks(fullName) : ''}
      ${r.phone ? `<a href="/?page=mnb&q=${encodeURIComponent(r.phone)}">📱 MNB</a>` : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function coronaStatsCard(data) {
  const s = data.stats || {};
  const kinds = data.record_kinds || [];
  const ages = data.age_buckets || [];
  const years = data.years || [];
  const folders = data.folders || [];
  const topFiles = data.top_files || [];

  return `<div class="card">
    <div class="card-head">
      <div class="logo" style="font-size:10px;font-weight:900;background:linear-gradient(135deg,#7f1d1d,#ef4444)">CORONA</div>
      <div><h2>CORONA bazasının statistikası</h2><p>Fayl inventarı və şəxslərə aid çıxarılmış qeydlər</p></div>
    </div>
    <table>
      ${row('Fayl sayı', esc(String(s.files_total || '')))}
      ${row('Şəxsi məlumat siqnalı olan fayl', esc(String(s.files_with_personal_signal || '')))}
      ${row('Şəxs qeydi çıxarılan fayl', esc(String(s.files_with_records || '')))}
      ${row('Şəxs qeydi / mention', esc(String(s.person_records_total || '')))}
      ${row('Ehtimal olunan unikal şəxs', esc(String(s.unique_person_estimate || '')))}
      ${row('Telefonu olan qeydlər', esc(String(s.records_with_phone || '')))}
      ${row('ID/pasport olan qeydlər', esc(String(s.records_with_id || '')))}
      ${row('Ünvanı olan qeydlər', esc(String(s.records_with_address || '')))}
      ${kinds.map(x => row(esc(coronaKindLabel(x.record_kind)), `<b>${esc(String(x.count))}</b> qeyd`)).join('')}
      ${ages.map(x => row(`Yaş qrupu: ${esc(x.age_bucket || 'unknown')}`, `<b>${esc(String(x.count))}</b> qeyd`)).join('')}
      ${years.map(x => row(`İl: ${esc(x.year || 'unknown')}`, `<b>${esc(String(x.count))}</b> qeyd`)).join('')}
      ${folders.map(x => row(`Qovluq: ${esc(x.source_folder || 'unknown')}`, `<b>${esc(String(x.count))}</b> qeyd`)).join('')}
      ${topFiles.map(x => row(`Fayl: ${esc(x.source_file || '')}`, `<b>${esc(String(x.count))}</b> qeyd`)).join('')}
    </table>
  </div>`;
}

// ── TENDER STATS CARD ──────────────────────────────────────────────────
function tenderStatsCard(data) {
  const s = data.stats || {};
  const years = data.years || [];
  const totalAzn = s.total_azn ? Number(s.total_azn).toLocaleString('az-AZ', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' AZN' : null;
  return `<div class="card">
    <div class="card-head">
      <div class="logo" style="font-size:10px;font-weight:900;background:linear-gradient(135deg,#1e3a5f,#2563eb)">TENDER</div>
      <div><h2>TENDER bazasının statistikası</h2><p>Dövlət satınalmalarının reyestri — vergiler.az</p></div>
    </div>
    <table>
      ${row('Ümumi qeyd sayı',      `<b>${esc(String(s.total || ''))}</b>`)}
      ${row('Unikal satınalan',     esc(String(s.unique_org || '')))}
      ${row('Məbləği olan qeydlər', esc(String(s.with_price || '')))}
      ${totalAzn ? row('Ümumi məbləğ',        `<b>${totalAzn}</b>`) : ''}
      ${s.tendersiz_mmc ? row('Tendersiz MMC-lər (VÖEN bazası)', `<b>${Number(s.tendersiz_mmc).toLocaleString('az-AZ')}</b>`) : ''}
      ${years.map(x => row(`İl: ${esc(String(x.il || ''))}`, `<b>${esc(String(x.sayi))}</b> qeyd`)).join('')}
    </table>
  </div>`;
}

// ── CBAR CARD ──────────────────────────────────────────────────────────
function cbarCard(r) {
  const isActive = (r.status || 'active') === 'active' && (!r.legv_tarix || !r.legv_tarix.trim());
  const isSistem = Number(r.sistem_ehemliyyetli) === 1;

  const fullAd = r.huquqi_forma
    ? `${esc(r.ad || '—')} ${esc(r.huquqi_forma)}`
    : esc(r.ad || '—');

  const voenLink = r.voen && /^\d{10}$/.test(r.voen.trim())
    ? `<a href="/?page=history&tin=${encodeURIComponent(r.voen.trim())}" style="color:var(--blue)">${esc(r.voen.trim())}</a>`
    : esc(r.voen || '');

  const websiteLink = r.website
    ? `<a href="${esc(r.website)}" target="_blank" rel="noopener">${esc(r.website.replace(/^https?:\/\//, ''))}</a>`
    : '';

  // People grouped by role
  const people = Array.isArray(r.rehberlik) ? r.rehberlik : [];
  const grouped = {};
  for (const p of people) {
    const rol = (p.rol || 'Rəhbər').trim();
    if (!grouped[rol]) grouped[rol] = [];
    if (p.ad && p.ad.trim()) grouped[rol].push(p.ad.trim());
  }
  const peopleRows = Object.entries(grouped).map(([rol, names]) =>
    row(esc(rol), names.map(name => {
      const displayName = cbarDisplayPersonName(rol, name);
      return `<div class="cbar-person-row"><span class="cbar-person-name">${esc(displayName)}</span><span class="cbar-person-actions">${personCrossLinks(displayName)}</span></div>`;
    }).join(''))
  ).join('');

  return `<div class="card">
    <div class="card-head">
      <div class="logo" style="font-size:11px;font-weight:900;background:linear-gradient(135deg,#1e3a8a,#3b82f6)">CBAR</div>
      <div>
        <h2>${fullAd}</h2>
        <p>${esc(r.kateqoriya || '')}</p>
      </div>
      <div class="status">
        ${isActive ? b('Aktiv', 'green') : b('Ləğv edilib', 'red')}
        ${isSistem ? b('Sistem əhəmiyyətli', 'yellow') : ''}
      </div>
    </div>
    <table>
      ${row('VÖEN',              voenLink)}
      ${row('Lisenziya №',       esc(r.lis_no || ''))}
      ${row('Lisenziya tarixi',  esc(r.lis_tarix || ''))}
      ${r.legv_tarix ? row('Ləğv tarixi', b(esc(r.legv_tarix), 'red')) : ''}
      ${row('Ünvan',             esc(r.unvan || ''))}
      ${row('Telefon',           esc(r.telefon || ''))}
      ${row('Vebsayt',           websiteLink)}
      ${row('E-poçt',            esc(r.email || ''))}
      ${row('Fəaliyyət növü',    esc(r.faaliyet || ''))}
      ${row('Əmtəə nişanı / Qeyd', esc(r.elave || ''))}
      ${peopleRows}
    </table>
    <div class="actions">
      ${r.voen && /^\d{10}$/.test(r.voen.trim()) ? tinCrossLinks(r.voen.trim(), { tdrQuery: r.ad }) : ''}
      <a href="/?page=search&name=${encodeURIComponent(r.ad || '')}">🔎 MMC AD</a>
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

// ── OLD CBAR HELPERS (kept for potential reuse) ────────────────────────
function cbarDisplayPersonName(role, name) {
  const r = normText(role || '');
  const raw = String(name || '').trim();
  if (r === 'tekbasina rehberi' || r.includes('tekbasina rehberi')) {
    return cleanPersonName(raw).toUpperCase();
  }
  return raw;
}

function cbarRoleLabel(role) {
  const r = String(role || '').trim();
  const n = normText(r);

  if (n.startsWith('bas muhasib')) return 'Baş mühasib';
  if (n === 'daxili auditor' || n === 'daxili audit bolmesi rehberi') return 'Daxili audit bölməsinin rəhbəri';
  if (n === 'idare heyeti sedri') return 'İdarə heyətinin sədri';
  if (n === 'idare heyeti uzvleri') return 'İdarə heyətinin üzvləri';
  if (n === 'direktorlar surasi') return 'Direktorlar Şurası';
  if (n === 'idare heyeti') return 'İdarə heyəti';
  if (n === 'audit komitesi') return 'Audit Komitəsi';
  if (n === 'daxili audit xidmetinin rehberi') return 'Daxili audit xidmətinin rəhbəri';
  if (n === 'mesul aktuari') return 'Məsul aktuarı';

  return r;
}

function cbarIsEmptyPersonName(name) {
  const n = normText(String(name || '').replace(/[()]/g, ' ').replace(/\s+/g, ' '));
  if (!n) return true;

  const emptyMarkers = [
    'muhasibat xidmetinin rehberi',
    'muhasibat xidmetinin rəhbəri',
    'elaqe melumatlari',
    'elaqe məlumatlari',
    'tel',
    'telefon',
    'vebsayt',
    'www',
    'mesul aktuari'
  ];

  if (emptyMarkers.some(x => n === x || n.includes(x))) return true;
  if (n.length < 3) return true;
  return false;
}

function cbarSplitPeopleNames(value) {
  let text = String(value || '')
    .replace(/\b(DNN|B2B|MSK)\b/gi, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cbarIsEmptyPersonName(text)) return [];

  const azMatches = text.match(/[A-ZƏİÖÜĞŞÇ][A-ZƏİÖÜĞŞÇ''`\-\. ]+?\s+(?:OĞLU|OGLU|QIZI|QİZI|KYZY)\b/giu);
  if (azMatches && azMatches.length >= 2) {
    return azMatches
      .map(x => x.replace(/\s+/g, ' ').trim())
      .filter(x => !cbarIsEmptyPersonName(x));
  }

  return [text].filter(x => !cbarIsEmptyPersonName(x));
}

function cbarPersonLinks(name) {
  const cleanName = String(name || '').trim();
  if (!cleanName || cbarIsEmptyPersonName(cleanName)) return '';

  const dnnUrl = `/?page=dnn&q=${encodeURIComponent(cleanName)}`;
  const b2bUrl = `/?page=b2b&b2bMode=people&b2bName=${encodeURIComponent(cleanName)}`;

  return `<span class="cbar-person-links">` +
    `<a href="${dnnUrl}" target="_blank" rel="noopener">DNN</a>` +
    `<a href="${b2bUrl}" target="_blank" rel="noopener">B2B</a>` +
    `</span>`;
}


function cbarContactText(r) {
  return [
    r?.telefon || '',
    r?.email || '',
    r?.vebsayt || '',
    r?.raw_contact || '',
    r?.elaqe_melumatlari || '',
    r?.contact || '',
    r?.contact_raw || ''
  ].join(' ').replace(/\s+/g, ' ').trim();
}

function cbarStripFromFirstRole(text) {
  const roles = cbarRoleMarkers();
  const hay = String(text || '');
  let cut = -1;
  for (const role of roles) {
    const idx = hay.toLocaleLowerCase('az-AZ').indexOf(role.toLocaleLowerCase('az-AZ'));
    if (idx !== -1 && (cut === -1 || idx < cut)) cut = idx;
  }
  return cut === -1 ? hay : hay.slice(0, cut);
}

function cbarCleanEmailValue(r) {
  const contact = cbarStripFromFirstRole(cbarContactText(r));
  const m = contact.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  return m ? m[0] : '';
}

function cbarCleanWebsiteValue(r) {
  const contact = cbarStripFromFirstRole(cbarContactText(r));
  const raw = String(r?.vebsayt || '').trim();
  const candidates = [raw, contact];
  for (const c of candidates) {
    const m = String(c || '').match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9\-]+(?:\.[a-z0-9\-]+)+(?:\/[^\s]*)?/i);
    if (m && !m[0].includes('@')) {
      let site = m[0].replace(/[,.]+$/g, '');
      if (!/^https?:\/\//i.test(site)) site = 'https://' + site;
      return site;
    }
  }
  return '';
}

function cbarCleanLicenseDateValue(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const m1 = s.match(/\b\d{2}\.\d{2}\.\d{4}\b/);
  if (m1) return m1[0];
  const m2 = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m2) return `${m2[3]}.${m2[2]}.${m2[1]}`;
  return s.replace(/Lisenziyada dəyişiklik barədə qeyd/gi, '').replace(/\s+/g, ' ').trim();
}

function cbarCleanVoenValue(r) {
  const candidates = [
    r?.voen, r?.vöen, r?.VOEN, r?.VÖEN,
    r?.tin, r?.tax_number, r?.taxNumber, r?.identity_number, r?.identityNumber
  ];
  for (const v of candidates) {
    const digits = String(v || '').replace(/\D+/g, '');
    if (/^[1-9]\d{7,11}$/.test(digits)) return digits;
  }

  const raw = [r?.raw_contact || '', r?.elaqe_melumatlari || '', r?.contact || '', r?.email || ''].join(' ');
  const m = raw.match(/(?:VÖEN|VOEN|TIN|vergi)[^0-9]{0,30}([1-9]\d{7,11})/i);
  if (m) return m[1];
  return '';
}

function cbarCleanPhoneValue(r) {
  const contact = cbarStripFromFirstRole(cbarContactText(r));
  const found = [];
  const add = (v) => {
    let x = String(v || '').trim().replace(/[;]+$/g, '').replace(/^[Tt]el:?\s*/i, '').trim();
    if (!x) return;
    const compact = x.replace(/[\s\-()]/g, '');
    if (!/^\*?\+?\d{3,14}$/.test(compact)) return;
    if (compact.length < 4) return;
    if (!found.some(y => y.replace(/[\s\-()]/g, '') === compact)) found.push(x);
  };

  const re = /(\*\d{3,5}|\+?994\s*\(?\d{2}\)?[\s\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}|0\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|0\d{9})/g;
  let m;
  while ((m = re.exec(contact)) !== null) add(m[1]);
  if (!found.length) add(r?.telefon || '');
  return found.join(', ');
}

function cbarRoleMarkers() {
  return [
    'Direktorlar Şurası',
    'İdarə heyəti',
    'Audit Komitəsi',
    'Daxili audit xidmətinin rəhbəri',
    'Məsul aktuarı',
    'Baş mühasib',
    'Müşahidə Şurasının sədri',
    'Müşahidə Şurasının üzvləri',
    'Müşahidə Şurasının müstəqil üzvləri',
    'Audit komitəsinin sədri',
    'Audit komitəsinin üzvləri',
    'Audit komitəsinin müstəqil kənar üzvləri',
    'İdarə heyətinin sədri',
    'İdarə heyətinin üzvləri',
    'Daxili audit bölməsinin rəhbəri',
    'Daxili audit bölməsinin əməkdaşları',
    'Filial müdiri',
    'Təkbaşına rəhbəri'
  ];
}

function cbarExtractRoleSectionsFromText(value) {
  let text = String(value || '')
    .replace(/\b(DNN|B2B|MSK)\b/gi, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return [];

  const markers = cbarRoleMarkers();
  const lower = text.toLocaleLowerCase('az-AZ');
  const hits = [];
  for (const role of markers) {
    let start = 0;
    const roleLower = role.toLocaleLowerCase('az-AZ');
    while (true) {
      const idx = lower.indexOf(roleLower, start);
      if (idx === -1) break;
      hits.push({ idx, role, len: role.length });
      start = idx + roleLower.length;
    }
  }
  hits.sort((a, b) => a.idx - b.idx || b.len - a.len);
  const uniq = [];
  for (const h of hits) {
    if (uniq.length && h.idx < uniq[uniq.length - 1].idx + uniq[uniq.length - 1].len) continue;
    uniq.push(h);
  }

  const out = [];
  for (let i = 0; i < uniq.length; i++) {
    const h = uniq[i];
    const next = uniq[i + 1] ? uniq[i + 1].idx : text.length;
    const body = text.slice(h.idx + h.len, next).replace(/^[:\-–—\s]+/, '').trim();
    if (!body) continue;
    const names = cbarSplitInsurancePeople(body);
    for (const name of names) out.push({ role: cbarRoleLabel(h.role), full_name: name });
  }
  return out;
}

function cbarSplitInsurancePeople(value) {
  let text = String(value || '')
    .replace(/\b(DNN|B2B|MSK)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text || cbarIsEmptyPersonName(text)) return [];

  const withRoleSuffix = [];
  const re = /(.+?)(?:\s*[-–—]\s*|[-–—])?(sədr müavini|müstəqil üzv|sədr|üzv)\b/giu;
  let m;
  while ((m = re.exec(text)) !== null) {
    let name = String(m[1] || '').replace(/[;,]+$/g, '').replace(/^[:\-–—\s]+/, '').trim();
    name = name.replace(/\s+/g, ' ');
    if (name && !cbarIsEmptyPersonName(name)) withRoleSuffix.push(name);
  }
  if (withRoleSuffix.length) return withRoleSuffix;
  return cbarSplitPeopleNames(text);
}

function cbarAddGroupedPerson(grouped, role, name) {
  const cleanRole = cbarRoleLabel(role || '');
  if (!cleanRole) return;
  const names = cbarSplitPeopleNames(name || '');
  if (!names.length) return;
  if (!grouped[cleanRole]) grouped[cleanRole] = [];
  names.forEach(nm => {
    const key = normText(nm);
    const already = grouped[cleanRole].some(x => normText(x) === key);
    if (!already) grouped[cleanRole].push(nm);
  });
}


function parseIdareTable(htmlText) {
  const rows = partsBetween(htmlText, '<tr', '</tr>');
  const out = [];
  for (const r of rows) {
    const cells = partsBetween(r, '<td', '</td>').map(stripTags);
    if (cells.length >= 5 && cells[0] && /\d/.test(cells[0])) {
      out.push({
        tel: cells[0].trim(),
        name: cells[1].trim(),
        address: cells[2].trim(),
        bankCode: cells[3].trim(),
        voen: cells[4].trim()
      });
    }
  }
  return out;
}

function parseIdareOptions(htmlText) {
  const selectMatch = htmlText.match(/name="ctl06\$ddlSelect"[^>]*>([\s\S]*?)<\/select>/);
  if (!selectMatch) return [];
  const out = [];
  const optRe = /<option[^>]*value="([^"]*)"[^>]*>(.*?)<\/option>/g;
  let m;
  while ((m = optRe.exec(selectMatch[1])) !== null) {
    const val = m[1];
    const label = htmlDecode(m[2]).trim().replace(/\s+/g, ' ');
    if (val && label && label !== 'SIYAHI') {
      out.push({ value: val, label });
    }
  }
  return out;
}

function idareCard(r) {
  const hasTin = r.voen && /^\d{10}$/.test(r.voen.trim());
  const tinLink = hasTin
    ? `<a href="/?page=history&tin=${encodeURIComponent(r.voen.trim())}">${esc(r.voen.trim())}</a>`
    : esc(r.voen);

  return `<div class="card">
    <div class="card-head">
      <div class="logo">🏛️</div>
      <div>
        <h2>${esc(r.name)}</h2>
        <p>☎️ ${esc(r.tel)}</p>
      </div>
      <div class="status">${b('İDARƏ', 'gray')}</div>
    </div>
    <table>
      ${row('Ad', esc(r.name))}
      ${row('Telefon', esc(r.tel))}
      ${row('Ünvan', esc(r.address))}
      ${row('Bank hesab kodu', esc(r.bankCode))}
      ${row('VÖEN', tinLink)}
    </table>
    <div class="actions">
      ${hasTin ? tinCrossLinks(r.voen.trim()) : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function aramDate(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : esc(s);
}

function aramBadgeText(v) {
  const x = String(v || '').trim();
  if (!x) return '';
  if (x === '1') return 'Sənəd var';
  if (x === '0') return 'Sənəd yoxdur';
  return x;
}

function aramAbsUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `https://sc.supremecourt.gov.az${s}`;
  return `https://sc.supremecourt.gov.az/${s.replace(/^\/+/, '')}`;
}

function aramHtmlDecodeMultiline(s) {
  return String(s || '')
    .split('&nbsp;').join(' ')
    .split('&amp;').join('&')
    .split('&lt;').join('<')
    .split('&gt;').join('>')
    .split('&quot;').join('"')
    .split('&#39;').join("'")
    .replace(/\r/g, '');
}

function aramPlainTextBlock(s) {
  return aramHtmlDecodeMultiline(String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function aramDecisionText(htmlText) {
  const raw = String(htmlText || '');
  const paragraphs = partsBetween(raw, '<p', '</p>').map(aramPlainTextBlock).filter(Boolean);
  return paragraphs.length ? paragraphs.join('\n') : aramPlainTextBlock(raw);
}

function aramDecisionExcerpt(text) {
  const cleanText = String(text || '').trim();
  if (!cleanText) return '';
  const markers = ['Qərara aldı:', 'QƏRARA ALDI:', 'MÜƏYYƏN ETDİ:', 'M Ü Ə Y Y Ə N E T D İ:'];
  for (const marker of markers) {
    const idx = cleanText.indexOf(marker);
    if (idx !== -1) return cleanText.slice(idx, idx + 1400).trim();
  }
  return cleanText.slice(0, 1400).trim();
}

function aramCard(r, currentQuery = '') {
  const regn = r.am_regn || r.job_regn || '';
  const date = aramDate(r.am_date4 || '');
  const judge = r.am_judge || '';
  const result = r.am_result || '';
  const decisionType = r.am_decision_type || '';
  const col = r.am_col || '';
  const star = r.am_star || '';
  const docBadge = aramBadgeText(r.has_document);
  const decisionShowUrl = aramAbsUrl(r.am_decision_show_url || '');
  const pdfUrl = aramAbsUrl(r.am_decision_link_url || r.pdf || '');
  const originalPdfUrl = aramAbsUrl(r.am_orginal_link_url || r.orginal_pdf || '');
  const referenceFileUrl = aramAbsUrl(r.reference_file_url || '');
  const hasDirectDocUrl = !!(decisionShowUrl || pdfUrl || originalPdfUrl || referenceFileUrl);
  const officialSearchUrl = 'https://sc.supremecourt.gov.az/decision-search/';

  return `<div class="card">
    <div class="card-head">
      <div class="logo">⚖️</div>
      <div>
        <h2>${esc(regn || 'Qərar məlumatı')}</h2>
        <p>${esc(date || 'Tarix göstərilməyib')}</p>
      </div>
      <div class="status">
        ${decisionType ? b(decisionType, 'gray') : ''}
        ${docBadge ? b(docBadge, r.has_document === '1' ? 'green' : 'yellow') : ''}
      </div>
    </div>
    <table>
      ${row('İş / qeyd nömrəsi', esc(regn))}
      ${row('Tarix', esc(date))}
      ${row('Qərar növü', esc(decisionType))}
      ${row('Hakim', esc(judge))}
      ${row('Kollegiya', esc(col))}
      ${row('Nəticə', esc(result))}
      ${row('Əlavə qeyd', esc(star))}
      ${row('Rəsmi baxış statusu', hasDirectDocUrl ? b('Birbaşa keçid tapıldı', 'green') : (String(r.has_document || '') === '1' ? b('Sənəd var, keçid gizlidir', 'yellow') : b('Birbaşa sənəd linki yoxdur', 'gray')))}
    </table>
    <div class="actions">
      ${decisionShowUrl ? `<a href="${esc(decisionShowUrl)}" target="_blank" rel="noopener">👁️ Baxış</a>` : ''}
      ${pdfUrl ? `<a href="${esc(pdfUrl)}" target="_blank" rel="noopener">📄 PDF</a>` : ''}
      ${originalPdfUrl ? `<a href="${esc(originalPdfUrl)}" target="_blank" rel="noopener">📎 Original PDF</a>` : ''}
      ${referenceFileUrl ? `<a href="${esc(referenceFileUrl)}" target="_blank" rel="noopener">🗂️ Arayış</a>` : ''}
      <a href="${officialSearchUrl}" target="_blank" rel="noopener">🔗 Rəsmi ARAM-da aç</a>
      ${regn ? `<button type="button" data-copy="${esc(regn)}" onclick="copyText(this.getAttribute('data-copy'))">📋 İş nömrəsini kopyala</button>` : ''}
      ${currentQuery ? `<button type="button" data-copy="${esc(currentQuery)}" onclick="copyText(this.getAttribute('data-copy'))">🔎 Sorğunu kopyala</button>` : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}

function tobbCard(r) {
  const unvan = r.unvan || 'Şirkət';
  const pdf = r.pdfProxy || (r.pdfToken ? ('http://34.30.56.108.nip.io/bazalar/tobb-api.php?action=pdf&u=' + encodeURIComponent(r.pdfToken)) : (r.pdf || ''));
  const sumRows = Array.isArray(r.pdfSummary) ? r.pdfSummary.map(x => row(x.label || 'PDF', esc(x.value || ''))).join('') : '';
  const sumErr = r.pdfSummaryError ? `<div class="mutedline" style="margin:10px 0 0">PDF mətni çıxarılmadı: ${esc(r.pdfSummaryError)}</div>` : '';
  return `<div class="card">
    <div class="card-head">
      <div class="logo" style="font-size:13px;font-weight:900;background:linear-gradient(135deg,#b91c1c,#ef4444)">TR</div>
      <div>
        <h2>${esc(unvan)}</h2>
        <p>${esc(r.tur || 'Ticarət Sicili elanı')}</p>
      </div>
      <div class="status">${r.tarih ? b(r.tarih, 'gray') : ''}</div>
    </div>
    <table>
      ${row('Müdürlük', esc(r.mudurluk || ''))}
      ${row('Sicil No', esc(r.sicilNo || ''))}
      ${row('Ünvan', esc(unvan))}
      ${row('İlan növü', esc(r.tur || ''))}
      ${row('Detal', esc(r.turDetail || ''))}
      ${row('Yayın tarixi', esc(r.tarih || ''))}
      ${row('Qəzet sayı', esc(r.sayi || ''))}
      ${row('Səhifə', esc(r.sayfa || ''))}
    </table>
    ${sumRows ? `<div class="subhead" style="margin-top:14px">PDF-dən çıxarılan əsas məlumatlar</div><table>${sumRows}</table>` : sumErr}
    <div class="actions">
      ${pdf ? `<a href="${esc(pdf)}" target="_blank" rel="noopener">📄 Qəzet PDF</a>` : ''}
      ${r.pdfToken ? `<a href="http://34.30.56.108.nip.io/bazalar/tobb-api.php?action=extract&u=${encodeURIComponent(r.pdfToken)}" target="_blank" rel="noopener">🧾 Mətn xülasəsi</a>` : ''}
      ${r.pdfToken ? `<a href="http://34.30.56.108.nip.io/bazalar/tobb-api.php?action=ocr&u=${encodeURIComponent(r.pdfToken)}" target="_blank" rel="noopener">🔍 OCR oxu</a>` : ''}
      ${r.sicilNo ? `<button type="button" data-copy="${esc(r.sicilNo)}" onclick="copyText(this.getAttribute('data-copy'))">📋 Sicil No</button>` : ''}
      ${r.unvan ? `<button type="button" data-copy="${esc(r.unvan)}" onclick="copyText(this.getAttribute('data-copy'))">📋 Ünvanı kopyala</button>` : ''}
      <button onclick="printCard(this)">🖨️ PDF çap et</button>
    </div>
  </div>`;
}


function tobbSeedBox(d) {
  if (!d) return '';
  const details = Array.isArray(d.details) ? d.details.map(x => `<tr><td>${esc(x.variant || '')}</td><td>${esc(String(x.found || 0))}</td><td>${esc(String(x.queued_new || 0))}</td></tr>`).join('') : '';
  return `<div class="card"><div class="subhead">Namizəd PDF-lər queue-ya əlavə edildi</div><table>
    ${row('Sorğu', esc(d.query || ''))}
    ${row('Yeni queue', esc(String(d.queued_new || 0)))}
    ${row('Müdürlük', esc(d.mudurluk_id || ''))}
  </table>${details ? `<table><thead><tr><th>Variant</th><th>Tapıldı</th><th>Yeni queue</th></tr></thead><tbody>${details}</tbody></table>` : ''}</div>`;
}


function tobbPersonStatsBox(d) {
  const q = (d && d.queue) || {};
  const idx = (d && d.index) || {};
  const daily = (d && d.daily) || {};
  const scope = d && d.scope ? String(d.scope) : 'İstanbul';
  const dailyLimit = Number(daily.limit || 10);
  const dailyProcessed = Number(daily.processed || 0);
  const dailyRemaining = Number(daily.remaining || Math.max(0, dailyLimit - dailyProcessed));
  const dailyPct = dailyLimit > 0 ? Math.min(100, Math.round((dailyProcessed / dailyLimit) * 1000) / 10) : 0;

  const total = Number(d.queue_total || 0);
  const queued = Number(q.queued || 0);
  const processing = Number(q.processing || 0);
  const done = Number(q.done || 0);
  const errorCount = Number(q.error || 0);
  const other = Number(q.other || 0);
  const indexed = Number(idx.indexed_docs || 0);
  const relations = Number(idx.relations || 0);

  const finished = done + errorCount;
  const donePct = total > 0 ? Math.round((done / total) * 1000) / 10 : 0;
  const finishedPct = total > 0 ? Math.round((finished / total) * 1000) / 10 : 0;
  const waitingPct = total > 0 ? Math.round((queued / total) * 1000) / 10 : 0;
  const errPct = total > 0 ? Math.round((errorCount / total) * 1000) / 10 : 0;
  const procPct = total > 0 ? Math.round((processing / total) * 1000) / 10 : 0;

  const widthDone = total > 0 ? Math.min(100, Math.max(0, donePct)) : 0;
  const widthErr = total > 0 ? Math.min(100 - widthDone, Math.max(0, errPct)) : 0;
  const widthProc = total > 0 ? Math.min(100 - widthDone - widthErr, Math.max(0, procPct)) : 0;

  const stat = (label, value, tone, sub = '') => `
    <div class="ocr-stat ${tone || ''}">
      <b>${esc(label)}</b>
      <strong>${esc(String(value))}</strong>
      ${sub ? `<span>${esc(sub)}</span>` : ''}
    </div>
  `;

  return `
    <details class="ocr-counter-card ocr-collapsible">
      <summary class="ocr-counter-summary">
        <div class="ocr-summary-main">
          <div class="eyebrow">TOBB OCR sayğacı</div>
          <strong>${esc(scope)} şəxs indeksi</strong>
          <span>Oxunub: ${esc(String(done))}/${esc(String(total))} • Bugün: ${esc(String(dailyProcessed))}/${esc(String(dailyLimit))} • Əlaqə izləri: ${esc(String(relations))}</span>
        </div>
        <div class="ocr-summary-actions">
          <span class="ocr-mini-progress"><i style="width:${widthDone}%"></i></span>
          <span class="ocr-open-label">Aç / bax</span>
        </div>
      </summary>

      <div class="ocr-counter-body">
        <div class="ocr-counter-head">
          <div>
            <h2>${esc(scope)} şəxs indeksi</h2>
            <p>Bu sayğac yalnız İstanbul queue-ları üzrə hesablanır. Gündəlik OCR limiti: maksimum 10 PDF. Bütün TOBB arxivinin faizi deyil.</p>
          </div>
          <a class="ocr-refresh" href="/?page=tobb&tobbMode=person">Yenilə</a>
        </div>

        <div class="ocr-progress-wrap">
          <div class="ocr-progress-label">
            <span>Tamamlanma: ${esc(String(donePct))}%</span>
            <span>Yekun işlənib: ${esc(String(finishedPct))}%</span>
          </div>

          <div class="ocr-progress">
            <i class="done" style="width:${widthDone}%"></i>
            <i class="err" style="width:${widthErr}%"></i>
            <i class="proc" style="width:${widthProc}%"></i>
          </div>

          <div class="ocr-progress-note">
            Oxunub: ${esc(String(done))} • Gözləyir: ${esc(String(queued))} • İşlənir: ${esc(String(processing))} • Xəta: ${esc(String(errorCount))}
          </div>
        </div>

        <div class="ocr-progress-wrap daily-limit-wrap">
          <div class="ocr-progress-label">
            <span>Bugünkü OCR: ${esc(String(dailyProcessed))}/${esc(String(dailyLimit))} PDF</span>
            <span>Qalıb: ${esc(String(dailyRemaining))}</span>
          </div>
          <div class="ocr-progress">
            <i class="proc" style="width:${dailyPct}%"></i>
          </div>
          <div class="ocr-progress-note">
            Gündəlik limit dolanda worker avtomatik dayanır və sabah davam edir.
          </div>
        </div>

        <div class="ocr-stats-grid">
          ${stat('Namizəd PDF', total, 'blue', 'İstanbul queue')}
          ${stat('OCR oxunub', done, 'green', donePct + '%')}
          ${stat('Gözləyir', queued, 'gray', waitingPct + '%')}
          ${stat('İndi işlənir', processing, 'amber')}
          ${stat('Xəta', errorCount, 'red', errPct + '%')}
          ${stat('İndeksdə PDF', indexed, 'blue')}
          ${stat('Əlaqə izləri', relations, 'green')}
          ${stat('Bugün OCR', dailyProcessed + '/' + dailyLimit, 'amber', dailyRemaining + ' qalıb')}
          ${stat('Digər', other, 'gray')}
        </div>
      </div>
    </details>
  `;
}

function tobbPersonBox(d) {
  const items = Array.isArray(d.items) ? d.items : [];
  if (!items.length) return `<div class="msg err">[${esc(d.query || 'sorğu')}] - Heç bir nəticə tapılmadı.</div>`;
  const highCount = items.reduce((n, it) => n + (Array.isArray(it.relations) ? it.relations.filter(r => (r.confidence || '') === 'yüksək').length : 0), 0);
  return `<div class="person-results-wrap">
    <div class="person-summary-card">
      <div><div class="eyebrow">TOBB OCR Şəxs axtarışı</div><h2>${esc(d.query || '')}</h2><p>İndeksdə ${esc(String(d.indexed_docs || 0))} PDF oxunub. Bu sorğuda ${esc(String(items.length))} PDF nəticəsi, ${esc(String(highCount))} yüksək etibarlı əlaqə tapıldı.</p></div>
      <div class="person-summary-badges"><span>${esc(String(items.length))} PDF</span><span>${esc(String(highCount))} yüksək</span></div>
    </div>
    ${items.map((it, i) => tobbPersonCard(it, i + 1)).join('')}
  </div>`;
}

function relCleanPerson(r) {
  return esc(r.person || r.person_norm || r.person_raw || '');
}

function relBadge(conf) {
  const c = String(conf || '').toLowerCase();
  if (c === 'yüksək') return `<span class="rel-badge good">Yüksək</span>`;
  return `<span class="rel-badge check">Yoxlanmalı</span>`;
}

function tobbPersonCard(item, idx = 1) {
  const rels = Array.isArray(item.relations) ? item.relations : [];
  const high = rels.filter(r => (r.confidence || '') === 'yüksək');
  const check = rels.filter(r => (r.confidence || '') !== 'yüksək');
  const main = high[0] || rels[0] || {};
  const pdf = item.pdfToken ? `http://34.30.56.108.nip.io/bazalar/tobb-api.php?action=pdf&u=${encodeURIComponent(item.pdfToken)}` : (item.pdf_url || '');
  const rowRel = r => `<div class="rel-row">
    <div class="rel-main">
      <div class="rel-person">${relCleanPerson(r)}</div>
      <div class="rel-role">${esc(r.role || 'Mətndə iz')}</div>
    </div>
    <div class="rel-meta">
      ${relBadge(r.confidence)}
      ${r.page ? `<span class="rel-chip">Səhifə ${esc(String(r.page))}</span>` : ''}
    </div>
    <div class="rel-reason">${esc(r.reason || '')}</div>
  </div>`;
  const snippets = Array.isArray(item.snippets) ? item.snippets.filter(Boolean).slice(0, 3) : [];
  return `<div class="person-card">
    <div class="person-card-top">
      <div class="person-rank">${esc(String(idx))}</div>
      <div class="person-title-block">
        <h2>${esc(main.company || 'TOBB OCR əlaqəsi')}</h2>
        <div class="person-meta-line"><span>Sicil: ${esc(main.sicil || '')}</span><span>${esc(item.updated_at || '')}</span>${item.has_text_hit ? '<span>Mətndə ad izi var</span>' : ''}</div>
      </div>
      <div class="person-card-actions">${pdf ? `<a href="${esc(pdf)}" target="_blank" rel="noopener">PDF aç</a>` : ''}</div>
    </div>
    <div class="person-facts">
      <div><b>Şəxs</b><span>${esc(main.person || main.person_norm || '')}</span></div>
      <div><b>Rol</b><span>${esc(main.role || '')}</span></div>
      <div><b>Etibarlılıq</b><span>${esc(item.confidence || main.confidence || '')}</span></div>
    </div>
    ${high.length ? `<div class="rel-section"><h3>Yüksək etibarlı OCR əlaqələri</h3>${high.map(rowRel).join('')}</div>` : ''}
    ${check.length ? `<div class="rel-section muted-section"><h3>Yoxlanmalı OCR izləri</h3>${check.map(rowRel).join('')}</div>` : ''}
    ${snippets.length ? `<details class="snippet-box"><summary>OCR fraqmentləri</summary>${snippets.map(x => `<pre>${esc(x)}</pre>`).join('')}</details>` : ''}
  </div>`;
}

function itobbBox(d, detail) {
  const data = Array.isArray(d.Data) ? d.Data : (Array.isArray(d.data) ? d.data : []);
  const detailData = detail && detail.Data && !Array.isArray(detail.Data) ? detail.Data : null;
  if (!data.length && !detailData) return `<div class="msg err">[] - Heç bir nəticə tapılmadı.</div>`;
  const cards = data.map(r => itobbSummaryCard(r, detailData)).join('');
  return `<div class="count">${esc(String(d.Count || data.length || 1))} İTOBB nəticəsi</div>${cards}${detailData ? itobbDetailCard(detailData) : ''}`;
}

function itobbSummaryCard(r, detailData) {
  const sic = r.SicNumber || r.sicNumber || (detailData && detailData.SicNumber) || '';
  const status = r.CompanyStatus || (detailData && detailData.CompanyStatus) || '';
  return `<div class="itobb-card">
    <div class="itobb-head"><div class="itobb-logo">İTO</div><div><div class="eyebrow">İstanbul Ticaret Odası</div><h2>${esc(r.Title || r.title || (detailData && detailData.CompanyTitle) || '')}</h2><p>${esc(status)}${sic ? ` • Sicil ${esc(sic)}` : ''}</p></div></div>
    <div class="itobb-grid">
      <div><b>Status</b><span>${esc(status)}</span></div>
      <div><b>Sicil No</b><span>${esc(sic)}</span></div>
      <div><b>Rayon</b><span>${esc(r.District || '')}</span></div>
      <div><b>Ünvan</b><span>${esc(r.Address || '')}</span></div>
    </div>
  </div>`;
}

function itobbDetailCard(d) {
  const nace = Array.isArray(d.NaceCodes) ? d.NaceCodes : [];
  const former = Array.isArray(d.FormerTitleOfFirm) ? d.FormerTitleOfFirm : [];
  const business = String(d.BusinessIssueOfTheFirm || '').trim();
  return `<div class="itobb-detail-card">
    <div class="itobb-detail-title"><div><div class="eyebrow">Company detail</div><h2>${esc(d.CompanyTitle || '')}</h2></div><span class="rel-badge good">${esc(d.CompanyStatus || '')}</span></div>
    <div class="itobb-grid detail-grid">
      <div><b>MERSİS</b><span>${esc(d.MersisNo || '')}</span></div>
      <div><b>İTO sicil</b><span>${esc(d.SicNumber || '')}</span></div>
      <div><b>Oda qeydiyyatı</b><span>${esc(d.ChamberOfCommerce || '')}</span></div>
      <div><b>Qeydiyyat tarixi</b><span>${esc(d.DateOfEstablishmentReg || d.ChamberOfCommerceRegHistory || '')}</span></div>
      <div><b>Kapital</b><span>${esc(d.Capital || '')}</span></div>
      <div><b>Peşə qrupu</b><span>${esc(d.ProfessionalGroup || '')}</span></div>
      <div><b>Vergi no</b><span>${esc(d.TaxNumber || '')}</span></div>
      <div><b>Telefon</b><span>${esc(d.PhoneNumber || '')}</span></div>
      <div class="wide"><b>Ofis ünvanı</b><span>${esc(d.OfficeAddress || '')}</span></div>
      <div><b>Web</b><span>${d.WebPageLink ? `<a href="${esc(d.WebPageLink)}" target="_blank" rel="noopener">${esc(d.WebPageLink)}</a>` : ''}</span></div>
      <div><b>Fax</b><span>${esc(d.FaxNumber || '')}</span></div>
    </div>
    ${nace.length ? `<div class="nace-box"><h3>NACE kodları</h3>${nace.map(x => `<div class="nace-line">${esc(x)}</div>`).join('')}</div>` : ''}
    ${former.length ? `<div class="nace-box"><h3>Əvvəlki ünvanlar</h3>${former.map(x => `<div class="nace-line">${esc(String(x))}</div>`).join('')}</div>` : ''}
    ${business ? `<details class="business-box" open><summary>Fəaliyyət mövzusu</summary><pre>${esc(business)}</pre></details>` : ''}
  </div>`;
}

function parseQidaHtml(htmlText) {
  const idx = htmlText.indexOf('"data":');
  if (idx === -1) return [];
  const start = htmlText.indexOf('[', idx);
  if (start === -1) return [];

  let depth = 0;
  let i = start;
  for (; i < htmlText.length; i++) {
    if (htmlText[i] === '[' || htmlText[i] === '{') depth++;
    else if (htmlText[i] === ']' || htmlText[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }

  try {
    return JSON.parse(htmlText.slice(start, i + 1));
  } catch(e) {
    return [];
  }
}

function qidaCard(r) {
  const voen = r.IdentityNumber || '';
  const u = encodeURIComponent(voen);

  return `<div class="card">
    <div class="card-head">
      <div class="logo">🍽️</div>
      <div>
        <h2>${esc(r.SubjectName || '—')}</h2>
        <p>VÖEN: ${esc(voen || '—')}</p>
      </div>
      <div class="status">
        ${r.StatusCode === 'ACCEPTED' ? b('Qeydiyyatda', 'green') : b(esc(r.StatusCode || 'Naməlum'), 'gray')}
      </div>
    </div>

    <table>
      ${row('Subyektin adı / A.S.A', esc(r.SubjectName || ''))}
      ${row('Hüquqi forma', esc(r.LegalStatusText || ''))}
      ${row('VÖEN', esc(voen))}
      ${row('Qeydiyyat nömrəsi', esc(r.UnicalNumber || ''))}
      ${row('Qeydiyyat tarixi', r.RegistrationDate ? esc(r.RegistrationDate.slice(0, 10).split('-').reverse().join('.')) : '')}
      ${row('Fəaliyyət istiqaməti', esc(r.ActivityDirectionText || ''))}
      ${row('Fəaliyyət sahəsi', esc(r.OrganizationKindText || ''))}
      ${row('Fəaliyyət növü kodu', esc(r.ActivityTypeCodeText || ''))}
      ${row('Fəaliyyət növü', esc(r.ActivityTypeNameText || ''))}
      ${row('Ticari adı (nişanı)', esc(r.OrganizationName || ''))}
      ${row('Məhsulun adı', esc(r.ProductNameText || ''))}
      ${row('Rayon / Şəhər', esc(r.Region || ''))}
      ${row('Faktiki ünvan', esc(r.CurrentAddress || ''))}
      ${row('Regional bölmə', esc(r.WFOrganizationName || ''))}
    </table>

    <div class="actions">
      ${voen ? tinCrossLinks(voen, { exQida: true }) : ''}
      <button onclick="printCard(this)">🖨️ PDF</button>
    </div>
  </div>`;
}


function mskUnvanClientScript() {
  return `
  (function(){
    var rayons = [
      ['1','Abşeron'],['2','Ağcabədi'],['3','Ağdam'],['4','Ağdaş'],['87','Ağdərə'],['5','Ağstafa'],['6','Ağsu'],['7','Astara'],['8','Babək'],['9','Balakən'],['10','Bərdə'],['11','Beyləqan'],['12','Biləsuvar'],['13','Binəqədi'],['14','Cəbrayıl'],['15','Cəlilabad'],['16','Culfa'],['17','Daşkəsən'],['18','Füzuli'],['19','Gədəbəy'],['28','Gəncə'],['20','Goranboy'],['21','Göyçay'],['22','Göygöl'],['23','Hacıqabul'],['24','İmişli'],['25','İsmayıllı'],['26','Kəlbəcər'],['27','Kəngərli'],['29','Kürdəmir'],['30','Laçın'],['31','Lənkəran'],['32','Lerik'],['33','Masallı'],['34','Mingəçevir'],['35','Naftalan'],['36','Naxçıvan'],['37','Neftçala'],['38','Nərimanov'],['39','Nəsimi'],['40','Nizami'],['42','Oğuz'],['43','Ordubad'],['44','Pirallahı'],['45','Qaradağ'],['46','Qax'],['47','Qazax'],['48','Qəbələ'],['49','Qobustan'],['50','Quba'],['51','Qubadlı'],['52','Qusar'],['53','Saatlı'],['54','Sabirabad'],['55','Şabran'],['56','Sabunçu'],['57','Şahbuz'],['58','Salyan'],['59','Şamaxı'],['65','Samux'],['66','Səbail'],['67','Sədərək'],['60','Şəki'],['61','Şəmkir'],['62','Şərur'],['63','Şirvan'],['68','Siyəzən'],['69','Sumqayıt'],['70','Suraxanı'],['64','Şuşa'],['71','Tərtər'],['72','Tovuz'],['73','Ucar'],['74','Xaçmaz'],['75','Xankəndi'],['76','Xətai'],['77','Xəzər'],['78','Xızı'],['79','Xocalı'],['80','Xocavənd'],['81','Yardımlı'],['82','Yasamal'],['83','Yevlax'],['84','Zaqatala'],['85','Zəngilan'],['86','Zərdab']
    ];
    function el(id){ return document.getElementById(id); }
    function esc(s){ return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
    function setStatus(kind, text){ var s=el('mskUvStatus'); if(!s) return; s.className='msg '+kind; s.innerHTML=esc(text||''); }
    function resetSelect(sel, text, disabled){ if(!sel) return; sel.innerHTML='<option value="">'+esc(text)+'</option>'; sel.disabled=!!disabled; }
    function fillSelect(sel, list, text){ resetSelect(sel, text, false); (list||[]).forEach(function(x){ var opt=document.createElement('option'); opt.value=x.value||x.name||x; opt.textContent=x.name||x.value||x; sel.appendChild(opt); }); }
    var MSK_CACHE_TTL = 24*60*60*1000;
    function cacheKey(params){ return 'msk-unvan-v51:'+Object.keys(params).sort().map(function(k){return k+'='+String(params[k]||'').toLowerCase();}).join('&'); }
    function cacheGet(params){ try{ var raw=localStorage.getItem(cacheKey(params)); if(!raw) return null; var o=JSON.parse(raw); if(!o || Date.now()-o.t>MSK_CACHE_TTL){ localStorage.removeItem(cacheKey(params)); return null; } return o.v; }catch(e){ return null; } }
    function cacheSet(params,val){ try{ localStorage.setItem(cacheKey(params), JSON.stringify({t:Date.now(),v:val})); }catch(e){} return val; }
    async function api(params){
      var hit=cacheGet(params); if(hit){ hit.cached=true; return hit; }
      var u='/api/msk-unvan?'+new URLSearchParams(params).toString();
      var r=await fetch(u,{cache:'no-store'});
      var j=await r.json();
      if(!j.ok) throw new Error(j.error||'Naməlum xəta');
      return cacheSet(params,j);
    }
    function extractFirstNumber(v){
      var m = String(v || '').match(/(\d{1,4})\s*(?:sayl[ıi]|sayli|saylı|№|nömrəli|nomreli)?/i);
      return m ? m[1] : '';
    }
    function findVoterLinkData(j){
      var out = { daire:'', menteqe:'' };
      function numFrom(v){ var m=String(v||'').match(/(\d{1,4})\s*sayl[ıi]/i) || String(v||'').match(/^(\d{1,4})\b/); return m?m[1]:''; }
      function scanRow(r){
        if(!r || typeof r !== 'object') return;
        var vals = Object.keys(r).map(function(k){ return String(r[k]||''); });
        vals.forEach(function(v){
          if(!out.daire && /seçki\s+dairəsi/i.test(v)) out.daire = numFrom(v);
          if(!out.menteqe && /məntəqə/i.test(v) && /sayl[ıi]/i.test(v)) out.menteqe = numFrom(v);
        });
      }
      if(Array.isArray(j.sections)) j.sections.forEach(function(sec){ (sec.rows||[]).forEach(scanRow); });
      if(Array.isArray(j.results)) j.results.forEach(scanRow);
      return out;
    }
    function voterLinkPanel(j){
      var d = findVoterLinkData(j);
      if(!d.daire || !d.menteqe) return '';
      var href = 'https://www.infocenter.gov.az/page/voters/default.aspx?s=' + encodeURIComponent(d.daire) + '&sm=' + encodeURIComponent(d.menteqe);
      return '<div class="msk-unvan-link-panel">'
        + '<h2>Seçici siyahısına keçid</h2>'
        + '<div class="msk-unvan-link-grid">'
        + '<div><b>Dairə nömrəsi</b><span>'+esc(d.daire)+'</span></div>'
        + '<div><b>Məntəqə nömrəsi</b><span>'+esc(d.menteqe)+'</span></div>'
        + '</div>'
        + '<a class="msk-unvan-official-link" target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">'+esc(href)+'</a>'
        + '</div>';
    }
    function normalizeSections(j){
      var dCols = ['S/s','Dairənin adı','Dairənin ünvanı','Telefon'];
      var mCols = ['S/s','Məntəqə adı','Məntəqənin ünvanı','Məntəqənin marşrutu'];
      var dRows=[], mRows=[], seenD={}, seenM={};
      function putD(ss,name,addr,tel){
        name=String(name||'').trim(); if(!/seçki\s+dairəsi/i.test(name)) return;
        var key=name+'|'+String(addr||''); if(seenD[key]) return; seenD[key]=1;
        dRows.push({'S/s':String(ss||dRows.length+1),'Dairənin adı':name,'Dairənin ünvanı':String(addr||''),'Telefon':String(tel||'')});
      }
      function putM(ss,name,addr,route){
        name=String(name||'').trim(); if(!/məntəqə/i.test(name) || !/sayl[ıi]/i.test(name)) return;
        var key=name+'|'+String(addr||''); if(seenM[key]) return; seenM[key]=1;
        mRows.push({'S/s':String(ss||mRows.length+1),'Məntəqə adı':name,'Məntəqənin ünvanı':String(addr||''),'Məntəqənin marşrutu':String(route||'')});
      }
      function scan(r){
        if(!r || typeof r !== 'object') return;
        if(r['Dairənin adı']) putD(r['S/s'], r['Dairənin adı'], r['Dairənin ünvanı'], r['Telefon']);
        if(r['Məntəqə adı']) putM(r['S/s'], r['Məntəqə adı'], r['Məntəqənin ünvanı'], r['Məntəqənin marşrutu']);
        // old broken cache sometimes stored precinct rows under district columns
        if(r['Dairənin adı'] && /məntəqə/i.test(String(r['Dairənin adı']))){
          putM(r['S/s'], r['Dairənin adı'], r['Dairənin ünvanı'], r['Telefon']);
        }
      }
      if(Array.isArray(j.sections)) j.sections.forEach(function(sec){ (sec.rows||[]).forEach(scan); });
      if(Array.isArray(j.results)) j.results.forEach(scan);
      var out=[];
      if(dRows.length) out.push({type:'districts',title:'TAPILAN DAİRƏLƏR',columns:dCols,rows:dRows});
      if(mRows.length) out.push({type:'precincts',title:(rayon && rayon.value ? rayon.options[rayon.selectedIndex].text+' ÜZRƏ MƏNTƏQƏLƏR' : 'MƏNTƏQƏLƏR'),columns:mCols,rows:mRows});
      return out;
    }
    function renderResult(j){
      var box=el('mskUvResult'); if(!box) return;
      function tableSection(sec){
        var cols = Array.isArray(sec.columns) ? sec.columns : [];
        var rows = Array.isArray(sec.rows) ? sec.rows : [];
        if(!cols.length || !rows.length) return '';
        var head = '<tr>'+cols.map(function(c){ return '<th>'+esc(c)+'</th>'; }).join('')+'</tr>';
        var body = rows.map(function(r){
          return '<tr>'+cols.map(function(c){ return '<td>'+esc(r[c] || '')+'</td>'; }).join('')+'</tr>';
        }).join('');
        return '<div class="msk-unvan-result"><h2>'+esc(sec.title || 'MSK ünvan nəticəsi')+'</h2><table>'+head+body+'</table></div>';
      }
      // FINAL: trust backend sections first.
      var sections = (Array.isArray(j.sections) && j.sections.length) ? j.sections : normalizeSections(j);

      // V52: backend artiq dogru sectionlari qaytarir (rəsmi GridDaire/GridMenteqe),
      // ona gore ehtiyac olmayan hardcoded filter silindi.

      if(sections.length){
        function firstNum(v){
          var m = String(v || '').match(/\d+/);
          return m ? m[0] : '';
        }

        // Hər section-dan dairə və məntəqə nömrələrini topla (təkrarsız).
        // ASCII-əsaslı uyğunluq: "sayl" + "dair" + section.type — beləcə Azərbaycan
        // hərfləri deploy zamanı pozulsa belə nömrələr düzgün tapılır.
        var districtNos = [], precinctNos = [];
        sections.forEach(function(sec){
          var type = String(sec && sec.type || '');
          var rows = sec && Array.isArray(sec.rows) ? sec.rows : [];
          rows.forEach(function(row){
            if(!row || typeof row !== 'object') return;
            var joined = Object.keys(row).map(function(k){ return String(row[k] || ''); }).join(' ');
            var m = joined.match(/(\\d+)\\s*sayl/i);
            if(!m) return;
            var num = m[1];
            if(/district/i.test(type) || /dair/i.test(joined)){
              if(districtNos.indexOf(num) < 0) districtNos.push(num);
            } else {
              if(precinctNos.indexOf(num) < 0) precinctNos.push(num);
            }
          });
        });

        var html = sections.map(tableSection).join('');

        // Hər dairə × məntəqə üçün rəsmi seçici siyahısı linki.
        if(districtNos.length && precinctNos.length){
          var items = '';
          districtNos.forEach(function(dNo){
            precinctNos.forEach(function(mNo){
              var href = 'https://www.infocenter.gov.az/page/voters/default.aspx?s='
                + encodeURIComponent(dNo) + '&sm=' + encodeURIComponent(mNo);
              items += '<div class="msk-unvan-link-item">'
                + '<div class="msk-unvan-link-grid">'
                + '<div><b>Dairə nömrəsi</b><span>' + esc(dNo) + '</span></div>'
                + '<div><b>Məntəqə nömrəsi</b><span>' + esc(mNo) + '</span></div>'
                + '</div>'
                + '<a class="msk-unvan-official-link" target="_blank" rel="noopener noreferrer" href="' + esc(href) + '">' + esc(href) + '</a>'
                + '</div>';
            });
          });
          html += '<div class="msk-unvan-link-panel">'
            + '<h2>Seçici siyahısına keçid</h2>'
            + items
            + '</div>';
        }

        box.innerHTML = html;

        // Ehtiyat: əsas üsul panel qurmadısa, görünən cədvəlin mətnindən link qur.
        try {
          if(!box.querySelector('.msk-unvan-link-panel')){
            var cellTexts = Array.prototype.map.call(box.querySelectorAll('td'), function(td){ return (td.textContent||'').replace(/\\s+/g,' ').trim(); });
            function num(v){ var mm=String(v||'').match(/(\\d+)\\s*sayl/i); return mm?mm[1]:''; }
            var dCell = cellTexts.filter(function(v){ return /dair/i.test(v) && /(\\d+)\\s*sayl/i.test(v); });
            var mCell = cellTexts.filter(function(v){ return /(\\d+)\\s*sayl/i.test(v) && !/dair/i.test(v); });
            var dNo3 = dCell.length ? num(dCell[dCell.length-1]) : '';
            var mNo3 = mCell.length ? num(mCell[0]) : '';
            if(dNo3 && mNo3){
              var href3 = 'https://www.infocenter.gov.az/page/voters/default.aspx?s=' + encodeURIComponent(dNo3) + '&sm=' + encodeURIComponent(mNo3);
              box.insertAdjacentHTML('beforeend',
                '<div class="msk-unvan-link-panel"><h2>Seçici siyahısına keçid</h2>'
                + '<div class="msk-unvan-link-item"><div class="msk-unvan-link-grid">'
                + '<div><b>Dairə nömrəsi</b><span>' + esc(dNo3) + '</span></div>'
                + '<div><b>Məntəqə nömrəsi</b><span>' + esc(mNo3) + '</span></div></div>'
                + '<a class="msk-unvan-official-link" target="_blank" rel="noopener noreferrer" href="' + esc(href3) + '">' + esc(href3) + '</a>'
                + '</div></div>');
            }
          }
        } catch(e) {}

        return;
      }
      box.innerHTML='<div class="msg err">[] - Heç bir nəticə tapılmadı.</div>';
    }
    var rayon=el('mskUvRayon'), street=el('mskUvStreet'), house=el('mskUvHouse'), btn=el('mskUvBtn');
    if(!rayon || !street || !house || !btn) return;
    rayons.forEach(function(r){ var opt=document.createElement('option'); opt.value=r[0]; opt.textContent=r[1]; opt.dataset.name=r[1]; rayon.appendChild(opt); });
    rayon.addEventListener('change', async function(){
      resetSelect(street,'Yüklənir...',true); resetSelect(house,'Əvvəl küçə seç',true); el('mskUvResult').innerHTML='';
      if(!rayon.value){ setStatus('warn','Rayon/şəhər seçin.'); resetSelect(street,'Əvvəl rayon seç',true); return; }
      setStatus('info','Küçə/kənd siyahısı yüklənir...');
      try{
        var j=await api({action:'streets', rayonId:rayon.value, rayonName:rayon.options[rayon.selectedIndex].text});
        fillSelect(street, j.items || [], 'Küçə / kənd / prospekt seç');
        setStatus('info',(j.items||[]).length+' küçə/kənd tapıldı'+(j.cached?' (cache)':'')+'. İndi ikinci siyahıdan seçin.');
      }catch(e){ resetSelect(street,'Siyahı alınmadı',true); setStatus('err','Küçə siyahısı alınmadı: '+e.message); }
    });
    street.addEventListener('change', async function(){
      resetSelect(house,'Yüklənir...',true); el('mskUvResult').innerHTML='';
      if(!street.value){ setStatus('warn','Küçə/kənd seçin.'); resetSelect(house,'Əvvəl küçə seç',true); return; }
      setStatus('info','Ev siyahısı yüklənir...');
      try{
        var j=await api({action:'houses', rayonId:rayon.value, rayonName:rayon.options[rayon.selectedIndex].text, street:street.value});
        fillSelect(house, j.items || [], 'Ev seç');
        setStatus('info',(j.items||[]).length+' ev nömrəsi tapıldı'+(j.cached?' (cache)':'')+'.');
      }catch(e){ resetSelect(house,'Siyahı alınmadı',true); setStatus('err','Ev siyahısı alınmadı: '+e.message); }
    });
    btn.addEventListener('click', async function(){
      if(!rayon.value || !street.value || !house.value){ setStatus('warn','Rayon, küçə/kənd və ev nömrəsinin hamısını seçin.'); return; }
      setStatus('info','Nəticə axtarılır...'); el('mskUvResult').innerHTML='';
      try{
        var j=await api({action:'result', rayonId:rayon.value, rayonName:rayon.options[rayon.selectedIndex].text, street:street.value, house:house.value});
        window.__mskUvLastParams = {
          rayon: rayon && rayon.options && rayon.selectedIndex >= 0 ? String(rayon.options[rayon.selectedIndex].text || '') : '',
          street: street && street.options && street.selectedIndex >= 0 ? String(street.options[street.selectedIndex].text || '') : '',
          house: house && house.options && house.selectedIndex >= 0 ? String(house.options[house.selectedIndex].text || '') : ''
        };
        setStatus('info','Axtarış tamamlandı'+(j.cached?' (cache)':'')+'.'); renderResult(j);
      }catch(e){ setStatus('err','Nəticə alınmadı: '+e.message); }
    });
  })();
  `;
}

function style() {
  return `<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0e1117;--header:#161b27;--card:#161b27;--card2:#1e2535;--border:#2a3347;--text:#e2e8f0;--muted:#94a3b8;--soft:#64748b;--blue:#3b82f6;--blue2:#2563eb;--green:#22c55e;--red:#ef4444;--yellow:#f59e0b;--accent:#3b82f6;--print:#fff}
html.light,body.light{--bg:#f5f7fb;--header:#ffffff;--card:#ffffff;--card2:#eef2f7;--border:#d7deea;--text:#172033;--muted:#56657a;--soft:#718096;--blue:#2563eb;--blue2:#1d4ed8;--green:#16a34a;--red:#dc2626;--yellow:#d97706;--accent:#2563eb;--print:#fff}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh;padding-bottom:60px}
header{background:var(--header);border-bottom:1px solid var(--border);padding:12px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.header-search{display:flex;gap:8px;align-items:center;flex:1;max-width:500px}
.header-search input{padding:9px 14px;font-size:14px;background:var(--card2);border:1px solid var(--border);border-radius:9px;color:var(--text);outline:none;min-width:0}
.header-search input:focus{border-color:var(--blue)}
.header-search button{padding:9px 14px;font-size:13px;white-space:nowrap}
.univ-form{display:flex;gap:12px;margin-bottom:4px}
.univ-form input{font-size:17px;padding:16px 20px;border-radius:12px;flex:1}
.univ-form button{font-size:15px;padding:15px 26px;border-radius:12px}
.universal-search-box{margin-bottom:28px}
.brand{display:flex;gap:10px;align-items:center;letter-spacing:.08em;color:var(--text)}
.head-right{display:flex;align-items:center;gap:12px}
header small{font-family:monospace;color:var(--soft)}
.theme-toggle{background:var(--card2);border:1px solid var(--border);border-radius:999px;padding:8px 12px;color:var(--text);font-size:13px;font-weight:800;cursor:pointer;text-transform:none}
main{max-width:1000px;margin:0 auto;padding:32px}
.tabs{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.tab{padding:11px 18px;border-radius:9px;background:var(--card2);color:var(--muted);text-decoration:none;font-size:13px;font-weight:800;letter-spacing:.04em}
.tab.active{background:var(--blue);color:white}
.tab:hover:not(.active){background:var(--border);color:var(--text)}
.subtabs{display:flex;gap:8px;margin-bottom:18px}
.subtabs a{padding:9px 14px;border-radius:8px;background:var(--card2);color:var(--muted);text-decoration:none;font-size:12px;font-weight:800}
.subtabs a.active{background:var(--green);color:#052e16}
.terkib-nav{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:10px 0;font-size:13px}
.terkib-nav-label{color:var(--muted);font-weight:800;margin-right:4px}
.terkib-nav a{display:inline-block;min-width:26px;text-align:center;padding:3px 7px;border-radius:6px;color:var(--blue);text-decoration:none;font-weight:700}
.terkib-nav a:hover{background:var(--card2)}
.terkib-nav a.cur{background:#facc15;color:#000;font-weight:900}
.voters-link{background:rgba(80,124,209,.18);border:1px solid rgba(80,124,209,.5);color:#93b4ff!important}
.terkib-block{margin:16px 0;border:1px solid var(--border);border-radius:14px;overflow:hidden}
.terkib-title{background:#507CD1;color:#fff;font-weight:800;padding:10px 12px;font-size:13px}
.terkib-table{width:100%;border-collapse:collapse}
.terkib-table th{background:rgba(80,124,209,.18);text-align:left;padding:8px 10px;font-size:12px}
.terkib-table td{padding:7px 10px;border-top:1px solid var(--border);font-size:13px}
.terkib-table td.vz{text-align:center;font-weight:800;white-space:nowrap}
.search-form{display:flex;gap:12px;margin-bottom:28px}
.search-form.three input{min-width:0}
.search-form.etndr-form{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;align-items:center}
.search-form.etndr-form input,.search-form.etndr-form select{min-width:0}
.search-form.etndr-form button{grid-column:span 4}
.etndr-pager{display:flex;align-items:center;justify-content:center;gap:14px;margin:22px 0 8px}
.etndr-proxy-wrap{margin-bottom:14px}
.etndr-proxy-toggle{margin-bottom:10px}
.etndr-proxy{display:flex;gap:10px;align-items:center}
.etndr-proxy[hidden]{display:none}
.etndr-proxy input{flex:1;min-width:0}
.etndr-summary{border:1px solid rgba(34,197,94,.22)}
.etndr-status{font-size:13px;font-weight:700;color:var(--muted)}
.xeber-panel{background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(15,23,42,.35));border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:20px;box-shadow:0 10px 28px rgba(0,0,0,.14)}
.xeber-titlebar{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:15px}
.xeber-titlebar h1{font-size:22px;line-height:1.2;margin:0 0 6px;color:var(--text)}
.xeber-titlebar p{margin:0;color:var(--muted);font-size:14px;line-height:1.45}
.xeber-status{min-width:190px;text-align:right;color:var(--soft);font-size:13px;font-weight:900;line-height:1.45}
.xeber-status small{display:block;color:var(--muted);font-size:11px;font-weight:800;margin-top:3px}
.xeber-filter{display:grid;grid-template-columns:minmax(240px,1fr) 220px 120px 110px;gap:10px;align-items:stretch;margin:0}
.xeber-filter input,.xeber-filter select{min-width:0;width:100%;height:46px;padding:0 14px}
.xeber-filter button{height:46px;padding:0 16px}
.xeber-refresh{display:flex;align-items:center;justify-content:center;height:46px;min-height:46px;border-radius:10px;background:var(--card2);border:1px solid var(--border);color:var(--soft);font-weight:900;text-decoration:none;padding:0 14px}
.xeber-refresh:hover{color:var(--text);border-color:var(--blue)}
.xeber-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:18px}
.xeber-card{display:flex;flex-direction:column;min-height:430px;background:var(--card);border:1px solid var(--border);border-radius:13px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.18)}
.xeber-img{position:relative;display:block;height:178px;background-color:var(--card2);text-decoration:none;overflow:hidden}
.xeber-img .xeber-thumb{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.xeber-thumb-fallback{display:none}
.xeber-img-empty{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--card2),var(--border));color:var(--muted);font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.xeber-img-empty .xeber-thumb-fallback{display:inline-block;padding:8px 12px;border:1px solid var(--border);border-radius:999px;background:rgba(0,0,0,.12)}
.xeber-body{display:flex;flex-direction:column;flex:1;padding:15px 16px 14px}
.xeber-meta{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;color:var(--muted);font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
.xeber-meta em{font-style:normal;white-space:nowrap;color:var(--soft)}
.xeber-card h2{font-size:19px;line-height:1.35;margin:0 0 10px}
.xeber-card h2 a{color:var(--text);text-decoration:none}
.xeber-card h2 a:hover{color:var(--blue)}
.xeber-card p{font-size:13px;line-height:1.45;color:var(--muted);margin:0 0 13px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.xeber-foot{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:auto;font-size:12px;font-weight:900;color:#0891b2;text-transform:uppercase;letter-spacing:.05em}
.xeber-foot a{color:var(--blue);text-decoration:none;text-transform:none;letter-spacing:0}
@media(max-width:950px){.xeber-titlebar{display:block}.xeber-status{text-align:left;margin-top:10px}.xeber-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.xeber-filter{grid-template-columns:1fr 180px}.xeber-filter button,.xeber-refresh{width:100%}}
@media(max-width:650px){.xeber-grid{grid-template-columns:1fr}.xeber-filter{grid-template-columns:1fr}.xeber-card{min-height:0}.xeber-img{height:190px}}


.etndr-status.ok{color:var(--green)}
.etndr-status.err{color:var(--red)}
#etStatus{margin-bottom:16px}
@media(max-width:760px){.search-form.etndr-form{grid-template-columns:1fr 1fr}.search-form.etndr-form button{grid-column:span 2}}
input,select,.selectbox{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:13px 16px;font-size:16px;color:var(--text);outline:none;width:100%}
select,.selectbox{appearance:none;-webkit-appearance:none;background-color:var(--card);background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);background-position:calc(100% - 18px) 50%,calc(100% - 12px) 50%;background-size:6px 6px,6px 6px;background-repeat:no-repeat;padding-right:38px;cursor:pointer}
.tobb-select{font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:var(--text);min-width:0}
input::placeholder{color:var(--soft);text-transform:uppercase;letter-spacing:.08em}
input:focus{border-color:var(--blue)}
button{background:var(--blue);border:none;border-radius:9px;padding:12px 22px;color:#fff;font-size:13px;font-weight:800;text-transform:uppercase;cursor:pointer;white-space:nowrap}
button:hover{background:var(--blue2)}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;margin-bottom:16px;overflow:hidden}
.card-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px}
.logo{width:44px;height:44px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;flex-shrink:0}
h1,h2{font-size:18px;color:var(--text);margin-bottom:4px}
.card p,.title p{font-family:monospace;font-size:13px;color:#60a5fa}
.status{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.badge{font-family:monospace;font-size:11px;font-weight:800;padding:4px 9px;border-radius:6px;background:var(--card2);color:var(--muted)}
.badge.good{background:rgba(34,197,94,.15);color:var(--green)}
.badge.bad{background:rgba(239,68,68,.15);color:var(--red)}
.badge.warnb{background:rgba(245,158,11,.15);color:var(--yellow)}
.label{padding:12px 18px;border-bottom:1px solid var(--border);font-size:12px;color:var(--muted);font-family:monospace;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;width:1%}
.value{padding:12px 18px;border-bottom:1px solid var(--border);font-size:14px;color:var(--text);line-height:1.45}
.debt{color:var(--red);font-weight:900}
.plus{color:var(--green);font-weight:900}
.actions{padding:13px 22px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.actions a,.actions button{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 10px;border:1px solid var(--border);border-radius:999px;background:var(--card2);color:var(--blue);text-decoration:none;font-size:12px;font-weight:800;line-height:1.1;text-transform:none;letter-spacing:0;white-space:nowrap;cursor:pointer}
.actions a:hover,.actions button:hover{border-color:rgba(59,130,246,.55);background:rgba(59,130,246,.12);color:var(--blue);text-decoration:none}
.extra-actions{padding:10px 0;border-top:none;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.extra-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 10px;border:1px solid var(--border);border-radius:999px;background:var(--card2);color:var(--blue);text-decoration:none;font-size:12px;font-weight:800;line-height:1.1;white-space:nowrap}
.extra-actions a:hover{border-color:rgba(59,130,246,.55);background:rgba(59,130,246,.12);text-decoration:none}
.cbar-person-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0}
.cbar-person-row+.cbar-person-row{border-top:1px dashed var(--border)}
.cbar-person-name{font-weight:800;letter-spacing:.03em}
.cbar-person-actions{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.cbar-person-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:26px;padding:4px 8px;border:1px solid var(--border);border-radius:999px;background:var(--card2);color:var(--blue);text-decoration:none;font-size:11px;font-weight:900;line-height:1;white-space:nowrap}
.cbar-person-actions a:hover{border-color:rgba(59,130,246,.55);background:rgba(59,130,246,.12);text-decoration:none}
.msg{border-radius:10px;padding:18px 20px;font-family:monospace;font-size:13px;margin-bottom:18px}
.err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red)}
.warn{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:var(--yellow)}
.count{font-family:monospace;font-size:12px;color:var(--muted);margin-bottom:16px}
.tab-info{margin:0 0 22px 0;padding:16px 20px;border:1px solid var(--border);border-left:5px solid var(--blue);border-radius:12px;background:rgba(59,130,246,.10);color:var(--text);font-size:15px;font-weight:800;line-height:1.5}
.tab-info:before{content:"Məlumat: ";color:var(--blue);font-family:monospace;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
.msk-unvan-shell{margin-top:18px}
.msk-unvan-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:start;margin-bottom:18px}
.msk-unvan-select{min-height:54px;font-weight:800;letter-spacing:.02em;background-color:var(--card);border:1px solid var(--border);border-radius:12px;color:var(--text)}
.msk-unvan-select:disabled{opacity:.55;cursor:not-allowed}
.msk-unvan-select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.18)}
.msk-unvan-row button{min-height:54px;border-radius:12px;padding:0 28px}
.msk-unvan-result{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-top:14px}
.msk-unvan-result h2{padding:18px 22px;border-bottom:1px solid var(--border);font-size:18px}
.msk-unvan-result table{width:100%;border-collapse:collapse}
.msk-unvan-result th,.msk-unvan-result td{padding:12px 18px;border-bottom:1px solid var(--border);vertical-align:top;text-align:left}
.msk-unvan-result th{background:var(--card2);font-size:13px;color:var(--text);font-weight:900}
.msk-unvan-result td:first-child{width:90px;color:var(--muted);font-family:monospace;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.msk-unvan-link-item + .msk-unvan-link-item{margin-top:16px;padding-top:16px;border-top:1px solid var(--border)}
.msk-unvan-link-panel{background:var(--card);border:1px solid var(--border);border-radius:14px;margin-top:14px;padding:18px 22px}
.msk-unvan-link-panel h2{font-size:18px;margin:0 0 14px 0}
.msk-unvan-link-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}
.msk-unvan-link-grid div{background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
.msk-unvan-link-grid b{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.msk-unvan-link-grid span{font-size:22px;font-weight:900;color:var(--text)}
.msk-unvan-official-link{display:block;word-break:break-all;border:1px solid rgba(59,130,246,.45);background:rgba(59,130,246,.10);border-radius:12px;padding:14px;color:#93c5fd;font-weight:800;text-decoration:none}
.msk-unvan-official-link:hover{text-decoration:underline;background:rgba(59,130,246,.18)}
.msk-secici-shell{margin-top:18px}
.msk-secici-form{display:grid!important;grid-template-columns:minmax(300px,1.1fr) 108px 125px 128px 100px;gap:10px;align-items:center;width:100%}
.msk-secici-form input{min-width:0!important;width:100%}
.msk-secici-form button{width:100%}
.msk-secici-card .logo{font-size:11px;font-weight:1000;background:linear-gradient(135deg,#0f766e,#22c55e)}
@media(max-width:1100px){.msk-secici-form{grid-template-columns:minmax(260px,1fr) 85px 95px 95px 90px}}
@media(max-width:900px){.msk-unvan-row{grid-template-columns:1fr}.msk-unvan-row button{width:100%}.msk-unvan-link-grid{grid-template-columns:1fr}.msk-secici-form{grid-template-columns:1fr}.msk-secici-form button{width:100%}}
.decision-text{padding:18px 22px;border-top:1px solid var(--border);white-space:pre-wrap;line-height:1.7;font-size:14px;color:var(--text)}
.title{display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:22px;border-bottom:1px solid var(--border)}
.title button{margin-left:auto;background:#475569}
.leaders-card{margin-bottom:20px}
.leaders-list{display:flex;flex-direction:column}
.leader-row{display:flex;align-items:center;gap:14px;padding:11px 22px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.leader-row:last-child{border-bottom:none}
.leader-name{font-weight:700;font-size:14px;color:var(--text);min-width:200px;flex:1}
.leader-btns{display:flex;gap:6px;flex-wrap:wrap}
.leader-btns a{font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.04em;padding:5px 11px;border-radius:6px;background:var(--card2);border:1px solid var(--border);color:var(--blue);text-decoration:none;transition:background .12s,color .12s}
.leader-btns a:hover{background:var(--blue);color:#fff}
@media(max-width:620px){.leader-name{min-width:100%}}
.timeline{position:relative}
.timeline:before{content:"";position:absolute;left:19px;top:0;bottom:0;width:2px;background:var(--border)}
.timeline-row{display:flex;gap:20px;margin-bottom:14px}
.dot{width:12px;height:12px;border-radius:50%;border:2px solid var(--bg);background:#475569;margin:15px 14px;z-index:1;flex-shrink:0}
.dot.a{background:var(--green)}
.dot.d{background:var(--yellow)}
.hist-card{flex:1;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 18px}
.hist-top{display:flex;gap:10px;margin-bottom:10px;align-items:center}
.hist-top span{font-family:monospace;font-size:11px;font-weight:800;padding:4px 8px;border-radius:5px;background:var(--card2);color:var(--muted)}
.hist-top em{margin-left:auto;font-family:monospace;font-size:12px;color:var(--muted);font-style:normal}
.hist-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hist-grid .full{grid-column:1/-1}
.hist-grid small{display:block;font-family:monospace;font-size:10px;color:var(--soft);text-transform:uppercase;margin-bottom:3px}
.hist-grid strong{font-size:13px;color:var(--text);line-height:1.4;font-weight:500}
@media(max-width:700px){
  main{padding:20px}
  .search-form{flex-direction:column}
  .card-head{align-items:flex-start;flex-direction:column}
  .status{margin-left:0}
  .hist-grid{grid-template-columns:1fr}
  .label,.value{display:block;width:100%}
}
/* ── Kompakt rejim ── */
body.compact .card table{font-size:12px}
body.compact .card table .label{padding:6px 12px;font-size:10px}
body.compact .card table .value{padding:6px 12px;font-size:12px}
body.compact .card-head{padding:10px 14px}
body.compact .card-head .logo{width:32px;height:32px;font-size:13px}
body.compact h2{font-size:14px}
body.compact .actions{padding:8px 14px;gap:5px}
/* ── Qeyd sahəsi ── */
.card-note{padding:10px 18px;border-top:1px solid var(--border);display:none}
.card-note.open{display:block}
.card-note textarea{width:100%;min-height:70px;font-size:13px;background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);resize:vertical;outline:none;font-family:system-ui,sans-serif}
.card-note textarea:focus{border-color:var(--blue)}
.card-note-hint{font-size:11px;color:var(--muted);margin-top:4px}
/* ── AİLƏ AĞACI / QOHUMLUQ XƏRİTƏSİ ───────────────────────────── */
.family-page{margin-top:4px}.family-fullscreen{--fam-blue:#3b82f6;--fam-green:#22c55e;--fam-red:#ef4444;--fam-yellow:#f59e0b}.family-topline{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:22px;border:1px solid rgba(96,165,250,.35);border-radius:24px;background:radial-gradient(circle at 10% 20%,rgba(34,197,94,.22),transparent 28%),radial-gradient(circle at 88% 8%,rgba(59,130,246,.34),transparent 30%),linear-gradient(135deg,rgba(15,23,42,.98),rgba(30,64,175,.75));box-shadow:0 20px 60px rgba(0,0,0,.22);margin-bottom:16px;color:#fff}.family-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#bfdbfe;font-weight:1000;margin-bottom:8px}.family-topline h1{margin:0 0 8px;font-size:29px;line-height:1.12}.family-topline p{margin:0;max-width:780px;color:rgba(255,255,255,.80);line-height:1.5}.family-top-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end;min-width:420px}.family-top-actions select,.family-top-actions button,.family-map-tools button,.family-searchbar button,.family-primary,.family-mini-actions button{border:1px solid rgba(255,255,255,.18);border-radius:13px;padding:10px 13px;font-weight:1000;cursor:pointer;background:rgba(224,242,254,.95);color:#082f49;min-height:40px}.family-top-actions select{min-width:230px;background:rgba(15,23,42,.38);color:#fff;border-color:rgba(191,219,254,.35)}.family-map-card,.family-detail-panel,.family-notes-panel,.family-stats-panel{background:var(--card);border:1px solid var(--border);border-radius:22px;box-shadow:0 12px 35px rgba(0,0,0,.10)}.family-map-card{padding:14px;margin-bottom:16px}.family-map-head{display:flex;gap:12px;justify-content:space-between;align-items:center;margin-bottom:10px}.family-searchbar{display:flex;gap:8px;flex:1;min-width:260px}.family-searchbar input{width:100%;border:1px solid var(--border);background:var(--card2);color:var(--text);border-radius:13px;padding:11px 13px;outline:none}.family-searchbar input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.16)}.family-searchbar button{background:var(--card2);color:var(--text);border-color:var(--border)}.family-map-tools{display:flex;gap:8px;flex-wrap:wrap}.family-map-tools button{background:linear-gradient(135deg,#2563eb,#22c55e);color:#fff;border:0;min-width:44px}.family-map-tools button:nth-child(3),.family-map-tools button:nth-child(4),.family-map-tools button:nth-child(5){min-width:auto}.family-legend{display:flex;gap:13px;flex-wrap:wrap;align-items:center;color:var(--muted);font-size:12px;font-weight:900;margin:2px 2px 10px}.fam-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:middle}.fam-confirmed{background:#22c55e}.fam-pending{background:#f59e0b}.fam-suspect{background:#ef4444}.fam-line{display:inline-block;width:24px;border-top:3px solid #93c5fd;margin-right:5px;vertical-align:middle}.fam-line.dashed{border-top-style:dashed;border-color:#ef4444}.family-stage{position:relative}#familyNetwork{height:74vh;min-height:660px;border:1px solid var(--border);border-radius:18px;background:radial-gradient(circle at 15% 18%,rgba(59,130,246,.18),transparent 28%),radial-gradient(circle at 80% 20%,rgba(34,197,94,.11),transparent 30%),radial-gradient(circle at 50% 92%,rgba(99,102,241,.10),transparent 32%),linear-gradient(180deg,var(--card2),var(--card));overflow:hidden}.family-floating-tip{position:absolute;left:14px;bottom:14px;max-width:520px;border:1px solid rgba(148,163,184,.25);border-radius:999px;background:rgba(15,23,42,.72);backdrop-filter:blur(10px);color:#cbd5e1;padding:9px 13px;font-size:12px;font-weight:800}.family-bottom-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(260px,.7fr) minmax(260px,.6fr);gap:14px}.family-detail-panel,.family-notes-panel,.family-stats-panel{padding:15px}.family-panel-title{font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:1000;margin-bottom:10px}.family-empty{padding:16px;border:1px dashed var(--border);border-radius:15px;color:var(--muted);background:var(--card2)}.family-notes-panel textarea{width:100%;min-height:142px;border:1px solid var(--border);border-radius:14px;background:var(--card2);color:var(--text);padding:12px;resize:vertical;outline:none}.family-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}.family-stats div{border:1px solid var(--border);border-radius:14px;background:var(--card2);padding:12px}.family-stats b{display:block;font-size:23px;color:var(--text)}.family-stats span{font-size:12px;color:var(--muted);font-weight:900}.family-stats p{grid-column:1/-1;margin:2px 0 0;color:var(--muted);font-size:12px}.fam-profile-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.fam-profile-title h2{font-size:21px;margin:0}.fam-status{white-space:nowrap;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:1000}.fam-status.confirmed{background:rgba(34,197,94,.18);color:#22c55e}.fam-status.pending{background:rgba(245,158,11,.18);color:#f59e0b}.fam-status.suspect{background:rgba(239,68,68,.18);color:#ef4444}.fam-profile-table{width:100%;border-collapse:collapse;font-size:13px}.fam-profile-table td{border-top:1px solid var(--border);padding:10px 0;vertical-align:top}.fam-profile-table td:first-child{width:110px;color:var(--muted);font-weight:900}.fam-profile-table textarea{width:100%;min-height:88px;border:1px solid var(--border);border-radius:12px;background:var(--card2);color:var(--text);padding:10px;outline:none}.fam-profile-table ul{margin:0;padding-left:18px}.family-mini-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.family-mini-actions button{background:var(--card2);color:var(--text);border:1px solid var(--border);padding:8px 10px;font-size:12px}.family-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.72);backdrop-filter:blur(7px);z-index:9999;padding:18px}.family-modal.open{display:flex}.family-modal-box{width:min(680px,96vw);max-height:88vh;overflow:auto;background:var(--card);border:1px solid var(--border);border-radius:22px;box-shadow:0 28px 80px rgba(0,0,0,.42);padding:16px}.family-modal-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:14px}.family-modal-head h2{margin:0;font-size:21px}.family-modal-head button{border:1px solid var(--border);border-radius:12px;background:var(--card2);color:var(--text);font-size:22px;line-height:1;padding:6px 11px;cursor:pointer}.family-modal-section{display:none;gap:9px}.family-modal-section label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:1000}.family-modal-section input,.family-modal-section select,.family-modal-section textarea{width:100%;border:1px solid var(--border);background:var(--card2);color:var(--text);border-radius:12px;padding:11px 12px;outline:none}.family-modal-section textarea{min-height:96px;resize:vertical}.family-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.family-primary{background:linear-gradient(135deg,#2563eb,#22c55e);color:#fff!important;border:0!important;margin-top:4px}.vis-network:focus{outline:none}@media(max-width:1180px){.family-topline{display:block}.family-top-actions{min-width:0;justify-content:flex-start;margin-top:14px}.family-map-head{display:block}.family-map-tools{margin-top:10px}.family-bottom-grid{grid-template-columns:1fr}#familyNetwork{height:64vh;min-height:540px}}@media(max-width:720px){.family-topline h1{font-size:24px}.family-top-actions select,.family-top-actions button{width:100%}.family-searchbar{display:block}.family-searchbar button{margin-top:8px;width:100%}.family-map-tools button{flex:1}.family-two{grid-template-columns:1fr}#familyNetwork{height:58vh;min-height:430px}.family-floating-tip{position:static;margin-top:8px;border-radius:12px}}


/* ── Favorit badge ── */
.fav-star,.actions button.fav-star{font-size:16px;cursor:pointer;background:none;border:none;padding:0;line-height:1;opacity:.5;transition:opacity .15s;min-height:unset;border-radius:0;color:var(--muted)}
.fav-star.active,.actions button.fav-star.active{opacity:1;color:#f59e0b}
/* ── Müqayisə rejimi ── */
.compare-bar{position:fixed;bottom:0;left:0;right:0;background:var(--header);border-top:2px solid var(--blue);padding:10px 24px;display:none;align-items:center;gap:12px;z-index:999;flex-wrap:wrap}
.compare-bar.visible{display:flex}
.compare-item{background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:4px 12px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px}
.compare-item button{background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:0;min-height:unset}
/* ── Boş axtarış xəbərdarlığı ── */
.empty-warn{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.4);color:var(--yellow);border-radius:10px;padding:12px 16px;margin-bottom:12px;font-size:13px;font-family:monospace;display:none}
@media print{
  .no-print,.tabs,.subtabs,.search-form,.actions,header{display:none!important}
  body{background:#fff;color:#111;padding:0}
  main{max-width:none;padding:20px}
  .card{background:#fff!important;border:2px solid #111!important;color:#111!important;break-inside:avoid}
  .card-head{border-bottom:2px solid #111!important}
  .label{color:#1f2937!important;border-bottom:1px solid #111!important}
  .value{color:#111!important;border-bottom:1px solid #111!important}
  h1,h2{color:#111!important}
  .badge{border:1px solid #bbb}
  .print-one main{padding:0}
  .print-one .card{margin:0}
}
.riskbar{padding:10px 20px;border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;background:rgba(245,158,11,.06)}
.panel-grid{padding:16px 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.mini-card{background:rgba(100,116,139,.08);border:1px solid var(--border);border-radius:12px;padding:14px}
.mini-card h3{font-size:14px;margin-bottom:10px;color:var(--text)}
.panel-actions{border-top:none!important;padding:0!important}
.mutedline{display:inline-block;font-family:monospace;font-size:12px;color:var(--muted);margin-top:2px}
.cbar-person-line{display:flex;align-items:center;gap:10px;padding:4px 0;line-height:1.35}
.cbar-person-links{display:inline-flex;gap:7px;flex:0 0 auto;min-width:58px;font-size:11px;font-weight:900;white-space:nowrap}
.cbar-person-links a{color:var(--blue);text-decoration:none}
.cbar-person-links a:hover{text-decoration:underline}
.raw-row .raw-label{background:rgba(59,130,246,.10);color:var(--blue);border-left:3px solid var(--blue);vertical-align:top}
.raw-row .raw-value{background:rgba(59,130,246,.055)}
.raw-row .raw-value:before{display:none}
.raw-row .raw-value pre{margin:0;padding:0;background:transparent;border:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-word;overflow-x:auto}

.manual-raw-form{display:grid;gap:12px;margin:18px 0 24px;padding:16px;border:1px solid var(--border);border-radius:14px;background:rgba(59,130,246,.055)}
.manual-raw-form input,.manual-raw-form textarea{width:100%;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:12px;padding:13px 14px;font-size:15px;outline:none}
.manual-raw-form textarea{min-height:190px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;line-height:1.55}
.manual-raw-form button{justify-self:start;background:var(--blue);color:white;border:0;border-radius:12px;padding:12px 18px;font-weight:900;cursor:pointer}
.raw-block{border-top:1px solid var(--border);padding:10px 20px 14px;background:rgba(100,116,139,.05)}
.raw-block summary{cursor:pointer;color:var(--muted);font-weight:700;font-size:12px;letter-spacing:.5px;text-transform:uppercase;padding:6px 0}
.raw-block summary:hover{color:var(--text)}
.raw-block pre{margin:8px 0 0;padding:12px;background:var(--card2);border:1px solid var(--border);border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.55;color:var(--text);white-space:pre-wrap;word-break:break-word;overflow-x:auto}
.whois-header { margin-bottom: 24px; }
.whois-header h2 { font-size: 26px; margin-bottom: 8px; }
.manual-section { background: var(--card2); padding: 28px; border-radius: 16px; margin: 28px 0; border: 2px dashed var(--border); }
.msg.info { background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.4); color: var(--blue); }

.edit-form{display:grid;gap:10px;margin:14px 0}.edit-form label{display:grid;gap:6px;color:var(--muted);font-size:12px}.edit-form input,.edit-form textarea,.inline-form input{width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--card2);color:var(--text)}.edit-form textarea{min-height:90px}.inline-form{display:inline-block;margin-left:8px}.inline-form button{padding:6px 10px;border-radius:8px}.msg.ok{background:rgba(31,122,63,.12);border-color:rgba(31,122,63,.25);color:var(--green)}

.person-results-wrap{display:grid;gap:16px;margin-top:14px}
.person-summary-card,.person-card,.itobb-card,.itobb-detail-card{border:1px solid var(--border);border-radius:18px;background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(17,24,39,.92));box-shadow:0 14px 40px rgba(0,0,0,.22);padding:18px}
.person-summary-card{display:flex;align-items:center;justify-content:space-between;gap:16px;border-color:rgba(59,130,246,.35)}
.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);font-weight:900;margin-bottom:5px}
.person-summary-card h2,.person-card h2,.itobb-card h2,.itobb-detail-card h2{margin:0;color:var(--text);font-size:20px;line-height:1.25}
.person-summary-card p,.person-card p,.itobb-card p{margin:5px 0 0;color:var(--muted);font-size:13px;line-height:1.45}
.person-summary-badges{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.person-summary-badges span,.rel-chip{display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:999px;background:rgba(148,163,184,.08);padding:6px 10px;font-size:12px;font-weight:900;color:var(--muted)}
.person-card-top,.itobb-head,.itobb-detail-title{display:flex;align-items:flex-start;gap:14px;justify-content:space-between}.itobb-head{justify-content:flex-start}.person-rank,.itobb-logo{flex:0 0 auto;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#1d4ed8,#38bdf8);font-weight:1000;color:white}.person-title-block{flex:1;min-width:0}.person-meta-line{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}.person-meta-line span{font-size:12px;color:var(--muted);background:rgba(148,163,184,.08);border:1px solid var(--border);padding:5px 8px;border-radius:999px}.person-card-actions a{display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(59,130,246,.45);background:rgba(59,130,246,.12);color:var(--blue);border-radius:12px;text-decoration:none;font-weight:900;padding:9px 12px;white-space:nowrap}
.person-facts,.itobb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}.itobb-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.person-facts div,.itobb-grid div{background:rgba(15,23,42,.72);border:1px solid var(--border);border-radius:14px;padding:11px 12px}.person-facts b,.itobb-grid b{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}.person-facts span,.itobb-grid span{display:block;color:var(--text);font-size:14px;font-weight:800;word-break:break-word}.detail-grid .wide{grid-column:span 3}
.rel-section{margin-top:14px}.rel-section h3,.nace-box h3{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 8px}.rel-row{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:8px;border:1px solid var(--border);background:rgba(15,23,42,.55);border-radius:14px;padding:12px;margin-top:8px}.rel-person{font-size:16px;font-weight:1000;color:var(--text)}.rel-role{margin-top:3px;color:var(--blue);font-weight:900;font-size:13px}.rel-meta{display:flex;gap:6px;align-items:flex-start;justify-content:flex-end;flex-wrap:wrap}.rel-reason{grid-column:1/-1;color:var(--muted);font-size:12px;line-height:1.45}.rel-badge{display:inline-flex;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:1000;border:1px solid}.rel-badge.good{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.35);color:#86efac}.rel-badge.check{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.35);color:#fbbf24}.muted-section{opacity:.92}.snippet-box,.business-box{margin-top:14px;border:1px solid var(--border);border-radius:14px;background:rgba(2,6,23,.35);padding:10px 12px}.snippet-box summary,.business-box summary{cursor:pointer;font-weight:900;color:var(--blue)}.snippet-box pre,.business-box pre{white-space:pre-wrap;word-break:break-word;margin:10px 0 0;background:transparent;border:0;color:var(--text);font-size:12px;line-height:1.5}.itobb-detail-card{margin-top:14px;border-color:rgba(34,197,94,.28)}.nace-box{margin-top:14px;border:1px solid var(--border);border-radius:14px;background:rgba(15,23,42,.55);padding:12px}.nace-line{padding:8px 0;color:var(--text);font-size:13px;line-height:1.45}.nace-line+.nace-line{border-top:1px dashed var(--border)}
@media(max-width:760px){.person-summary-card,.person-card-top,.itobb-detail-title{display:block}.person-summary-badges{justify-content:flex-start;margin-top:10px}.person-facts,.itobb-grid{grid-template-columns:1fr}.detail-grid .wide{grid-column:auto}.rel-row{grid-template-columns:1fr}.rel-meta{justify-content:flex-start}.person-card-actions{margin-top:10px}.itobb-head{align-items:flex-start}}
.birth-finder{margin:12px 0 0;border:1px solid var(--border);border-radius:12px;background:rgba(59,130,246,.05);overflow:hidden}
.birth-finder>summary{cursor:pointer;list-style:none;padding:12px 16px;font-weight:900;color:var(--blue);font-size:14px;user-select:none}
.birth-finder>summary::-webkit-details-marker{display:none}
.birth-finder>summary::before{content:'▸ ';font-weight:900}
.birth-finder[open]>summary::before{content:'▾ '}
.birth-finder[open]>summary{border-bottom:1px solid var(--border)}
.birth-finder-body{padding:14px 16px}
.birth-finder-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}
.birth-finder-grid label{display:grid;gap:5px;color:var(--muted);font-size:12px;font-weight:700}
.birth-finder-grid input,.birth-finder-grid select{width:100%;padding:9px 11px;border:1px solid var(--border);border-radius:10px;background:var(--card2);color:var(--text);font-size:14px}
.birth-finder-body>.find-birth-btn{width:100%;padding:11px;border:1px solid rgba(34,197,94,.4);background:rgba(34,197,94,.14);color:#86efac;border-radius:10px;font-weight:900;font-size:14px;cursor:pointer}
.birth-finder-body>.find-birth-btn:hover{background:rgba(34,197,94,.22)}
.birth-result{margin-top:12px}
.birth-result:empty{display:none}
.birth-loading{padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:rgba(245,158,11,.1);color:#fbbf24;font-weight:700;font-size:13px}
@media(max-width:760px){.birth-finder-grid{grid-template-columns:1fr}}



.ocr-collapsible{padding:0;overflow:hidden}.ocr-counter-summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 18px}.ocr-counter-summary::-webkit-details-marker{display:none}.ocr-summary-main{min-width:0}.ocr-summary-main strong{display:block;color:var(--text);font-size:18px;line-height:1.25}.ocr-summary-main span{display:block;color:var(--muted);font-size:12px;font-weight:800;margin-top:4px}.ocr-summary-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}.ocr-mini-progress{display:block;width:120px;height:10px;border-radius:999px;background:rgba(148,163,184,.16);overflow:hidden}.ocr-mini-progress i{display:block;height:100%;background:#22c55e;border-radius:999px}.ocr-open-label{border:1px solid rgba(59,130,246,.45);background:rgba(59,130,246,.12);color:var(--blue);border-radius:12px;font-weight:900;font-size:12px;padding:8px 10px;white-space:nowrap}.ocr-collapsible[open] .ocr-open-label{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.38);color:#22c55e}.ocr-collapsible[open] .ocr-counter-summary{border-bottom:1px solid var(--border)}.ocr-counter-body{padding:0 18px 18px}@media(max-width:760px){.ocr-counter-summary{align-items:flex-start;flex-direction:column}.ocr-summary-actions{width:100%;justify-content:space-between}.ocr-mini-progress{width:160px;max-width:55vw}}
.ocr-counter-card{border:1px solid rgba(59,130,246,.36);border-radius:18px;background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(17,24,39,.92));box-shadow:0 14px 40px rgba(0,0,0,.22);padding:18px;margin:14px 0}.ocr-counter-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.ocr-counter-head h2{margin:0;color:var(--text);font-size:20px;line-height:1.25}.ocr-counter-head p{margin:5px 0 0;color:var(--muted);font-size:13px;line-height:1.45}.ocr-refresh{display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(59,130,246,.45);background:rgba(59,130,246,.12);color:var(--blue);border-radius:12px;text-decoration:none;font-weight:900;padding:9px 12px;white-space:nowrap}.ocr-progress-wrap{margin-top:14px;border:1px solid var(--border);background:rgba(2,6,23,.28);border-radius:14px;padding:12px}.ocr-progress-label,.ocr-progress-note{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;color:var(--muted);font-size:12px;font-weight:900}.ocr-progress-note{margin-top:8px;font-weight:700}.ocr-progress{height:13px;margin-top:9px;background:rgba(148,163,184,.14);border-radius:999px;overflow:hidden;display:flex}.ocr-progress i{display:block;height:100%}.ocr-progress .done{background:#22c55e}.ocr-progress .err{background:#ef4444}.ocr-progress .proc{background:#f59e0b}.ocr-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.ocr-stat{border:1px solid var(--border);border-radius:14px;background:rgba(15,23,42,.72);padding:12px}.ocr-stat b{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}.ocr-stat strong{display:block;color:var(--text);font-size:22px;line-height:1;font-weight:1000}.ocr-stat span{display:block;margin-top:5px;color:var(--muted);font-size:12px}.ocr-stat.green{border-color:rgba(34,197,94,.32)}.ocr-stat.blue{border-color:rgba(59,130,246,.34)}.ocr-stat.amber{border-color:rgba(245,158,11,.35)}.ocr-stat.red{border-color:rgba(239,68,68,.35)}@media(max-width:760px){.ocr-counter-head{flex-direction:column}.ocr-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* AİLƏ AĞACI v5 — yerli xəritə, CDN-siz, işlək düymələr */
.family-stage-v5{height:74vh;min-height:660px;border:1px solid var(--border);border-radius:18px;background:radial-gradient(circle at 15% 18%,rgba(59,130,246,.18),transparent 28%),radial-gradient(circle at 80% 20%,rgba(34,197,94,.11),transparent 30%),linear-gradient(180deg,var(--card2),var(--card));overflow:hidden;position:relative;user-select:none}
.family-svg{position:absolute;inset:0;width:100%;height:100%;z-index:1;overflow:visible}.family-nodes-layer{position:absolute;inset:0;z-index:2}.fam-node{position:absolute;transform:translate(-50%,-50%);min-width:190px;max-width:250px;padding:12px 13px;border-radius:17px;border:2px solid rgba(148,163,184,.45);background:rgba(15,23,42,.92);box-shadow:0 14px 40px rgba(0,0,0,.32);cursor:grab;color:#e5e7eb;touch-action:none}.fam-node:active{cursor:grabbing}.fam-node.confirmed{border-color:#22c55e;background:linear-gradient(135deg,rgba(22,101,52,.78),rgba(15,23,42,.94))}.fam-node.pending{border-color:#f59e0b;background:linear-gradient(135deg,rgba(146,64,14,.74),rgba(15,23,42,.94))}.fam-node.suspect{border-color:#ef4444;background:linear-gradient(135deg,rgba(127,29,29,.78),rgba(15,23,42,.94))}.fam-node.selected{outline:3px solid rgba(96,165,250,.85);outline-offset:4px}.fam-node-name{font-weight:1000;font-size:15px;line-height:1.2}.fam-node-role{font-size:12px;color:#cbd5e1;margin-top:5px;line-height:1.25}.fam-node-status{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#bfdbfe;margin-top:8px;font-weight:1000}.fam-svg-edge{stroke:#93c5fd;stroke-width:2.4;cursor:pointer}.fam-svg-edge.pending{stroke:#f59e0b;stroke-dasharray:7 6}.fam-svg-edge.suspect{stroke:#ef4444;stroke-dasharray:8 6}.fam-svg-label{fill:#dbeafe;font-size:12px;font-weight:900;paint-order:stroke;stroke:#0f1117;stroke-width:5px;cursor:pointer;text-anchor:middle}.family-modal.open{display:flex!important}@media(max-width:1180px){.family-stage-v5{height:64vh;min-height:540px}}@media(max-width:720px){.family-stage-v5{height:58vh;min-height:430px}.fam-node{min-width:165px;max-width:210px}}

.card td a,td.value a,#alResults a,#csResults a,#wbResults a,#imResults a{color:#8ecbff!important;background:rgba(255,255,255,.08);padding:1px 6px;border-radius:6px;text-decoration:none;word-break:break-all}.card td a:hover,td.value a:hover,#alResults a:hover,#csResults a:hover,#wbResults a:hover{background:rgba(142,203,255,.28);color:#eaf4ff!important}.osint-nav{display:flex;flex-wrap:wrap;gap:12px;margin:6px 0 18px}.osint-group{flex:1 1 220px;min-width:200px;background:var(--card2);border:1px solid var(--border);border-radius:14px;padding:10px 13px}.osint-glabel{display:block;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:9px}.osint-links{display:flex;flex-wrap:wrap;gap:7px}.osint-links a{padding:6px 12px;border-radius:999px;border:1px solid var(--border);background:var(--card);color:var(--text);text-decoration:none;font-size:13px;font-weight:700;line-height:1.15}.osint-links a:hover{border-color:var(--blue);color:var(--blue)}.osint-links a.active{background:var(--blue);color:#fff;border-color:var(--blue)}</style>`;
}
