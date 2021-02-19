const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Posts');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route POST api/posts
// @desc api to add posts
// @access private
router.post(
    '/', [auth, [check('text', 'Text is required').not().isEmpty()]],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            });

            const post = await newPost.save();
            res.json(post);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route GET api/posts
// @desc get all posts
// @access private
router.get('/', auth, async(req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/posts/:post_id
// @desc get a post by id
// @access private
router.get('/:post_id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route DELETE api/posts/:post_id
// @desc delete a post by id
// @access private
router.delete('/:post_id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();

        res.json({ msg: 'Post Deleted Successfully' });
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route PUT api/posts/like/:postId
// @desc add like to the post
// @access private
router.put('/like/:postId', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (
            post.likes.filter((like) => like.user.toString() === req.user.id).length >
            0
        ) {
            return res.status(400).json({ msg: 'Post is already liked' });
        }
        post.likes.push({ user: req.user.id });

        await post.save();

        res.json(post.likes);
        //res.json({ msg: 'You liked this post' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route PUT api/posts/dislike/:postId
// @desc dislike a post
// @access private
router.put('/dislike/:postId', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (!post.likes.filter((like) => like.user.toString() === req.user.id)
            .length > 0
        ) {
            return res.status(400).json({ msg: "you haven't  liked this post" });
        }
        const likeIndex = post.likes.findIndex(
            (like) => like.user.toString() === req.user.id
        );
        post.likes.splice(likeIndex, 1);
        await post.save();

        res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route POST api/posts/comment/:postId
// @desc add comment to a post
// @access private
router.post(
    '/comment/:postId', [auth, [check('text', 'Text is required').not().isEmpty()]],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.postId);

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            };

            post.comments.unshift(newComment);

            await post.save();
            res.json(post.comments);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route DELETE api/posts/comment/:postId/:commentId
// @desc delete comment
// @access private
router.delete('/comment/:postId/:commentId', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const comment = post.comments.find(
            (comment) => comment._id.toString() === req.params.commentId
        );

        //check if comment exists
        if (!comment) {
            return res.status(404).json({ msg: "Comment doesn't exist" });
        }

        //check user authorization
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const commentIndex = post.comments.indexOf(comment);

        post.comments.splice(commentIndex, 1);

        await post.save();

        res.json(post.comments);
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post/comment not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;