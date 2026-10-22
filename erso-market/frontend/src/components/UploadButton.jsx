import { useId, useState } from 'react';
import { uploadFiles } from '../lib/upload';

/** "Ngarko" button: pick files from the phone or computer and upload them. */
export default function UploadButton({ accept = 'image/*', multiple = false, label = '📷 Ngarko foto', onUploaded, className = 'btn btn-outline' }) {
  const id = useId();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  const onChange = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setProgress(0);
    try {
      const uploaded = await uploadFiles(files, setProgress);
      onUploaded(uploaded);
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="upload">
      <label htmlFor={id} className={`${className} ${progress !== null ? 'is-busy' : ''}`} aria-disabled={progress !== null}>
        {progress !== null ? `Po ngarkohet… ${progress}%` : label}
      </label>
      <input id={id} type="file" accept={accept} multiple={multiple} onChange={onChange} disabled={progress !== null} className="visually-hidden" />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
