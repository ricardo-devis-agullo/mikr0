import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/ui/")({
	component: HomeComponent,
});

interface CardProps {
	name: string;
	description?: string;
	lastPublished: number;
	lastVersion: string;
}

function ComponentCard(props: CardProps) {
	const published = new Date(props.lastPublished);
	const formatted = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(published);

	return (
		<a href={`/ui/component/${props.name}`}>
			<div className="p-4 hover:bg-gray-100 hover:dark:bg-gray-800">
				<div className="flex space-x-2">
					<div className="text-xl">{props.name}</div>
					<Badge variant="secondary">{props.lastVersion}</Badge>
				</div>
				<div className="text-sm text-slate-400 dark:text-slate-600">
					{formatted}
				</div>
				<div className="mt-4 text-base text-slate-500 dark:text-slate-400">
					{props.description}
				</div>
			</div>
		</a>
	);
}

function EmptyList() {
	return (
		<div>
			<p>No components have been published yet.</p>
			<div className="mt-8 flex flex-col space-y-4 border-solid border-2 p-4 text-sm">
				<p>Create your first component running</p>
				<p className="font-mono">npm create mikr0@latest -- -t component</p>
				<p>And when you are ready to publish it</p>
				<p className="font-mono">
					npm run publish-component -- --registry {window.location.origin}
				</p>
			</div>
		</div>
	);
}

export default function HomeComponent() {
	const [search, setSearch] = useState("");
	const componentNames = Object.keys(window.mikr0Data.components);
	if (componentNames.length === 0) return <EmptyList />;

	const filtered = useMemo(() => {
		const names = !search
			? componentNames
			: componentNames.filter((name) => name.startsWith(search));
		const components: CardProps[] = [];
		for (const name of names) {
			const componentWithVersions = window.mikr0Data.components[name];
			const [[lastVersion, lastComponent]] = Object.entries(
				componentWithVersions,
			);
			components.push({
				name,
				description: lastComponent.description,
				lastPublished: lastComponent.publishedAt,
				lastVersion,
			});
		}
		return components;
	}, [search, componentNames]);

	return (
		<div>
			<Input
				className="pl-10 mb-4"
				type="text"
				autoFocus
				placeholder="Search ..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			{filtered.map((component) => (
				<ComponentCard key={component.name} {...component} />
			))}
		</div>
	);
}
