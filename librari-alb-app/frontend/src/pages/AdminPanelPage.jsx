import { useEffect, useState } from 'react';
import { setDailyTopic, fetchTopicHistory, fetchActiveTopic } from '../api/topicsApi.js';
import { setWordOfDay, fetchWordHistory, fetchActiveWord } from '../api/wordOfDayApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminPanelPage() {
  const { token } = useAuth();

  const [topicText, setTopicText] = useState('');
  const [currentTopic, setCurrentTopic] = useState(null);
  const [topicHistory, setTopicHistory] = useState([]);
  const [submittingTopic, setSubmittingTopic] = useState(false);
  const [topicError, setTopicError] = useState('');

  const [word, setWord] = useState('');
  const [wordNote, setWordNote] = useState('');
  const [currentWord, setCurrentWord] = useState(null);
  const [wordHistory, setWordHistory] = useState([]);
  const [submittingWord, setSubmittingWord] = useState(false);
  const [wordError, setWordError] = useState('');

  const loadTopicHistory = () => {
    fetchTopicHistory(token).then((data) => setTopicHistory(data.topics));
  };

  const loadWordHistory = () => {
    fetchWordHistory(token).then((data) => setWordHistory(data.words));
  };

  useEffect(() => {
    fetchActiveTopic().then((data) => setCurrentTopic(data.topic));
    fetchActiveWord().then((data) => setCurrentWord(data.word));
    loadTopicHistory();
    loadWordHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicText.trim() || submittingTopic) return;
    setSubmittingTopic(true);
    setTopicError('');
    try {
      const { topic } = await setDailyTopic(topicText, token);
      setCurrentTopic(topic);
      setTopicText('');
      loadTopicHistory();
    } catch (err) {
      setTopicError(err.message);
    } finally {
      setSubmittingTopic(false);
    }
  };

  const handleWordSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim() || submittingWord) return;
    setSubmittingWord(true);
    setWordError('');
    try {
      const { word: created } = await setWordOfDay(word, wordNote, token);
      setCurrentWord(created);
      setWord('');
      setWordNote('');
      loadWordHistory();
    } catch (err) {
      setWordError(err.message);
    } finally {
      setSubmittingWord(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>Paneli i Adminit</h1>
      <section>
        <h2>Vendos "Temën e Ditës" (ping për të gjithë)</h2>
        {currentTopic && (
          <p className="admin-current-topic">
            Aktuale: <strong>{currentTopic.text}</strong>
          </p>
        )}
        <form onSubmit={handleTopicSubmit} className="admin-topic-form">
          <input
            value={topicText}
            onChange={(e) => setTopicText(e.target.value.slice(0, 200))}
            placeholder="p.sh. Sot flasim për...?"
          />
          <button type="submit" disabled={!topicText.trim() || submittingTopic}>
            {submittingTopic ? 'Duke dërguar...' : 'Ping'}
          </button>
        </form>
        {topicError && <p className="form-error">{topicError}</p>}
        <p className="admin-hint">
          Sapo dërgohet, tema shfaqet menjëherë si banderolë e ngjitur sipër feed-it të të gjithë
          përdoruesve.
        </p>

        <ul className="admin-topic-history">
          {topicHistory.map((topic) => (
            <li key={topic._id}>
              <strong>{topic.text}</strong> — @{topic.createdBy?.username} (
              {new Date(topic.createdAt).toLocaleString('sq-AL')})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Vendos "Fjalën e Ditës" (loja gjuhësore)</h2>
        {currentWord && (
          <p className="admin-current-topic">
            Aktuale: <strong>{currentWord.word}</strong>
            {currentWord.note && ` — ${currentWord.note}`}
          </p>
        )}
        <form onSubmit={handleWordSubmit} className="admin-word-form">
          <input
            value={word}
            onChange={(e) => setWord(e.target.value.slice(0, 60))}
            placeholder="p.sh. frigorifer"
          />
          <input
            value={wordNote}
            onChange={(e) => setWordNote(e.target.value.slice(0, 300))}
            placeholder="Shënim (opsional), p.sh. fjalë e huazuar"
          />
          <button type="submit" disabled={!word.trim() || submittingWord}>
            {submittingWord ? 'Duke dërguar...' : 'Posto'}
          </button>
        </form>
        {wordError && <p className="form-error">{wordError}</p>}
        <p className="admin-hint">
          Përdoruesit propozojnë një alternativë "më shqip" dhe votojnë; propozimi me më shumë
          vota del në krye. Ndryshimi shfaqet menjëherë te të gjithë.
        </p>

        <ul className="admin-topic-history">
          {wordHistory.map((w) => (
            <li key={w._id}>
              <strong>{w.word}</strong> — @{w.createdBy?.username} (
              {new Date(w.createdAt).toLocaleString('sq-AL')})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
