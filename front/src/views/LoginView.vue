<template>
  <div class="min-h-screen bg-linear-to-br from-sky-100 via-indigo-100 to-white flex items-center justify-center px-4 py-24">
    <div class="w-full max-w-xl space-y-10">
      <div class="text-center space-y-3">
        <h1 class="text-4xl font-semibold text-slate-900">Sign in</h1>
      </div>

      <form @submit.prevent="login" class="bg-white rounded-3xl border border-white/60 shadow-[0_20px_45px_rgba(15,23,42,0.15)] p-10 space-y-8">
        <div class="space-y-3">
          <label for="username" class="block text-sm font-semibold text-slate-800 uppercase tracking-wide">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            class="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            placeholder="Enter your username"
          />
        </div>

        <div class="space-y-3">
          <label for="password" class="block text-sm font-semibold text-slate-800 uppercase tracking-wide">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:from-indigo-400 hover:via-violet-400 hover:to-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!username || !password"
        >
          Sign In
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import axios from '@/axios'

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
    }
  },
  methods: {
    async doLogin(username: string, password: string) {
      const result = await axios.post('/user/login', {
        username,
        password,
      })
      return result.data
    },
    async login() {
      const username = this.username
      const password = this.password
      if (!username || !password) return
      const data = await this.doLogin(username, password)
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

