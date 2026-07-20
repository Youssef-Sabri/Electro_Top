import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { requireAdminGuard } from '@/lib/auth';
import { devLog } from '@/lib/utils/misc';

export async function GET(request: Request) {
  const guard = await requireAdminGuard(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const adminClient = createSupabaseAdminClient();

    const { data, error } = await adminClient.rpc('get_order_counts');

    if (error) {
      devLog('Failed to fetch order counts:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    devLog('Unexpected error in order-counts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
