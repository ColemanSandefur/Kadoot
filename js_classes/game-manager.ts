import {Game} from "./game";
import socket_io = require("socket.io");
import { DatabaseManager } from "./database-manager";
import {UserManager} from "./user-manager";

export class GameManager {
    private static games: Record<number, Game> = {};

    public static createGame(game_id: number, question_id: number){
        GameManager.games[game_id] = new Game(game_id, question_id, (callback: any) => {
            delete GameManager.games[game_id];
        });

        this.sleep(3600000).then(() => { //wait for an hour then delete
            delete GameManager.games[game_id];
        });
    }

    public static AddUser(cookie: string, username: string, game_id: number) {
        GameManager.games[game_id]?.addUser(cookie, username);
    }

    public static reconnectUser(socket: socket_io.Socket){
        let user_id = this.getUserId(socket.handshake.headers.cookie);

        if (user_id.length == 0){
            return;
        }

        let data = UserManager.getUserData(user_id);

        if (data == null){
            return;
        }

        let game_id: number = data.game_id;
        let leader: boolean = data.leader;

        if (GameManager.games[game_id] == null) {
            return;
        }

        if (leader == true) {
            GameManager.games[game_id]?.setHost(socket);
        } else {
            GameManager.games[game_id]?.reconnectUser(socket)
        }
    }

    private static getUserId(cookie: string): string{
        cookie += ";";
        let userIndex = cookie.indexOf("user_id=");
        return cookie.substring(userIndex + "user_id=".length, cookie.indexOf(";", userIndex));
    }

    static createGameId(): number{
        let output = "";
        for (let i = 0; i < 8; i++){
            output += Math.floor(Math.random() * 10);
        }
        return parseInt(output);
    }

    private static sleep(ms: number) {
        return new Promise((res, rej) => {
            setTimeout(res, ms);
        });
    }
}