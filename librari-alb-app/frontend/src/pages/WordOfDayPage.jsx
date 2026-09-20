import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import {
  fetchActiveWord,
  submitSuggestion,
  voteSuggestion,
  fetchWordComments,
  postWordComment,
} from '../api/wordOfDayApi.js';

export default function WordOfDayPage() {
  const { user, token } = useAuth();
  const socket = useSocket();

  const [word, setWord] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionText, setSuggestionText] = useState('');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [error, setError] = useState('');

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const load = () => {
    fetchActiveWord().then((data) => {
      setWord(data.word);
      setSuggestions(data.suggestions);
    });
  };

  useEffect(load, []);

  useEffect(() => {
    if (!word) {
      setComments([]);
      return;
    }
    fetchWordComments(word._id).then((data) => setComments(data.comments));
  }, [word?._id]);

  useEffect(() => {
    if (!socket) return undefined;

    const onWordUpdated = (newWord) => {
      setWord(newWord);
      setSuggestions([]);
    };
    const onSuggestionUpdated = (suggestion) => {
      setSuggestions((prev) => {
        const withoutOld = prev.filter((s) => s._id !== suggestion._id);
        return [...withoutOld, suggestion].sort((a, b) => b.votesCount - a.votesCount);
      });
    };

    socket.on('word:updated', onWordUpdated);
    socket.on('word:suggestion_updated', onSuggestionUpdated);
    return () => {
      socket.off('word:updated', onWordUpdated);
      socket.off('word:suggestion_updated', onSuggestionUpdated);
    };
  }, [socket]);

  const handleSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestionText.trim() || submittingSuggestion || !word) return;
    setSubmittingSuggestion(true);
    setError('');
    try {
      await submitSuggestion(word._id, suggestionText, token);
      setSuggestionText('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const handleVote = async (suggestionId) => {
    if (!user) return;
    await voteSuggestion(suggestionId, token);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment || !word) return;
    setSubmittingComment(true);
    try {
      const { comment } = await postWordComment(word._id, commentText, token);
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!word) {
    return (
      <div className="word-of-day-page">
        <h1>Fjala e Ditës</h1>
        <p>Ende nuk ka fjalë të vendosur nga admini. Kthehu më vonë!</p>
      </div>
    );
  }

  const topVotes = suggestions[0]?.votesCount || 0;

  return (
    <div className="word-of-day-page">
      <h1>Fjala e Ditës</h1>
      <div className="word-of-day-card">
        <p className="word-of-day-word">{word.word}</p>
        {word.note && <p className="word-of-day-note">{word.note}</p>}
        <p className="word-of-day-hint">
          Propozo si mund ta themi këtë fjalë "më shqip", pastaj voto propozimin që të pëlqen më
          shumë.
        </p>
      </div>

      {user ? (
        <form onSubmit={handleSuggestion} className="word-suggestion-form">
          <input
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value.slice(0, 60))}
            placeholder="p.sh. kuti ngrirëse"
          />
          <button type="submit" disabled={!suggestionText.trim() || submittingSuggestion}>
            Propozo
          </button>
        </form>
      ) : (
        <p>
          <Link to="/hyrje">Hyr</Link> për të propozuar ose voutuar.
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      <ul className="word-suggestion-list">
        {suggestions.length === 0 && <li className="word-suggestion-empty">Ende s'ka propozime, bëhu i pari!</li>}
        {suggestions.map((s, index) => {
          const isWinning = index === 0 && s.votesCount > 0 && s.votesCount === topVotes;
          const hasVoted = Boolean(user && s.votedBy?.includes(user.id));
          return (
            <li key={s._id} className={isWinning ? 'word-suggestion winning' : 'word-suggestion'}>
              <div>
                <span className="word-suggestion-text">{s.text}</span>
                <span className="word-suggestion-author"> — @{s.submittedBy?.username}</span>
                {isWinning && <span className="word-suggestion-badge">🏆 Në krye</span>}
              </div>
              <button
                type="button"
                onClick={() => handleVote(s._id)}
                disabled={!user}
                className={hasVoted ? 'vote-button voted' : 'vote-button'}
              >
                ▲ {s.votesCount}
              </button>
            </li>
          );
        })}
      </ul>

      <section className="word-comments-section">
        <h2>Diskutim</h2>
        {user && (
          <form onSubmit={handleComment} className="reply-form">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 280))}
              placeholder="Jep mendimin tënd..."
              rows={2}
            />
            <button type="submit" disabled={!commentText.trim() || submittingComment}>
              Komento
            </button>
          </form>
        )}
        <div className="reply-list">
          {comments.map((c) => (
            <div key={c._id} className="reply-item">
              <span className="post-author">
                {c.author.displayName} <span className="post-author-username">@{c.author.username}</span>
              </span>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
