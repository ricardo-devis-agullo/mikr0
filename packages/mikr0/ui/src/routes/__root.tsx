import { useTheme } from "@/ThemeProvider";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { FiBox } from "react-icons/fi";
import { IoSunnyOutline } from "react-icons/io5";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const { theme, setTheme } = useTheme();

	return (
		<>
			<header className="p-8 flex items-center bg-gradient-to-b from-sky-100 dark:from-cyan-950">
				<h1 className="text-3xl font-['Sixtyfour_Convergence']">
					Mikr0 registry
				</h1>
				<IoSunnyOutline
					className="ml-[auto] cursor-pointer mr-2"
					onClick={() => {
						setTheme(theme === "dark" ? "light" : "dark");
					}}
					size={18}
				/>
			</header>
			<div className="p-8 flex space-x-10">
				<div className="border-solid border-r-2 pr-8">
					<ul className="flex flex-col space-y-8">
						<li className="flex items-center space-x-2">
							<FiBox className="ml-2" size={18} />
							<Link to="/ui" className="font-bold underline underline-offset-8">
								Components
							</Link>
						</li>
						{/* <li className="flex items-center space-x-2">
							<TbPlug className="ml-2" size={18} />
							<a href="/ui/">Plugins</a>
						</li>
						<li className="flex items-center space-x-2">
							<CgProfile className="ml-2" size={18} />
							<a href="/ui/">Admin</a>
						</li> */}
					</ul>
				</div>
				<main>
					<Outlet />
				</main>
				{import.meta.env.DEV && (
					<TanStackRouterDevtools position="bottom-right" />
				)}
			</div>
		</>
	);
}
