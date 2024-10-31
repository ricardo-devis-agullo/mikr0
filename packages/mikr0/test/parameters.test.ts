import assert from "node:assert";
import test from "node:test";
import { parseParameters } from "../src/parameters.ts";

test("will parse strings", () => {
	const result = parseParameters(
		{
			foo: {
				type: "string",
				default: "bar",
				mandatory: true,
			},
		},
		{ foo: "foo" },
	);

	assert(result.foo === "foo");
});

test("will parse booleans", () => {
	const result = parseParameters(
		{
			foo: {
				type: "boolean",
				mandatory: true,
			},
		},
		{ foo: "true" },
	);

	assert(result.foo === true);
});

test("will parse numbers", () => {
	const result = parseParameters(
		{
			foo: {
				type: "number",
				mandatory: true,
			},
		},
		{ foo: "3" },
	);

	assert(result.foo === 3);
});

test("will throw if a required parameter is not present", () => {
	assert.throws(() => {
		parseParameters(
			{
				foo: {
					type: "string",
					mandatory: true,
				},
				bar: {
					type: "string",
					mandatory: true,
				},
			},
			{ foo: "foo" },
		);
	});
});

test("will fill a default value if a not required parameter is not present", () => {
	const result = parseParameters(
		{
			foo: {
				type: "string",
				default: "bar",
			},
		},
		{},
	);

	assert(result.foo === "bar");
});

test("will fill an example value if a not required parameter is not present and fillWithExample is true", () => {
	const result = parseParameters(
		{
			foo: {
				type: "string",
				example: "bar",
			},
		},
		{},
		true,
	);

	assert(result.foo === "bar");
});

test("will fill a default value if a not required parameter is not present and fillWithExample is true", () => {
	const result = parseParameters(
		{
			foo: {
				type: "string",
				default: "bar",
			},
		},
		{},
		true,
	);

	assert(result.foo === "bar");
});
