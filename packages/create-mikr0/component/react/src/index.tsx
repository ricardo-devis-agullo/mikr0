import { createComponent } from "mikr0/dev";
import { StrictMode } from "react";
import { type Root, createRoot } from "react-dom/client";
import App from "./App.tsx";

let root: Root | undefined;

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

