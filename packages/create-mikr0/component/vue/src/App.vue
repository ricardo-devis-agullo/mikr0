<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{ name: string; lang: string }>();

const count = ref(0);
const formatted = computed(() => {
	return new Intl.NumberFormat(props.lang, {
		maximumSignificantDigits: 3,
	}).format(count.value);
});
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
    <button type="button" @click="count++">
      Hi, {{ props.name }}! Click me! The count is {{ formatted }}
    </button>
  </div>
</template>

<style scoped>
button {
  background-color: "#eee";
  color: "#111";
  border: 0;
  text-align: "center";
  padding: "1rem";
  cursor: "pointer";
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
