import { faker } from "@faker-js/faker";

export function mockComponents() {
	const numComponents = faker.number.int({ min: 50, max: 100 });
	const components = Object.fromEntries(
		Array.from({ length: numComponents }, (_, idx) => {
			// Don't randomize the first component name so refresh doesn't wipe it out
			const componentName = idx === 0 ? "accelerator" : faker.word.noun();
			const numVersions = faker.number.int({ min: 1, max: 7 });

			const componentVersions = Object.fromEntries(
				Array.from({ length: numVersions }, () => {
					const version = faker.system.semver();
					/** @type [string, { publishedAt: number, description?: string }] */
					const componentVersion = [
						version,
						{
							publishedAt: faker.date.anytime().getTime(),
							description: faker.word.words({
								count: faker.number.int({ min: 7, max: 20 }),
							}),
						},
					] as const;
					return componentVersion;
				}).sort((a, b) => {
					const [aMajor, aMinor, aPatch] = a[0].split(".").map(Number);
					const [bMajor, bMinor, bPatch] = b[0].split(".").map(Number);
					if (aMajor === bMajor && aMinor === bMinor && aPatch === bPatch)
						return 0;
					if (aMajor !== bMajor) return aMajor > bMajor ? -1 : 1;
					if (aMinor !== bMinor) return aMinor > bMajor ? -1 : 1;
					return aPatch > bPatch ? -1 : 1;
				}),
			);

			const component = [componentName, componentVersions] as const;
			return component;
		}).sort((a, b) => a[0].localeCompare(b[0])),
	);

	return components;
}
