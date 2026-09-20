import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toggleLike } from '../api/postsApi.js';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'tani';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}o`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PostCard({ post, onChange }) {
  const { user, token } = useAuth();

  const handleLike = async () => {
    if (!user) return;
    const result = await toggleLike(post._id, token);
    onChange?.({ ...post, likesCount: result.likesCount });
  };

  return (
    <article className="post-card">
      <div className="post-card-header">
        <Link to={`/${post.author.username}`} className="post-author">
          {post.author.displayName} <span className="post-author-username">@{post.author.username}</span>
        </Link>
        <span className="post-time">{timeAgo(post.createdAt)}</span>
      </div>
      <Link to={`/postimi/${post._id}`} className="post-text-link">
        <p className="post-text">{post.text}</p>
      </Link>
      <div className="post-card-actions">
        <button type="button" onClick={handleLike} disabled={!user}>
          ♥ {post.likesCount || 0}
        </button>
        <Link to={`/postimi/${post._id}`}>💬 {post.repliesCount || 0}</Link>
      </div>
    </article>
  );
}
