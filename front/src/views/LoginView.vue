<template>
  <div>
    <h1>Login</h1>
    <label for="username">Username</label>
    <input type="text" v-model="username" placeholder="" />
    <br/>
    <label for="password">Password</label>
    <input type="password" v-model="password" placeholder="" />
    <br/>
    <button @click="login">Login</button>
  </div>
</template>

<style scoped></style>
<script lang="ts">
import axios from '@/axios';
export default {
  data() {
    return {
      username: '',
      password: '',
    }
  },
  methods: {
    async doLogin(username: string, password: string) {
      let result = await axios.post('/user/login', {
        username,
        password,
      })
      return result.data
    },


    async login() {
      let username = this.username
      let password = this.password
      if (!username || !password) return
      let data = await this.doLogin(username, password)
      if (data.code === 200) {
        localStorage.setItem('token', data.data)
        this.$router.push('/list')
      } else {
        alert(data.message)
      }
    },
  },
}

</script>

