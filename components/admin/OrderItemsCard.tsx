'use client';

import { memo } from 'react';
import Image from 'next/image';
import type { Order, OrderItem } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { ColorSwatch } from '@/components/ui/ColorSwatch';

interface OrderItemsCardProps {
  order: Order;
  orderItems: OrderItem[];
  productsById: ReadonlyMap<string, { name: string; image_url: string }>;
}

export const OrderItemsCard = memo(function OrderItemsCard({ order, orderItems, productsById }: OrderItemsCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 overflow-hidden text-start">
      <h3 className="font-headline-md text-headline-md mb-6 text-on-surface">عناصر الطلب</h3>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-start">
          <thead>
            <tr className="border-b border-outline-variant/30 select-none">
              <th scope="col" className="pb-4 font-label-md text-label-md text-on-surface-variant text-start">المنتج</th>
              <th scope="col" className="pb-4 font-label-md text-label-md text-on-surface-variant text-center">الكمية</th>
              <th scope="col" className="pb-4 font-label-md text-label-md text-on-surface-variant text-end">السعر</th>
              <th scope="col" className="pb-4 font-label-md text-label-md text-on-surface-variant text-end">المجموع الفرعي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {orderItems.map((item) => {
              const product = productsById.get(item.product_id);
              const itemSubtotal = item.unit_price * item.quantity;

              return (
                <tr key={item.id} className="group">
                  <td className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center p-2 overflow-hidden relative shrink-0">
                        {product?.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none select-none"
                            sizes="64px"
                            quality={75}
                            loading="lazy"
                            draggable={false}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant text-[28px] select-none">inventory_2</span>
                        )}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface font-semibold">
                          {product ? product.name : 'عنصر غير معروف'}
                        </p>
                        {item.selected_color && (
                          <span className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant text-on-surface-variant text-[11px] font-bold px-2.5 py-0.5 mt-1 rounded">
                            <ColorSwatch color={item.selected_color} />
                            اللون: {item.selected_color}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center font-body-md text-body-md text-on-surface font-bold">
                    {item.quantity}
                  </td>
                  <td className="py-4 text-end font-body-md text-body-md text-on-surface">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-4 text-end font-headline-md text-label-md text-secondary-fixed-dim font-bold">
                    {formatCurrency(itemSubtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pricing calculations */}
      <div className="mt-8 pt-6 border-t border-outline-variant/30 space-y-2 text-sm">
        <div className="flex justify-between font-body-md text-body-md">
          <span className="text-on-surface-variant">المجموع الفرعي</span>
          <span className="text-on-surface font-semibold">{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between font-body-md text-body-md">
          <span className="text-on-surface-variant">الشحن (عادي)</span>
          <span className="text-green-600 font-bold text-xs">مجاني</span>
        </div>

        <div className="flex justify-between pt-4 font-headline-md text-headline-md border-t border-outline-variant/10 items-end">
          <span className="text-on-surface font-bold text-base">الإجمالي</span>
          <span className="text-secondary-fixed-dim font-tajawal font-bold text-xl">
            {formatCurrency(order.total_amount)}
          </span>
        </div>
      </div>
    </div>
  );
});
