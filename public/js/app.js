const chatForm = document.querySelector("#chat-form");
const chatBoxContainer = document.querySelector(".chat-messages");
const userList = document.querySelector("#users");

//Get URl params with qs
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

socket.on("message", (message) => {
  outputMessage(message);
  chatBoxContainer.scrollTop = chatBoxContainer.scrollHeight;
});

//Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputUsers(users);
});

//Join chatroom
socket.emit("joinRoom", { username, room });

socket.on("pastMessages", (pastMessagesArray) => {
  outputPastMessage(pastMessagesArray);
});
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
  div.innerHTML = ` <p class="message-header">${message.username} <span>${message.time}</span></p>
    <p class="text">
     ${message.text}
    </p>`;
  chatBoxContainer.appendChild(div);
}

chatBoxContainer.innerHTML = `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`;
function outputPastMessage(pastMessagesArray) {
  chatBoxContainer.innerHTML = "";
  pastMessagesArray.forEach((message) => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = ` <p class="message-header">${message.sender} <span>${moment(
      message.createdAt
    ).format("h:mm a")}</span></p>
      <p class="text">
       ${message.text}
      </p>`;
    chatBoxContainer.appendChild(div);
  });
}

//Add room name to dom
userList.innerHTML = `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`;
function outputUsers(users) {
  userList.innerHTML = `
${users.map((user) => `<li>${user}</li>`).join(" ")}
`;
}
