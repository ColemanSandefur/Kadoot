import socket_io = require("socket.io");
import {QuestionManager} from "./question-manager";

export class Game {
    private host:socket_io.Socket | null = null;
    private game_id: number;
    private quiz_id: number;
    private user_sockets: {[cookie: string]: socket_io.Socket}= {}
    private user_data:  {[cookie: string]: {name: string, score: number}} = {};
    private user_response: {[cookie: string]: number} = {};
    private quiz: QuestionManager | null = null;
    private correct_point_val = 100;
    private cur_question_number: number = -1;
    
    constructor(game_id: number, quiz_id: number){
        this.game_id = game_id;
        this.quiz_id = quiz_id;
        QuestionManager.loadQuiz(quiz_id).then((quiz) => {
            this.quiz = quiz;
        });
    }

    public setHost(socket:socket_io.Socket):void {
        this.host = socket;

        //host socket listeners
        socket.on("disconnection", () => {
            this.host = null;
        });

        socket.emit("give-game-id", this.game_id);

        socket.on("start-game", () => {
            if (this.quiz == null){
                this.host?.emit("game-wait");
                return;
            } 
            if (this.cur_question_number != -1) {
                console.log("game already started");
                
                return;
            }

            this.cur_question_number = 0;
            this.startQuestion();
        });

        socket.on("finish-question", () => {
            this.stopQuestion();
        });

        socket.on("next-question", () => {
            if (this.quiz && this.cur_question_number == this.quiz.curQuestionIndex()){
                console.log("stopping question");
                this.stopQuestion();
                return;
            }
            if (this.quiz && this.cur_question_number > this.quiz.curQuestionIndex()){
                console.log("next question");
                this.quiz?.nextQuestion();
            } if (this.quiz?.getNumQuestions() == this.quiz?.curQuestionIndex()){
                console.log("game finished");
                this.finalResults();
                return;
            }

            this.startQuestion();
        });
    }

    public startQuestion(){
        console.log("starting question");

        if (this.quiz == null){
            return;
        }
        this.user_response = {};

        let question = this.quiz.getCurQuestion()[0];
        let choices = this.quiz.getCurQuestion()[1];
        let answerIndex = this.quiz.getCurQuestion()[2];

        for (var cookie in this.user_sockets) {
            this.user_sockets[cookie]?.emit("new-question", choices?.length);
        }

        this.host?.emit("new-question-info", question, choices);

        let questionIndex = this.quiz.curQuestionIndex();

        this.sleep(10000).then(() => {
            console.log("time up!");
            this.stopQuestion(questionIndex);
        });
    }

    public stopQuestion(question_number?: number){
        if (this.quiz == null){
            return
        }

        //if question already advanced: skip
        if (question_number!= null && question_number != this.quiz.curQuestionIndex()) {
            return;
        }
        if (this.cur_question_number != this.quiz.curQuestionIndex() || this.quiz.curQuestionIndex() == this.quiz.getNumQuestions()) {
            return;
        }

        this.cur_question_number++;

        let results = this.quiz.gradeQuestion(this.user_response);

        //loop through all sockets
        for (var cookie in this.user_data) {
            //  if the user got question right: 
            //      emit that they got it right and add points for correct answer
            //  else: 
            //      emit they got it wrong
            if (results != null && results.indexOf(cookie) > -1){
                
                if (this.user_data[cookie] != null){
                    console.log(`score before: ${this.user_data[cookie].score}`);
                    let user_dat = this.user_data[cookie];
                    user_dat.score += this.correct_point_val;
                    console.log(`score after: ${this.user_data[cookie].score}`);
                    this.user_sockets[cookie].emit("answer-result", true, user_dat.score);
                } else {
                    this.user_sockets[cookie].emit("answer-result", true);
                }
            } else {
                this.user_sockets[cookie].emit("answer-result", false);
            }
        }

        this.host?.emit("give-question-results", this.user_response, this.quiz.getCurQuestion()[2], this.quiz.getCurQuestion()[1].length);
    }

    public finalResults(){
        let placing: {cookie: string, score: number, name: string}[] = [];

        // let cur_place: number = Object.keys(this.user_data).length;
        for (let cur_cookie in this.user_data){
            placing.push({cookie: cur_cookie, score: this.user_data[cur_cookie].score, name: this.user_data[cur_cookie].name});
        }

        placing.sort((a, b) => a.score > b.score ? -1 : a.score < b.score ? 1 : 0);

        for (let cur_cookie in this.user_sockets){
            let cur_score = this.user_data[cur_cookie].score;
            let cur_name = this.user_data[cur_cookie].name;
            
            this.user_sockets[cur_cookie]?.emit("final-score", placing.indexOf({cookie: cur_cookie, score: cur_score, name: cur_name}) + 1, cur_score);
        }

        let score: number[] = [];
        let name: string[] = [];

        for (let i = 0; i < placing.length; i++){
            score.push(placing[i].score);
            name.push(placing[i].name);
        }

        this.host?.emit("final-game-results", score, name);
    }

    private sleep(ms: number) {
        return new Promise((res, rej) => {
            setTimeout(res, ms);
        });
    }

    public addUser(cookie: string, name: string){
        this.user_data[cookie] = {"name": name, "score": 0};

        if (this.host != null)
            this.host.emit("user-connected", name);
    }

    public reconnectUser(socket: socket_io.Socket){
        let cookie = this.getUserId(socket.handshake.headers.cookie);
        this.user_sockets[cookie] = socket;

        //add socket listeners
        socket.on("disconnection", () => {
            delete this.user_sockets[cookie];
        });

        let user_dat = this.user_data[cookie];
        if (user_dat != null) {
            socket.emit("give-user-data", user_dat.name, user_dat.score);
        }
        socket.on("give-answer", (answer) => {
            this.user_response[cookie] = <number>answer;
        });
    }

    private getUserId(cookie: string): string{
        cookie += ";";
        let userIndex = cookie.indexOf("user_id=");
        return cookie.substring(userIndex + "user_id=".length, cookie.indexOf(";", userIndex));
    }
}