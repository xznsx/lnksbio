const https = require('https');

const router = require('express').Router();
const bcrypt = require('bcrypt');
const filters = require('../filters/auth-filters')

const Lnk = require('../models/lnk');
const User = require('../models/user');
const { resolve } = require('path');
const { rejects } = require('assert');
const { facebookAPIKey } = require('../config/keys');

// Facebook API Changed.
async function getThumbnail(postURL, thumbnail_url) {
    APIURL = "https://graph.facebook.com/v8.0/instagram_oembed?url=" + postURL + "&fields=thumbnail_url&access_token=" + facebookAPIKey.appId + "|" + facebookAPIKey.APIToken;

    let req_call = new Promise((resolve, reject) => {
        https.get(APIURL,
            (res) => {
                let body = "";
                res.on("data", (chunk) => body += chunk);

                res.on("end", () => {
                    try {
                        let json = JSON.parse(body);
                        resolve(json['thumbnail_url']);
                    } catch (err) {
                        reject(err);
                    }
                });
            }
        );
    });

    return req_call.then(res => {
        return res;
    }).catch((error) => {
        console.log(error);
    });
}

// Creates a Lnk
router.post('/lnk', filters.isAuthenticated, async function (req, res) {
    var thumbnail_url = await getThumbnail(req.body.postURL, thumbnail_url);
    console.log(thumbnail_url);
    await Lnk.create({ userid: req.user.id, link: req.body.linkURL, post: req.body.postURL, thumbnail_url: thumbnail_url }, function (err, lnk) {
        if (err) {
            req.flash('error', 'Could not create Lnk, please try again.')
            res.redirect('/');
        } else {
            req.flash('success', 'Lnk Created');
            res.redirect('/');
        }
    });

});

// Gets individual Lnk's page
router.get('/lnk/:lnkid', filters.isAuthenticated, async function (req, res) {
    const lnk = await Lnk.findOne({ _id: req.params.lnkid });
    res.render('pages/lnk', { title: 'Lnk', user: req.user, lnk: lnk });
})

// Update a Lnk
router.post('/lnk/:lnkid', filters.isAuthenticated, function (req, res) {
    Lnk.updateOne({ _id: req.params.lnkid }, {
        link: req.body.linkURL, post: req.body.postURL
    }, function (err, lnk) {
        if (!err) {
            req.flash('success', 'Lnk updated.');
            return res.redirect(`/lnk/${req.params.lnkid}`);
        } else {
            req.flash('error', 'Could not update Lnk, please try again.');
            return res.redirect(`/lnk/${req.params.lnkid}`);
        }
    })
});

// Delete a Lnk
router.delete('/lnk/:lnkid', filters.isAuthenticated, function (req, res) {
    //TODO(Mounib): Not handling error at all. VERY STUPID.
    Lnk.findOneAndDelete({ _id: req.params.lnkid }, function (lnk) {
        req.flash('success', 'Lnk deleted.')
        return res.redirect('/home');
    });
});


// Get's currently logged in lnks.
router.get('/home', filters.isAuthenticated, async function (req, res) {
    lnks = await Lnk.find({ userid: req.user.id }).sort({ _id: -1 });
    res.render('pages/home', { title: null, user: req.user, lnks: lnks });
});


// Get's a user lnks
router.get('/:username', async function (req, res) {
    await User.findOne({ username: req.params.username }).then(async function (user) {
        if (user) {
            if (req.user) {
                if (req.user.username == req.params.username) return res.redirect('/home');
            }
            const lnks = await Lnk.find({ userid: user.id }).sort({ _id: -1 });
            res.render('pages/profile', { title: user.displayname, user: req.user, lnks: lnks });
        } else {
            req.flash('error', 'User not found');
            res.render('pages/profile', { title: 'User not found', user: (req.user ? true : false), lnks: null });
        }
    });
});

module.exports = router;