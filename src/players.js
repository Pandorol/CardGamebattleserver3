// 这里维护所有的用户

class Players {
    constructor(config) {
        this.config = config; // 保存 config 参数到类属性
        this.playerList = {};
        this.playerUsername = [];
    }
    add(socket, userid) {
        if (this.playerList[userid]) {
            this.playerList[userid].socket = socket
            this.playerList[userid].listen();
            return;
        }
        this.playerList[userid] = new Player(socket, userid);
    }

    remove(userid) {
        delete this.playerList[userid];
    }

    getPlayer(userid) {
        return this.playerList[userid];
    }
    leave(player) {
        global.rooms.leave(player.data.roomid, player.userid)
    }
}
class Player {
    constructor(socket, userid) {
        this.socket = socket;
        this.data = {};
        this.userid = userid
        this.listen();
    }
    listen() {
        this.socket.on('message', data => {
            global.action.act(this, data)

        });
        this.socket.on('disconnect', () => {
            global.players.leave(this);

        })
    }
    //data set
    set(key, val) {
        this.data[key] = val;
    }

    get(keys) {
        let result = {};
        Object.keys(keys).forEach(key => {
            result[key] = this.data[key]
        })
        return result;
    }

    delete(key) {
        delete this.data[key];
    }

}

module.exports.Players = Players
