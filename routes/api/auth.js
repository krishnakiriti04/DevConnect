const express = require('express');
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const jwt = require('jsonwebtoken');
const config = require("config")
const bcrypt = require("bcryptjs");
const { check, validationResult } = require('express-validator');

// @route GET api/auth
// @desc authenticate and get user details
// @access public
router.get('/', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        console.log(error.message);
        res.status(400).send('Something Went Wrong')
    }
})


// @route POST api/auth
// @desc Authenticate user and get token
// @access public
router.post('/', [
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body
    try {
        //Check user duplication
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid Credentials' }]
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                errors: [{ msg: 'Invalid Credentials' }]
            })
        }


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