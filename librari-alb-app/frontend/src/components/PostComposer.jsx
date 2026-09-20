import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { createPost } from '../api/postsApi.js';
import { ALL_CATEGORIES } from '../constants/categories.js';

const MAX_LENGTH = 280;

export default function PostComposer({ onPosted, defaultCategory = '' }) {
  const { user, token } = useAuth();
  const [text, setText] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setCategory(defaultCategory), [defaultCategory]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const { post } = await createPost(text, category, token);
      setText('');
      onPosted?.(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="post-composer" onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Çfarë po ndodh?"
        rows={3}
      />
      <div className="post-composer-footer">
        <select
          className="post-composer-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Pa kategori</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <span className={text.length > MAX_LENGTH - 20 ? 'char-count warn' : 'char-count'}>
          {text.length}/{MAX_LENGTH}
        </span>
        <button type="submit" disabled={!text.trim() || submitting}>
          {submitting ? 'Duke postuar...' : 'Posto'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
