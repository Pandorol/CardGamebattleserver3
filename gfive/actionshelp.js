class actionhelp {
    actmap = {}
    async AddUserStartActDesk(userid) {
        let actdesk = await global.mysqlmgr.GetDesk(userid, 0)
        return actdesk
    }
    InitActMap(player) {
        let newactdesk = []
        if (player.data.team == 0) {
            for (let i = 1; i <= 5; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = i * 7
                this.actmap[pos] = {
                    cardpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 0,
                    alive: 1
                }
                newactdesk.push(this.actmap[pos])
            }
            for (let i = 6; i <= 10; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = 37 + i
                this.actmap[pos] = {
                    cardpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 0,
                    alive: 1
                }
                newactdesk.push(this.actmap[pos])
            }
        }
        if (player.data.team == 1) {
            for (let i = 1; i <= 5; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = i
                this.actmap[pos] = {
                    cardpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 0,
                    alive: 1
                }
                newactdesk.push(this.actmap[pos])
            }
            for (let i = 6; i <= 10; i++) {
                let cardid = player.data.actdesk[i - 1]
                if (cardid == 0) { continue }
                let pos = 6 + (i - 5) * 7
                this.actmap[pos] = {
                    cardpos: pos,
                    cardid: player.data.actdesk[i - 1],
                    orgownerid: player.userid,
                    ownerid: player.userid,
                    readycamp: 0,
                    alive: 1
                }
                newactdesk.push(this.actmap[pos])
            }
        }
        this.actmap[24] = {
            damges: {}//team:0,score:0
        }

        return newactdesk
    }
}
module.exports = new actionhelp()