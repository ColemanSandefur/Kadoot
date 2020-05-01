//Main Imports
import express = require('express');
const app: express.Application = express();
import http = require("http");
const server = http.createServer(app);
import path = require("path");
import bodyParser = require("body-parser");
import socket_io = require("socket.io");
const io = socket_io(server);
import bcrypt = require("bcrypt");
import fs = require("fs");
import ejs = require("ejs");

//Adding directories
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "static")));

//Import my classes
import {SocketManager} from "./js_classes/socket-manager";
import {DatabaseManager} from "./js_classes/database-manager";
import {QuestionManager} from "./js_classes/question-manager";
import { GameManager } from './js_classes/game-manager';
import { UserManager } from './js_classes/user-manager';
import { LinkManager } from "./js_classes/link-manager";
import { AccountManager } from "./js_classes/account-manager";

DatabaseManager.initializeDatabase();

server.listen(3000, () => {
    console.log("Listening on port *3000");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/id=:id", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
    let username = (<string>req.body.username).substr(0, 32);
    let game_id = Number.parseInt((<string>req.body.game_id).substr(0, 8));

    if (username == null || username.trim().length == 0 || game_id == null || game_id +"".trim.length == 0){
        res.redirect("/");
        return;
    }
    
    let cookie = UserManager.createCookie(32);
    res.cookie("user_id", cookie);
    UserManager.setUserData(cookie, game_id, false);
    GameManager.AddUser(cookie, username, game_id);
    res.redirect("/game");
});

app.get("/game", (req, res) => {
    res.sendFile(__dirname + "/game.html");
})

app.get("/game-creator", (req, res) => {
    res.sendFile(__dirname + "/game-creator.html");
});

/* This is where the quizzes are created */
app.post("/game-creator", (req, res) => {
    let question_id = req.body.game_id;

    let account_id = AccountManager.getAccountId(req.headers.cookie + ";");
    console.log(AccountManager.getAccountData(account_id));
    if (AccountManager.getAccountData(account_id) == undefined) {
        res.redirect("/sign-in/error=Please sign in to continue");
        return;
    }
    
    if (question_id == null || question_id + "".trim().length == 0){
        res.redirect("/game-creator.html");
        return;
    }

    let game_id = GameManager.createGameId();
    GameManager.createGame(game_id, question_id);

    let cookie = UserManager.createCookie(32);
    res.cookie("user_id", cookie);
    UserManager.setUserData(cookie, game_id, true);
    res.set("game_id", "" + game_id);
    res.redirect("/admin-game");
});

app.get("/admin-game", (req, res) => {
    res.sendFile(__dirname + "/admin-game.html");
})

/* This is where the quizzes are started */
app.post("/admin-game", (req, res) => {
    res.redirect("/run-game");
});

app.post("/run-game", (req, res) => {
    res.sendFile(__dirname + "/run-game.html");
});

app.get("/run-game", (req, res) => {
    res.sendFile(__dirname + "/run-game.html");
})

app.get("/quiz-creator", (req, res) => {
    res.sendFile(__dirname + "/quiz-creator.html");
});

/* This is wehre the quizzes are created and saved */
app.post("/quiz-creator", (req, res) => {
    res.redirect("/game-creator");
    let dat = <[string, string[], number[], number][]>JSON.parse(req.body["game-data"]);
    QuestionManager.saveQuiz(req.body["quiz-name-input"], req.body["author-name-input"], dat);
});

app.get("/sign-in", (req, res) => {
    fs.readFile(__dirname + "/sign-in.html", (err, html) => {
        res.send(ejs.render(html.toString()));
    })
});

app.get("/sign-in/error=:error", (req, res) => {
    fs.readFile(__dirname + "/sign-in.html", (err, html) => {
        res.send(ejs.render(html.toString(), {error: req.params["error"]}));
    });
})

/* This is where the user gets signed in */
app.post("/sign-in", (req, res) => {
    AccountManager.signIn(req.body.username, req.body.password).then((cookie) => {
        if (cookie == null) {
            res.redirect("/sign-in/error=Wrong username or password");
            return;
        }
        
        res.cookie("account_id", cookie);
        console.log(AccountManager.getAccountData());
        res.redirect("/game-creator");
    });
});

app.post("/remote-game-creator", (req, res) => {
    let question_id = req.body.question_id;
    
    if (question_id == null || question_id + "".trim().length == 0){
        res.send("error");
        return;
    }

    let game_id = GameManager.createGameId();
    GameManager.createGame(game_id, question_id);
    
    let admin_link = LinkManager.createNewLink(game_id, true, true);

    res.send(JSON.stringify([`localhost:3000/admin-game/${admin_link}`, `localhost:3000/id=${game_id}`]));
});

app.get("/admin-game/:oneTimeCode", (req, res) => {
    let oneTimeCode = req.params["oneTimeCode"];

    let linkData = LinkManager.getLinkData(oneTimeCode);

    if (linkData == null){
        res.redirect("/");
        return;
    } else if (linkData.host == false) {
        console.log("not host");
        res.redirect("/");
        return;
    }

    let game_id = linkData.game_id;

    let cookie = UserManager.createCookie(32);
    res.cookie("user_id", cookie);
    UserManager.setUserData(cookie, game_id, true);
    res.set("game_id", "" + game_id);
    res.redirect("/admin-game");

    if (linkData.oneTime) {
        LinkManager.deleteLink(oneTimeCode);
    } else {
        sleep(3600000).then(() => {
            LinkManager.deleteLink(oneTimeCode);
        });
    }
});

function sleep(ms: number) {
    return new Promise((res, rej) => {
        setTimeout(res, ms);
    });
}

io.on("connection", (socket) => {
    SocketManager.addListeners(socket);
});