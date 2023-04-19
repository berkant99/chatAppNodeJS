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

/* GET Sign In page. */
router.get('/', function (req, res, next) {
  if (!req.session.loggedIn) {
    res.render('signin', { title: 'Sign In', val: "" });
  } else {
    res.redirect('/room');
  }
});

router.post('/', function (req, res, next) {
  let data = req.body;
  for (const property in data) {
    if (data[property] == "") {
      res.render('signin', { signinErr: 'All fields are required!', val: data });
      return;
    }
  }
  let newUserData = JSON.parse(JSON.stringify(data))
  checkAndLogin(newUserData, req, res);
});

function checkAndLogin(data, req, res) {
  pool.getConnection(function (err, conn) {
    conn.query('SELECT * FROM users WHERE email = ? ', data.email, function (err, rows, fields) {
      if (err) {
        console.log(err.message);
        res.render('signin', { signinErr: 'Unexpected error occurred please try again later', val: "" });
      }
      if (rows.length == 0) {
        res.render('signin', { signinErr: 'Username or password is incorrect!', val: data });
        return;
      }
      if (!passwordHash.verify(data.password, rows[0].password)) {
        res.render('signin', { signinErr: 'Username or password is incorrect!', val: data });
        return;
      }
      req.session.loggedIn = true;
      req.session.user_id = rows[0].id;
      let fullName = rows[0].firstname + " " + rows[0].lastname;
      let imageURL = 'images/' + rows[0].image;
      req.session.fullname = fullName;
      req.session.image_url = imageURL;
      res.redirect("/room");
    });
    conn.release();
    console.log('Connection has been released');
    if (err) {
      console.log(err.message);
      res.render('signin', { signinErr: 'Something bad happened, please try again!', val: "" });
    }
  })
}

module.exports = router;
