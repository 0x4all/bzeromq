const zmq = require("../");
const cluster = require("cluster");
var port = "tcp://127.0.0.1:19000";
var os = require("os");


if(cluster.isMaster){
    console.log("create server");
    //handler
    var handler = function(){}
    var t = 0;
    handler.prototype.reg = function(clientid, msg, next){
        t++;
        next(msg.__reqid, msg);
    }

    //handler system
    var h = new handler();
    var serverhandlers= {};
    serverhandlers["sys"] = h;
    function doHandler(clientid, msg, next){
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
        // next = next.bind(null,msg.__reqid);
        m[fname](clientid, msg, next);
    }
    
    
    //create server
    var ssocket = zmq.socket("router");
    ssocket.bind(port,(function(err){
        console.error(err);
        var server = new zmq.helpers.RouterServer(ssocket, doHandler,{limitps:16000, checktime:100});
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
    var client = new zmq.helpers.Client(csocket, doHandler, {limitps:10000,checktime:1000});
    client.settimeout(1000,300);
    
    console.log(process.cpuUsage(), process.memoryUsage());
    console.log("avg:%s mem:%dm/%dm",  os.loadavg().join(), os.freemem/(1024*1024), os.totalmem/(1024*1024));
    // return;
    var t = 0
    var rn = 0;
    var t0 = 0;
    setInterval(()=>{
        var a = n = 1000; var e = 0;
        var t1 = Date.now();
        if(t0 ==0){
            t0 = Date.now();
        }
        for(var i = 0; i < a; ++i){
            client.req("sys", "reg", {a:"req", r: i }, (err, msg)=>{
                if(err){ e++; }else{ rn++;}
                t++;
                if(--n == 0){
                    console.log("time:%f send:%d error:%d  total:%d avg:%s mem:%dm/%dm %f", (Date.now()-t1)/1000, a-n, e,t, os.loadavg().join(), os.freemem/(1024*1024), os.totalmem/(1024*1024), 1000*rn/(Date.now()-t0), );
                }
            })
        }
        client.notify("sys","reg",{a:"notify"});
    },100);
    

    setInterval(()=>{
        console.log("avg qps: %d/s",Math.floor(1000*rn/(Date.now()-t0)));
    },100);
    
}


