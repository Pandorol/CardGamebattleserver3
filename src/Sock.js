const { instrument } = require("@socket.io/admin-ui");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { Server } = require("socket.io");
const { Emitter } = require("@socket.io/redis-emitter");
class Sock {
    constructor(config) {
        this.config = config; // 保存 config 参数到类属性
        this.io = new Server();

        this.pubClient = createClient({ url: this.config.redisURL });
        this.subClient = this.pubClient.duplicate();
        this.dataclient = this.pubClient
        // 创建 Emitter 实例
        this.emitter = new Emitter(this.pubClient);
        // 启动服务器监听
        this.io.listen(this.config.port);


        // 启动 Redis 客户端连接并配置适配器
        this.initialize();


    }

    async initialize() {
        try {
            await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
            this.io.adapter(createAdapter(this.pubClient, this.subClient));
            instrument(this.io, { auth: false });
            console.log(`Socket.IO server with Redis adapter initialized on port ${this.config.port}`);
        } catch (err) {
            console.error("Redis 连接失败：", err);
        }
    }
    // 使用 Emitter 发送消息的方法
    sendMessage(event, message) {
        this.emitter.emit(event, message);
        console.log(`Message sent: ${event} - ${message}`);
    }
    // 使用 Emitter 发送消息到某个房间的方法
    sendMessageToRoom(room, event, message) {
        this.emitter.to(room).emit(event, message);
        console.log(`Message sent to room ${room}: ${event} - ${message}`);
    }
}

module.exports.Sock = Sock;
