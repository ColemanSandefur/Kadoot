import {DatabaseManager} from "./database-manager";
import bcrypt = require("bcrypt");
import SocketIO = require("socket.io");

export class AccountManager {
    static createAccount(username: string, password: string, email: string) {
        return new Promise((res, rej) => {
            bcrypt.hash(password, 12).then((passhash) => {
                console.log([password, passhash]);
                // DatabaseManager.dbQuery("INSERT INTO accounts (username, passhash, email) VALUES (?, ?, ?)", [username, passhash, email]);
                res();
            })
        });
    }

    static validCredentials(username: string, password: string) {
        return new Promise((res, rej) => {
            DatabaseManager.dbQuery("SELECT * FROM accounts WHERE username=?", [username]).then((accounts) => {
                if (accounts.length == 0) {
                    res(false);
                    return;
                }

                bcrypt.compare(password, accounts[0].passhash).then((matches) => {
                    if (matches) {
                        res(true);
                        return;
                    }
                    res(false);
                });
            });
        });
    }

    static signIn(username: string, password: string): Promise<String | null> {
        return new Promise((res, rej) => {
            DatabaseManager.dbQuery("SELECT * FROM accounts WHERE username=?", [username]).then((accounts) => {
                if (accounts.length == 0) {
                    res(null);
                    return;
                }

                bcrypt.compare(password, accounts[0].passhash).then((matches) => {
                    if (!matches){
                        res(null);
                        return;
                    }

                    let cookie: string;

                    do {
                        cookie = this.createCookie(64);
                    } while (this.account_cookies[cookie] != null);
                    
                    this.account_cookies[cookie] = {username: username, premium: accounts[0].premium};

                    res(cookie);
                });
            });
        });
    }

    static createCookie(len: number) {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let cookie = "";
        let running = true;

        while (running) {
            for (let i = 0; i < len; i++) {
                cookie += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            if (this.account_cookies[cookie] == null){
                running = false;
            } else {
                cookie = "";
            }
        }

        return cookie;
    }

    private static account_cookies: {[cookie: string]: {username: string, premium: boolean}} = {};

    static getAccountData(cookie?: string){
        if (cookie)
            return this.account_cookies[cookie];
        
        return this.account_cookies;
    }

    static reconnectUser(socket: SocketIO.Socket) {
        let account_id = this.getAccountId(socket.handshake.headers.cookie);
    }

    static getAccountId(cookie: string): string{
        cookie += ";";
        let userIndex = cookie.indexOf("account_id=");
        return cookie.substring(userIndex + "account_id=".length, cookie.indexOf(";", userIndex));
    }
}