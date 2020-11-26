const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  users: [{ type: String, required: true, ref: "User" }],
  messages: [{ type: mongoose.Types.ObjectId, required: true, ref: "Message" }],
});

module.exports = mongoose.model("Room", roomSchema);
