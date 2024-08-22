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
    }
}