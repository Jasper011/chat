import myIp from "./nodeJS/myIP.json" with { type: 'json' };

console.log(myIp);
console.log(myIp.data.ip);


console.log('client is runnig');

let serverLink = 'wss://spotty-mango-ferry.glitch.me'
let serverData; 

try {
   const serverResp = await fetch('http://'+myIp.data.ip+':4000/check', {
    method: "GET",
    mode: "cors"
  });
    serverData = await serverResp.text();
} catch(e) {
    console.warn(e);
}


if(serverData == 1) {
    console.log('You has local server ONLINE!');
    
    serverLink = 'ws://'+myIp.data.ip+':4000'
}

console.log('final sever link is ' + serverLink);

const ws = new WebSocket(serverLink);
let currentRoomId = null;

ws.onopen = function () {
    ws.send(JSON.stringify({ type: "getRooms", data:{} }));
    init()
};

ws.onmessage = (event) => {
    const type = JSON.parse(event.data).type;
    const data = JSON.parse(event.data).data;
    console.log(type, data);
    
    switch (type) {
        case "message":
            if (data.roomId === currentRoomId) {
                console.log('message get');
                addMessage(data.message, data.sender);
            }
            break;
        case "roomCreated":
            console.log(data.roomLink);
            
            currentRoomId = data.roomId;
            clearMessages();
            document.getElementById("chat").style.display = "block";
            if (data.messages) {
                data.messages.forEach(msg => addMessage(msg.message, msg.sender));
            }
            break;

        case "roomJoined":
            currentRoomId = data.roomId;
            clearMessages();
            document.getElementById("chat").style.display = "block";

            if (data.messages) {
                data.messages.forEach(msg => addMessage(msg.message, msg.sender));
            }
            break;

        case "roomList":
            displayRooms(data.rooms);
            break;

        case "leftRoom":
            currentRoomId = null;
            document.getElementById("chat").style.display = "none";
            break;

        case "roomDeleted":
            if (currentRoomId === data.roomId) {
                currentRoomId = null;
                document.getElementById("chat").style.display = "none";
                clearMessages();
            }
            break;
    }
};

function addMessage(message, sender) {
    const messages = document.getElementById("messages");
    const div = document.createElement("div");
    div.textContent = sender + ': ' + message;
    messages.append(div);
    messages.scrollTop = messages.scrollHeight;
}

function clearMessages() {
    document.getElementById("messages").innerHTML = "";
}

function displayRooms(roomsId) {
    const roomList = document.getElementById("rooms");
    roomList.innerHTML = "";
    roomsId.forEach((roomId) => {
        const li = document.createElement("li");
        li.textContent = `Room ID: ${roomId}`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
            ws.send(JSON.stringify({ type: "joinRoom", data:{roomId} }));
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.style.marginLeft = "10px";
        deleteButton.addEventListener("click", () => {
            ws.send(JSON.stringify({ type: "deleteRoom", data:{ roomId }}));
            document.getElementById("chat").style.display = "none";
            ws.send(JSON.stringify({ type: "getRooms", data: {} }));
        });

        li.append(deleteButton);
        roomList.append(li);
    });
}

function init() {
    const nickname = localStorage.getItem('nickname')
    ws.nickname = nickname
    document.getElementById("nickname").value = nickname

    document.getElementById("create-room").addEventListener("click", () => {
        if (!ws.nickname){
            alert("You need to write your nickname");
            return
        }
        ws.send(JSON.stringify({ type: "getRooms", data:{} }));
        const roomId = document.getElementById("room-id").value.trim();
        const originLink = window.location.origin + '/game/'
        if (roomId) {
            ws.send(JSON.stringify({ type: "createRoom", data: {roomId, originLink} }));
        } else {
            console.log("Please enter a room ID");
        }
    });
    
    document.getElementById("send-message").addEventListener("click", () => {
        if (!ws.nickname){
            alert("You need to write your nickname");
            return
        }
        const messageInput = document.getElementById("message-input");
        const message = messageInput.value.trim();
        if (message && currentRoomId) {
            ws.send(JSON.stringify({ type: "sendMessage", data: {roomId: currentRoomId, message: message, sender: ws.nickname} }));
            messageInput.value = "";
        } else {
            console.log("Cannot send an empty message or you are not in a room");
        }
    });
    
    document.getElementById("leave-room").addEventListener("click", () => {
        ws.send(JSON.stringify({ type: "getRooms", data:{} }));
        if (currentRoomId) {
            ws.send(JSON.stringify({ type: "leaveRoom", data: {roomId: currentRoomId} }));
            currentRoomId = null;
            document.getElementById("chat").style.display = "none";
            clearMessages();
        } else {
            console.log("You are not in a room");
        }
    });

    document.getElementById("change-name").addEventListener("click", ()=>{
        const nickname = document.getElementById("nickname").value.trim()
        if (nickname) {
            ws.nickname = nickname
            localStorage.setItem('nickname', nickname)
        } else {
            alert("You need to write your nickname");
        }
    })
    
}