import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdminGuard } from '@/lib/admin-guard'
import { TABLES } from '@/lib/db-constants'
import { devLog } from '@/lib/dev-log'

export async function GET(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard

  const adminClient = createSupabaseAdminClient()

  try {
    const [
      revenueRes,
      activeRevenueRes,
      statusCountsRes,
      productCountsRes,
      outOfStockRes,
      lowStockRes,
      recentOrdersRes,
      salesRes
    ] = await Promise.all([
      // 1. Total Revenue (Delivered orders)
      adminClient.from(TABLES.orders).select('total_amount').eq('status', 'Delivered'),
      // 2. Pending Revenue (Active orders)
      adminClient.from(TABLES.orders).select('total_amount').in('status', ['Pending Review', 'Accepted', 'Processing', 'Check Internal Note']),
      // 3. Status lists for counts
      adminClient.from(TABLES.orders).select('status'),
      // 4. Products count
      adminClient.from(TABLES.products).select('*', { count: 'exact', head: true }),
      // 5. Out of stock products count
      adminClient.from(TABLES.products).select('*', { count: 'exact', head: true }).eq('stock', 0),
      // 6. Low stock products count
      adminClient.from(TABLES.products).select('*', { count: 'exact', head: true }).gt('stock', 0).lte('stock', 5),
      // 7. Recent orders (exactly 5)
      adminClient.from(TABLES.orders).select('id_unique_tracking, customer_name, status, total_amount, created_at').order('created_at', { ascending: false }).limit(5),
      // 8. Order items category sales (joined)
      adminClient.from(TABLES.orderItems).select('quantity, unit_price, products(category), orders!inner(status)').eq('orders.status', 'Delivered')
    ])

    if (revenueRes.error) throw revenueRes.error
    if (activeRevenueRes.error) throw activeRevenueRes.error
    if (statusCountsRes.error) throw statusCountsRes.error
    if (recentOrdersRes.error) throw recentOrdersRes.error
    if (salesRes.error) throw salesRes.error

    const totalRevenue = (revenueRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0)
    const pendingRevenue = (activeRevenueRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0)

    const ordersStatusList = statusCountsRes.data || []
    const totalOrders = ordersStatusList.length
    const pendingCount = ordersStatusList.filter(o => o.status === 'Pending Review').length
    const processingCount = ordersStatusList.filter(o => o.status === 'Processing' || o.status === 'Accepted').length
    const deliveredCount = ordersStatusList.filter(o => o.status === 'Delivered').length
    const declinedCount = ordersStatusList.filter(o => o.status === 'Declined').length

    const totalProductsCount = productCountsRes.count || 0
    const outOfStockCount = outOfStockRes.count || 0
    const lowStockCount = lowStockRes.count || 0

    const salesByCategory: Record<string, number> = {}
    const unitsByCategory: Record<string, number> = {}

    type SalesItem = {
      quantity: number
      unit_price: number | string
      products: { category: string | null } | { category: string | null }[] | null
    }

    const salesData = (salesRes.data || []) as unknown as SalesItem[]

    salesData.forEach(item => {
      const prod = Array.isArray(item.products) ? item.products[0] : item.products
      const category = prod?.category || 'أخرى'
      const cost = Number(item.unit_price) * item.quantity
      salesByCategory[category] = (salesByCategory[category] || 0) + cost
      unitsByCategory[category] = (unitsByCategory[category] || 0) + item.quantity
    })

    return NextResponse.json({
      totalRevenue,
      pendingRevenue,
      totalOrders,
      pendingCount,
      processingCount,
      deliveredCount,
      declinedCount,
      totalProductsCount,
      outOfStockCount,
      lowStockCount,
      salesByCategory,
      unitsByCategory,
      recentOrders: recentOrdersRes.data || [],
    })
  } catch (error) {
    devLog('Failed to calculate dashboard statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
