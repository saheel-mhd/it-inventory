export const PASSWORD_MIN_LENGTH = 8;

export type PasswordPolicyResult = { ok: true } | { ok: false; error: string };

export function validatePassword(password: string): PasswordPolicyResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { ok: false, error: "Password must contain at least one letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: "Password must contain at least one number." };
  }
  return { ok: true };
}
