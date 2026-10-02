// Generates the intro narration with ElevenLabs, plus word timings so the on-screen text can be revealed in sync.
// Usage (PowerShell):  $env:ELEVENLABS_API_KEY = '...'; node tools/gen_vo.mjs
// The key is only read from the environment and is never written to disk.
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error('Set ELEVENLABS_API_KEY first'); process.exit(1); }
const VOICE = process.env.VO_VOICE ?? 'JBFqnCBsd6RMkjVDRZzb'; // George, warm storyteller
const slides = JSON.parse(fs.readFileSync('src/data/intro.json', 'utf8'));
const out = 'public/assets/audio/vo';
fs.mkdirSync(out, { recursive: true });

/** Groups the character alignment into words: [{ w, t0, t1 }]. */
function words(al) {
  const res = [];
  let cur = '', t0 = 0, t1 = 0;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) res.push({ w: cur, t0, t1 });
      cur = '';
      return;
    }
    if (!cur) t0 = al.character_start_times_seconds[i];
    cur += ch;
    t1 = al.character_end_times_seconds[i];
  });
  if (cur) res.push({ w: cur, t0, t1 });
  return res;
}

for (let i = 0; i < slides.length; i++) {
  const s = slides[i];
  const text = `${s.title}. ${s.text}`;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  if (!res.ok) { console.error(`slide ${i + 1} failed`, res.status, (await res.text()).slice(0, 300)); process.exit(1); }
  const j = await res.json();
  fs.writeFileSync(path.join(out, `intro_${i + 1}.mp3`), Buffer.from(j.audio_base64, 'base64'));
  const w = words(j.alignment);
  const dur = w.length ? w[w.length - 1].t1 : 0;
  fs.writeFileSync(path.join(out, `intro_${i + 1}.json`), JSON.stringify({ text, duration: dur, words: w }));
  console.log(`slide ${i + 1}: ${w.length} words, ${dur.toFixed(1)}s`);
}
