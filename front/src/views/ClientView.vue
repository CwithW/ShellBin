<template>
  <div class="about">
    <div class="console" id="terminal"></div>
  </div>
</template>

<style scoped>
.console {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
<script lang="ts">
import { Terminal } from 'xterm';
import "xterm/css/xterm.css";
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import axios from '@/axios';
export default {
  name: 'About',
  data() {
    return {
      id: "",
      terminal: undefined as Terminal|undefined,
      socket: undefined as WebSocket|undefined,
      rows: 40,
      cols: 10
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
      }
      this.socket.onerror = () => {
        console.log("socket error")
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
      const attachAddon = new AttachAddon(this.socket!);
      this.terminal.loadAddon(attachAddon);
      this.terminal.onData((data) => {
        console.log(encodeURIComponent(data))
      });
    }
  },
  mounted() {
    this.id = this.$route.params.id as string;
    this.initSocket();
  },
  unmounted() {
    this.socket?.close();
    this.terminal?.dispose();
  },
}

</script>
