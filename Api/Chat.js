// SNECHAT backend — Vercel Serverless Function
// Proxy aman ke Google Gemini API. API key disimpan di Environment Variables Vercel,
// TIDAK PERNAH dikirim ke browser.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_FAST = process.env.MODEL_FAST || 'gemini-2.5-flash-lite';
const MODEL_DEEP = process.env.MODEL_DEEP || 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function toGeminiContents(messages) {
  return (messages || []).map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    let parts = [];
    if (typeof m.content === 'string') {
      parts.push({ text: m.content || '(kosong)' });
    } else if (Array.isArray(m.content)) {
      m.content.forEach(block => {
        if (block.type === 'text') {
          parts.push({ text: block.text });
        } else if (block.type === 'image_url' && block.image_url && block.image_url.url) {
          const match = /^data:(.+?);base64,(.+)$/.exec(block.image_url.url);
          if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
        }
      });
    } else {
      parts.push({ text: '(kosong)' });
    }
    return { role, parts };
  });
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('\n').trim();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const { messages, system, modelTier, webSearch } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages harus berupa array' });
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum di-set di server' });

    const model = modelTier === 'deep' ? MODEL_DEEP : MODEL_FAST;
    const payload = {
      system_instruction: { parts: [{ text: system || '' }] },
      contents: toGeminiContents(messages),
      generationConfig: { maxOutputTokens: 1000 }
    };
    if (webSearch) payload.tools = [{ google_search: {} }];

    const r = await fetch(`${BASE_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(payload)
    });
    let data = await r.json();

    if (data.error) {
      if (webSearch) {
        delete payload.tools;
        const r2 = await fetch(`${BASE_URL}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify(payload)
        });
        const data2 = await r2.json();
        if (!data2.error) return res.status(200).json({ text: extractText(data2) });
      }
      return res.status(400).json({ error: data.error.message || 'Terjadi kesalahan dari Gemini' });
    }

    const text = extractText(data);
    if (!text) return res.status(400).json({ error: 'Respons kosong dari model (mungkin diblokir filter keamanan).' });
    res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
};
