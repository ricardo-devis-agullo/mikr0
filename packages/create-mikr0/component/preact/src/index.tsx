import { render } from "preact";
import { App } from "./app.tsx";
import { createComponent } from "mikr0/dev";

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
		render(<App {...props} />, element);
	},
});
