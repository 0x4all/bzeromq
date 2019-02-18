
Node.js v11.10 版本编译的zeromq 4.3.1, 包含darwin和linux版本

libzmq源码地址: https://github.com/zeromq/libzmq

Node.js扩展源码地址: https://github.com/zeromq/zeromq.js


1. 先编译libzmq后安装
2. 修改扩展中的binding.gyp, 修改变量值为true

        'variables': {
            'zmq_external%': 'true',
        },
