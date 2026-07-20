'use client';

import { memo } from 'react';
import type { Order, OrderItem, Product } from '@/types';
import { getSafeUrl } from '@/lib/utils/misc';

interface PrintableInvoiceProps {
  order: Order;
  orderItems: OrderItem[];
  productsById: ReadonlyMap<string, Product>;
  formatCurrency: (amount: number) => string;
  orderDate: string;
  orderTime: string;
  primaryPhone: string;
  secondaryPhone: string;
  supportEmail: string;
}

export const PrintableInvoice = memo(function PrintableInvoice({
  order,
  orderItems,
  productsById,
  formatCurrency,
  orderDate,
  orderTime,
  primaryPhone,
  secondaryPhone,
  supportEmail,
}: PrintableInvoiceProps) {
  return (
    <div className="hidden print:block" dir="rtl">
      <style>{`
        @media print {
          @page { margin: 0; }
          html, body {
            margin: 0 !important; padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div
        style={{
          width: '100%', maxWidth: '210mm',
          margin: '0 auto', padding: '7mm 12mm 8mm',
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          fontSize: '14pt', color: '#222', background: 'white',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '2px solid #999', paddingBottom: '3mm', marginBottom: '5mm',
        }}>
          <div>
            <div style={{ fontSize: '22pt', fontWeight: 800, color: '#222' }}>
              إلكترو توب
            </div>
            <div style={{ fontSize: '11pt', color: '#666', marginTop: '1mm', lineHeight: 1.6 }}>
              توريدات كهربائية — 21 شارع السبع بنات، المنشية، الإسكندرية<br/>
              <span dir="ltr">{primaryPhone}</span>
              {secondaryPhone && <> / <span dir="ltr">{secondaryPhone}</span></>}
              {supportEmail && <><br/><span>البريد الإلكتروني: {supportEmail}</span></>}
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: '"Courier New", monospace', fontSize: '22pt',
              fontWeight: 900, letterSpacing: '0.5px', color: '#222',
              direction: 'ltr', textAlign: 'left',
            }}>
              {order.id_unique_tracking}
            </div>
            <div style={{ color: '#666', marginTop: '1mm', lineHeight: 1.6, fontSize: '12pt' }}>
              {orderDate} — {orderTime}
            </div>
          </div>
        </div>

        <div className="no-break" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5mm', marginBottom: '5mm',
        }}>
          <div style={{ border: '1.5px solid #ddd', borderRadius: '2mm', padding: '3mm 4mm' }}>
            <div style={{ fontSize: '11pt', fontWeight: 700, color: '#555', marginBottom: '1.5mm' }}>بيانات العميل</div>
            <div style={{ fontSize: '15pt', fontWeight: 600, color: '#222' }}>{order.customer_name}</div>
            <div style={{ fontSize: '13pt', color: '#444', marginTop: '1mm' }}>هاتف: <span dir="ltr">{order.phone_number}</span></div>
            {order.instapay_phone_number && (
              <div style={{ fontSize: '13pt', color: '#444', marginTop: '0.5mm' }}>إنستا باي: <span dir="ltr">{order.instapay_phone_number}</span></div>
            )}
          </div>
          <div style={{ border: '1.5px solid #ddd', borderRadius: '2mm', padding: '3mm 4mm' }}>
            <div style={{ fontSize: '11pt', fontWeight: 700, color: '#555', marginBottom: '1.5mm' }}>عنوان الشحن</div>
            <div style={{ fontSize: '13pt', color: '#222', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {order.shipping_address}
            </div>
            {order.location_link && getSafeUrl(order.location_link) && (
              <div style={{ marginTop: '1.5mm' }}>
                <a href={getSafeUrl(order.location_link)!}
                  style={{ fontSize: '11pt', color: 'var(--color-status-accepted)', wordBreak: 'break-all', textDecoration: 'underline' }}>
                  {order.location_link}
                </a>
              </div>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13pt', marginBottom: '5mm' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: '#333' }}>المنتج</th>
              <th style={{ padding: '2mm 2.5mm', textAlign: 'center', fontWeight: 700, color: '#333', width: '16mm' }}>الكمية</th>
              <th style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 700, color: '#333', width: '24mm' }}>السعر</th>
              <th style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 700, color: '#333', width: '28mm' }}>المجموع</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item) => {
              const product = productsById.get(item.product_id);
              const name = product ? product.name : item.product_id;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'right', color: '#222' }}>{name}</td>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'center', color: '#444' }}>{item.quantity}</td>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'left', color: '#444' }}>{formatCurrency(item.unit_price)}</td>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 600, color: '#222' }}>{formatCurrency(item.unit_price * item.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{
          marginTop: '5mm',
          borderTop: '2px solid #999', paddingTop: '3mm',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13pt', color: '#444', padding: '1mm 0' }}>
            <span>المجموع الفرعي</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13pt', color: '#444', padding: '1mm 0' }}>
            <span>الشحن</span>
            <span style={{ fontWeight: 700 }}>مجاني</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '18pt', fontWeight: 900, color: '#222',
            borderTop: '2px solid #222', paddingTop: '2mm', marginTop: '1mm',
          }}>
            <span>الإجمالي المدفوع</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
           <div style={{ textAlign: 'center', fontSize: '13pt', color: '#666', marginTop: '5mm' }}>
             {order.payment_method === 'cod'
               ? 'طريقة الدفع: الدفع عند الاستلام'
               : 'تم الدفع عن طريق إنستاباي (InstaPay)'}
           </div>
          <div style={{ textAlign: 'center', fontSize: '11pt', color: '#888', borderTop: '1.5px solid #ddd', marginTop: '3mm', paddingTop: '3mm' }}>
            <div style={{ fontWeight: 600 }}>شكراً لاختياركم إلكترو توب!</div>
            <div>للاستفسارات والدعم: <span dir="ltr">{primaryPhone}</span>{secondaryPhone && <span> / <span dir="ltr">{secondaryPhone}</span></span>}{supportEmail && <span> | {supportEmail}</span>}</div>
          </div>
        </div>
      </div>
    </div>
  );
});
PrintableInvoice.displayName = 'PrintableInvoice';
