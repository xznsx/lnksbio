const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const filters = require('../filters/auth-filters');
const keys = require('../config/keys')
const User = require('../models/user');


// Get login page
router.get('/login', filters.isNotAuthenticated, function (req, res) {
    res.render('pages/login', { title: 'Login' });
});

// User signin.
router.post('/login', filters.isNotAuthenticated, filters.emailToLowerCase, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

// User sign out.
router.get('/logout', filters.isAuthenticated, function (req, res) {
    req.logOut();
    res.redirect('/auth/login');
});

// Get registration page
router.get('/register', filters.isNotAuthenticated, function (req, res) {
    res.render('pages/register', { title: 'Sign up' });
});

// Register user.
router.post('/register', filters.isNotAuthenticated, filters.usernameAvailable, filters.emailAvailable, filters.emailToLowerCase,function (req, res) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buff) {
                var token = buff.toString('hex');
                done(err, token);
            });
        },
        async function (token, done) {
            hashedPassword = await bcrypt.hash(req.body.password, 10)
            done(null, token, hashedPassword);
        },
        function (token, hashedPassword, done) {
            new User({
                displayname: req.body.displayname,
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
                verificationToken: token
            }).save().then(function (user) {
                done(null, token, user);
            });
        },
        function (token, user, done) {
            // nodemailer transporter
            const transporter = nodemailer.createTransport({
                host: "mail.lnksbio.com",
                port: 465,
                secure: true, // use TLS
                auth: {
                    user: keys.email.user,
                    pass: keys.email.pass
                }
            });
            var mailOptions = {
                to: user.email,
                from: '"Lnksbio" <contact@lnksbio.com>',
                subject: 'Lnksbio Email Verification',
                text: 'You are receiving this because you (or someone else) have signed up for a Lnksbio account.\n\n' +
                    'Please click on the following link, or paste this into your browser to verify your email:\n\n' +
                    'http://' + req.headers.host + '/auth/register/verify/' + token + '\n\n' +
                    'If you did not request this, please ignore this email.\n'
            };
            transporter.sendMail(mailOptions, function (err) {
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with a verification link.');
                done(err);
            });
            // done(null); // to be remove later.
        }
    ], function (err) {
        if(err) req.flash('Error trying to send a verification email, please contact us at contact@lnksbio.com.');
        res.redirect('/auth/login');
    })
});


// Verifies user account and redirects.
router.get("/register/verify/:token", async function (req, res) {
    await User.findOne({ verificationToken: req.params.token }).then(function (user) {
        if (!user) {
            req.flash('error', 'Email verification link is invalid, please try again or contct us at contact@lnksbio.com.');
            return res.redirect('/auth/register');
        }
        user.verified = true;
        user.verificationToken = undefined;
        user.save(function (err) {
            req.flash('success', 'Account verified, please login.');
            return res.redirect('/auth/login');
        });
    });
});



// Get forgot password page.
router.get('/forgot', filters.isNotAuthenticated, function (req, res) {
    res.render('pages/forgot', { title: 'Password Reset', user: false });
});


// Sends password reset email and sets up tokens and expiry date.
router.post('/forgot', function (req, res) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buff) {
                var token = buff.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email }).then(function (user) {
                if (user) {
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    user.save(function (err) {
                        done(err, token, user);
                    });
                } else {
                    done(true);
                }
            });
        },
        function (token, user, done) {
            if(user) {
                // nodemailer transporter
                const transporter = nodemailer.createTransport({
                    host: "mail.lnksbio.com",
                    port: 465,
                    secure: true, // use TLS
                    auth: {
                        user: keys.email.user,
                        pass: keys.email.pass
                    }
                });
    
                var mailOptions = {
                    to: user.email,
                    from: '"Lnksbio" <contact@lnksbio.com>',
                    subject: 'Lnksbio Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your Lnksbio account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/auth/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                transporter.sendMail(mailOptions, function(err) {
                    done(err);
                });
            }
        }
    ], function (err) {
        req.flash('success', "If we found an account associated with that username, we've sent password reset instructions to the primary email address on the account.");
        res.redirect('/auth/forgot');
    })
});


// Get password reset page or forgot password page..
router.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }).then(function (user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired, please request another one.');
            return res.redirect('/auth/forgot');
        }
        res.render('pages/reset', { title: 'Reset Password', user: req.user });
    });
});


// Resets password if token is valid.
router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }).then(async function (user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('/auth/forgot');
                }
                user.password = await bcrypt.hash(req.body.password, 10);
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                    req.logIn(user, function (err) {
                        done(err, user);
                    });
                });
            });
        },
        function (user, done) {
            // nodemailer transporter
            const transporter = nodemailer.createTransport({
                host: "mail.lnksbio.com",
                port: 465,
                secure: true, // use TLS
                auth: {
                    user: keys.email.user,
                    pass: keys.email.pass
                }
            });
            var mailOptions = {
                to: user.email,
                from: '"Lnksbio" <contact@lnksbio.com>',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your Lnksbio account ' + user.email + ' has just been changed.\n'
            };
            transporter.sendMail(mailOptions, function (err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/');
    })
});

module.exports = router;