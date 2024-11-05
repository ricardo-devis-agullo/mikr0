import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};
type ThemeProviderProps = {
	defaultTheme?: Theme;
	storageKey?: string;
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider(
	props: React.PropsWithChildren<ThemeProviderProps>,
) {
	const storageKey = props.storageKey ?? "vite-ui-theme";
	const [theme, setTheme] = useState<Theme>(
		(localStorage.getItem(storageKey) as Theme) ||
			(props.defaultTheme ?? "system"),
	);
	const [chosenTheme, setChosenTheme] = useState<Theme>(
		props.defaultTheme ?? "system",
	);

	useEffect(() => {
		let chosenTheme = theme;

		if (theme === "system") {
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
	}, [theme]);

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
	};

	return (
		<>
			<link
				rel="stylesheet"
				href={
					chosenTheme === "light"
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
