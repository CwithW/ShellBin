import express from 'express';
import expressWs = require('express-ws');
import * as md5 from 'md5';
import { connections, findConnectionById } from './socket';
import { getConfig } from './config';
let origApp = express();
let app = expressWs(origApp).app;

import WebSocket from 'ws';

app.use(express.urlencoded({ limit: "50mb", extended: false }))
app.use(express.json())
app.use(express.static('public'));
// cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});

let websockets: WebSocket[] = [];

let websocketPingInterval = setInterval(() => {
    websockets.forEach((ws) => {
        ws.ping();
    });
}, 1000 * 30);

let config = getConfig();

const token = getToken();
function getToken() {
    let str = `SHELLBIN:${config.username}:${config.password}`
    // sha256
    return md5.default(str);
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (1) {
        next();
    } else {
        res.json({
            code: 401,
            message: "Unauthorized",
            data: null
        });
    }
}

function bufferReplace(buf: Buffer, a: string, b: string | Uint8Array | Buffer): Buffer {
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
    const idx = buf.indexOf(a);
    if (idx === -1) return buf;
    if (!Buffer.isBuffer(b)) b = Buffer.from(b);

    const before = buf.slice(0, idx);
    const after = bufferReplace(buf.slice(idx + a.length), a, b);
    const len = idx + b.length + after.length;
    return Buffer.concat([before, b, after], len);
}


app.post("/api/user/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username === config.username && password === config.password) {
        res.json({
            code: 200,
            message: "success",
            data: getToken()
        });
        return;
    } else {
        res.json({
            code: 500,
            message: "Wrong username or password",
            data: null
        });
        return;
    }
});



app.get("/api/client/list", requireAuth, (req, res) => {
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
    websockets.push(ws);
    let connection = maybeUndefinedConnection
    ws.on('message', (message: Buffer) => {
        // xterm.js: replace CR with LF
        if (connection.config.replaceCRwithLF) {
            message = bufferReplace(message, "\r", "\n");
        }
        connection.alive && connection.socket.write(message) && (
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
        websockets.splice(websockets.indexOf(ws), 1);
    });
    // send existing buffer to client for history
    // but do not send if the user requested not to send
    const noHistory = req.query.nohistory === 'true' || req.query.nohistory === '1';
    if (!noHistory) {
        connection.buffer.length > 0 && ws.send(connection.buffer);
    }
    if (!connection.alive) {
        ws.send(Buffer.from("\nError: connection closed"));
        ws.close();
    }
});

app.post("/api/client/:id/config", requireAuth, (req, res) => {
    let id = req.params.id;
    let maybeUndefinedConnection = findConnectionById(id);
    if (maybeUndefinedConnection === undefined) {
        res.json({
            "code": 500,
            "message": "connection not found",
            "data": null
        })
        return
    }
    let connection = maybeUndefinedConnection
    let toModifyObject = req.body;
    for (let key in toModifyObject) {
        if (key in connection.config) {
            ((connection.config) as any)[key] = toModifyObject[key];
        } else {
            res.json({
                "code": 500,
                "message": `key ${key} not found`,
                "data": null
            })
            return
        }
    }
    res.json({
        "code": 200,
        "message": "success",
        "data": connection.config
    })
})

function log(...args: any[]) {
    if (!process.env.DEBUG) return;
    console.log(...args);
}



app.post("/api/webshell/:shell_uuid", async (req, res, next) => {
    try {
        const shellUuid = req.params.shell_uuid;

        if(!shellUuid){
            res.status(400).send("shell_uuid is required");
            return;
        }
        if(findConnectionById(shellUuid) === undefined){
            res.status(400).send("connection not found");
            return;
        }


        const command = req.body['1'] || req.body['command'];

        // osType detection
        let osType = "linux";

        if(req.headers['os']){
            osType = req.headers['os'] as string;
        }else if(command.startsWith("powershell") || command.startsWith("cmd")){
            osType = "windows";
        }

        if(osType == "win") osType = "windows";

        if(osType !== "windows" && osType !== "linux"){
            res.status(400).send("unsupported os type: " + osType);
            return;
        }
        
        // Handle the shell command execution here
        log(`Executing shell command on ${osType} with UUID ${shellUuid}`);
        log(command);

        let firstTimeout = 10000;
        let afterDataTimeout = 500;
        let endNeedle: null | Buffer = null;

        if (osType === "windows") {
            afterDataTimeout = 10000;
            // parse windows command, find end needle
            // powershell -nop -enc <base64_command>
            const regex_for_enc = /-enc\s+([A-Za-z0-9+/=]+)/i;
            const match = command.match(regex_for_enc);
            if (match) {
                const base64Command = match[1];
                const decodedCommand = Buffer.from(base64Command, 'base64').toString('utf16le');
                log(`Decoded PowerShell command: ${decodedCommand}`);
                // $TAGE=[System.String]::Concat('9b91','a35a4');
                const regex_for_endNeedle = /\$TAGE=\[System.String\]::Concat\('([A-Za-z0-9]+)','([A-Za-z0-9]+)'\);/i;
                const endNeedleMatch = decodedCommand.match(regex_for_endNeedle);
                if (endNeedleMatch) {
                    endNeedle = Buffer.from(endNeedleMatch[1] + endNeedleMatch[2], 'utf8');
                    log(`Extracted endNeedle: ${endNeedle}`);
                }
            }
        } else if (osType === "linux") {
            afterDataTimeout = 10000;
            // TAGE="e389a2""1f7653";
            const regex_for_endNeedle = /TAGE="([a-fA-F0-9]+)""([a-fA-F0-9]+)";/i;
            const endNeedleMatch = command.match(regex_for_endNeedle);
            if (endNeedleMatch) {
                endNeedle = Buffer.from(endNeedleMatch[1] + endNeedleMatch[2], 'utf8');
                log(`Extracted endNeedle: ${endNeedle}`);
            }
        }

        const wsPath = 'http://127.0.0.1:3000' + "/api/client/" + shellUuid + "?nohistory=1";
        const result = await new Promise((resolve, reject) => {
            const ws = new WebSocket(wsPath);
            let buffer = Buffer.alloc(0);
            function end() {
                ws.close();
                if (buffer.length > 0) {
                    resolve(buffer);
                } else {
                    reject(new Error("No data received"));
                }
            }
            let timeout = setTimeout(end, firstTimeout);
            ws.on('open', () => {
                log('WebSocket connection opened');
                ws.send(command + "\n");
            });

            ws.on('message', (message) => {
                log(`Received message: ${message}`);
                const messageBuffer = message as Buffer;
                buffer = Buffer.concat([buffer, messageBuffer]);
                if (endNeedle != null) {
                    if (buffer.includes(endNeedle)) {
                        log('End needle detected, ending data collection');
                        clearTimeout(timeout);
                        end();
                    }
                } else {
                    clearTimeout(timeout);
                    timeout = setTimeout(end, afterDataTimeout);
                }
            });

            ws.on('error', (error) => {
                log(`WebSocket error: ${error}`);
                reject(error);
            });
        }) as Buffer;

        res.end(result);
    } catch (e) {
        next(e);
    }
});

export function start() {
    app.listen(3000, () => {
        console.log("HTTP server running on port 3000");
    });
}