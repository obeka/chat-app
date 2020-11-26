const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  room:  { type: String, required: true },
  socketId:  { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);