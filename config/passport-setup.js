const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local');

const User = require('../models/user');

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id).then(function(user) {
        done(null, user);
    });
});

passport.use(new LocalStrategy(
    {
        usernameField: 'email',
    },
    function(email, password, done) {
        User.findOne({email: email}).then(async function(currentUser) {
            if(!currentUser) {
                return done(null, false, { message: 'No user with that email, please sign in.' });
            }
            try {
                if(currentUser.password) {
                    if(await bcrypt.compare(password, currentUser.password)) {
                        if(currentUser.verified) {
                            return  done(null, currentUser);
                        } else {
                            return done(null, false, {message: 'Please verify your email.'})
                        }
                    } else {
                        return done(null, false, { message : 'Password Incorrect.'})
                    }
                } else {
                    // TODO(Mounib): User does not have a password.
                }
            } catch(e) {
                done(e);
            }
        });
    }
));
