var mysql = require('mysql');
var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "chatroom",
    port: 3306,
});

pool.getConnection(function (err, connection) {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Connection established!');
});

module.exports = pool;