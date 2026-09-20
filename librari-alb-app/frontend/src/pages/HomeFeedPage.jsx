import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DailyTopicBanner from '../components/DailyTopicBanner.jsx';
import PostComposer from '../components/PostComposer.jsx';
import PostCard from '../components/PostCard.jsx';
import { fetchFeed } from '../api/postsApi.js';
import { useSocket } from '../context/SocketContext.jsx';
import { categoryLabel } from '../constants/categories.js';

export default function HomeFeedPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('kategoria') || '';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    setLoading(true);
    fetchFeed(1, category)
      .then((data) => setPosts(data.posts))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!socket) return undefined;
    const onPostCreated = (post) => {
      if (category && post.category !== category) return;
      setPosts((prev) => [post, ...prev]);
    };
    socket.on('post:created', onPostCreated);
    return () => socket.off('post:created', onPostCreated);
  }, [socket, category]);

  const updatePost = (updated) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  return (
    <div className="feed-page">
      <DailyTopicBanner />
      {category && (
        <p className="feed-category-heading">
          Kategoria: <strong>{categoryLabel(category)}</strong>
        </p>
      )}
      <PostComposer onPosted={(post) => setPosts((prev) => [post, ...prev])} defaultCategory={category} />
      {loading && <p>Duke ngarkuar...</p>}
      {!loading && posts.length === 0 && <p>Ende s'ka postime këtu. Bëhu i pari!</p>}
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onChange={updatePost} />
      ))}
    </div>
  );
}
