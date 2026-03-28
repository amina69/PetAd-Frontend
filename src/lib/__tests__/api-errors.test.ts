import { describe, it, expect } from "vitest";
import {
	ApiError,
	ValidationApiError,
	NotFoundError,
	ForbiddenError,
} from "../api-errors";

describe("Api errors", () => {
	it("supports instanceof checks for ApiError", () => {
		const error = new ApiError("Base error", { status: 500, code: "ERR" });
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toBeInstanceOf(Error);
		expect(error.status).toBe(500);
		expect(error.code).toBe("ERR");
	});

	it("supports instanceof checks for ValidationApiError", () => {
		const fields = { email: ["Required"] };
		const error = new ValidationApiError("Invalid input", fields, {
			status: 422,
			code: "VALIDATION_ERROR",
		});

		expect(error).toBeInstanceOf(ValidationApiError);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.fields).toEqual(fields);
	});

	it("supports instanceof checks for NotFoundError", () => {
		const error = new NotFoundError("Missing", {
			status: 404,
			code: "NOT_FOUND",
		});
		expect(error).toBeInstanceOf(NotFoundError);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(404);
	});

	it("supports instanceof checks for ForbiddenError", () => {
		const error = new ForbiddenError("Denied", {
			status: 403,
			code: "FORBIDDEN",
		});
		expect(error).toBeInstanceOf(ForbiddenError);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(403);
	});
});
