import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import { fetchPost, createReply } from '../api/postsApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PostDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetchPost(id).then((data) => {
      setPost(data.post);
      setReplies(data.replies);
    });
  };

  useEffect(load, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createReply(id, replyText, token);
      setReplyText('');
      load();
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return <p>Duke ngarkuar...</p>;

  return (
    <div className="post-detail-page">
      <PostCard post={post} onChange={setPost} />

      {user && (
        <form onSubmit={handleReply} className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value.slice(0, 280))}
            placeholder="Postoni përgjigjen tuaj"
            rows={2}
          />
          <button type="submit" disabled={!replyText.trim() || submitting}>
            Përgjigju
          </button>
        </form>
      )}

      <div className="reply-list">
        {replies.map((reply) => (
          <div key={reply._id} className="reply-item">
            <span className="post-author">
              {reply.author.displayName} <span className="post-author-username">@{reply.author.username}</span>
            </span>
            <p>{reply.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
