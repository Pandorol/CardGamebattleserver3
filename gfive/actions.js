const { CommonCMD, gfiveCMD } = require("../src/cmd")
const redis = require("../src/redismgr")
const actionhelp = require("./actionshelp")
retcode = {
    suc: 0,
    nofull: 1,
    noOwner: 2,
    commonerror: 3,
}
class gfiveAction {
    actions = {
        [gfiveCMD.startact]: async (player, data) => {
            let roomid = player.data.roomid
            let room = global.rooms.getRoom(roomid)
            // if (!room.fullplayers()) {
            //     player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.startact, code: retcode.nofull })
            // }
            // else
            if (player.userid != room.getOwner()) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.startact, code: retcode.noOwner })
            }
            else {
                let players = room.playerList
                let userids = Object.keys(players)
                for (let i = 0; i < userids.length; i++) {
                    let userid = userids[i]
                    players[userid].data.team = i
                    players[userid].data.actdesk = await actionhelp.AddUserStartActDesk(userid)
                    players[userid].data.actdesk = actionhelp.InitActMap(players[userid])
                    players[userid].data.turn = 0
                    players[userid].data.leftsteps = 1
                    players[userid].emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.startact, code: retcode.suc, mydata: players[userid].data })
                }


                room.setActStart()
                //room.broadcast(CommonCMD.cmdheadler, { cmd: gfiveCMD.startact, code: retcode.suc })
            }
        },
        [gfiveCMD.endact]: (player, data) => {
            room.setActEnd()
            room.broadcast(CommonCMD.cmdheadler, { cmd: gfiveCMD.endact, code: retcode.suc })
        },
        [gfiveCMD.getroomlist]: async (player, data) => {
            try {
                const rooms = await redis.hgetall("rooms"); // 获取所有房间数据
                const roomList = Object.keys(rooms).map(roomId => JSON.parse(rooms[roomId])); // 解析房间数据
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.getroomlist, roomList: roomList, code: retcode.suc })
            }
            catch (err) {
                //console.log(err)
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.getroomlist, roomList: [], code: retcode.commonerror })
            }
        },
        [gfiveCMD.readystatus]: async (player, data) => {
            player.set('readystatus', data.readystatus)
            let room = global.rooms.getRoom(player.data.roomid)
            room.broadcast(CommonCMD.cmdheadler, { cmd: gfiveCMD.readyed, readystatus: data.readystatus, userid: player.userid })
        },
        [gfiveCMD.kickpos]: async (player, data) => {
            if (!player.data.kickpos) {
                player.set('kickpos', [])
            }
            player.data.kickpos.push(data.pos)
            player.data.kickpos = Array.from(new Set(player.data.kickpos))
            let room = global.rooms.getRoom(player.data.roomid)
            room.broadcast(CommonCMD.cmdheadler, { cmd: gfiveCMD.kickpos, userid: player.userid, kickpos: player.data.kickpos })
            redis.set(player.userid, JSON.stringify(player.data))
        },
        [gfiveCMD.atpos]: async (player, data) => {
            player.set('atpos', { x: data.x, y: data.y })
            player.broadcastroom(CommonCMD.cmdheadler, { cmd: gfiveCMD.atpos, userid: player.userid, atpos: player.data.atpos })
            redis.set(player.userid, JSON.stringify(player.data))
        },
        [gfiveCMD.cardmove]: (player, data) => {

        }
    }




    act(player, data) {
        if (this.actions[data.cmd]) {  // 检查命令是否存在
            this.actions[data.cmd](player, data);
        } else {
            player.socket.emit(CommonCMD.errorheadler, { msg: 'Unknown command.' + data.cmd })
            console.error("Unknown command:", data.cmd);
        }
    }
}
module.exports = gfiveAction;