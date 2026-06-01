const MIN_PASSWORD_LENGTH = 8;
const UNSAFE_PASSWORDS = new Set([
  "jay442tx",
  "password",
  "password123",
  "password123!",
  "admin123",
  "admin123!",
]);

export const isUnsafeConfiguredPassword = (value = "") => {
  const password = String(value || "").trim();
  const normalized = password.toLowerCase();

  return (
    !password ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.startsWith("replace_with_") ||
    password.includes("<") ||
    UNSAFE_PASSWORDS.has(normalized)
  );
};

export const requireConfiguredPassword = (name, context = "creating or resetting this account") => {
  const password = String(process.env[name] || "").trim();

  if (!password) {
    throw new Error(`${name} must be set before ${context}`);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (isUnsafeConfiguredPassword(password)) {
    throw new Error(`${name} must be changed from a placeholder or commonly used password`);
  }

  return password;
};
