import { Link } from "@solidjs/meta";
import {
	type FlowProps,
	createContext,
	createEffect,
	createSignal,
	useContext,
} from "solid-js";

type Theme = "dark" | "light" | "system";
type ThemeProviderState = {
	theme: () => Theme;
	setTheme: (theme: Theme) => void;
};
type ThemeProviderProps = {
	defaultTheme?: Theme;
	storageKey?: string;
};

const initialState: ThemeProviderState = {
	theme: () => "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider(props: FlowProps<ThemeProviderProps>) {
	const storageKey = () => props.storageKey ?? "vite-ui-theme";
	const [theme, setTheme] = createSignal(
		(localStorage.getItem(storageKey()) as Theme) ||
			(props.defaultTheme ?? "system"),
	);
	const [chosenTheme, setChosenTheme] = createSignal(props.defaultTheme);

	createEffect(() => {
		let chosenTheme = theme();

		if (theme() === "system") {
			chosenTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}
		setChosenTheme(chosenTheme);

		if (chosenTheme === "dark") {
			document.body.setAttribute("data-kb-theme", "dark");
		} else {
			document.body.removeAttribute("data-kb-theme");
		}
	});

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey(), theme);
			setTheme(theme);
		},
	};

	return (
		<>
			<Link
				rel="stylesheet"
				href={
					chosenTheme() === "light"
						? "/ui/prism-solarizedlight.css"
						: "/ui/prism-tomorrow.css"
				}
			/>
			<ThemeProviderContext.Provider value={value}>
				{props.children}
			</ThemeProviderContext.Provider>
		</>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
