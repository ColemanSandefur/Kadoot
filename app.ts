//Main Imports
import express = require('express');
const app: express.Application = express();
import http = require("http");
const server = http.createServer(app);
import path = require("path");
import bodyParser = require("body-parser");
import socket_io = require("socket.io");
const io = socket_io(server);

//Adding directories
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "static")));

//Import my classes
import {SocketManager} from "./js_classes/socket-manager";
import {DatabaseManager} from "./js_classes/database-manager";
import {QuestionManager} from "./js_classes/question-manager";
import { GameManager } from './js_classes/game-manager';

DatabaseManager.dbQuery("DELETE FROM users", []);
// QuestionManager.saveQuiz("Best Quiz", "Author", '["What year did OBD2 get legaly mandated in the U.S.", ["1994", "1999", "1986", "1982"], [0]],["What is the sin(30)", ["sqrt(2)/2", "1/2", "Undfined", "sqrt(3)/2"], [1]],["What is your favorite color", ["#ff0000", "#00ff00", "#00000ff", "#ffffff"], []],["What question number is this?", ["1", "2", "3", "4"], [3]],["What is the scala equivalent of switch?", ["val","future","match","case"], [2]],["Which C function will allocate memory for an array or struct?", ["free()", "malloc()", "new()", "create()"], [1]],["What question number is this?", ["5", "6", "7", "8"], [2]],["What is Integer.MAX_VALUE?", ["2147483647", "2147483648","2147483646", "-2147483648"], [0]],["Which of these vehicles was available with a boxer 4 cylinder engine? (H4)", ["Honda Civic", "Subaru Forester", "Honda Spree", "Toyota 86"], [1,3]]');
// DatabaseManager.dbQuery("UPDATE quizes SET questions=? WHERE id=6", ['[["What year did OBD2 get legaly mandated in the U.S.", ["1994", "1999", "1986", "1982"], [0]],["What is the sin(30)", ["sqrt(2)/2", "1/2", "Undfined", "sqrt(3)/2"], [1]],["What is your favorite color", ["#ff0000", "#00ff00", "#00000ff", "#ffffff"], []],["What question number is this?", ["1", "2", "3", "4"], [3]],["What is the scala equivalent of switch?", ["val","future","match","case"], [2]],["Which C function will allocate memory for an array or struct?", ["free()", "malloc()", "new()", "create()"], [1]],["What question number is this?", ["5", "6", "7", "8"], [2]],["What is Integer.MAX_VALUE?", ["2147483647", "2147483648","2147483646", "-2147483648"], [0]],["Which of these vehicles was available with a boxer 4 cylinder engine? (H4)", ["Honda Civic", "Subaru Forester", "Honda Spree", "Toyota 86"], [1,3]]]'])
// '["What year did OBD2 get legaly mandated in the U.S.", ["1994", "1999", "1986", "1982"], [0]],["What is the sin(30)", ["sqrt(2)/2", "1/2", "Undfined", "sqrt(3)/2"], [1]],["What is your favorite color", ["#ff0000", "#00ff00", "#00000ff", "#ffffff"], []],["What question number is this?", ["1", "2", "3", "4"], [3]],["What is the scala equivalent of switch?", ["val","future","match","case"], [2]],["Which C function will allocate memory for an array or struct?", ["free()", "malloc()", "new()", "create()"], [1]],["What question number is this?", ["5", "6", "7", "8"], [2]],["What is Integer.MAX_VALUE?", ["2147483647", "2147483648","2147483646", "-2147483648"], [0]],["Which of these vehicles was available with a boxer 4 cylinder engine? (H4)", ["Honda Civic", "Subaru Forester", "Honda Spree", "Toyota 86"], [1,3]]'

server.listen(3000, () => {
    console.log("Listening on port *3000");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
    let username = <string>req.body.username;
    let game_id = req.body.game_id;

    if (username == null || username.trim().length == 0 || game_id == null || game_id +"".trim.length == 0){
        res.redirect("/");
        return;
    }
    
    DatabaseManager.createCookie(32).then((cookie) => {
        res.cookie("user_id", cookie);
        DatabaseManager.addCookie(cookie, username, game_id, false).then(() => {
            GameManager.AddUser(cookie, username, game_id);
            res.redirect("/game");
        });
    });
});

app.get("/game", (req, res) => {
    res.sendFile(__dirname + "/game.html");
})

app.get("/game-creator", (req, res) => {
    res.sendFile(__dirname + "/game-creator.html");
});

app.post("/game-creator", (req, res) => {
    let question_id = req.body.game_id;
    
    if (question_id == null || question_id + "".trim().length == 0){
        res.redirect("/game-creator.html");
        return;
    }

    let game_id = GameManager.createGameId();
    GameManager.createGame(game_id, question_id);

    DatabaseManager.createCookie(32).then((cookie) => {
        res.cookie("user_id", cookie);
        DatabaseManager.addCookie(cookie, null, game_id, true).then(() => {
            res.set("game_id", "" + game_id);
            res.redirect("/admin-game");
        });
    });
});

app.get("/admin-game", (req, res) => {
    res.sendFile(__dirname + "/admin-game.html");
})

app.post("/admin-game", (req, res) => {
    res.redirect("/run-game");
});

app.post("/run-game", (req, res) => {
    res.sendFile(__dirname + "/run-game.html");
});

app.get("/run-game", (req, res) => {
    res.sendFile(__dirname + "/run-game.html");
})

io.on("connection", (socket) => {
    SocketManager.addListeners(socket);
});