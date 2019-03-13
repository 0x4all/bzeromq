# A Request Message:
reqid:number
route:string
method:string
data: object

# Response Message for Request
respid:number
data:object


# Notify Message
route:string
method:string
data:object

data is the real message payload.


every time, if you recv or send a message, the message is full data include route;