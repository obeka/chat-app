const chatForm = document.querySelector("#chat-form");
const chatBoxContainer = document.querySelector(".chat-messages");
const userList = document.querySelector("#users");
const msgInput = document.querySelector("#msg");
const locationBtn = document.querySelector("#location");

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
socket.on("roomUsers", ({ users }) => {
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
  document.querySelector(".typing").innerHTML = "";
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
    div.innerHTML = ` <p class="message-header">${
      message.sender
    } <span>${moment(message.createdAt).format("h:mm a")}</span></p>
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
${users
  .map((user) => `<li>${user}</li>`)
  .join(" ")}
`;
}

//Typing effect
let typing = false;
let timeout = undefined;

function typingTimeout() {
  (typing = false), socket.emit("typing", { username, typing: false });
}

msgInput.addEventListener("keydown", (e) => {
  if (e.which !== 13) {
    typing = true;
    socket.emit("typing", { username, typing: true });
    clearTimeout(timeout);
    timeout = setTimeout(typingTimeout, 1200);
  } else {
    typingTimeout()
    document.querySelector(".typing").innerHTML = "";  }
});

socket.on("display", (data) => {
  if (data.typing == true) {
    document.querySelector(".typing").innerHTML = `${data.username} is typing...`;
  } else {
    document.querySelector(".typing").innerHTML = "";
  }
});

//Send location
locationBtn.addEventListener("click", e => {
  if(!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.")
  }
  navigator.geolocation.getCurrentPosition(position => {
    console.log(position);
    socket.emit("chatMessage", {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
  })
})