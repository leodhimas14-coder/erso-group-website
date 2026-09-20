import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { createPost } from '../api/postsApi.js';

const MAX_LENGTH = 280;

export default function PostComposer({ onPosted }) {
  const { user, token } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const { post } = await createPost(text, token);
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
