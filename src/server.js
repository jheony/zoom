import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();      //서버 생성

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

const sockets = [];

wss.on("connection", (socket) => {                                      //웹과 연결
    console.log("Connection to Browser");
    sockets.push(socket);                                               //메시지 저장
    socket["nickname"] = "Anonymous"                                    //익명 설정
    socket.on("close", ()=> console.log("Disconnected from Browser"));  //웹 종료//메시지 출력
    socket.on("message", (msg) => {          
        const message = JSON.parse(msg);                       
        switch(message.type){                                           //닉네임 or 메시지 구분
            case "new_message":
                sockets.forEach(aSocket => aSocket.send(`${socket.nickname}:${message.payload}`));
                break;                                                  //"닉네임: 메시지" 출력
            case "nickname":
                socket["nickname"] = message.payload;
                break;
        }
    });
})
server.listen(3000, handleListen);