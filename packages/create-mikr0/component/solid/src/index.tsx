/* @refresh reload */

import { render } from "solid-js/web";
import App from "./App.tsx";
import { createComponent } from "mikr0/dev";

let dispose: (() => void) | undefined = undefined;

// eslint-disable-next-line react-refresh/only-export-components
export default createComponent({
	parameters: {
		name: {
			type: "string",
			mandatory: true,
			example: "Mikr0",
			description: "Name of the component",
		},
	},
	async loader({ parameters: { name }, headers }) {
		const lang = headers["accept-language"]?.split(",")[0] ?? "en";
		return { name, lang };
	},
	mount(element, props) {
		dispose = render(() => <App {...props} />, element);
	},
	unmount() {
		dispose?.();
	},
});
