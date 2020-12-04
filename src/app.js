const express = require("express");
const path = require("path");
const hbs = require("hbs");
const http = require("http");
const moment = require("moment");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const formatMessage = require("../utils/messages");
const User = require("../models/user");
const Message = require("../models/message");
const Room = require("../models/room");
const message = require("../models/message");
const Filter = require("bad-words"),
  filter = new Filter({ placeHolder: "🤬" });
const groupByTime = require("group-by-time");

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
  const { username, room } = req.query;
  res.render("chat", {
    username,
    room,
  });
});

io.on("connection", (socket) => {
  console.log("New WS Connection...");
  //Join room
  socket.on("joinRoom", async ({ username, room }) => {
    let newUser;
    try {
      newUser = new User({
        socketId: socket.id,
        username,
        room,
      });
      await newUser.save();
    } catch (error) {
      console.log(error);
    }
    let currentRoom;
    try {
      const roomToBeEntered = await Room.findOne({ roomName: room });
      if (roomToBeEntered) {
        currentRoom = roomToBeEntered;
        currentRoom.users.push(newUser.username);
        await currentRoom.save();
      } else {
        currentRoom = Room({
          roomName: room,
        });
        currentRoom.users.push(newUser.username);
        await currentRoom.save();
      }
    } catch (error) {
      console.log(error);
    }
    socket.join(newUser.room);

    let pastMessages;

    try {
      pastMessages = await Room.findOne({ roomName: room }).populate(
        "messages"
      );
    } catch (error) {
      console.log(error);
    }

    let filteredPastMessages = pastMessages.messages.map((message) => {
      if (message.hasProfane) {
        return { ...message._doc, text: filter.clean(message.text) };
      } else {
        return message;
      }
    });


    let groupedByDay = groupByTime(filteredPastMessages, "createdAt", "day");
    //console.log(groupedByDay);

    socket.emit("pastMessages", groupedByDay);

    //Welcome current user
    socket.emit("message", formatMessage("Chat Bot", "Welcome to Chat!"));

    socket.on("typing", (data) => {
      if (data.typing == true) io.emit("display", data);
      else io.emit("display", data);
    });

    //Broadcast when a user connects
    socket.broadcast
      .to(newUser.room)
      .emit(
        "message",
        formatMessage("Chat Bot", `${newUser.username} has joined the chat.`)
      );

    io.to(newUser.room).emit("roomUsers", {
      room: newUser.room,
      users: currentRoom.users,
    });
  });

  //Listen for chatMessage
  socket.on("chatMessage", async (msg) => {
    let user;
    try {
      user = await User.findOne({ socketId: socket.id });
    } catch (error) {
      console.log(error);
    }
    let message;
    if (msg.latitude) {
      message = new Message({
        room: user.room,
        sender: user.username,
        text: `<a href="https://www.google.com/maps?q=${msg.latitude},${msg.longitude}" target="_blank">My location.</a>`,
      });
    } else {
      let isProfane = filter.isProfane(msg);
      message = new Message({
        room: user.room,
        sender: user.username,
        text: msg,
        hasProfane: isProfane,
      });
    }

    try {
      await message.save();
    } catch (error) {
      console.log(error);
    }

    try {
      let currentRoom = await Room.findOne({ roomName: user.room });
      currentRoom.messages.push(message);
      await currentRoom.save();
    } catch (error) {
      console.log(error);
    }

    if (msg.latitude) {
      io.to(user.room).emit(
        "message",
        formatMessage(
          user.username,
          `<a href="https://www.google.com/maps?q=${msg.latitude},${msg.longitude}" target="_blank">My location.</a>`
        )
      );
    } else {
      io.to(user.room).emit("message", {
        username: message.sender,
        text: filter.clean(message.text),
        time: moment().format("h:mm a"),
      });
    }
  });

  //When user disconnects
  socket.on("disconnect", async () => {
    // const user = userLeave(socket.id);
    const user = await User.findOne({ socketId: socket.id });
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage("Chat Bot", `${user.username} has left the chat.`)
      );
      let currentRoom;
      try {
        currentRoom = await Room.findOne({ roomName: user.room });
        currentRoom.users.pull(user.username);
        await currentRoom.save();
      } catch (error) {
        console.log(error);
      }
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: currentRoom.users,
      });
    }
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.f6uwe.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }
  )
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log("Server is running!");
    });
  })
  .catch((err) => {
    console.log("error", err);
  });
