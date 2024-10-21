import { createRegistry } from "mikro";

createRegistry({
  auth: {
    username: "admin",
    password: "admin",
  },
});
