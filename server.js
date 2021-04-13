const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const cookieParser = require("cookie-parser");
const ytdl = require("ytdl-core");
const rawBody = require("raw-body");
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "public", "index.html");
})

app.get("/session/:id", (req, res) => {
    res.cookie("sessionId", req.params.id, {maxAge: 5259600000});
    res.redirect("/");
})

app.get("/video/:id", (req, res) => {
    var range = req.headers.range;
    if(!range) return res.status(400).send("Range header missing");

    var baseUrl = "https://www.youtube.com/watch?v=";
    var video = ytdl(baseUrl + req.params.id);
    const videoSize = rawBody(video, (err, buffer) => {
        if(err) return next(err);
        return buffer.length;
    })

    const CHUNK_SIZE = 10 ** 6 //1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start} - ${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4"
    };
    res.writeHead(206, headers);

    const videoStream = ytdl(baseUrl + req.params.id, { start, end });
    videoStream.pipe(res);
})

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("joinEvent", (data) => {
        socket.join(data);
        console.log("user joined the room: " + data);
    });

    socket.on("leaveEvent", (data) => {
        socket.leave(data);
        console.log("user left the room: " + data);
    })

    socket.on("playerEvent", (data) => {
        io.to(data.room).emit("playerEvent", data);
        console.log(data);
    });

    socket.on("submitEvent", (data) => {
        io.to(data.room).emit("loadEvent", data);
        console.log(data);
    });

    socket.on("disconnect", () => {
        console.log("a user disconnected");
    });
});

http.listen(PORT, () => console.log(`Listening on ${PORT}...`));