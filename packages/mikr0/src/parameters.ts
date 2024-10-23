interface Parameter {
	description?: string;
	mandatory?: boolean;
	type: "string" | "boolean" | "number";
	default?: string | boolean | number;
	example?: string | boolean | number;
}
export interface ParametersSchema {
	[key: string]: Parameter;
}

export function parseParameters(
	schema: ParametersSchema,
	parameters: Record<string, unknown>,
	fillWithExample = false,
) {
	const parsedParameters: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(schema)) {
		if (
			value.mandatory &&
			parameters[key] === undefined &&
			!fillWithExample &&
			value.example === undefined
		) {
			throw new Error(`Missing mandatory parameter ${key}`);
		}
		let newValue: string | boolean | number | undefined = undefined;

		if (parameters[key] === undefined) {
			if (value.default !== undefined) {
				newValue = value.default;
			} else if (fillWithExample) {
				newValue = value.example;
			}
		} else {
			newValue = String(parameters[key]);
		}

		parsedParameters[key] = newValue;

		if (parsedParameters[key] !== undefined) {
			if (value.type === "number") {
				parsedParameters[key] = Number(parsedParameters[key]);
			}
			if (value.type === "boolean") {
				parsedParameters[key] =
					String(parsedParameters[key]).toLowerCase() === "true";
			}
		}
	}

	return parsedParameters;
}
