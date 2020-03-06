import {DatabaseManager, RowPacket} from "./database-manager";

export interface Question {
    question: string;
    choices: string[];
    answer_index: number[];
}

/* 
["What year did OBD2 get legaly mandated in the U.S.", ["1994", "1999", "1986", "1982"], [0]],
["What is the sin(30)", ["sqrt(2)/2", "1/2", "Undfined", "sqrt(3)/2"], [1]],
["What is your favorite color", ["#ff0000", "#00ff00", "#00000ff", "#ffffff"], []],
["What question number is this?", ["1", "2", "3", "4"], [3]],
["What is the scala equivalent of switch?", ["val","future","match","case"], [2]],
["Which C function will allocate memory for an array or struct?", ["free()", "malloc()", "new()", "create()"], [1]],
["What question number is this?", ["5", "6", "7", "8"], [2]],
["What is Integer.MAX_VALUE?", ["2147483647", "2147483648","2147483646", "-2147483648"], [0]],
["Which of these vehicles was available with a boxer 4 cylinder engine? (H4)", ["Honda Civic", "Subaru Forester", "Honda Spree", "Toyota 86"], [1,3]]
*/

export class QuestionManager{
    private author: string;
    private name: string;
    private questions: [string, string[], number[]][];
    private cur_question: number = 0;

    constructor(author: string, name: string, question: [string, string[], number[]][]){
        this.author = author;
        this.name = name;
        this.questions = question;
    }

    public getCurQuestion(): [string, string[], number[]] {
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

    public gradeQuestion(input: {[cookie: string]: number;}) {
        let output: string[] = [];

        let question = this.questions[this.cur_question];

        for (let cookie in input){
            for (let i = 0; i < question[2].length; i++){
                console.log(`their answer: ${input[cookie]}, correct answer: ${question[2][i]}`);
                if (question[2][i] == input[cookie]){
                    console.log("correct");
                    output.push(cookie);
                    break;
                }
            }
        }

        return output;
    }

    public static loadQuiz(quiz_id: number): Promise<QuestionManager> {
        return new Promise((res, rej) => {
            DatabaseManager.dbQuery("SELECT * FROM quizes WHERE id=?", [quiz_id]).then((raw_dat) => {
                let dat = raw_dat[0];

                let game_name = dat.game_name;
                let author_name = dat.author_name;
                let quiz: [string, string[], number[]][] = <[string, string[], number[]][]> JSON.parse(dat.questions)

                res(new QuestionManager(author_name, game_name, quiz));
            });
        });
    }

    public static searchQuiz(query: string): Promise<RowPacket[]> {
        return new Promise((res, rej) => {
            let data = this.makeRegex(query);
            DatabaseManager.dbQuery("SELECT * FROM quizes WHERE id LIKE ? AND game_name LIKE ?", [data[0], data[1]]).then((data) => {
                res(data);
            });
        });
    }

    public static saveQuiz(game_name: string, author_name: string, questions: string) {
        // let jString = JSON.stringify(questions);
        DatabaseManager.dbQuery("INSERT INTO quizes (game_name, author_name, questions) VALUES (?, ?, ?)", [game_name, author_name, questions]);
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