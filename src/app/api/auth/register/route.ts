import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { validateEmail, validatePassword, apiError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return apiError("Email, name, and password are required", 400);
    }

    if (!validateEmail(email)) {
      return apiError("Invalid email format", 400);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return apiError(passwordError, 400);
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name: name.trim(), passwordHash },
      select: { id: true, email: true, name: true },
    });

    await setSessionCookie(user.id);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return apiError("Internal server error", 500);
  }
}
