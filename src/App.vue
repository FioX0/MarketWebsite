<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// Main app component - just renders the router view
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
}

.app {
  min-height: 100vh;
}
</style>
