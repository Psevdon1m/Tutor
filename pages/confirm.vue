<template>
  <div class="flex items-center justify-center min-h-screen">
    <p class="text-xl">Completing sign in...</p>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser();
const router = useRouter();

// Redirect to home page if authentication is successful
watch(user, (newUser) => {
  if (newUser) {
    router.push("/");
  }
});
</script>
