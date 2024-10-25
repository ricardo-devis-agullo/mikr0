/* @refresh reload */

import { render } from "solid-js/web";
import "./index.css";
import fs from "node:fs";
import App from "./App";

import { createComponent } from "mikr0/dev";

const component = createComponent({
	parameters: {
		position: { type: "number", default: 0 },
	},
	plugins: {
		defaultPosition: () => 5,
	},
	actions: {
		clickMe(para: { stuff: boolean }) {
			return { a: 3, wat: para.stuff };
		},
		async doIt() {
			return { no: 3 };
		},
	},
	loader(ctx) {
		const dirs = fs.readdirSync(".");
		return Promise.resolve({
			folder:
				dirs[ctx.parameters.position ?? -1] ??
				dirs[ctx.plugins.defaultPosition()],
		});
	},
	mount(element, props) {
		render(() => <App {...props} />, element);
	},
});

declare module "mikr0/dev" {
	interface Register {
		component: typeof component;
	}
}

export default component;
