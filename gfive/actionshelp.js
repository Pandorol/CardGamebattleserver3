class actionhelp {
    turnsteps = [1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5]
    getturnsteps(turn) {
        if (turn < 9) {
            return this.turnsteps[turn]
        }
        else {
            return 5
        }
    }
    async AddUserStartActDesk(userid) {
        let actdesk = await global.mysqlmgr.GetDesk(userid, 0)
        return actdesk
    }
    InitActMap(player, actmap) {
        if (player.data.team == 0) {
            for (let i = 1; i <= 5; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = i * 7
                let actpos = {
                    borthpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 1,
                    alive: 1
                }
                actmap[pos] = actpos
            }
            for (let i = 6; i <= 10; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = 37 + i
                let actpos = {
                    borthpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 1,
                    alive: 1
                }
                actmap[pos] = actpos
            }
        }
        if (player.data.team == 1) {
            for (let i = 1; i <= 5; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = i
                let actpos = {
                    borthpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 1,
                    alive: 1
                }
                actmap[pos] = actpos
            }
            for (let i = 6; i <= 10; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = 6 + (i - 5) * 7
                let actpos = {
                    borthpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 1,
                    alive: 1
                }
                actmap[pos] = actpos
            }
        }

        return actmap
    }
}
module.exports = new actionhelp()