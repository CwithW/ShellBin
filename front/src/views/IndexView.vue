<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
    <div class="relative flex h-28 w-28 items-center justify-center">
      <span class="absolute inset-0 rounded-full border-4 border-slate-800 border-t-sky-400 animate-spin"></span>
      <span class="absolute h-16 w-16 rounded-full bg-sky-500/40 blur-xl"></span>
      <span class="sr-only">Loading…</span>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'Index',
  mounted() {
    let token = localStorage.getItem('token')
    if(!token) {
      this.$router.push('/login')
    } else {
      this.$router.push('/list')
    }
  },
}

</script>
