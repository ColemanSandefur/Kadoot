export class UserManager {
    private static user_cookies: {[cookie: string]: {game_id: number, leader: boolean}} = {};

    static getUserData(cookie: string){
        return this.user_cookies[cookie];
    }

    static setUserData(cookie: string, game_id: number, leader: boolean){
        this.user_cookies[cookie] = {game_id, leader};
    }

    static createCookie(len: number) {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let cookie = "";
        let running = true;

        while (running) {
            for (let i = 0; i < len; i++) {
                cookie += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            if (this.user_cookies[cookie] == null){
                running = false;
            } else {
                cookie = "";
            }
        }

        return cookie;
    }

    static deleteCookie(cookie: string) {
        delete this.user_cookies[cookie];
    }
}