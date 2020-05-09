import mysql = require("mysql");
import { QuestionManager } from "./question-manager";

const pingDelayMs = 1 * 60 * 60 * 1000;

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: ""
});

con.connect((err) => {
    if (err) {
        throw err
    };
    
    console.log("Connected to the database server!");
});

// Ping once every pingDelayMs to keep connection alive
setInterval(function() {
    con.ping();
}, pingDelayMs) ;

export class DatabaseManager{
    private static con = con;

    static initializeDatabase() {
        this.dbQuery("CREATE DATABASE IF NOT EXISTS kadoot_data").then(() => {

            con.changeUser({database: "kadoot_data"}, (err) => {
                if (err) throw err;
                this.dbQuery("CREATE TABLE IF NOT EXISTS `questions` (`id` int NOT NULL AUTO_INCREMENT,`quiz_id` int DEFAULT NULL,`question_number` int DEFAULT NULL,`question` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,`choices` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,`answers` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, `question_time` int NOT NULL DEFAULT '10', PRIMARY KEY (`id`), UNIQUE KEY `id` (`id`)) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                this.dbQuery("CREATE TABLE IF NOT EXISTS `quizzes` (`id` int NOT NULL AUTO_INCREMENT,`game_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,`author_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, `account_id` int unsigned NOT NULL, UNIQUE KEY `id` (`id`)) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                this.dbQuery("CREATE TABLE IF NOT EXISTS `accounts` (`id` int unsigned NOT NULL AUTO_INCREMENT,`username` varchar(64) NOT NULL,`passhash` varchar(64) NOT NULL,`email` varchar(128) NOT NULL,`date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,`premium` tinyint NOT NULL DEFAULT '0',PRIMARY KEY (`id`),UNIQUE KEY `id_UNIQUE` (`id`),UNIQUE KEY `username_UNIQUE` (`username`),UNIQUE KEY `email_UNIQUE` (`email`),UNIQUE KEY `passhash_UNIQUE` (`passhash`)) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci")
                console.log("connected to the kadoot_data database");
            });
        });
    }

    static dbQuery(query: string, data?: any[]): Promise<RowPacket[]> {
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