const ws = new WebSocket(`wss://chatserver-i35t.onrender.com`);
let currentRoomId = null;
const clientId = localStorage.getItem("clientId") || generateClientId();
localStorage.setItem("clientId", clientId);
let roomUpdateInterval;
ws.onopen = () => {
    ws.send(JSON.stringify({ type: "setClientId", clientId }));
    ws.send(JSON.stringify({ type: "getRooms" }));
    roomUpdateInterval = setInterval(() => {
        if (!currentRoomId) {
            ws.send(JSON.stringify({ type: "getRooms" }));
        }
    }, 10000);
};

document.getElementById("create-room").addEventListener("click", () => {
    const roomId = document.getElementById("room-id").value.trim();
    if (roomId) {
        ws.send(JSON.stringify({ type: "createRoom", roomId }));
        ws.send(JSON.stringify({ type: "getRooms" }));
    }
});

document.getElementById("leave-room").addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "leaveRoom" }));
});

document.getElementById("send-message").addEventListener("click", () => {
    const message = document.getElementById("message-input").value.trim();
    if (message && currentRoomId) {
        ws.send(JSON.stringify({ type: "sendMessage", roomId: currentRoomId, message }));
        addMessage(`You: ${message}`);
        document.getElementById("message-input").value = "";
    }
});

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case "roomCreated":
            currentRoomId = data.roomId;
            console.log(`Room "${currentRoomId}" created!`);
            document.getElementById("chat").style.display = "block";
            break;

        case "roomJoined":
            currentRoomId = data.roomId;
            console.log(`Joined room "${currentRoomId}"!`);
            document.getElementById("chat").style.display = "block";
            clearInterval(roomUpdateInterval);
            break;

        case "roomList":
            displayRooms(data.rooms);
            break;

        case "leftRoom":
            currentRoomId = null;
            document.getElementById("chat").style.display = "none";
            console.log("You have left the room.");
            break;

        case "roomDeleted":
            console.log(`Room "${data.roomId}" has been deleted.`);
            break;

        case "message":
            addMessage(data.message);
            break;

        default:
            console.error("Unknown message type:", data.type);
    }
};

function addMessage(message) {
    const messages = document.getElementById("messages");
    const div = document.createElement("div");
    div.textContent = message;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function displayRooms(rooms) {
    const roomList = document.getElementById("rooms");
    roomList.innerHTML = "";
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.textContent = `Room ID: ${room.roomId} (${room.participants} participants)`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
            if (!room.isOwner) {
                ws.send(JSON.stringify({ type: "joinRoom", roomId: room.roomId }));
            }
        });
        if (room.isOwner) {
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.style.marginLeft = "10px";
            deleteButton.addEventListener("click", () => {
                ws.send(JSON.stringify({ type: "deleteRoom", roomId: room.roomId }));
                document.getElementById("chat").style.display = "none";
                ws.send(JSON.stringify({ type: "getRooms" }));
            });
            li.appendChild(deleteButton);
        }
        roomList.appendChild(li);
    });
}

function generateClientId() {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}