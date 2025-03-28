<template>
  <div>
    <NuxtPwaManifest />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient();
console.log({ client });
</script>
