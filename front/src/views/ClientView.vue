<template>
  <div class="about">
    <div class="console" id="terminal" ref="terminal"></div>
    <div class="options hidden"></div>
  </div>
</template>

<style scoped>
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
      const fitAddon = new FitAddon();
      this.terminal.loadAddon(fitAddon);
      fitAddon.fit();
      this.fitAddon = fitAddon;
      const attachAddon = new AttachAddon(this.socket!);
      this.terminal.loadAddon(attachAddon);
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
