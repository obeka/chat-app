const chatForm = document.querySelector("#chat-form");
const chatBoxContainer = document.querySelector(".chat-messages");
const userList = document.querySelector("#users");

//Get URl params with qs
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

socket.on("message", (message) => {
  console.log(message);
  outputMessage(message);
  chatBoxContainer.scrollTop = chatBoxContainer.scrollHeight;
});

//Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputUsers(users);
});

//Join chatroom
socket.emit("joinRoom", { username, room });
//Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const messageInput = e.target.elements.msg;
  //Emitting a message to the server
  socket.emit("chatMessage", messageInput.value.trim());
  messageInput.value = "";
  messageInput.value = "";
  messageInput.focus();
});

function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = ` <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
     ${message.text}
    </p>`;
  chatBoxContainer.appendChild(div);
}

//Add room name to dom
function outputUsers(users) {
  userList.innerHTML = `
${users.map((user) => `<li>${user.username}</li>`).join(" ")}
`;
}
