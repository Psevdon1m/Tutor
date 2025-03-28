<template>
  <button
    class="w-full mb-12 h-14 flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    @click="handleSignIn"
  >
    <img src="@/assets/icons/google-icon.svg" alt="Google" class="w-10 h-10" />
    <span class="text-3xl text-gray-700">Sign in with Google</span>
  </button>
</template>

<script setup lang="ts">
const { signInWithGoogle } = useAuth();
const loading = ref(false);

const handleSignIn = async () => {
  try {
    loading.value = true;
    await signInWithGoogle();
  } catch (error) {
    console.error("Sign in error:", error);
  } finally {
    loading.value = false;
  }
};
</script>
