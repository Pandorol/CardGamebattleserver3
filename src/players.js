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
    broadcastroom(eventName, data) {
        this.socket.to(this.data.roomid).emit(eventName, data)
    }
    delete(key) {
        delete this.data[key];
    }
    // 自定义 JSON 序列化方法，去除 socket
    toJSON() {
        // 仅返回想要序列化的属性
        return {
            userid: this.userid,
            data: this.data
        };
    }
}

module.exports.Players = Players
