<template>
  <div class="about">
    <h1>This is an index page</h1>
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
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
