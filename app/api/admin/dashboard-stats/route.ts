import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdminGuard } from '@/lib/admin-guard'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'
import { devLog } from '@/lib/dev-log'

async function cleanupOrphanedReceipts(adminClient: SupabaseClient) {
  try {
    const { data: files, error } = await adminClient.storage.from(STORAGE_BUCKETS.receipts).list()
    if (error || !files || files.length === 0) return

    const { data: orders, error: ordersErr } = await adminClient.from(TABLES.orders).select('instapay_screenshot')
    if (ordersErr || !orders) return

    const activeScreenshots = new Set(
      orders
        .map((o: { instapay_screenshot: string | null }) => o.instapay_screenshot?.split('/').pop())
        .filter(Boolean)
    )

    const toDelete = files
      .filter((f) => {
        if (!f.created_at) return false
        const ageMs = Date.now() - new Date(f.created_at).getTime()
        const isOld = ageMs > 24 * 60 * 60 * 1000
        return isOld && !activeScreenshots.has(f.name)
      })
      .map((f) => f.name)

    if (toDelete.length > 0) {
      await adminClient.storage.from(STORAGE_BUCKETS.receipts).remove(toDelete)
    }
  } catch (err) {
    devLog('Failed to cleanup orphaned receipts:', err)
  }
}

export async function GET(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard

  const adminClient = createSupabaseAdminClient()

  try {
    // 1. Fetch aggregate metrics via RPC and fetch the 5 most recent orders in parallel
    const [statsRes, recentOrdersRes] = await Promise.all([
      adminClient.rpc('get_dashboard_stats'),
      adminClient.from(TABLES.orders).select('id_unique_tracking, customer_name, status, total_amount, created_at').order('created_at', { ascending: false }).limit(5)
    ])

    if (statsRes.error) throw statsRes.error
    if (recentOrdersRes.error) throw recentOrdersRes.error

    const stats = statsRes.data || {}

    // 2. Trigger non-blocking background cleanup of orphaned receipts
    cleanupOrphanedReceipts(adminClient).catch(err => {
      devLog('Background receipts cleanup failed:', err)
    })

    return NextResponse.json({
      totalRevenue: stats.totalRevenue || 0,
      pendingRevenue: stats.pendingRevenue || 0,
      totalOrders: stats.totalOrders || 0,
      pendingCount: stats.pendingCount || 0,
      processingCount: stats.processingCount || 0,
      deliveredCount: stats.deliveredCount || 0,
      declinedCount: stats.declinedCount || 0,
      totalProductsCount: stats.totalProductsCount || 0,
      outOfStockCount: stats.outOfStockCount || 0,
      lowStockCount: stats.lowStockCount || 0,
      salesByCategory: stats.salesByCategory || {},
      unitsByCategory: stats.unitsByCategory || {},
      recentOrders: recentOrdersRes.data || [],
    })
  } catch (error) {
    devLog('Failed to calculate dashboard statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
