import semver from "semver";

function maxVersion(versions: string[]) {
	const sorted = versions.sort(semver.rcompare);
	return sorted[0] || null;
}

export function getAvailableVersion(
	availableVersions: string[],
	requestedVersion = "",
) {
	const version =
		semver.maxSatisfying(availableVersions, requestedVersion) || undefined;
	const max = maxVersion(availableVersions);
	const isLatest = !requestedVersion;

	return version || (isLatest && max) || undefined;
}

export function validateNewVersion(
	availableVersions: string[],
	requestedVersion: string,
) {
	return !availableVersions.includes(requestedVersion);
}
