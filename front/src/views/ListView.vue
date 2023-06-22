<template>
  <div class="about">
    <h1>Connections</h1>
    <ul>
      <li v-for="client in clients" :key="client.id" @click="clickedOn(client)" class="connection">
        {{ client.description }} - {{ client.alive ? "Alive":"Dead" }} - {{ unixTimeToDate(client.lastActive) }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.connection{
  cursor: pointer;
}
</style>
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
