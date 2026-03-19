export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push("Minimum 8 characters");
  if (password.length > 64) errors.push("Maximum 64 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter (A-Z)");
  if (!/[a-z]/.test(password)) errors.push("At least 1 lowercase letter (a-z)");
  if (!/[0-9]/.test(password)) errors.push("At least 1 number (0-9)");
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) errors.push("At least 1 special character");
  if (/\s/.test(password)) errors.push("No spaces allowed anywhere");

  return {
    valid: errors.length === 0,
    errors
  };
}
