const User = require('../models/user');
const user = require('../models/user');

function isNotAuthenticated(req, res, next) {
    if(req.user) {
        res.redirect('/');
    } else {
        next();
    }
}

function isAuthenticated(req, res, next) {
    if(!req.user) {
        req.flash('error', 'You tried to access a protected page, please login first.');
        res.redirect('/auth/login');
    } else {
        next();
    }
}

async function usernameAvailable(req, res, next) {
    await User.findOne({username: req.body.username}).then(function(user) {
        if(user) {
            req.flash('error', 'Username already exists');
            return res.redirect('/auth/register');
        } else {
            next();
        }
    });
}

async function emailAvailable(req, res, next) {
    await User.findOne({email: req.body.email}).then(function(user) {
        if(user) {
            req.flash('error', 'Email already exists');
            return res.redirect('/auth/register');
        } else {
            next();
        }
    });
}

// TODO(Mounib): Try and combine this with code in top, this is very stupid redundant code.
// Also hardcoded redirected ? WTF MAN.
async function usernameAvailableSettings(req, res, next) {
    await User.findOne({username: req.body.username}).then(function(user) {
        if(user) {
            if(user.username == req.user.username) {
                return next();
            }
            req.flash('profileError', 'Username already exists');
            return res.redirect('/settings');
        } else {
            next();
        }
    });
}

async function emailAvailableSettings(req, res, next) {
    await User.findOne({email: req.body.email}).then(function(user) {
        if(user) {
            if(user.email == req.user.email) {
                return next();
            }
            req.flash('profileError', 'Email already exists');
            return res.redirect('/settings');
        } else {
            next();
        }
    });
}

function emailToLowerCase(req, res, next) {
    req.body.email = req.body.email.toLowerCase();
    next();
}



module.exports = {
    isNotAuthenticated: isNotAuthenticated,
    isAuthenticated: isAuthenticated,
    usernameAvailable: usernameAvailable,
    emailAvailable: emailAvailable,
    usernameAvailableSettings: usernameAvailableSettings,
    emailAvailableSettings: emailAvailableSettings,
    emailToLowerCase: emailToLowerCase
}