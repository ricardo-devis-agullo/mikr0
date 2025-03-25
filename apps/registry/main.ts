import { createRegistry } from "mikr0";

createRegistry({
  database: {
    client: 'sqlite3',
    connection: {
      filename: './mydb.sqlite'
    }
  },
  plugins: {
    defaultPosition: {
      handler: () => 5
    }
  },
  importmap: {
    imports: {
      preact: "https://esm.sh/preact@10.26.4",
      "preact/": "https://esm.sh/preact@10.26.4/",
      react: "https://esm.sh/react@19",
      "react-dom": "https://esm.sh/react-dom@19",
      "react-dom/": "https://esm.sh/react-dom@19/",
      "solid-js": "https://cdn.jsdelivr.net/npm/solid-js@1.9/+esm",
      svelte: "https://cdn.jsdelivr.net/npm/svelte@5.1/+esm",
      vue: "https://cdn.jsdelivr.net/npm/vue@3.5/+esm",
    },
  },
  dependencies: ['node:fs'],
  auth: {
    username: "admin",
    password: "password",
  },
});
