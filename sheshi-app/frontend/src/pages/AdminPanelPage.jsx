import { useEffect, useState } from 'react';
import { setDailyTopic, fetchTopicHistory, fetchActiveTopic } from '../api/topicsApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminPanelPage() {
  const { token } = useAuth();
  const [text, setText] = useState('');
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = () => {
    fetchTopicHistory(token).then((data) => setHistory(data.topics));
  };

  useEffect(() => {
    fetchActiveTopic().then((data) => setCurrent(data.topic));
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { topic } = await setDailyTopic(text, token);
      setCurrent(topic);
      setText('');
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>Paneli i Adminit</h1>
      <section>
        <h2>Vendos "Temën e Ditës" (ping për të gjithë)</h2>
        {current && (
          <p className="admin-current-topic">
            Aktuale: <strong>{current.text}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit} className="admin-topic-form">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            placeholder="p.sh. Sot flasim për...?"
          />
          <button type="submit" disabled={!text.trim() || submitting}>
            {submitting ? 'Duke dërguar...' : 'Ping'}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <p className="admin-hint">
          Sapo dërgohet, tema shfaqet menjëherë si banderolë e ngjitur sipër feed-it të të gjithë
          përdoruesve.
        </p>
      </section>

      <section>
        <h2>Historiku i temave</h2>
        <ul className="admin-topic-history">
          {history.map((topic) => (
            <li key={topic._id}>
              <strong>{topic.text}</strong> — @{topic.createdBy?.username} (
              {new Date(topic.createdAt).toLocaleString('sq-AL')})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
