const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;


app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "public", "index.html");
});

io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
    socket.on("playerEvent", (data) => {
        io.emit("playerEvent", data);
        console.log(data);
    })
});

http.listen(PORT, () => console.log(`Listening on ${PORT}`));