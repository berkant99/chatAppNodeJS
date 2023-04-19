var express = require('express');
var pool = require('database');
var passwordHash = require('password-hash');
var session = require('express-session');
var router = express.Router();

router.use(session({
    secret: 'chatAppSecret',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: { maxAge: 60 * 60 * 1000 * 1 } // Session expires after 1 min of inactivity.
}));

/* GET Sign Up page. */
router.get('/', function (req, res, next) {
    if (!req.session.loggedIn) {
        res.render('signup', { title: 'Sign Up', val: "" });
    } else {
        res.redirect("/");
    }
});

router.post('/', function (req, res, next) {
    let data = req.body;
    for (const property in data) {
        if (data[property] == "") {
            res.render('signup', { signupErr: 'All fields are required!', val: data });
            return;
        }
    }
    if (!/^[a-zA-Z]+$/.test(data.firstname)) {
        res.render('signup', { signupErr: 'Firstname can only contain letters', val: data });
        return;
    }
    if (!/^[a-zA-Z]+$/.test(data.lastname)) {
        res.render('signup', { signupErr: 'Lastname can only contain letters', val: data });
        return;
    }
    if (!isEmail(data.email)) {
        res.render('signup', { signupErr: 'Email you have entered is not valid', val: data });
        return;
    }
    if (data.password.length < 8) {
        res.render('signup', { signupErr: 'Password must contain at least 8 characters', val: data });
        return;
    }

    data.password = passwordHash.generate(data.password);
    let newUserData = JSON.parse(JSON.stringify(data))
    saveData(newUserData, res);
});

function saveData(data, res) {
    pool.getConnection(function (err, conn) {
        conn.query('SELECT COUNT(*) AS count FROM users WHERE email = ?', data.email, function (err, result) {
            if (err) {
                console.log(err.message);
                res.render('signup', { signupErr: 'Unexpected error occurred please try again later', val: "" });
            } else {
                if (Number(result[0].count) > 0) {
                    res.render('signup', { signupErr: 'Unexpected error occurred please try again', val: "" });
                } else {
                    conn.query('INSERT INTO users SET ?', data, function (err, result) {
                        if (err) {
                            console.log(err.message);
                            res.render('signup', { signupErr: 'Unexpected error occurred please try again later', val: "" });
                        } else {
                            res.render('signup', { signupSuccess: 'You have signed up successfully', val: "" });
                        }
                    });
                }
            }
        });
        conn.release();
        if (err) {
            console.log(err.message);
            res.render('signup', { signupErr: 'Something bad happened, please be patient!', val: "" });
        }
    });
}

function isEmail(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

module.exports = router;

