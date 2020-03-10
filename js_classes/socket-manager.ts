import socket_io = require("socket.io");
import {GameManager} from "./game-manager";
import {QuestionManager} from "./question-manager";

export class SocketManager {
    static addListeners(socket: socket_io.Socket){
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
    }
}