import socket_io = require("socket.io");
import {GameManager} from "./game-manager";
import {QuestionManager} from "./question-manager";
import { AccountManager } from "./account-manager";
import { DatabaseManager } from "./database-manager";

export class SocketManager {
    static addListeners(socket: socket_io.Socket){
        AccountManager.reconnectUser(socket);
        GameManager.reconnectUser(socket);

        //When a socket wants to search for games it emits "search-games"
        //Gets what the user is searching for and returns it through a callback
        socket.on("search-games", (input, callback) => {
            QuestionManager.searchQuiz(input).then((dat) => {
                let arr = [];

                for (let i = 0; i < dat.length; i++){
                    arr.push([dat[i].game_name, dat[i].id]);
                }
                callback(arr);
            });
        });

        socket.on("get-my-quizzes", (callback) => {
            console.log("hi");
            DatabaseManager.dbQuery("SELECT * FROM quizzes WHERE account_id=?", [AccountManager.getAccountData(AccountManager.getAccountId(socket.handshake.headers.cookie)).id]).then((dat) => {
                let arr = [];

                for (let i = 0; i < dat.length; i++){
                    arr.push([dat[i].game_name, dat[i].id]);
                }

                callback(arr);
            })
        });

        socket.on("get-account-info", (callback) => {
            DatabaseManager.dbQuery("SELECT username, email, date, premium FROM accounts WHERE id=?", [AccountManager.getAccountData(AccountManager.getAccountId(socket.handshake.headers.cookie)).id]).then((dat) => {
                if (dat.length == 0) {
                    callback();
                }
                callback(dat[0]);
            })
        });
    }
}