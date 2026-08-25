export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}

export function sanitizeTitle(title: string): string {
  return title.trim().slice(0, 200);
}
