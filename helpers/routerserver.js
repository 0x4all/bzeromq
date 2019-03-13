
/**
 * 
 * @param {*} socket 
 * @param {(clientid:Buffer, msg:any} handler 
 * @param {{protocol, limitps:number} opts 
 */
function server(socket, handler, opts){
    this.socket = socket;
    this.lasttime = 0;
    this.sendcount = 0;
    this.recvcount = 0;
    this.protocol = opts.protocol||JSON;
    this.checktime = opts.checktime || 100;
    this.limit = (opts.limitps || 1000) * this.checktime/1000;

    // zmqsocket
    this.socket.on("message",(clientid, buffer)=>{
        if(this.recvcount > this.limit ){ //recvcount: 来保证内存稳定
            var diff = Date.now() - this.lasttime;
            if(diff <= this.checktime){
                return; //drop it
            }else{ 
             this.lasttime = Date.now(); 
             this.recvcount = 0;
            }
        }   //阈值可以使用mem来动态计算；

        this.recvcount++;
        var pkg = this.protocol.parse(buffer);
        handler(clientid, pkg, this);
    });
}

module.exports = server;


server.prototype.push = function(clientid, pkg){
    this.socket.send([clientid, this.protocol.stringify(pkg)]);
}


server.prototype.response = function(clientid, pkg){
    this.socket.send([clientid, this.protocol.stringify(pkg)]);
}