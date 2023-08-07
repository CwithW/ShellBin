import * as net from 'net';
import { EventEmitter } from 'events';
import {v4 as uuid} from 'uuid';
import { getConfig } from './config';
const config = getConfig();
export type Connection = {
    socket: net.Socket;
    id: string;
    description: string;
    buffer: Buffer;
    alive: boolean;
    lastActive: number;
    config: ConnectionConfig;
}

export type ConnectionConfig = {
    // replace CR with LF
    replaceCRwithLF: boolean;
    // echo input
    echo: boolean;
    // send keepalive packet
    keepalive: boolean;
    // keepAlive with string
    keepaliveString: string;
}

const defaultConnectionConfig = {
    replaceCRwithLF: true,
    echo: false,
    keepalive: false,
    keepaliveString: "\n"
};

let server = net.createServer();
export let connections: Connection[] = [];

server.on('connection', (socket: net.Socket) => {
    socket.setKeepAlive(true, 1000 * 60 * 5);
    let connection:Connection = {
        socket,
        id:uuid(),
        description: `${socket.remoteAddress!.replace(/^.*:/, '')}:${socket.remotePort}`,
        buffer: Buffer.alloc(0),
        alive: true,
        lastActive: Date.now(),
        config: Object.assign({}, defaultConnectionConfig)
    };
    connections.push(connection);
    socket.on('data', (data: Buffer) => {
        connection.buffer = Buffer.concat([connection.buffer, data]);
        // if the buffer is longer than 10240*2 bytes, trim it to 10240 bytes
        if(connection.buffer.length > 10240 * 2){
            connection.buffer = connection.buffer.slice(10240);
        }
        connection.lastActive = Date.now();
    });
    socket.on("error", (err) => {
        connection.buffer = Buffer.concat([connection.buffer, Buffer.from("Error: "+err.message)]);
        connection.alive = false;
        connection.lastActive = Date.now();
    });

    socket.on('close', () => {
        connection.alive = false;
        connection.lastActive = Date.now();
    });
});


function removeDeadConnections(){
    if(config.removeDeadAfter === 0) return
    connections = connections.filter((connection) => {
        return connection.alive ||(
            // connection is dead for 1 days
            Date.now() - connection.lastActive < (1000 * config.removeDeadAfter)
        );
    });
}
let _timer: NodeJS.Timeout | undefined;

export function start(){
    server.listen(3001, () => {
        console.log('TCP server listening on port 3001');
    });
    _timer !== undefined && clearInterval(_timer);
    _timer = setInterval(() => {
        removeDeadConnections();
    }, 1000 * 60);
}
export function stop(){
    server.listening && server.close();
    _timer !== undefined && clearInterval(_timer);
}

export function findConnectionById(id: string): Connection | undefined {
    return connections.find((connection) => {
        return connection.id === id;
    });
}