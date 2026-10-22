import { IS_DEMO, tokenStore } from './api';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Uploads files to the shop server and returns [{ url, kind }].
 * onProgress receives 0–100 while sending.
 */
export function uploadFiles(files, onProgress = () => {}) {
  if (IS_DEMO) return demoUpload(files, onProgress);

  return new Promise((resolve, reject) => {
    const body = new FormData();
    for (const f of files) body.append('files', f);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/api/admin/uploads`);
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data.files || []);
      else reject(new Error(data.error || 'Ngarkimi dështoi'));
    };
    xhr.onerror = () => reject(new Error('Nuk ka lidhje me internetin. Provo përsëri.'));
    xhr.send(body);
  });
}

// The demo has no server: photos are shrunk and kept in this browser,
// videos are shown only until the page is reloaded.
async function demoUpload(files, onProgress) {
  const out = [];
  let i = 0;
  for (const file of files) {
    if (file.type.startsWith('video/')) out.push({ url: URL.createObjectURL(file), kind: 'video' });
    else if (file.type.startsWith('image/')) out.push({ url: await shrinkImage(file), kind: 'image' });
    else throw new Error('Lejohen vetëm foto ose video');
    i += 1;
    onProgress(Math.round((i / files.length) * 100));
  }
  return out;
}

function shrinkImage(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Fotoja nuk u lexua'));
    img.src = URL.createObjectURL(file);
  });
}
