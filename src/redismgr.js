module.exports = {
    set(key, value) {
        global.datacli.set(key, value)
    },
    del(key) {
        global.datacli.del(key)
    },
    async get(key) {
        let data = await global.datacli.get(key)
        return data
    },
    hset(akey, key, value) {
        global.datacli.hSet(akey, key, value)
    },
    async hget(akey, key) {
        let data = await global.datacli.hGet(akey, key)
        return data
    },
    hdel(akey, key) {
        global.datacli.hDel(akey, key)
    },
    async hgetall(akey) {
        let data = await global.datacli.hGetAll(akey)
        return data
    },
    hdelall(akey) {
        global.datacli.hDel(akey);
    },
}