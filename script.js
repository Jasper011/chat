const ws = new WebSocket(`wss://spotty-mango-ferry.glitch.me`);
let currentRoomId = null;
let roomUpdateInterval;

ws.onopen = function () {
    roomUpdateInterval = setInterval(() => {
        if (!currentRoomId) {
            ws.send(JSON.stringify({ type: "getRooms" }));
        }
    }, 3000);
};

document.getElementById("create-room").addEventListener("click", () => {
    const roomId = document.getElementById("room-id").value.trim();
    if (roomId) {
        ws.send(JSON.stringify({ type: "createRoom", roomId }));
    }
});

document.getElementById("leave-room").addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "leaveRoom" }));
    clearMessages();
});

document.getElementById("send-message").addEventListener("click", () => {
    const message = document.getElementById("message-input").value.trim();
    if (message && currentRoomId) {
        ws.send(JSON.stringify({ type: "sendMessage", roomId: currentRoomId, message }));
        document.getElementById("message-input").value = "";
    }
});

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
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
        li.textContent = `Room ID: ${room.roomId} (${room.participants} participants)`;
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
