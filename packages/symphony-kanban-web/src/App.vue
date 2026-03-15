<template>
  <div class="app-root">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "./composables/useTheme";

useTheme();
</script>
