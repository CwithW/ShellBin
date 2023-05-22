import express from 'express';
import expressWs = require('express-ws');
import { connections, findConnectionById } from './socket';
let app = expressWs(express()).app;

app.use(express.static('public'));
// cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});


function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    // TODO: implement authorization logic
    if (req.headers && req.headers.authorization) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
}

function bufferReplace(buf:Buffer, a:string, b:string|Uint8Array|Buffer):Buffer{
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
    const idx = buf.indexOf(a);
    if (idx === -1) return buf;
    if (!Buffer.isBuffer(b)) b = Buffer.from(b);
  
    const before = buf.slice(0, idx);
    const after = bufferReplace(buf.slice(idx + a.length), a, b);
    const len = idx + b.length + after.length;
    return Buffer.concat([ before, b, after ], len);
  }

app.get("/api/client/list", (req, res) => {
    res.json(connections.map((connection) => {
        return {
            id: connection.id,
            lastActive: connection.lastActive,
            description: connection.description,
            alive: connection.alive
        };
    }).sort((a, b) => {
        return b.lastActive - a.lastActive;
    }));
});

app.ws("/api/client/:id", (ws, req) => {
    let id = req.params.id;
    let maybeUndefinedConnection = findConnectionById(id);
    if (maybeUndefinedConnection === undefined) {
        ws.send(Buffer.from("\nError: connection not found"));
        ws.close();
        return;
    }
    let connection = maybeUndefinedConnection
    ws.on('message', (message:Buffer) => {
        // xterm.js: replace CR with LF
        if(connection.config.replaceCRwithLF){
            message = bufferReplace(message, "\r", "\n");
        }
        connection.alive && connection.socket.write(message) &&(
            connection.config.echo && ws.send(message)
        )
    });
    let listener1 = (data: Buffer) => {
        ws.send(data);
    }
    connection.socket.on('data', listener1);
    let listener2 = () => {
        ws.send(Buffer.from("\nError: connection closed"));
        ws.close();
    }
    connection.socket.on('close', listener2);
    ws.on('close', () => {
        connection.socket.off('data', listener1);
        connection.socket.off('close', listener2);
    });
    // send existing buffer to client for history
    connection.buffer.length > 0 && ws.send(connection.buffer);
    if(!connection.alive){
        ws.send(Buffer.from("\nError: connection closed"));
        ws.close();
    }
});

app.post("/api/client/:id/config", (req,res) => {
    let id = req.params.id;
    let maybeUndefinedConnection = findConnectionById(id);
    if (maybeUndefinedConnection === undefined) {
        res.json({
            "code":500,
            "message":"connection not found",
            "data": null
        })
        return
    }
    let connection = maybeUndefinedConnection
    let toModifyObject = req.body;
    for(let key in toModifyObject){
        if(key in connection.config){
            ((connection.config) as any)[key] = toModifyObject[key];
        }else{
            res.json({
                "code":500,
                "message":`key ${key} not found`,
                "data": null
            })
            return
        }
    }
    res.json({
        "code":200,
        "message":"success",
        "data": connection.config
    })
})

export function start() {
    app.listen(3000, () => {
        console.log("HTTP server running on port 3000");
    });
}