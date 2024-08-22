module.exports = {
    getObjLength(data) {
        return Object.keys(data).length;
    },
    objMap(data, fn) {
        Object.keys(data).forEach(key => {
            fn(key, data[key]);
        });
    },

    trim(val) {
        let reg = /(^\s*)|(\s*$)/g;
        return val.replace(reg, '');
    },

    randomStr(num) {
        let result = "";
        let str = "1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
        for (let i = 0; i < num; i++) {
            result += str[~~(Math.random() * str.length)]
        }
        return result;
    },

    delay(ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        })
    }
}