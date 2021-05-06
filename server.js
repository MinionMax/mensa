const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const vidSearch = require("ytsr");
const listSearch = require("ytpl");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "public", "index.html");
});

app.get("/session/:id", (req, res) => {
    res.cookie("sessionId", req.params.id, {maxAge: 5259600000});
    res.redirect("/");
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

    socket.on("queueEvent", async (data) =>{
        if(!data.playlist){

            var res = await vidSearch(data.url);
            var title = res.items[0].title;
            var id = res.items[0].id

            var queue = { id: id, title: title }
            io.to(data.room).emit("enqueueEvent", queue);
            console.log("enqueued: " + queue);

        } else if(data.playlist){

            var res = await listSearch(data.url);
            var queue = [];

            for(var i = 0; i < res.items.length; i++){
                var id = res.items[i].id;
                var title = res.items[i].title;

                queue.push({ id: id, title: title})
            }

            io.to(data.room).emit("enqueueEvent", queue);
            console.log("enqueued playlist" + queue[1]);

        }
    });

    socket.on("disconnect", () => {
        console.log("a user disconnected");
    });
});

http.listen(PORT, () => console.log(`Listening on ${PORT}...`));