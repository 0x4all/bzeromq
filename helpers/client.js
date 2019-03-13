
/**
 * 
 * @param {*} socket 
 * @param {*} handler 
 * @param {{ protocol, limitps}} opts 
 */
function client(socket, handler, opts){
    this.reqid = 1;
    this.lasttime = Date.now();
    this.sendcount = 0;
    this.socket = socket;
    this.cbs = {};
    this.protocol = opts.protocol || JSON;
    this.checktime = (opts.checktime) || 1000;
    this.limit = (opts.limitps || 1000) * this.checktime/1000;

    // zmqsocket
    this.socket.on("message",(buffer)=>{
        var msg = this.protocol.parse(buffer);
        if(msg.__reqid){
            var info = this.cbs[msg.__reqid];
            if(info && info.cb){
                info.cb(null, msg.data);
            }
            delete this.cbs[msg.__reqid];
        }
        else{
            handler(msg);
        }
    });
}

module.exports = client;

/**
 * check maybe some message was lost. if lost, callback error;
 * @param {*} timeout 
 * @param {*} checktime 
 */
client.prototype.settimeout = function(timeout, checktime){
    timeout = timeout || 2000;
    checktime = checktime || 200;
    setInterval(()=>{
        var now = Date.now();
        for(var reqid in this.cbs){
            var info = this.cbs[reqid];
            if((now - info.time) > timeout ){
                var cb = info.cb;
                if(cb){
                    cb({message:"timeout"});
                    delete this.cbs[reqid];
                }
            }
        }
    }, checktime);
}

/**
 * 
 * @param {string} route 
 * @param {*} data 
 * @param {(msg)=>void} cb 
 */
client.prototype.req = function (route, method, data, cb){
    if(this.sendcount > this.limit ){ //recvcount: 来保证内存稳定
        var diff = Date.now() - this.lasttime;
        if(diff <= this.checktime){
            cb({message:"exceed request freq limit "});
            return; //drop it
        }else{ 
         this.lasttime = Date.now(); 
         this.sendcount = 0;
        }
    }
    
    var msg = {};
    msg.__reqid = this.reqid++;
    msg.route = route;
    msg.method = method;
    msg.data = data;
    this.socket.send(this.protocol.stringify(msg));
    this.cbs[msg.__reqid] = {cb:cb, time:Date.now()};
    this.sendcount++;
}


client.prototype.notify = function (route, method, data){
    if(this.sendcount > this.limit ){ //recvcount: 来保证内存稳定
        var diff = Date.now() - this.lasttime;
        if(diff <= this.checktime){
            cb({code:"exceed request freq limit "});
            return; //drop it
        }else{ 
         this.lasttime = Date.now(); 
         this.sendcount = 0;
        }
    }

    var msg = {};
    msg.route = route;
    msg.method = method;
    msg.data = data;
    this.socket.send(this.protocol.stringify(msg));
    this.sendcount++;
}