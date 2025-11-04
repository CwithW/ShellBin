<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 text-slate-900">
    <div class="mx-auto max-w-4xl space-y-8">
      <header class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight text-slate-950">Shell Connections</h1>
        <p class="text-sm text-slate-500">Click a shell to open its terminal viewer in a new window.</p>
      </header>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 class="text-lg font-medium">Active Sessions</h2>
            <p class="text-xs text-slate-500">Updated every second</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {{ clients.length }} clients
          </span>
        </div>

        <div v-if="clients.length" class="divide-y divide-slate-200">
          <button
            v-for="client in clients"
            :key="client.id"
            type="button"
            @click="clickedOn(client)"
            class="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-100"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-900">{{ client.description || 'Untitled client' }}</p>
              <p class="text-xs text-slate-500">Last active: {{ unixTimeToDate(client.lastActive) }}</p>
            </div>

            <span
              class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              :class="client.alive ? 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200' : 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200'"
            >
              <span class="h-2 w-2 rounded-full" :class="client.alive ? 'bg-emerald-500' : 'bg-rose-500'"></span>
              {{ client.alive ? 'Alive' : 'Dead' }}
            </span>
          </button>
        </div>

        <div v-else class="px-6 py-20 text-center text-sm text-slate-500">
          No clients connected yet.
        </div>
      </section>
    </div>
  </div>
</template>
<script lang="ts">
import axios from '@/axios';
type Client = {
  id: string;
  alive: boolean;
  description: string;
  lastActive: number;
}

export default {
  name: 'ClientList',
  data() {
    return {
      clients: [] as Client[],
      _timer: null as any,
    }
  },
  methods: {
    unixTimeToDate(unixTime: number) {
      return new Date(unixTime).toLocaleString();
    },
    pollClients() {
      axios.get('/client/list').then((res) => {
        this.clients = res.data;
      });
    },
    clickedOn(client: Client) {
      // start a popop page that shows the terminal
      window.open("/#/client/" + client.id, "_blank", "width=800,height=600");
      
    }
  },
  mounted() {
    this._timer = setInterval(this.pollClients, 1000);
  },
  unmounted() {
    clearInterval(this._timer);
  },
}

</script>
