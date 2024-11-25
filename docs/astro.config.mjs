import starlight from "@astrojs/starlight";
// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://ricardo-devis-agullo.github.io",
	// base: 'mikr0',
	integrations: [
		starlight({
			title: "Mikr0",
			social: {
				github: "https://github.com/ricardo-devis-agullo/mikr0",
			},
			sidebar: [
				{
					label: "Welcome",
					items: [{ label: "Getting started", slug: "guides/getting-started" }],
				},
				{
					label: "Registry",
					items: [
						{ label: "Introduction", slug: "guides/registry-intro" },
						{ label: "Configuration", slug: "guides/registry-configure" },
					],
				},
				{
					label: "Components",
					items: [
						{ label: "Introduction", slug: "guides/component-intro" },
						{ label: "Configuration", slug: "guides/component-configure" },
						{ label: "Loader", slug: "guides/loader" },
						{ label: "Actions", slug: "guides/actions" },
						{ label: "Events", slug: "guides/component-event" },
					],
				},
				{
					label: "Reference",
					autogenerate: { directory: "reference" },
				},
			],
		}),
	],
});
