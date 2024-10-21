/* @refresh reload */

import { render } from "solid-js/web";
import "./index.css";
import fs from "node:fs";
import App from "./App";

import { createComponent } from "mikr0/dev";

export default createComponent({
	parameters: {
		position: { type: "number", default: 0 },
	},
	plugins: {
		defaultPosition: () => 0,
	},
	loader: (ctx) => {
		const dirs = fs.readdirSync(".");
		return Promise.resolve({
			folder:
				dirs[ctx.parameters.position ?? -1] ??
				dirs[ctx.plugins.defaultPosition()],
		});
	},
	render: (element, props) => {
		render(() => <App {...props} />, element);
	},
});
