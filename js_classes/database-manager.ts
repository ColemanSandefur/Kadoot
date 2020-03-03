import mysql = require("mysql");
import { QuestionManager } from "./question-manager";

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "kadoot_data"
});

con.connect((err) => {
    if (err) throw err;
    console.log("Connected to the database!");
});

export class DatabaseManager{
    private static con = con;

    static addCookie(cookie: string, username: string | null, game_id: number, host: boolean){
        return new Promise((res, rej) => {
            this.dbQuery("INSERT INTO users (cookie, username, game_id, leader) VALUES (?, ?, ?, ?)", [cookie, username, game_id, host]).then((dat) => {
                res();
            });
        });
    }

    static getCookieData(cookie: string): Promise<RowPacket[]> {
        return new Promise((res, rej) => {
            this.dbQuery("SELECT * FROM users WHERE cookie=?",[cookie]).then((dat) => {
                res(dat);
            });
        });
    }

    static createCookie(len: number): Promise<string> {
        return new Promise((res, rej) => {
            createCookie(len).then((cookie) => {
                res(cookie);
            });
        });
    }

    static dbQuery(query: string, data: any[]): Promise<RowPacket[]> {
        return new Promise(function (res, rej) {
            DatabaseManager.con.query(query, data, function (err, result) {
                if (err) rej(err);
                else res(result);
            });
        });
    }
}

export interface RowPacket {
    [key: string]: any;
}

async function createCookie(len: number): Promise<string> {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let cookie = "";
    let running = true;
    while (running){
        for (let i = 0; i < len; i++){
            cookie += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        await DatabaseManager.getCookieData(cookie).then((dat) => {
            if (dat.length == 0){
                running = false;
            }
        });
    }
    return cookie;
}