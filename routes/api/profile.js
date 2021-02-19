const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route GET api/profile/me
// @desc get current user's profile
// @access private
router.get('/me', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id,
        }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);
    } catch (error) {
        res.status(400).send('Server Error');
    }
});

// @route POST api/profile/
// @desc create or update user's profile
// @access private
router.post(
    '/', [
        auth, [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty(),
        ],
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin,
        } = req.body;

        //Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map((skill) => skill.trim());
        }

        //Build social object
        profileFields.social = {};
        if (facebook) profileFields.social.facebook = facebook;
        if (instagram) profileFields.social.instagram = instagram;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (twitter) profileFields.social.twitter = twitter;
        if (youtube) profileFields.social.youtube = youtube;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //Update profile if found
                profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

                return res.json(profile);
            }

            // Creating the profile
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        } catch (error) {
            res.status(400).send('Server Error');
        }
    }
);

// @route GET api/profile/
// @desc get all profiles
// @access public
router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(400).send('Server Error');
    }
});

// @route GET api/profile/user/:id
// @desc get profile by id
// @access public
router.get('/user/:user_id', async(req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id,
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        if (error.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(400).send('Server Error');
    }
});

// @route DELETE api/profile/:id
// @desc delete profile, user & post
// @access private
router.delete('/', auth, async(req, res) => {
    try {
        //Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });

        //Remove User
        await User.findOneAndRemove({ _id: req.user.id });

        res.json('User deleted');
    } catch (error) {
        console.error(error.message);
        res.status(400).send('Server Error');
    }
});

// @route PUT api/profile/experience
// @desc update profile experience
// @access private
router.put(
    '/experience', [
        auth, [
            check('title', 'title is Required').not().isEmpty(),
            check('from', 'from is Required').not().isEmpty(),
            check('company', 'company is Required').not().isEmpty(),
        ],
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        } = req.body;

        const experienceFields = {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        };
        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.experience.unshift(experienceFields);

            await profile.save();

            res.json(profile);
        } catch (error) {
            console.error(error.message);
            res.status(400).send('Server Error');
        }
    }
);

// @route DELETE api/profile/experience/:exp_id
// @desc delete profile experience
// @access private
router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/profile/github/:username
// @desc Get user repos from github api
// @access public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' },
        };

        request(options, (error, response, body) => {
            if (error) console.error(error.message);
            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No Github Profile Found' });
            }
            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).send('Server Error');
    }
});

module.exports = router;