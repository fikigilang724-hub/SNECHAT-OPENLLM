// SNECHAT backend — Vercel Serverless Function (generate gambar)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_IMAGE = process.env.MODEL_IMAGE || 'gemini-2.5-flash-image';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt kosong' });
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum di-set di server' });

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] }
    };

    const r = await fetch(`${BASE_URL}/${MODEL_IMAGE}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (data.error) return res.status(400).json({ error: data.error.message || 'Terjadi kesalahan dari Gemini' });

    const parts = data?.candidates?.[0]?.content?.parts || [];
    let b64 = null;
    for (const p of parts) {
      const inline = p.inline_data || p.inlineData;
      if (inline && inline.data) { b64 = inline.data; break; }
    }
    if (!b64) return res.status(400).json({ error: 'Model tidak mengembalikan gambar (mungkin diblokir filter keamanan).' });
    res.status(200).json({ b64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
};
