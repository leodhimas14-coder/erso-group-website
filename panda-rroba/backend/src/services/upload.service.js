// Stores photos and videos uploaded from the admin panel.
//
// Two storage options:
//  - Cloudinary, when CLOUDINARY_URL is set (recommended online: files survive
//    redeploys and are served from a fast CDN, free tier available).
//  - Local disk (UPLOAD_DIR, default ./uploads), served at /uploads. Fine on a
//    VPS; on hosts with temporary disks (Render, Railway) files are lost on
//    every deploy, so use Cloudinary there.

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { HttpError } = require('../middleware/errorHandler');

const MB = 1024 * 1024;
const LIMITS = { image: 10 * MB, video: 60 * MB };

// File type is decided by the first bytes, not by the name the browser sends.
function sniff(buf) {
  const hex = buf.subarray(0, 12).toString('hex');
  const ascii = buf.subarray(0, 12).toString('latin1');
  if (hex.startsWith('ffd8ff')) return { kind: 'image', ext: 'jpg', mime: 'image/jpeg' };
  if (hex.startsWith('89504e47')) return { kind: 'image', ext: 'png', mime: 'image/png' };
  if (ascii.startsWith('GIF8')) return { kind: 'image', ext: 'gif', mime: 'image/gif' };
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return { kind: 'image', ext: 'webp', mime: 'image/webp' };
  if (hex.startsWith('1a45dfa3')) return { kind: 'video', ext: 'webm', mime: 'video/webm' };
  if (ascii.slice(4, 8) === 'ftyp') {
    const brand = ascii.slice(8, 12);
    if (brand === 'avif' || brand === 'avis') return { kind: 'image', ext: 'avif', mime: 'image/avif' };
    if (['heic', 'heix', 'mif1', 'msf1'].includes(brand)) return { kind: 'heic' };
    if (brand.startsWith('qt')) return { kind: 'video', ext: 'mov', mime: 'video/quicktime' };
    return { kind: 'video', ext: 'mp4', mime: 'video/mp4' };
  }
  return null;
}

function check(file) {
  if (!file?.buffer?.length) throw new HttpError(400, 'Nuk u zgjodh asnjë skedar');
  const type = sniff(file.buffer);
  if (type?.kind === 'heic') throw new HttpError(400, 'Fotot HEIC nuk hapen në çdo telefon. Ruaje foton si JPG dhe provo përsëri.');
  if (!type) throw new HttpError(400, 'Lejohen vetëm foto (JPG, PNG, WEBP, GIF) ose video (MP4, MOV, WEBM)');
  if (file.size > LIMITS[type.kind]) {
    throw new HttpError(400, type.kind === 'video' ? 'Videoja është mbi 60 MB. Shkurtoje ose kompresoje.' : 'Fotoja është mbi 10 MB.');
  }
  return type;
}

const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));
const useCloudinary = () => Boolean(process.env.CLOUDINARY_URL);

async function saveLocal(file, type, baseUrl) {
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}.${type.ext}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), name), file.buffer);
  return `${baseUrl}/uploads/${name}`;
}

function saveCloudinary(file, type) {
  const { v2: cloudinary } = require('cloudinary'); // reads CLOUDINARY_URL
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'panda', resource_type: type.kind }, (err, result) => (err ? reject(err) : resolve(result.secure_url)))
      .end(file.buffer);
  });
}

/** Saves one uploaded file and returns { url, kind }. */
async function storeUpload(file, { baseUrl }) {
  const type = check(file);
  const url = useCloudinary() ? await saveCloudinary(file, type) : await saveLocal(file, type, baseUrl);
  return { url, kind: type.kind };
}

module.exports = { storeUpload, uploadDir, useCloudinary, sniff, LIMITS };
