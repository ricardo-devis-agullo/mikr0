import { createRegistry } from "../../packages/mikr0/src/index.ts";

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
