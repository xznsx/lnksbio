const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const methodOverride = require('method-override');
const flash = require('express-flash');
const cookiesession = require('cookie-session');
const keys = require('./config/keys');
const authRoutes = require('./routes/auth-routes');
const lnkRoutes = require('./routes/lnk-routes');
const accountRoutes = require('./routes/settings-routes');

const filters = require('./filters/auth-filters');

const passportSetup = require('./config/passport-setup');

const Lnk = require('./models/lnk');

const app = express();

mongoose.connect(keys.mongodb.dbURI, {
    useNewUrlParser: true, useUnifiedTopology: true 
});
mongoose.connection.once('open', function() {
    console.log('Successfully connected to DB.');
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(cookiesession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey]
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(flash());

// Order mmatters ( /:username must be last )
app.use('/auth', authRoutes);
app.use('/settings', accountRoutes);
app.use('/', lnkRoutes);

app.get('/', function (req, res) {
    res.redirect('/home');
});
// Handeling every other route (eg: /account/trolololo return 404 )
app.use(function (req, res, next) {
    req.flash('error', 'Error 404 page not found');
    res.render('pages/profile', {title: 'Error page not found', user: (req.user ? true: false), lnks: false});
});

port = 5000;
app.listen(port, function() {
    console.log(`Listening on port : ${port}`)
})