import {DatabaseManager} from "./database-manager";
import bcrypt = require("bcrypt");

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

    static signIn(username: string, password: string) {
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
}