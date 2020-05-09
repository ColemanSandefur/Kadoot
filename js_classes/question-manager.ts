import {DatabaseManager, RowPacket} from "./database-manager";
import { stringify } from "querystring";

export interface Question {
    question: string;
    choices: string[];
    answer_index: number[];
}

export class QuestionManager{
    private author: string;
    private name: string;
    private questions: [string, string[], number[], number][];
    private cur_question: number = 0;

    constructor(author: string, name: string, question: [string, string[], number[], number][]){
        this.author = author;
        this.name = name;
        this.questions = question;
    }

    public getCurQuestion(): [string, string[], number[], number] {
        return this.questions[this.cur_question];
    }

    public getNumQuestions(): number {
        return this.questions.length;
    }

    public curQuestionIndex(): number {
        return this.cur_question;
    }

    public nextQuestion() {
        this.cur_question++;
    }

    public gradeQuestion(input: {[cookie: string]: {response: number, time: number}}) {
        let output: string[] = [];

        let question = this.questions[this.cur_question];

        for (let cookie in input){
            for (let i = 0; i < question[2].length; i++){
                if (question[2][i] == input[cookie].response){
                    output.push(cookie);
                    break;
                }
            }
        }

        return output;
    }

    public static loadQuiz(quiz_id: number): Promise<QuestionManager> {
        return new Promise((res, rej) => {
            DatabaseManager.dbQuery("SELECT * FROM quizzes WHERE id=?", [quiz_id]).then((raw_dat) => {
                let dat = raw_dat[0];

                let game_name = dat.game_name;
                let author_name = dat.author_name;

                this.loadQuestions(quiz_id).then((questions) => {
                    let quiz = questions;
                    res(new QuestionManager(author_name, game_name, quiz));
                });
            });
        });
    }

    private static loadQuestions(quiz_id: number): Promise<[string, string[], number[], number][]> {
        return new Promise((res, rej) => {
            DatabaseManager.dbQuery("SELECT * FROM questions WHERE quiz_id=?", [quiz_id]).then((raw_dat) => {
                let questions: [string, string[], number[], number][] = [];
    
                for (let i = 0; i < raw_dat.length; i++){
                    let question = raw_dat[i];
    
                    questions.push([question.question, JSON.parse(question.choices), JSON.parse(question.answers), question.question_time]);
                }
    
                res(questions);
            });
        });
    }

    public static searchQuiz(query: string): Promise<RowPacket[]> {
        return new Promise((res, rej) => {
            let data = this.makeRegex(query);
            DatabaseManager.dbQuery("SELECT * FROM quizzes WHERE id LIKE ? AND game_name LIKE ?", [data[0], data[1]]).then((data) => {
                res(data);
            });
        });
    }

    public static saveQuiz(game_name: string, author_name: string, account_id: number, questions: [string, string[], number[], number][]) {
        if (game_name.length > 128) {
            game_name = game_name.substr(0, 128);
        }
        if (author_name.length > 64) {
            author_name = author_name.substr(0, 64);
        }

        for (let i = 0; i < questions.length; i++){ //remove any questions that have an empty title or have no answers with text in
            let question = questions[i];

            if (questions.length == 0){
                break;
            }

            if (question[0].trim().length == 0) {
                questions.splice(i,1);
                i--;
                continue;
            } 

            if (question[1].length > 4) {
                question[1].splice(4);
            }

            let allEmpty = true;

            for (let j = 0; j < question[1].length; j++){
                if (question[1][j].trim().length > 0){
                    allEmpty = false;
                    break;
                }
            }

            if (allEmpty){
                questions.splice(i, 1);
                i--;
                continue;
            }

            if ((question[3] + "").length == 0){
                question[3] = 10;
            } else if (question[3] > 300) {
                question[3] = 300;
            } else if (question[3] < 5) {
                question[3] = 5;
            }
        }

        //Don't insert any quizes that don't have a name or any questions
        if (game_name.trim().length == 0 || questions.length == 0){
            return;
        }

        DatabaseManager.dbQuery("INSERT INTO quizzes (game_name, author_name, account_id) VALUES (?, ?, account_id)", [game_name, author_name, account_id]).then((data) => {
            let quiz_id = (<any>data).insertId;

            for (let i = 0; i < questions.length; i++){
                let question = questions[i];
                
                if (question[0].length > 256) {
                    question[0] = question[0].substr(0, 256);
                }

                for (let i = 0; i < question[1].length; i++){
                    if (question[1][i].length > 60){
                        question[1][i] = question[1][i].substr(0, 60);
                    }
                }
                DatabaseManager.dbQuery("INSERT INTO questions (quiz_id, question, choices, answers, question_time) VALUES (?, ?, ?, ?, ?)", [quiz_id, question[0], JSON.stringify(question[1]), JSON.stringify(question[2]), question[3]]);
            }
        })
    }

    private static makeRegex(query: string) {
        var name = "";
        var id = "";

        if (query.indexOf("#") > -1){
            name = "%" + query.substring(0, query.indexOf("#")) + "%";

            const regex = /#([0-9]+)/;
            let reg_return = query.match(regex);
    
            if (reg_return != null)
                id = reg_return[1];
        } else {
            name = query;
        }

        if (name.length > 0){
            name = "%" + name + "%";
        } else {
            name = "%";
        }

        if (id.length > 0){
            id = "%" + id + "%";
        } else {
            id = "%";
        }

        return [id, name];
    }
}

