var express = require('express');
var router = express.Router();
var pool = require('database');
var session = require('express-session');
var fileUpload = require('express-fileupload');

router.use(fileUpload());

router.use(session({
  secret: 'chatAppSecret',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: { maxAge: 60 * 60 * 1000 * 1 } // Session expires after 1 min of inactivity.
}));

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.session.room_id) {
    res.render('index', { name: req.session.fullname, image: req.session.image_url, user_id: req.session.user_id, room: req.session.roomKey, title: 'ChatApp' });
  } else {
    res.redirect("/signin");
  }
});

router.post('/upload', function (req, res, next) {
  if (req.files && req.files.image) {
    const file = req.files.image;
    // Change the file name to user_id + original file extension
    const extension = file.name.split('.').pop();
    const newFileName = req.session.user_id + '.' + extension;
    file.mv('./public/images/' + newFileName, (err) => {
      if (err) console.log(err.message)
    });
    pool.getConnection(function (err, conn) {
      conn.query('UPDATE users SET image = ?, updated = NOW() WHERE id = ?', [newFileName, req.session.user_id], function (err, result) {
        if (err) {
          console.log(err.message);
        }
        res.redirect("/");
      });
      conn.release();
      if (err) {
        console.log(err.message);
      }
    });
  }
});

router.get('/logout', (req, res) => {
  console.log("Clearing...");
  console.log(req.session);
  req.session.destroy();
  console.log("Logging out...");
  console.log(req.session);
  res.redirect("/signin");
});

module.exports = router;
