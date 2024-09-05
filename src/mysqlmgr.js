const redis = require("../src/redismgr")
const mysql = require('mysql');
class MySQLMgr {
    constructor(config) {
        this.db = mysql.createPool(config);
        this.InitCardsTable()
    }
    InitCardsTable() {
        var sql = 'SELECT * FROM cards';
        try {

            this.db.query(sql, function (err, results) {
                if (err) {
                    console.log("readcards error")
                }
                for (let i = 0; i < results.length; i++) {
                    //console.log(results[i])
                    redis.hset(redis.keys.cards, results[i].cardid, JSON.stringify(results[i]))
                }
            });
        }
        catch {
            console.log("readcards error")
        }
    }
    async GetDesk(userid, deskidx = 0) {
        var sql = 'SELECT desks FROM logindatas WHERE userid = ?';
        try {
            const desk = await new Promise((resolve, reject) => {
                this.db.query(sql, [userid], function (err, results) {
                    if (err) {
                        console.log(err);
                        return reject(null); // Reject on error
                    }
                    //console.log(JSON.parse(results[0].desks)[0]);
                    if (!results[0].desks) {
                        return reject(null);
                    }
                    resolve(JSON.parse(results[0].desks)[deskidx]); // Resolve with results
                })
            });

            return desk
        }
        catch {
            return null
        }

    }
}
module.exports.MySQLMgr = MySQLMgr