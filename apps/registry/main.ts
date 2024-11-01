import { createRegistry } from "mikr0";

createRegistry({
  verbose: true,
  auth: {
    username: "admin",
    password: "password",
  },
});
