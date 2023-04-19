var express = require('express');
var router = express.Router();
var pool = require('database');
var session = require('express-session');

router.use(session({
    secret: 'chatAppSecret',
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: { maxAge: 60 * 60 * 1000 * 1 } // Session expires after 1 min of inactivity.
}));

/* GET home page. */
router.get('/', function (req, res, next) {
    if (req.session.loggedIn && !req.session.room_id) {
        console.log("Getting user information for room...");
        console.log(req.session);
        res.render('room', { name: req.session.fullname, title: 'Select room' });
    } else if (req.session.loggedIn && req.session.room_id) {
        res.redirect("/");
    } else {
        res.redirect("/signin");
    }
});

router.post('/enter', function (req, res, next) {
    let key = req.body.roomkey;
    if (key == "") {
        res.redirect("/room");
        return;
    } else {
        checkAndEnterRoom(key, req, res);
    }
});

router.post('/create', function (req, res, next) {
    let key = generateRandomString(6);
    pool.getConnection(function (err, conn) {
        conn.query('INSERT INTO `rooms`(`roomkey`) VALUES (?)', key, function (err, rows, fields) {
            if (err) {
                console.log(err.message);
                res.render('room', { roomErr: 'Unexpected error occurred please try again later' });
                return;
            }
        });
        conn.release();
        console.log('Connection has been released');
        if (err) {
            console.log(err.message);
            res.render('room', { roomErr: 'Something bad happened, please try again!' });
        }
    })
    res.render('room', { roomCreated: true, title: "Select room", roomKey: key });
    return;
});

function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function checkAndEnterRoom(key, req, res) {
    pool.getConnection(function (err, conn) {
        conn.query('SELECT * FROM rooms WHERE roomkey = ? ', key, function (err, rows, fields) {
            if (err) {
                console.log(err.message);
                res.render('room', { roomErr: 'Unexpected error occurred please try again later' });
                return;
            }
            if (rows.length == 0) {
                res.render('room', { roomErr: 'Room key is incorrect!', title: "Select room" });
                return;
            }
            req.session.roomKey = key;
            req.session.room_id = rows[0].id;
            res.redirect("/");
        });
        conn.release();
        console.log('Connection has been released');
        if (err) {
            console.log(err.message);
            res.render('room', { roomErr: 'Something bad happened, please try again!' });
        }
    })
}

router.get('/logout', (req, res) => {
    console.log("Clearing...");
    console.log(req.session);
    req.session.destroy();
    console.log("Logging out...");
    console.log(req.session);
    res.redirect("/signin");
});

module.exports = router;
