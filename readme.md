
Node.js v11.10 版本编译的zeromq 4.3.1, 包含darwin和linux版本

libzmq源码地址: https://github.com/zeromq/libzmq

Node.js扩展源码地址: https://github.com/zeromq/zeromq.js


1. 先编译libzmq后安装
2. 修改扩展中的binding.gyp, 修改变量值为true

        'variables': {
            'zmq_external%': 'true',
        },


# note

dealer/req
发送请求，接受响应
dealer.send:
    当作为1端的时候，轮询发送给N端
    当作为N端的时候，发送1端
req.send
    当作为1端的时候，轮询发给每个N端
    当作为N端的时候，发送1端

rep.send
    无论N端1端，都发送给对端
router.send:
    