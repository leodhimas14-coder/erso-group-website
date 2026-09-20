const Post = require('../models/Post');
const Reply = require('../models/Reply');
const { emitPostCreated } = require('../sockets/index');

async function listFeed(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username displayName');

    return res.json({ posts, page, limit });
  } catch (err) {
    return next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Post text is required' });
    }
    if (text.length > 280) {
      return res.status(400).json({ error: 'Post text must be 280 characters or fewer' });
    }

    let post = await Post.create({ author: req.user.id, text: text.trim() });
    post = await post.populate('author', 'username displayName');

    emitPostCreated(post);
    return res.status(201).json({ post });
  } catch (err) {
    return next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username displayName');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const replies = await Reply.find({ post: post._id })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName');

    return res.json({ post, replies });
  } catch (err) {
    return next(err);
  }
}

async function toggleLike(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user.id;
    const alreadyLiked = post.likedBy.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter((id) => id.toString() !== userId);
    } else {
      post.likedBy.push(userId);
    }
    post.likesCount = post.likedBy.length;
    await post.save();

    return res.json({ liked: !alreadyLiked, likesCount: post.likesCount });
  } catch (err) {
    return next(err);
  }
}

async function createReply(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    let reply = await Reply.create({ post: post._id, author: req.user.id, text: text.trim() });
    reply = await reply.populate('author', 'username displayName');

    post.repliesCount += 1;
    await post.save();

    return res.status(201).json({ reply });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listFeed, createPost, getPost, toggleLike, createReply };
