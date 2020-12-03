const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    hasProfane: { type: String, required: false },
    sender: { type: String, required: true, ref: "User" },
    room: { type: String, required: true, ref: "Room" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
