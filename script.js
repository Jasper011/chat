console.log('client is runnig');

let serverLink = 'wss://spotty-mango-ferry.glitch.me'
let serverData 

try {
   const serverResp = await fetch('http://192.168.56.1:4000/', {
    method: "GET",
    mode: "cors"
  });
    serverData = await serverResp.text();
} catch(e) {
    console.warn(e);
}


if(serverData == 1) {
    serverLink = 'ws://192.168.56.1:4000'
}

console.log('final sever link is ' + serverLink);

const ws = new WebSocket(serverLink);
let currentRoomId = null;

ws.onopen = function () {
    ws.send(JSON.stringify({ type: "getRooms" }));
    init()
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);
    switch (data.type) {
        case "message":
            if (data.roomId === currentRoomId) {
                addMessage(data.message);
            }
            break;

        case "roomCreated":
            currentRoomId = data.roomId;
            clearMessages();
            document.getElementById("chat").style.display = "block";

            if (data.messages) {
                data.messages.forEach(msg => addMessage(msg.message));
            }
            break;

        case "roomJoined":
            currentRoomId = data.roomId;
            clearMessages();
            document.getElementById("chat").style.display = "block";

            if (data.messages) {
                data.messages.forEach(msg => addMessage(msg.message));
            }
            break;

        case "roomList":
            console.log(data);
            console.log(data.rooms);
            
            displayRooms(data.rooms);
            break;

        case "leftRoom":
            currentRoomId = null;
            document.getElementById("chat").style.display = "none";
            break;

        case "roomDeleted":
            console.log(`Room "${data.roomId}" has been deleted.`);
            if (currentRoomId === data.roomId) {
                currentRoomId = null;
                document.getElementById("chat").style.display = "none";
                clearMessages();
            }
            break;
    }
};

function addMessage(message) {
    const messages = document.getElementById("messages");
    const div = document.createElement("div");
    div.textContent = message;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function clearMessages() {
    document.getElementById("messages").innerHTML = "";
}

function displayRooms(rooms) {
    const roomList = document.getElementById("rooms");
    roomList.innerHTML = "";
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.textContent = `Room ID: ${room.roomId}`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
            ws.send(JSON.stringify({ type: "joinRoom", roomId: room.roomId }));
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.style.marginLeft = "10px";
        deleteButton.addEventListener("click", () => {
            ws.send(JSON.stringify({ type: "deleteRoom", roomId: room.roomId }));
            document.getElementById("chat").style.display = "none";
            ws.send(JSON.stringify({ type: "getRooms" }));
        });

        li.append(deleteButton);
        roomList.append(li);
    });
}

function init() {
    document.getElementById("create-room").addEventListener("click", () => {
        ws.send(JSON.stringify({ type: "getRooms" }));
        const roomId = document.getElementById("room-id").value.trim();
        if (roomId) {
            ws.send(JSON.stringify({ type: "createRoom", roomId }));
        } else {
            console.log()("Please enter a room ID");
        }
    });
    
    document.getElementById("send-message").addEventListener("click", () => {
        ws.send(JSON.stringify({ type: "getRooms" }));
        const messageInput = document.getElementById("message-input");
        const message = messageInput.value.trim();
        if (message && currentRoomId) {
            ws.send(JSON.stringify({ type: "sendMessage", roomId: currentRoomId, message: message }));
            messageInput.value = "";
        } else {
            console.log()("Cannot send an empty message or you are not in a room");
        }
    });
    
    document.getElementById("leave-room").addEventListener("click", () => {
        ws.send(JSON.stringify({ type: "getRooms" }));
        if (currentRoomId) {
            ws.send(JSON.stringify({ type: "leaveRoom", roomId: currentRoomId }));
            currentRoomId = null;
            document.getElementById("chat").style.display = "none";
            clearMessages();
        } else {
            console.log("You are not in a room");
        }
    });
    
}