const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

async function getProfile(req, res, next) {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username displayName');

    let isFollowing = false;
    if (req.user) {
      isFollowing = Boolean(
        await Follow.exists({ follower: req.user.id, following: user._id })
      );
    }

    return res.json({ user, posts, isFollowing });
  } catch (err) {
    return next(err);
  }
}

async function toggleFollow(req, res, next) {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const existing = await Follow.findOne({ follower: req.user.id, following: target._id });

    if (existing) {
      await existing.deleteOne();
      await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(target._id, { $inc: { followersCount: -1 } });
      return res.json({ following: false });
    }

    await Follow.create({ follower: req.user.id, following: target._id });
    await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(target._id, { $inc: { followersCount: 1 } });
    return res.json({ following: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getProfile, toggleFollow };
