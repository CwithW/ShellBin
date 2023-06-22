import YAML from 'yaml'
import fs from 'fs'

export type Config = {
    username: string;
    password: string;
    managePort: number;
    shellPort: number;
    removeDeadAfter: number
}

let config:Config|null = null;

function validateConfig(config:Config){
    if(typeof config.username !== "string"){
        throw new Error("username must be string");
    }
    if(typeof config.password !== "string"){
        throw new Error("password must be string");
    }
    if(typeof config.managePort !== "number"){
        throw new Error("managePort must be number");
    }
    if(typeof config.shellPort !== "number"){
        throw new Error("shellPort must be number");
    }
    if(typeof config.removeDeadAfter !== "number"){
        throw new Error("removeDeadAfter must be number");
    }
}

export function getConfig(){
    if(config !== null){
        return config;
    }
    let configFile = fs.readFileSync("./config/config.yml", "utf-8");
    let configObject = YAML.parse(configFile);
    config = configObject as Config;
    validateConfig(config);
    return config;
}