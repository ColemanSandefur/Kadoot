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