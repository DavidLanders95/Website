import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'public', 'hero');
    if (!fs.existsSync(dir)) return res.status(200).json({ images: [] });
    const files = fs.readdirSync(dir);
    const images = files
      .filter((f) => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(f))
      .map((f) => `/hero/${f}`);
    res.status(200).json({ images });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read images' });
  }
}
