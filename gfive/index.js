const config = require('./config');
const gfiveAction = require('./actions');
const util = require('../src/util');
const { Sock } = require("../src/sock");
const { Players } = require("../src/players");
const { Rooms } = require("../src/rooms")
const redis = require("../src/redismgr")
global.config = config
global.sock = new Sock(config)
global.action = new gfiveAction()
global.players = new Players(config)
global.rooms = new Rooms()
global.datacli = global.sock.dataclient


sock.io.on("connection", (socket) => {
    const roomid = socket.handshake.query.roomid;
    const userid = socket.handshake.query.userid;

    if (!roomid) {
        socket.emit('error', { msg: 'Room ID is missing.' });
        socket.disconnect();
        console.log(`Connection disconnected: Room ID missing for socket ${socket.id}`);
        return;
    }

    if (!userid) {
        socket.emit('error', { msg: 'User ID is missing.' });
        socket.disconnect();
        console.log(`Connection disconnected: User ID missing for socket ${socket.id}`);
        return;
    }

    // 处理房间逻辑
    const roomExists = global.rooms.getRoom(roomid);


    if (!roomExists && util.getObjLength(global.rooms.roomList) >= global.config.maxRoomNum) {
        socket.emit('error', { msg: 'Maximum room limit reached.' });
        socket.disconnect();
        console.log(`Connection disconnected: Maximum room limit reached for socket ${socket.id}`);
        return;
    }
    let asyncfunc = async (socket) => {
        let userdata = await redis.get(userid)
        if (userdata) {
            global.players.add(socket, userid);
            let player = global.players.getPlayer(userid)
            player.data = JSON.parse(userdata)
            global.rooms.addPlayerToRoom(player.data.roomid, userid);
            socket.join(roomid);
            console.log(`User ${userid} rejoined room ${roomid}`);
        }
        else {
            global.players.add(socket, userid);
            global.rooms.addPlayerToRoom(roomid, userid);
            socket.join(roomid);
            console.log(`User ${userid} joined room ${roomid}`);
        }
    }
    if (roomExists) {
        if (!global.rooms.canAddToRoom(roomid)) { // 房间已满
            socket.emit('error', { msg: 'Room is full.' });
            socket.disconnect();
            console.log(`Connection disconnected: Room ${roomid} is full for socket ${socket.id}`);
            return;
        }
        else {
            asyncfunc(socket)
        }
    }
    else {
        global.rooms.createRoom(roomid);
        global.players.add(socket, userid);
        global.rooms.addPlayerToRoom(roomid, userid);
        socket.join(roomid);
        console.log(`Created and joined room ${roomid} by user ${userid}`);
    }

    // console.log(socket.rooms)
    // console.log(global.players)
    //console.log(global.rooms)
})


