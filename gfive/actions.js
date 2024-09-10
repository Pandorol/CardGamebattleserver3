const { CommonCMD, gfiveCMD } = require("../src/cmd")
const redis = require("../src/redismgr")
const actionhelp = require("./actionshelp")
const lan = require("./language")
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
                room.actdata.actmap = {}
                for (let i = 0; i < userids.length; i++) {
                    let userid = userids[i]
                    players[userid].data.team = i
                    players[userid].data.actdesk = await actionhelp.AddUserStartActDesk(userid)
                    room.actdata.actmap = actionhelp.InitActMap(players[userid], room.actdata.actmap)
                    room.actdata.turn = 0
                    room.actdata.sumturn = 0
                    room.actdata.leftsteps = 1

                }
                room.actdata.center = { damges: 0, from: 0 }
                room.actdata.actmap[24] = { hp: 500, dfs: 10, damages: {} }
                room.setActStart()
                room.broadcast(CommonCMD.cmdheadler, { cmd: gfiveCMD.startact, code: retcode.suc, roomdata: JSON.parse(JSON.stringify(room)) })
                //room.broadcast(CommonCMD.cmdheadler, { cmd: CommonCMD.roomdatas, datas: JSON.parse(JSON.stringify(room)) })

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
            //data.coststep
            //data.cardpos
            //data.targetpos

            let room = global.rooms.getRoom(player.data.roomid)
            if (room.actdata.turn != player.data.team) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.noyourturn })
                return
            }
            if (room.actdata.leftsteps < data.coststep) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.stepnoenough })
                return
            }
            if (room.actdata.actmap[data.cardpos].ownerid != player.userid) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.nocardowner })
                return
            }
            if (room.actdata.actmap[data.targetpos]) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.nomove })
                return
            }

            room.actdata.actmap[data.targetpos] = room.actdata.actmap[data.cardpos]
            delete room.actdata.actmap[data.cardpos]

            room.actdata.leftsteps = room.actdata.leftsteps - data.coststep
            room.setredis()
            room.broadcast(CommonCMD.cmdheadler, {
                cmd: gfiveCMD.cardmove,
                moveuser: player.userid,
                cardpos: data.cardpos,
                targetpos: data.targetpos,
                turn: player.data.team,
                leftsteps: room.actdata.leftsteps
            })
            //moveuser: player.userid
            //movecard: data.cardpos
            //targrtpos: data.targrtpos
            //turn : player.data.team
            //leftsteps:leftdtep-data.coststep
            //
        },
        [gfiveCMD.endturn]: (player, data) => {
            //turn : player.data.team+1%maxnum
            //leftsteps:config.steps[sumturn]
            let room = global.rooms.getRoom(player.data.roomid)
            if (room.actdata.turn != player.data.team) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.noyourturn })
                return
            }
            room.actdata.turn = (player.data.team + 1) % global.config.maxPlayerNum
            room.actdata.sumturn = room.actdata.sumturn + 1
            room.actdata.leftsteps = actionhelp.getturnsteps(room.actdata.sumturn)
            room.setredis()
            room.broadcast(CommonCMD.cmdheadler, {
                cmd: gfiveCMD.endturn,
                turn: room.actdata.turn,
                leftsteps: room.actdata.leftsteps,
                sumturn: room.actdata.sumturn
            })
        },
        [gfiveCMD.actatkcard]: (player, data) => {
            // data.coststep
            // data.cardposbefore
            // data.cardposafter
            // data.targrtposbefore
            // data.targrtposafter
            // data.resultatkcard//{}
            // data.resulttargetcard//{}

            let room = global.rooms.getRoom(player.data.roomid)
            if (room.actdata.turn != player.data.team) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.noyourturn })
                return
            }
            if (room.actdata.leftsteps < data.coststep) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.stepnoenough })
                return
            }
            if (room.actdata.actmap[data.cardpos].ownerid != player.userid) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.nocardowner })
                return
            }

            room.actdata.actmap[data.cardposafter] = data.resultatkcard
            room.actdata.actmap[data.targrtposafter] = data.resulttargetcard
            if (data.cardposbefore != data.cardposafter) {
                delete room.actdata.actmap[data.cardposbefore]
            }
            if (data.targrtposbefore != data.targrtposafter) {
                delete room.actdata.actmap[data.targrtposbefore]
            }

            room.actdata.leftsteps = room.actdata.leftsteps - data.coststep


            room.broadcast(CommonCMD.cmdheadler, {
                cmd: gfiveCMD.actatkcard,
                turn: room.actdata.turn,
                leftsteps: room.actdata.leftsteps,
                cardposbefore: data.cardposbefore,
                cardposafter: data.cardposafter,
                targrtposbefore: data.targrtposbefore,
                targrtposafter: data.targrtposafter,
                resultatkcard: room.actdata.actmap[data.cardposafter],
                resulttargetcard: room.actdata.actmap[data.targrtposafter],
            })
            if (room.actdata.actmap[data.cardposafter].alive == 0) {
                delete room.actdata.actmap[data.cardposafter]
            }
            if (room.actdata.actmap[data.targrtposafter].alive == 0) {
                delete room.actdata.actmap[data.targrtposafter]
            }
            room.setredis()
            //atkuser: player.userid
            //atkcardpos: data.cardpos
            //atkcard:data.resultatkcard
            //targrtpos: data.targrtpos
            //targrtcard.resulttargetcard
            //turn : player.data.team
            //leftsteps:leftdtep-data.coststep
            //
            //
        },
        [gfiveCMD.actatkflag]: (player, data) => {
            // data.coststep
            // data.cardpos
            // data.atkscore

            //turn:
            //flagcenter:
            //leftsteps:
            let room = global.rooms.getRoom(player.data.roomid)
            if (room.actdata.turn != player.data.team) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.noyourturn })
                return
            }
            room.actdata.leftsteps = room.actdata.leftsteps - data.coststep
            if (!room.actdata.actmap[24].damages[player.userid]) {
                room.actdata.actmap[24].damages[player.userid] = 0
            }
            room.actdata.actmap[24].damages[player.userid] += data.atkscore
            if (room.actdata.center.from == player.userid || room.actdata.center.damges == 0) {
                room.actdata.center.damges += data.atkscore
                room.actdata.center.from = player.userid
            }
            else {
                room.actdata.center.damges -= data.atkscore
                if (room.actdata.center.damges < 0) {
                    room.actdata.center.damges = -room.actdata.center.damges
                    room.actdata.center.from = player.userid
                }
            }
            room.setredis()
            room.broadcast(CommonCMD.cmdheadler, {
                cmd: gfiveCMD.actatkflag,
                turn: room.actdata.turn,
                leftsteps: room.actdata.leftsteps,
                flagcenter: room.actdata.center
            })
            if (room.actdata.center.from >= room.actdata.actmap[24].hp) {
                room.setActEnd()
                room.broadcast(CommonCMD.cmdheadler, { cmd: gfiveCMD.endact, winuser: room.actdata.center.from, damages: room.actdata.actmap[24].damages })
            }

        },
        [gfiveCMD.loser]: (player, data) => {
            let room = global.rooms.getRoom(player.data.roomid)
            if (room.actdata.turn != player.data.team) {
                player.socket.emit(CommonCMD.cmdheadler, { cmd: gfiveCMD.toast, msg: lan.zh.noyourturn })
                return
            }
            room.setActEnd()
            room.broadcast(CommonCMD.cmdheadler, { cmd: gfiveCMD.endact, loser: player.userid, damages: room.actdata.actmap[24].damages })
        },

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