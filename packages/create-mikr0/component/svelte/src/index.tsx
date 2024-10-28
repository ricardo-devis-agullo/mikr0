import { createComponent } from "mikr0/dev";
import { mount, unmount } from "svelte";
import App from "./App.svelte";

let app: any = undefined;

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
		app = mount(App, {
			target: element,
			props,
		});
	},
	unmount() {
		if (app) {
			unmount(app);
		}
	},
});
