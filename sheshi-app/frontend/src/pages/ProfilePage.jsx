import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import { fetchProfile, toggleFollow } from '../api/usersApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { username } = useParams();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);
    fetchProfile(username, token)
      .then((data) => {
        setProfile(data.user);
        setPosts(data.posts);
        setIsFollowing(data.isFollowing);
      })
      .catch(() => setNotFound(true));
  }, [username, token]);

  const handleFollow = async () => {
    const result = await toggleFollow(username, token);
    setIsFollowing(result.following);
    setProfile((prev) => ({
      ...prev,
      followersCount: prev.followersCount + (result.following ? 1 : -1),
    }));
  };

  if (notFound) return <p>Ky përdorues nuk u gjet.</p>;
  if (!profile) return <p>Duke ngarkuar...</p>;

  const isOwnProfile = user?.username === profile.username;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{profile.displayName}</h1>
        <p className="profile-username">@{profile.username}</p>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <div className="profile-stats">
          <span>{profile.followingCount} po ndjek</span>
          <span>{profile.followersCount} ndjekës</span>
        </div>
        {user && !isOwnProfile && (
          <button type="button" onClick={handleFollow}>
            {isFollowing ? 'Mos ndiq më' : 'Ndiq'}
          </button>
        )}
      </div>
      <div className="profile-posts">
        {posts.length === 0 && <p>Ende s'ka postime.</p>}
        {posts.map((post) => (
          <PostCard key={post._id} post={{ ...post, author: profile }} />
        ))}
      </div>
    </div>
  );
}
