const router = require('express').Router();
const bcrypt = require('bcrypt');
const filters = require('../filters/auth-filters')
const User = require('../models/user');


router.get('/', filters.isAuthenticated, function (req, res) {
    res.render('pages/settings', { title: 'Account', user: req.user });
});


// Update profile, Display Name, Username, Email
router.post('/profile', filters.isAuthenticated, filters.usernameAvailableSettings, filters.emailAvailableSettings, async function(req, res) {
    const displayname = req.body.displayname;
    const username = req.body.username;
    const email = req.body.email
    if(username != req.user.username) {
        await User.findOne({username: username}).then(function(user) {
            if(user) {
                req.flash('profileError', 'Username already taken.')
                return res.redirect('/settings')
            }
        });
    }
    if(email != req.user.email) {
        await User.findOne({email: email}).then(function(user) {
            if(user) {
                req.flash('profileError', 'Email already taken.')
                return res.redirect('/settings')
            }
        });
    }
    if(username != req.user.username) {
        await User.updateOne({_id: req.user.id}, {
            displayname: displayname,
            username: username,
            email: email
        }, function(err, res) {
            if(err) {
                req.flash('profileError', 'Error updating user.');
            } else {
                req.flash('profileSuccess', 'Profile updated.');
            }
        });
        res.redirect('/settings');
    } else {
        req.flash('profileSuccess', 'Nothing changed!');
        res.redirect('/settings')
    }

});


// Change password
router.post('/password', filters.isAuthenticated, async function(req, res) {
    if(!(await bcrypt.compare(req.body.oldpass, req.user.password))) {
        req.flash('passError', 'Incorrect password.');
        return res.redirect('/settings')
    }
    if(!(req.body.pass1 == req.body.pass2)) {
        req.flash('passError', 'Passwords don\'t match.');
        return res.redirect('/settings');
    }
    await User.updateOne({_id: req.user.id}, {
        password: await bcrypt.hash(req.body.pass1, 10)
    }).then(function(user) {
        req.flash('passSuccess', 'Passwords changed.');
        return res.redirect('/settings');
    })
});


module.exports = router;