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
      ordersDataRes,
      productsStockRes,
      recentOrdersRes,
      salesRes
    ] = await Promise.all([
      // 1. Fetch status and total_amount for all orders to aggregate metrics
      adminClient.from(TABLES.orders).select('status, total_amount'),
      // 2. Fetch all product stock values for inventory counts
      adminClient.from(TABLES.products).select('stock'),
      // 3. Recent orders (exactly 5)
      adminClient.from(TABLES.orders).select('id_unique_tracking, customer_name, status, total_amount, created_at').order('created_at', { ascending: false }).limit(5),
      // 4. Order items category sales (joined)
      adminClient.from(TABLES.orderItems).select('quantity, unit_price, products(category), orders!inner(status)').eq('orders.status', 'Delivered')
    ])

    if (ordersDataRes.error) throw ordersDataRes.error
    if (productsStockRes.error) throw productsStockRes.error
    if (recentOrdersRes.error) throw recentOrdersRes.error
    if (salesRes.error) throw salesRes.error

    const ordersList = ordersDataRes.data || []
    const totalRevenue = ordersList.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + Number(o.total_amount), 0)
    const pendingRevenue = ordersList.filter(o => ['Pending Review', 'Accepted', 'Processing', 'Check Internal Note'].includes(o.status)).reduce((sum, o) => sum + Number(o.total_amount), 0)

    const totalOrders = ordersList.length
    const pendingCount = ordersList.filter(o => o.status === 'Pending Review').length
    const processingCount = ordersList.filter(o => o.status === 'Processing' || o.status === 'Accepted').length
    const deliveredCount = ordersList.filter(o => o.status === 'Delivered').length
    const declinedCount = ordersList.filter(o => o.status === 'Declined').length

    const productsStock = productsStockRes.data || []
    const totalProductsCount = productsStock.length
    const outOfStockCount = productsStock.filter(p => p.stock === 0).length
    const lowStockCount = productsStock.filter(p => p.stock > 0 && p.stock <= 5).length

    const salesByCategory: Record<string, number> = {}
    const unitsByCategory: Record<string, number> = {}

    type SalesRow = {
      quantity: number
      unit_price: number | string
      products: { category: string | null } | { category: string | null }[] | null
    }

    const salesData: SalesRow[] = salesRes.data || []

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
