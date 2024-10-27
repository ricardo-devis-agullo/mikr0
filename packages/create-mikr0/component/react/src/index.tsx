import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "./App.tsx";
import { createComponent } from "mikr0/dev";

let root: Root | undefined;

// eslint-disable-next-line react-refresh/only-export-components
const component = createComponent({
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
		root = createRoot(element);
		root.render(
			<StrictMode>
				<App {...props} />
			</StrictMode>,
		);
	},
	unmount() {
		root?.unmount();
	},
});

export default component;
