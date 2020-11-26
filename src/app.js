const express = require("express");
const path = require("path");
const hbs = require("hbs");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("../utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("../utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Paths
const publicDirectory = path.join(__dirname, "../public");
const viewPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

//To use static files
app.use(express.static(publicDirectory));

//Setting up the handlebars
app.set("view engine", "hbs");
app.set("views", viewPath);
hbs.registerPartials(partialsPath);

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/chat", (req, res) => {
  console.log(req.query);
  const { username, room } = req.query;
  res.render("chat", {
    username,
    room,
  });
});

io.on("connection", (socket) => {
  console.log("New WS Connection...");
  //Join room
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room); //database de buradan user oluşturup rooma ekleyebilirim
    socket.join(user.room);

    //Welcome current user
    socket.emit("message", formatMessage("Chat Bot", "Welcome to Chat!"));

    //Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage("Chat Bot", `${user.username} has joined the chat.`)
      );
      io.to(user.room).emit("roomUsers", {
        room: username.room,
        users: getRoomUsers(user.room),
      });
  });


  //Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    console.log(msg);
    const user = getCurrentUser(socket.id); //socket id den userı buldu
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //When user disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage("Chat Bot", `${user.username} user has left the chat.`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} .`);
});
