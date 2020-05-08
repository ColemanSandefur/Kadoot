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

server.listen(25565, () => {
    console.log("Listening on port *3000");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/join", (req, res) => {
    res.sendFile(__dirname + "/join.html");
});

app.get("/join/id=:id", (req, res) => {
    res.sendFile(__dirname + "/join.html");
});

app.post("/join", (req, res) => {
    let username = (<string>req.body.username).substr(0, 32);
    let game_id = Number.parseInt((<string>req.body.game_id).substr(0, 8));

    if (username == null || username.trim().length == 0 || game_id == null || game_id +"".trim.length == 0){
        res.redirect("/join");
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

    let data = AccountManager.getAccountData(AccountManager.getAccountId(req.headers.cookie + ";"));

    fs.readFile(__dirname + "/game-creator.html", (err, html) => {
        if (data != null) {
            res.send(ejs.render(html.toString(), {signedin: true}));
            return;
        }

        res.redirect("/sign-in/error=Please sign in to continue");
    });
});

/* This is where the quizzes are started */
app.post("/game-creator", (req, res) => {
    let question_id = req.body.game_id;

    let account_id = AccountManager.getAccountId(req.headers.cookie + ";");
    if (AccountManager.getAccountData(account_id) == undefined) {
        res.redirect("/sign-in/error=Please sign in to continue");
        return;
    }
    
    if (question_id == null || question_id + "".trim().length == 0){
        res.redirect("/game-creator");
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
    let cookie = AccountManager.getAccountId(req.headers.cookie + ";");
    if (cookie.length == 0 || AccountManager.getAccountData(cookie) == undefined) {
        res.redirect("/sign-in/error=Please sign in to continue");
    }
    res.sendFile(__dirname + "/quiz-creator.html");
});

/* This is wehre the quizzes are created and saved */
app.post("/quiz-creator", (req, res) => {
    res.redirect("/game-creator");
    let dat = <[string, string[], number[], number][]>JSON.parse(req.body["game-data"]);
    let cookie = AccountManager.getAccountId(req.headers.cookie + ";");

    if (AccountManager.getAccountData(cookie) == undefined){
        res.redirect("/sign-in/error=Please sign in to continue");
        return
    }

    res.redirect("/game-creator");

    let accountData = <{username: string, premium: boolean, id: number}>AccountManager.getAccountData(cookie);
    QuestionManager.saveQuiz(req.body["quiz-name-input"], accountData.username, accountData.id, dat);
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
});

/* This is where the user gets signed in */
app.post("/sign-in", (req, res) => {
    AccountManager.signIn(req.body.username, req.body.password).then((cookie) => {
        if (cookie == null) {
            res.redirect("/sign-in/error=Wrong username or password");
            return;
        }
        
        res.cookie("account_id", cookie);
        res.redirect("/game-creator");
    });
});

/* Logs users out when they go to /logout */
app.get("/logout", (req, res) => {
    AccountManager.deleteAccountCookie(AccountManager.getAccountId(req.headers.cookie + ";"));

    res.redirect("/");
});

app.get("/create-account", (req, res) => {
    fs.readFile(__dirname + "/account-creator.html", (err, html) => {
        res.send(ejs.render(html.toString()));
    });
});

/* gives user error message in html document using ejs */
app.get("/create-account/error=:error", (req, res) => {
    fs.readFile(__dirname + "/account-creator.html", (err, html) => {
        res.send(ejs.render(html.toString(), {error: req.params["error"]}));
    });
});

app.post("/create-account", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let passwordConf = req.body.passwordConf;
    let email = req.body.email;

    if (username.trim.length == 0 || password.trim.length == 0 || passwordConf.trim.length == 0 || email.trim.length == 0) {
        res.redirect("/create-account/error=A field wasn't entered");
        return;
    }

    let credentialsUsed = await AccountManager.credentialsUsed(username, email);

    if (credentialsUsed == true) {
        res.redirect("/create-account/error=Username or email used");
        return;
    }

    if (password != passwordConf) {
        res.redirect("/create-account/error=Passwords don't match");
        return;
    }

    AccountManager.createAccount(username, password, email).then((success) => {
        if (success) {
            res.redirect("/sign-in");
        } else {
            res.redirect("/create-account/error=An error has occurred");
        }
    });
})

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
        res.redirect("/join");
        return;
    } else if (linkData.host == false) {
        console.log("not host");
        res.redirect("/join");
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