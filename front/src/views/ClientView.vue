<template>
  <div class="about">
    <div class="console" id="terminal" ref="terminal"></div>
    <div class="options">
      <button>RemoteSettings</button>
      <label><input type="checkbox" v-model="config.sendSttyOnResize"/>SendSttyOnResize</label>
      <button @click="gainPty()">GainPty</button>
      <button @click="setSttySize()">SetSttySize</button>
    </div>
  </div>
</template>

<style scoped>
label{
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.hidden{
  display: none;
}
.about{
  width: 100%;
  height: 100%;
  display:flex;
  flex-direction: column;
}
.console {
  width: 100%;
  height: calc(100% - 20px);
  position: absolute;
  top: 0;
  left: 0;
}
.options {
  width: 100%;
  height: 20px;
  position: absolute;
  bottom: 0;
  left: 0;
  background: gainsboro;
  overflow-x: auto;
  display: flex;
  flex-direction: row;
}
</style>
<script lang="ts">
import { Terminal } from 'xterm';
import "xterm/css/xterm.css";
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import axios from '@/axios';

// https://blog.51cto.com/hequan/3712190

export default {
  name: 'About',
  data() {
    return {
      id: "",
      terminal: undefined as Terminal|undefined,
      socket: undefined as WebSocket|undefined,
      rows: 40,
      cols: 10,
      windowResizeListener: undefined as (() => void)|undefined,
      fitAddon: undefined as FitAddon|undefined,
      resizeTimer: undefined as number|undefined,
      config:{
        sendSttyOnResize: false,
      }
    }
  },
  methods: {
    initSocket() {
      this.socket = new WebSocket(
        (import.meta.env.DEV ? "ws://localhost:3000" : 
        window.location.origin.replace(/^https(.*)/, 'wss$1').replace(/^http(.*)/, 'ws$1')
        )
        + "/api/client/" + this.id + "");
      this.socket.onopen = () => {
        this.initTerm();
      }
      this.socket.onclose = () => {
        console.log("socket close")
        this.terminal?.writeln("\nWebsocket Closed")
      }
      this.socket.onerror = (e) => {
        console.log("socket error",e)
      }
    },
    initTerm(){
      this.terminal = new Terminal({
        convertEol: true,
        rows: this.rows,
        cols: this.cols,
        cursorBlink: true,
        cursorStyle: "block",
        theme: {
          background: "#000000",
          foreground: "#ffffff"
        }
      });
      this.terminal.open(document.getElementById('terminal')!);
      this.terminal.onResize((size) => {
        this.rows = size.rows;
        this.cols = size.cols;
        console.log("resized", size);
        // change pty size
        if(this.config.sendSttyOnResize){
          this.socket?.send(`stty rows ${size.rows} cols ${size.cols}\n`);
        }
      });
      const fitAddon = new FitAddon();
      this.terminal.loadAddon(fitAddon);
      fitAddon.fit();
      this.fitAddon = fitAddon;
      const attachAddon = new AttachAddon(this.socket!);
      this.terminal.loadAddon(attachAddon);
    },
    gainPty() {
      this.socket?.send(`python -c 'import pty; pty.spawn("/bin/bash")'\n`);
      this.terminal?.focus();
    },
    setSttySize() {
      this.socket?.send(`stty rows ${this.rows} cols ${this.cols}\n`);
      this.terminal?.focus();
    }
  },
  mounted() {
    this.id = this.$route.params.id as string;
    this.initSocket();
    this.windowResizeListener = () => {
      this.resizeTimer && clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(()=>{
        this.fitAddon?.fit();
      }, 100);
    }
    window.addEventListener('resize', this.windowResizeListener);
  },
  unmounted() {
    this.socket?.close();
    this.terminal?.dispose();
    this.socket = undefined;
    this.terminal = undefined;
    this.fitAddon = undefined;
    window.removeEventListener('resize', this.windowResizeListener!);
    this.windowResizeListener = undefined;
  },
}

</script>
