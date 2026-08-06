import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminGuard, verifyAdminPassword } from '@/lib/auth';
import { parseJsonBody } from '@/lib/utils/misc';

export async function requirePasswordVerification(
  request: Request
) {
  const guard = await requireAdminGuard(request);
  if (guard instanceof NextResponse) return guard;

  const body = await parseJsonBody<{ password?: string }>(request);
  if (body instanceof NextResponse) return body;

  if (!body.password || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 });
  }

  const email = guard.user.email;
  if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 500 });

  const pwError = await verifyAdminPassword(email, body.password);
  if (pwError) return pwError;

  return { supabaseClient: guard.supabaseClient, email };
}

export function revalidateShopPaths() {
  revalidatePath('/');
  revalidatePath('/shop');
}

export function apiSuccess<T extends object>(data?: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function apiValidationError(fieldErrors: Record<string, string | string[]>, message = 'Validation failed') {
  return NextResponse.json({ error: message, fieldErrors }, { status: 400 });
}

