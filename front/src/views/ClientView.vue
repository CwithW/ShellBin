<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
    <div
      id="terminal"
      ref="terminal"
      class="min-h-0 flex-1 w-full overflow-hidden border-t border-slate-300 bg-black"
    ></div>
    <div
      class="flex flex-wrap items-center gap-3 border-t border-slate-300 bg-gray-200 px-4 py-3 backdrop-blur"
    >
      <button
        v-on:click="remoteSettings()"
        class="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow transition-colors hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        RemoteSettings
      </button>
      <label class="flex items-center gap-2 text-sm font-medium text-slate-700 select-none">
        <input
          type="checkbox"
          v-model="config.sendSttyOnResize"
          class="h-4 w-4 rounded border border-slate-300 bg-gray-200 text-emerald-500 focus:ring-emerald-500"
        />
        SendSttyOnResize
      </label>
      <button
        @click="gainPty()"
        class="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white shadow transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        GainPty
      </button>
      <button
        @click="setSttySize()"
        class="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white shadow transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        SetSttySize
      </button>
      <button
        @click="toClient()"
        class="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white shadow transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        ToAntsword
      </button>
      <button
        @click="toWebsocat()"
        class="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white shadow transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        ToWebsocat
      </button>
    </div>
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="toast.visible"
        class="pointer-events-auto fixed bottom-6 right-6 rounded-xl bg-indigo-600/90 px-4 py-3 text-base font-semibold text-white shadow-xl backdrop-blur"
        v-html="toast.message"
      >
      </div>
    </transition>
  </div>
</template>
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
      toastTimer: undefined as number|undefined,
      config:{
        sendSttyOnResize: false,
      },
      toast: {
        visible: false,
        message: "",
      }
    }
  },
  methods: {
    remoteSettings(){
      this.showToast("todo...");
    },
    async toWebsocat(){
      const text = "websocat --binary '" + this.socket?.url + "?nohistory=1'"
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const copied = this.copyUsingExecCommand(text);
          if (!copied) {
            throw new Error("execCommand failed");
          }
        }
        this.showToast("Copied");
      } catch (error) {
        const fallbackCopied = this.copyUsingExecCommand(text);
        if (fallbackCopied) {
          this.showToast("Copied");
          return;
        }
        this.showToast("Copy failed");
        console.error("copy failed", error);
      }
    },
    async toClient(){
      const text = this.getBackendHost() + "/api/webshell/" + this.id + "";
      const copiedToast = "Copied. <a href='" + "https://github.com/CwithW/ShellBin/blob/main/antsword-usage.md" + "' target='_blank' class='underline'>Usage?</a>"
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const copied = this.copyUsingExecCommand(text);
          if (!copied) {
            throw new Error("execCommand failed");
          }
        }
        this.showToast(copiedToast);
      } catch (error) {
        const fallbackCopied = this.copyUsingExecCommand(text);
        if (fallbackCopied) {
          this.showToast(copiedToast);
          return;
        }
        this.showToast("Copy failed");
        console.error("copy failed", error);
      }
    },
    copyUsingExecCommand(text: string): boolean {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      const selection = document.getSelection();
      const selected = selection?.rangeCount ? selection.getRangeAt(0) : null;
      textarea.select();
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (err) {
        success = false;
      }
      document.body.removeChild(textarea);
      if (selected && selection) {
        selection.removeAllRanges();
        selection.addRange(selected);
      }
      return success;
    },
    showToast(message: string){
      this.toast.message = message;
      this.toast.visible = true;
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
      }
      this.toastTimer = window.setTimeout(() => {
        this.toast.visible = false;
        this.toast.message = "";
      }, 2000);
    },
    getBackendHost(){
      return (import.meta.env.DEV ? "http://localhost:3000" : 
        window.location.origin
        )
    },
    initSocket() {
      this.socket = new WebSocket(
        this.getBackendHost().replace(/^http(.*)/, 'ws$1').replace(/^https(.*)/, 'wss$1')
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
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
  },
}

</script>
