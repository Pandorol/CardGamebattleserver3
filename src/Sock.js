const { instrument } = require("@socket.io/admin-ui");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { Server } = require("socket.io");

class Sock {
    constructor(config) {
        this.io = new Server();
        this.pubClient = createClient({ url: config.redisURL });
        this.subClient = this.pubClient.duplicate();

        // 启动服务器监听
        this.io.listen(config.port);

        // 启动 Redis 客户端连接并配置适配器
        this.initialize();
    }

    async initialize() {
        try {
            await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
            this.io.adapter(createAdapter(this.pubClient, this.subClient));
            instrument(this.io, { auth: false });
            console.log(`Socket.IO server with Redis adapter initialized on port ${config.port}`);
        } catch (err) {
            console.error("Redis 连接失败：", err);
        }
    }
}

module.exports = Sock;
