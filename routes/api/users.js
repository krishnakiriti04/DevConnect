const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require("./../../models/User");

// @route POST api/users
// @desc register a user
// @access public
router.post('/', [
    check('name', "Name is Required").not().isEmpty(),
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body
    try {
        //Check user duplication
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                errors: [{ msg: 'Exists already exists' }]
            })
        }

        //Get Avatar from Gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        })

        // encrypt the password
        const salt = await bcrypt.genSalt(8);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        })


    } catch (err) {
        res.status(500).send('Server Error')
    }
})


module.exports = router;