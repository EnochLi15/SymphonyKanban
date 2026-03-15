<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from "./AppSidebar.vue";
</script>
