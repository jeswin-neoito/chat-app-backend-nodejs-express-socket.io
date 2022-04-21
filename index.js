const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
const userModel = require("./models/userModel");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Hello chat app");
});

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

global.onlineUsers = new Map();
const online = [];
io.on("connection", async (socket) => {
  // console.log(">>>>>", global.onlineUsers);
  global.chatSocket = socket;
  socket.on("add-user", async (userId) => {
    onlineUsers.set(userId, socket.id);
    const user = await userModel.find({ _id: userId });
    online.push(user);
    io.emit("online-users", user);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    // console.log(":::::", data.to);
    if (sendUserSocket) {
      // console.log("send message", sendUserSocket, data, data.msg);
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
