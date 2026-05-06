import { describe, expect, it } from "vitest";
import { validatePassword } from "~/server/auth/password-policy";

describe("validatePassword", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(validatePassword("Ab1cd")).toEqual({
      ok: false,
      error: "Password must be at least 8 characters.",
    });
  });

  it("rejects passwords without a letter", () => {
    expect(validatePassword("12345678")).toEqual({
      ok: false,
      error: "Password must contain at least one letter.",
    });
  });

  it("rejects passwords without a number", () => {
    expect(validatePassword("OnlyLetters")).toEqual({
      ok: false,
      error: "Password must contain at least one number.",
    });
  });

  it("accepts passwords meeting all criteria", () => {
    expect(validatePassword("Admin@123")).toEqual({ ok: true });
    expect(validatePassword("Sup3rS3cret")).toEqual({ ok: true });
  });
});
