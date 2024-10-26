<script lang="ts">
  import svelteLogo from './assets/svelte.svg'

	const { name, lang }: { name: string, lang: string } = $props();
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
  const formatted = $derived(() => {
    return new Intl.NumberFormat(lang, {
      maximumSignificantDigits: 3,
    }).format(count)
  })
</script>

<div>
  <a href="https://vite.dev" target="_blank">
    <img src="/vite.svg" class="logo" alt="Vite logo" />
  </a>
  <a href="https://vuejs.org/" target="_blank">
    <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
  </a>
  <button type="button" onclick={increment}>
    Hi, {name}! Click me! The count is {formatted}
  </button>
</div>

<style>
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
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
</style>
