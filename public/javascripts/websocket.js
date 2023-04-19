document.addEventListener("DOMContentLoaded", (e) => {
    let btn = document.querySelector("#sendMsg");
    var msg = document.querySelector('#msg');
    var user_id = document.querySelector('.user_id').getAttribute("id");
    var roomKey = document.querySelector('#roomkey').innerText;
    var socket = io.connect(window.location.origin, { query: 'roomKey=' + roomKey });
    btn.addEventListener("click", sendMsg);

    msg.addEventListener("keydown", (e) => {
        if (e.keyCode === 13) {
            sendMsg();
        }
    });

    socket.on('message', (msg, sender_id, name, image, date) => {
        showMessage(msg, sender_id, name, image, date);
    })

    socket.on('messages', (rows) => {
        rows.forEach(el => {
            showMessage(el.msg, el.user_id, el.fullname, el.image, setDate(el.senton));
        });
    })

    function sendMsg() {
        msg = document.querySelector('#msg');
        if (!msg.value) {
            return;
        }
        socket.emit('message', msg.value, user_id, getDate());
        msg.value = '';
        msg.focus();
        return;
    }

    function showMessage(msg, sender_id, name, imageName, date) {
        let messages = document.querySelector('.msg-container');
        let image = document.querySelector('#profile-img').getAttribute("src");
        let myMsg = `<div class="msg-row">
            <div class="msg-right">
                <p class="alert alert-info">
                    <span class="msg-name">You
                        <span class="msg-time">${date}</span>
                    </span>
                    <span class="msg-text">${msg}</span>
                </p>
                <img class="rounded-circle border" src='${image}' width='40' height='40' alt='Logo' />
            </div>
        </div>`;
        let receivedMsg = `<div class="msg-row">
            <div class="msg-left">
                <img class="rounded-circle border" src='images/${imageName}' width='40' height='40' alt='Logo' />
                <p class="alert alert-success">
                    <span class="msg-name">${name}
                        <span class="msg-time">${date}</span>
                    </span>
                    <span class="msg-text">${msg}</span>
                </p>
            </div>
        </div>`;
        messages.innerHTML += user_id == sender_id ? myMsg : receivedMsg;
        messages.scrollTop = messages.scrollHeight;
    }

    function getDate() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const formattedDate = `${dd}.${mm}.${yyyy} ${hh}:${min}:${ss}`;
        return formattedDate;
    }
    function setDate(date) {
        const now = new Date(date);
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const formattedDate = `${dd}.${mm}.${yyyy} ${hh}:${min}:${ss}`;
        return formattedDate;
    }
})