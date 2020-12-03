//import {formatDate} from "./formatDate"
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
function outputPastMessage(pastMessagesObj) {
  chatBoxContainer.innerHTML = "";
  
  //Iterate over pastMessageObj which contains messages array under date properties
  for (let messageDate in pastMessagesObj) {
    const relativeDate = moment(Number(messageDate))
      .calendar()
      .split(" ")[0];
    const dateSection =
      relativeDate === "Today" || relativeDate === "Yesterday"
        ? relativeDate
        : moment(Number(messageDate)).format("LL"); //Today, yesterday or date format
    const divDate = document.createElement("div");
    divDate.innerHTML = `<p class="date-section">
     <span>${dateSection}</span>
    </p>`;
    chatBoxContainer.appendChild(divDate);

    //Here, I use array method to display the messages that sent in a specific date(messageDate)
    pastMessagesObj[messageDate].forEach((message) => {
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = ` <p class="message-header">${
        message.sender
      }  <span>${moment(message.createdAt).format("h:mm a")}</span></p>
        <p class="text">
         ${message.text}
        </p>`;
      chatBoxContainer.appendChild(div);
    });
  }
  /*   pastMessagesArray.forEach((message) => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = ` <p class="message-header">${message._doc.sender}  <span>${moment(message._doc.createdAt).format("h:mm a")}</span></p>
      <p class="text">
       ${message.text}
      </p>`;
    chatBoxContainer.appendChild(div);
  }); */
}

//Add room name to dom
userList.innerHTML = `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`;
function outputUsers(users) {
  userList.innerHTML = `
${users.map((user) => `<li>${user}</li>`).join(" ")}
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
    typingTimeout();
    document.querySelector(".typing").innerHTML = "";
  }
});

socket.on("display", (data) => {
  if (data.typing == true) {
    document.querySelector(
      ".typing"
    ).innerHTML = `${data.username} is typing...`;
  } else {
    document.querySelector(".typing").innerHTML = "";
  }
});

//Send location
locationBtn.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position);
    socket.emit("chatMessage", {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  });
});

//Format Date
function renderDate(date) {
  console.log(new Date(date));
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (new Date(date).toLocaleDateString() == today.toLocaleDateString()) {
    return "Today";
  } else if (
    new Date(date).toLocaleDateString() == yesterday.toLocaleDateString()
  ) {
    return "Yesterday";
  }
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
  });
}
