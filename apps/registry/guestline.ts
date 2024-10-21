import { createRegistry } from "mikro";

createRegistry({
  database: {
    client: "mssql",
    connection: {
      database: "mikro-db-test",
      host: "mikro-db-test-safetodelete.database.windows.net",
      user: "sugoi",
      password: process.env.PASSWORD!,
      options: {
        encrypt: true,
      },
    },
  },
  auth: {
    username: "admin",
    password: "password",
  },
});
