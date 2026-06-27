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
    // Fetch orders status, amount, date, customer name, and tracking code
    const { data: orders, error: ordersError } = await adminClient
      .from(TABLES.orders)
      .select('status, total_amount, created_at, customer_name, id_unique_tracking')

    if (ordersError || !orders) {
      devLog('Dashboard stats orders error:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders statistics' }, { status: 500 })
    }

    // Fetch products catalog status
    const { data: products, error: productsError } = await adminClient
      .from(TABLES.products)
      .select('id, stock, category')

    if (productsError || !products) {
      devLog('Dashboard stats products error:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products statistics' }, { status: 500 })
    }

    // Fetch delivered order items
    const { data: orderItems, error: itemsError } = await adminClient
      .from(TABLES.orderItems)
      .select('product_id, quantity, unit_price, orders!inner(status)')
      .eq('orders.status', 'Delivered')

    if (itemsError || !orderItems) {
      devLog('Dashboard stats items error:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch order items statistics' }, { status: 500 })
    }

    // Process statistics
    const completedOrders = orders.filter(o => o.status === 'Delivered')
    const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Declined')

    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
    const pendingRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)

    const totalOrders = orders.length
    const pendingCount = orders.filter(o => o.status === 'Pending Review').length
    const processingCount = orders.filter(o => o.status === 'Processing' || o.status === 'Accepted').length
    const deliveredCount = completedOrders.length
    const declinedCount = orders.filter(o => o.status === 'Declined').length

    const totalProductsCount = products.length
    const outOfStockCount = products.filter(p => p.stock === 0).length
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length

    const productCategoryMap = new Map(products.map(p => [p.id, p.category || 'أخرى']))

    const salesByCategory: Record<string, number> = {}
    const unitsByCategory: Record<string, number> = {}

    orderItems.forEach(item => {
      const category = productCategoryMap.get(item.product_id) || 'أخرى'
      const cost = Number(item.unit_price) * item.quantity
      salesByCategory[category] = (salesByCategory[category] || 0) + cost
      unitsByCategory[category] = (unitsByCategory[category] || 0) + item.quantity
    })

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

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
      recentOrders,
    })
  } catch (error) {
    devLog('Failed to calculate dashboard statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
