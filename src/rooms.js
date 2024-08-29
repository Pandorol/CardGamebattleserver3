const { CommonCMD } = require("./cmd")
const redis = require("./redismgr")
class Rooms {
    constructor() {
        this.roomList = {};

    }
    createRoom(roomid) {
        this.roomList[roomid] = new Room(roomid);
        redis.hset("rooms", roomid, JSON.stringify(this.roomList[roomid]))
    }

    deleteRoom(roomid) {
        if (this.roomList[roomid]) {
            this.roomList[roomid].setActEnd()
            delete this.roomList[roomid];
        }
    }
    getRoom(roomid) {
        return this.roomList[roomid];
    }


    addPlayerToRoom(roomid, userid) {
        const room = this.getRoom(roomid);
        if (!room) {
            this.createRoom(roomid);
        }
        return this.roomList[roomid].addPlayer(userid);


    }
    canAddToRoom(roomid) {
        if (!this.roomList[roomid]) {
            return true
        }
        if (Object.keys(this.roomList[roomid].playerList).length >= global.config.maxPlayerNum) {
            return false; // 房间已满
        }
        return true
    }
    leave(roomid, userid) {

        const room = this.getRoom(roomid);
        if (room) {

            room.removePlayer(userid);

            //console.log(`User ${userid} leaved room ${roomid}`)
            if (Object.keys(room.playerList).length === 0) {
                //console.log(`delete room ${roomid} `)
                room.setActEnd()
                this.deleteRoom(roomid);

            }

        }

    }
}
class Room {
    constructor(roomid) {
        this.roomid = roomid;
        this.playerList = {}; // 房间中的玩家列表
        this.owner = null; // 房主的 userid
        this.acting = false;
        this.actusers = []
    }

    addPlayer(userid) {
        if (this.fullplayers()) {
            return false; // 房间已满
        }

        this.playerList[userid] = global.players.getPlayer(userid);
        global.players.getPlayer(userid).set('roomid', this.roomid);

        if (!this.owner) {
            this.setOwner(userid); // 设置第一个加入的玩家为房主，并发送通知
        }
        redis.hset("rooms", this.roomid, JSON.stringify(this))
        // this.playerList[userid].socket.emit(CommonCMD.cmdheadler,
        //     {
        //         cmd: CommonCMD.joinroomsuc,
        //         roomid: this.roomid,
        //         players: Object.keys(this.playerList),
        //         owner: this.owner // 返回房主的信息
        //     }
        // )
        return true;
    }
    fullplayers() {
        return Object.keys(this.playerList).length >= global.config.maxPlayerNum
    }
    removePlayer(userid) {
        if (this.playerList[userid]) {
            delete this.playerList[userid];
            redis.hset("rooms", this.roomid, JSON.stringify(this))
            this.broadcast(CommonCMD.cmdheadler, {
                cmd: CommonCMD.leaveroom,
                userid: userid,
            });
        }
        if (userid === this.owner) {
            const newOwner = Object.keys(this.playerList)[0];
            this.setOwner(newOwner || null); // 如果房主离开，设置新的房主

        }
    }
    setOwner(userid) {
        if (userid && this.playerList[userid]) {
            this.owner = userid; // 设置新的房主

            // 给房间人发新房主发送通知
            this.broadcast(CommonCMD.cmdheadler, {
                cmd: CommonCMD.newOwner,
                owner: userid,
            });
        } else {
            this.owner = null; // 没有人时房主设为 null
        }
    }

    getOwner() {
        return this.owner;
    }
    broadcast(eventName, data) {
        global.sock.io.to(this.roomid).emit(eventName, data)
    }
    // deepCopy() {
    //     const newRoom = new Room(this.roomid);
    //     newRoom.playerList = { ...this.playerList }; // 深拷贝 playerList（浅拷贝结构可以处理嵌套对象）
    //     newRoom.owner = this.owner; // 拷贝 owner
    //     return newRoom;
    // }
    setActing(isact) {
        this.acting = isact
    }
    setActStart() {
        this.setActing(true)
        this.actusers = Object.keys(this.playerList)

        this.actusers.forEach((userid) => {
            redis.set(userid, JSON.stringify(this.playerList[userid].data))
        })
        redis.hset("rooms", this.roomid, JSON.stringify(this))
    }
    setActEnd() {
        this.setActing(false)
        this.actusers.forEach((userid) => {
            redis.del(userid)
        })
        this.actusers = []
        redis.hdel("rooms", this.roomid)
    }
}
module.exports.Rooms = Rooms