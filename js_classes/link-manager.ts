export class LinkManager {
    private static len = 32;
    private static link: {[link: string]: {game_id: number, host: boolean, oneTime: boolean}} = {};

    constructor(len: number){
        LinkManager.len = len;
    }

    static createNewLink(game_id: number, host: boolean, oneTime: boolean): string {
        let key = generateKey(this.len);

        this.link[key] = {"game_id": game_id, "host": host, "oneTime" : oneTime};

        return key;
    }

    static getLinkData(link: string){
        return this.link[link] ? this.link[link] : null;
    }

    static deleteLink(link: string) {
        let tmp = this.getLinkData(link);

        delete this.link[link];

        return tmp;
    }

    static linkExists(link: string){
        return (this.link[link] != null);
    }
}
function generateKey(len: number): string {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    let output = "";
    let running = true;

    do {
        for (let i = 0; i < len; i++){
            output += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        if (!LinkManager.linkExists(output)){
            running = false;
        } else {
            output = "";
        }
    } while (running);

    return output;
}