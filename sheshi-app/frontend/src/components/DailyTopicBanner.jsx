import { useEffect, useState } from 'react';
import { fetchActiveTopic } from '../api/topicsApi.js';
import { useSocket } from '../context/SocketContext.jsx';

/** Pinned "Tema e Ditës" banner - loads the current topic, then updates live when the admin pings a new one. */
export default function DailyTopicBanner() {
  const [topic, setTopic] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    fetchActiveTopic()
      .then((data) => setTopic(data.topic))
      .catch(() => setTopic(null));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onTopicUpdated = (newTopic) => setTopic(newTopic);
    socket.on('topic:updated', onTopicUpdated);
    return () => socket.off('topic:updated', onTopicUpdated);
  }, [socket]);

  if (!topic) return null;

  return (
    <div className="daily-topic-banner">
      <span className="daily-topic-label">📌 Tema e ditës</span>
      <span className="daily-topic-text">{topic.text}</span>
      <span className="daily-topic-author">— @{topic.createdBy?.username}</span>
    </div>
  );
}
