const zmq = require("../");
const cluster = require("cluster");
// var port = "tcp://182.61.54.138:19000";
var port = "tcp://0.0.0.0:19000";
var os = require("os");
var flatbuffers = require('flatbuffers');
var fs = require('fs');
var point = flatbuffers.compileSchema(fs.readFileSync(__dirname + '/data/reqpoint.bfbs'));

var ReqPoint = require("./data/reqpoint_generated").ReqPoint;
var fb = require("../node_modules/flatbuffers/src/flatbuffers").flatbuffers;



var protocol = {};
protocol.parse = function(data){
    return point.parse(data);
}

protocol.stringify = function(msg){
    return point.generate(msg);
}

var obj = {__reqid:1, route:"sys1212332",method:"reg", x:121012,y:212102.5 };
var str = JSON.stringify(obj);
console.log(Buffer.from(str).length);
var nx = 10000;
console.time("json");
for(var i = 0; i < nx; ++i){
    JSON.parse(str);
}
console.timeEnd("json");


var str = protocol.stringify(obj);
console.log(Buffer.from(str).length);
console.time("protocol");
for(var i = 0; i < nx; ++i){
    protocol.parse(str);
}
console.timeEnd("protocol");


var builder = new fb.Builder(20);
var p = ReqPoint.createReqPoint(builder, 1, builder.createString(obj.route), builder.createString(obj.method), 121012, 212102.5);
ReqPoint.finishReqPointBuffer(builder, p);
var buf = builder.asUint8Array();
console.time("fb");
for(var i = 0; i < nx; ++i){
    var bb = new fb.ByteBuffer(buf);
    ReqPoint.getRootAsReqPoint(bb);
}
console.timeEnd("fb");



console.log(buf.length);
var bb = new fb.ByteBuffer(buf);
var req = ReqPoint.getRootAsReqPoint(bb);
console.log( req._reqid(),req.route(), req.x(), req.y());



if(cluster.isMaster){
    console.log("create server");
    //handler
    var handler = function(){}
    var t = 0;
    handler.prototype.reg = function(clientid, msg, server){
        t++;

        if(msg.reqid){
            var pkg = {respid: msg.reqid};
            pkg.data = msg.data;
            server.response(clientid, pkg);
        }
    }

    //handler system
    var h = new handler();
    var serverhandlers= {};
    serverhandlers["sys"] = h;
    function doHandler(clientid, msg, server){
        if(!msg.route || !msg.method){
            console.warn("msg.c/m is invalid,", msg);
            return;
        }
        var m = serverhandlers[msg.route];
        if(!m){
            console.warn("message handler", router[0], "is not found");
            return;
        }
        var fname = msg.method;
        if(!m[fname]){
            console.warn(router[0], ".", fname, " is not found");
            return;
        }
        m[fname](clientid, msg, server);
    }
    
    
    //create server
    var ssocket = zmq.socket("router");
    ssocket.bind(port,(function(err){
        console.error(err);
        var server = new zmq.helpers.RouterServer(ssocket, doHandler,{limitps:16000, checktime:1000});
    }));

    //monitor mem payload
    setInterval(()=>{
        var mu = process.memoryUsage();
        console.log(t, mu.heapUsed/(1<<20), mu.heapTotal/(1024*1024), mu.rss/(1024*1024));
    },1000);

    cluster.fork();
}
else{

    console.log("create client");
    
    //handle system
    var clienthandlers = {};
    function doHandler(msg){

    }

    //create client
    var csocket = zmq.socket("dealer");
    csocket.identity = "client1";
    csocket.connect(port);
    var client = new zmq.helpers.Client(csocket, doHandler, {limitps:20000000,checktime:1000});
    client.settimeout(20000,3000);
    
    console.log(process.cpuUsage(), process.memoryUsage());
    console.log("avg:%s mem:%dm/%dm",  os.loadavg().join(), os.freemem/(1024*1024), os.totalmem/(1024*1024));
    // return;
    var t = 0
    var rn = 0;
    var te = 0;
    var reqn = 0;
    var t0 = 0;
    setInterval(()=>{
        var a = n = 1500; var e = 0;
        var t1 = Date.now();
        if(t0 ==0){
            t0 = Date.now();
        }
        for(var i = 0; i < a; ++i){
            reqn++;
            client.req("sys", "reg", {isok:"ok"}, (err, msg)=>{
                if(err){ 
                    e++; 
                    te++;
                 }else{
                    rn++;
                }
                t++;
                if(--n == 0){
                    // console.log("time:%f send:%d error:%d  total:%d avg:%s mem:%dm/%dm %f", (Date.now()-t1)/1000, a-n, e,t, os.loadavg().join(), os.freemem/(1024*1024), os.totalmem/(1024*1024), 1000*rn/(Date.now()-t0), );
                }
            })
        }
        // client.notify("sys","reg",{a:"notify"});
    },100);
    

    var lastrn = 0;
    setInterval(()=>{
        console.log("avg qps: %d/s  qps2: %d/s req:%d  resp:%d error:%d",rn-lastrn, Math.floor(rn*1000/(Date.now()-t0)), reqn, rn, te);
        lastrn = rn;
    },1000);
    
}


process.on("uncaughtException",(err)=>{
    console.log(err);
})

process.on("exit", function(err){
    console.log(err);
})

process.on("SIGKILL", function(err){
    consnole.log("sigkill",err);
})


process.on("SIGABRT", function(err){
    consnole.log("SIGABRT",err);
})



process.on("SIGTERM", function(err){
    consnole.log("SIGTERM",err);
})


// 1024 * 1024 byte/s
// 
