import { useEffect, useState } from 'react';
import DailyTopicBanner from '../components/DailyTopicBanner.jsx';
import PostComposer from '../components/PostComposer.jsx';
import PostCard from '../components/PostCard.jsx';
import { fetchFeed } from '../api/postsApi.js';
import { useSocket } from '../context/SocketContext.jsx';

export default function HomeFeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchFeed()
      .then((data) => setPosts(data.posts))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onPostCreated = (post) => setPosts((prev) => [post, ...prev]);
    socket.on('post:created', onPostCreated);
    return () => socket.off('post:created', onPostCreated);
  }, [socket]);

  const updatePost = (updated) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  return (
    <div className="feed-page">
      <DailyTopicBanner />
      <PostComposer onPosted={(post) => setPosts((prev) => [post, ...prev])} />
      {loading && <p>Duke ngarkuar...</p>}
      {!loading && posts.length === 0 && <p>Ende s'ka postime. Bëhu i pari!</p>}
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onChange={updatePost} />
      ))}
    </div>
  );
}
