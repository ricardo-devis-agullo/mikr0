import { createRegistry } from "../../packages/mikro/src/index.ts";

createRegistry({
	database: {
		client: "sqlite3",
		connection: {
			filename: "./db.sqlite",
		},
	},
	storage: {
		type: "filesystem",
		options: {
			folder: "./components",
		},
	},
	auth: {
		password: "",
		username: "",
	},
});
