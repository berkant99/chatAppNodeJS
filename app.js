var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require("http");
var socketio = require("socket.io");
var pool = require('database');
var app = express();

var indexRouter = require('./routes/index');
var signInRouter = require('./routes/signin');
var signUpRouter = require('./routes/signup');
var roomRouter = require('./routes/room');

// Create the http server
const server = http.createServer(app);

// Create the Socket IO server on
// the top of http server
const io = socketio(server);

io.on('connection', (socket) => {
  pool.getConnection(function (err, conn) {
    console.log("room key => " + socket.handshake.query.roomKey);
    let roomKey = socket.handshake.query.roomKey;
    socket.join(roomKey);
    conn.query("SELECT * FROM rooms WHERE roomKey = ?", roomKey,
      function (err, rows, fields) {
        if (err) {
          console.log(err.message);
        }
        var room_id = rows[0].id;
        console.log("room id => " + room_id);

        conn.query(`SELECT m.msg, m.user_id, m.senton, CONCAT(u.firstname," ",u.lastname) AS fullname, u.image FROM messages m
    JOIN users u ON m.user_id = u.id
    JOIN rooms r ON m.room_id = r.id WHERE r.roomkey = ? ORDER BY m.senton ASC`, roomKey,
          function (err, rows, fields) {
            if (err) {
              console.log(err.message);
            }
            if (rows.length == 0) {
              msg = 'An error occurred';
            }
            io.sockets.in(roomKey).emit('messages', rows);
          });

        socket.on('message', (msg, user_id, date) => {
          conn.query('SELECT * FROM users WHERE id = ?', user_id, function (err, rows, fields) {
            if (err) {
              console.log(err.message);
            }
            let fullName = rows[0].firstname + " " + rows[0].lastname;
            let imageName = rows[0].image;
            io.sockets.in(roomKey).emit('message', msg, user_id, fullName, imageName, date);
          });

          conn.query('INSERT INTO `messages`(`user_id`,`room_id`, `msg`, `senton`) VALUES (?, ?, ?, NOW())', [user_id, room_id, msg], function (err, rows, fields) {
            if (err) {
              console.log(err.message);
            }
          });
        });
      });
    conn.release();
    console.log('Connection has been released');
    if (err) {
      console.log(err.message);
    }
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/chat', indexRouter);
app.use('/home', indexRouter);
app.use('/signin', signInRouter);
app.use('/login', signInRouter);
app.use('/signup', signUpRouter);
app.use('/register', signUpRouter);
app.use('/room', roomRouter);
app.use('/select', roomRouter);
app.use('/choose', roomRouter);
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = { app: app, server: server };
