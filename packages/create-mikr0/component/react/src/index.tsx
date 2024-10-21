import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { createComponent } from "mikr0/dev";

// eslint-disable-next-line react-refresh/only-export-components
export default createComponent({
	parameters: {
		name: {
			type: "string",
			default: "Mikr0",
			description: "Name of the component",
		},
	},
	async loader({ parameters: { name } }) {
		return { data: 3 };
	},
	render(element, props) {
		createRoot(element).render(
			<StrictMode>
				<App {...props} />
			</StrictMode>,
		);
	},
});
