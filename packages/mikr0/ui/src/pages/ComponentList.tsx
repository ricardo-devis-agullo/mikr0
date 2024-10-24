import { TextField, TextFieldRoot } from "@/components/ui/textfield";
import { TbInputSearch } from "solid-icons/tb";
import { For, createMemo, createSignal } from "solid-js";
import { Badge } from "../components/ui/badge";

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
			<div class="p-4 hover:bg-gray-100 hover:dark:bg-gray-800">
				<div class="flex space-x-2">
					<div class="text-xl">{props.name}</div>
					<Badge variant="secondary">{props.lastVersion}</Badge>
				</div>
				<div class="text-sm text-slate-400 dark:text-slate-600">
					{formatted}
				</div>
				<div class="mt-4 text-base text-slate-500 dark:text-slate-400">
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
			<div class="mt-8 flex flex-col space-y-4 border-solid border-2 p-4 text-sm">
				<p>Create your first component running</p>
				<p class="font-mono">npx create mikr0@latest -t component</p>
				<p>And when you are ready to publish it</p>
				<p class="font-mono">
					npm run publish-component -- --registry {window.location.origin}
				</p>
			</div>
		</div>
	);
}

export default function ComponentList() {
	const [search, setSearch] = createSignal("");
	const componentNames = Object.keys(window.mikr0Data.components);
	if (componentNames.length === 0) return <EmptyList />;

	const filtered = createMemo(() => {
		const names = !search()
			? componentNames
			: componentNames.filter((name) => name.startsWith(search()));
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
	});

	return (
		<div>
			<TextFieldRoot class="mb-4 relative">
				<TbInputSearch class="absolute top-[11px] left-2 text-gray-500" />
				<TextField
					class="pl-10"
					type="text"
					autofocus
					placeholder="Search ..."
					value={search()}
					onInput={(e) => setSearch(e.currentTarget.value)}
				/>
			</TextFieldRoot>
			<For each={filtered()}>
				{(component) => <ComponentCard {...component} />}
			</For>
		</div>
	);
}
