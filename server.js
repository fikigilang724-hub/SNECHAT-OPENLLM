// SNECHAT backend — proxy aman ke Google Gemini API (gratis, tanpa kartu kredit).
// API key Gemini DISIMPAN DI SINI (server), TIDAK PERNAH dikirim ke browser.

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // biar bisa terima lampiran gambar base64

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Model asli disembunyikan di server. Kalau Google ganti/pensiunkan model ini,
// cek nama model terbaru di https://ai.google.dev/gemini-api/docs/models lalu ganti di sini.
const MODEL_FAST = process.env.MODEL_FAST || 'gemini-2.5-flash-lite'; // SNECHAT 0.1 (cepat, kuota paling longgar)
const MODEL_DEEP = process.env.MODEL_DEEP || 'gemini-2.5-flash';      // SNECHAT 0.10 (deep think)
const MODEL_IMAGE = process.env.MODEL_IMAGE || 'gemini-2.5-flash-image'; // generator gambar ("nano banana")

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY belum di-set. Set environment variable ini sebelum deploy/jalanin server.');
}

app.get('/', (req, res) => {
  res.send('SNECHAT backend (Gemini) aktif ✅');
});

// Ubah format pesan kita { role: 'user'|'assistant', content: string|array } ke format Gemini { role:'user'|'model', parts:[...] }
function toGeminiContents(messages) {
  return messages.map(m => {
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
          if (match) {
            parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
          }
        }
      });
    } else {
      parts.push({ text: '(kosong)' });
    }
    return { role, parts };
  });
}

// ---------- Chat endpoint ----------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system, modelTier, webSearch } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages harus berupa array' });
    }
    const model = modelTier === 'deep' ? MODEL_DEEP : MODEL_FAST;

    const payload = {
      system_instruction: { parts: [{ text: system || '' }] },
      contents: toGeminiContents(messages),
      generationConfig: { maxOutputTokens: 1000 }
    };

    if (webSearch) {
      payload.tools = [{ google_search: {} }];
    }

    const r = await fetch(`${BASE_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    });
    let data = await r.json();

    if (data.error) {
      // Kalau tool google_search ditolak model, coba ulang tanpa tool.
      if (webSearch) {
        delete payload.tools;
        const r2 = await fetch(`${BASE_URL}/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify(payload)
        });
        const data2 = await r2.json();
        if (!data2.error) {
          const text2 = extractText(data2);
          return res.json({ text: text2 });
        }
      }
      return res.status(400).json({ error: data.error.message || 'Terjadi kesalahan dari Gemini' });
    }

    const text = extractText(data);
    if (!text) return res.status(400).json({ error: 'Respons kosong dari model (mungkin diblokir filter keamanan Gemini).' });
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('\n').trim();
}

// ---------- Image generation endpoint ----------
app.post('/api/image', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt kosong' });

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] }
    };

    const r = await fetch(`${BASE_URL}/${MODEL_IMAGE}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message || 'Terjadi kesalahan dari Gemini' });
    }
    const parts = data?.candidates?.[0]?.content?.parts || [];
    let b64 = null;
    for (const p of parts) {
      const inline = p.inline_data || p.inlineData;
      if (inline && inline.data) { b64 = inline.data; break; }
    }
    if (!b64) return res.status(400).json({ error: 'Model tidak mengembalikan gambar (mungkin diblokir filter keamanan).' });
    res.json({ b64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SNECHAT backend (Gemini) jalan di port ${PORT}`));
