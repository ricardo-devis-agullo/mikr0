/* @refresh reload */

import { render } from "solid-js/web";
import "./index.css";
import fs from "node:fs";
import App from "./App";

import { createComponent , defer} from "mikr0/dev";

export default createComponent({
	parameters: {
		position: { type: "number", default: 0  },
	},
	plugins: {
		defaultPosition: () => 5,
	},
	actions: {
		clickMe(para: { stuff: boolean }, ctx) {
			return { a: 3, wat: para.stuff ? 1 : ctx.plugins.defaultPosition() };
		},
		async doIt() {
			return { no: 3 };
		},
	},
	async loader(ctx) {
		const dirs = fs.readdirSync(".");
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const delayedValue = delay(2_000).then(() => 5);
		return defer({
      pro: delayedValue,
			folder:
				dirs[ctx.parameters.position ?? -1] ??
				dirs[ctx.plugins.defaultPosition()],
        // dat
		});
	},
	mount(element, props) {
    console.log("mounting", props);
		render(() => <App {...props as any} />, element);
	},
});

