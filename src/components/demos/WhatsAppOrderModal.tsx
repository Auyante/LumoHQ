'use client';

import React, { useState } from 'react';
import { X, MessageCircle, Send, CheckCircle2, ShoppingBag, Car } from 'lucide-react';
import type { Locale } from '@/lib/types';

interface MenuItem {
  id: string;
  nameEs: string;
  nameEn: string;
  price: number;
}

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  locale: Locale;
  businessName: string;
  whatsAppNumber: string;
}

export function WhatsAppOrderModal({
  isOpen,
  onClose,
  items,
  locale,
  businessName,
  whatsAppNumber,
}: WhatsAppOrderModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    [items[0]?.id || '']: 2,
    [items[1]?.id || '']: 1,
  });
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');

  if (!isOpen) return null;

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [id]: next };
    });
  };

  const total = items.reduce((acc, item) => {
    const q = quantities[item.id] || 0;
    return acc + q * item.price;
  }, 0);

  const selectedList = items
    .filter((item) => (quantities[item.id] || 0) > 0)
    .map((item) => `${quantities[item.id]}x ${item.nameEs} ($${quantities[item.id] * item.price})`)
    .join(', ');

  const encodedMessage = encodeURIComponent(
    `¡Hola ${businessName}! Quisiera hacer un pedido:\n` +
      `Cliente: ${customerName || 'Cliente'}\n` +
      `Tipo: ${orderType === 'pickup' ? 'Para Recoger' : 'Para Llevar'}\n` +
      `Orden: ${selectedList || '1 Orden de Tacos'}\n` +
      `Total estimado: $${total.toFixed(2)} USD`
  );

  const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-lumo-niebla shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-lumo-niebla bg-[#25D366]/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase block">
                WhatsApp Business Catalog Demo
              </span>
              <h4 className="font-extrabold text-base sm:text-lg text-lumo-noche font-heading">
                {locale === 'es' ? 'Ordenar por WhatsApp en 1 Clic' : 'Order via WhatsApp in 1 Click'}
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch min-w-touch p-2 rounded-full hover:bg-lumo-niebla/80 text-lumo-noche flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 grow">
          <div className="text-xs sm:text-sm font-bold text-lumo-noche">
            {locale === 'es' ? 'Selecciona tus platillos:' : 'Select your dishes:'}
          </div>

          <div className="space-y-2.5">
            {items.map((item) => {
              const q = quantities[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-lumo-niebla bg-lumo-arena/30 flex items-center justify-between gap-2"
                >
                  <div className="grow">
                    <span className="block font-bold text-sm text-lumo-noche">
                      {locale === 'es' ? item.nameEs : item.nameEn}
                    </span>
                    <span className="text-xs text-lumo-pizarra font-semibold">${item.price.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="min-h-touch min-w-touch w-9 h-9 rounded-full bg-white border border-lumo-niebla text-lumo-noche font-black text-sm flex items-center justify-center hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm w-5 text-center">{q}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="min-h-touch min-w-touch w-9 h-9 rounded-full bg-lumo-ambar text-lumo-noche font-black text-sm flex items-center justify-center shadow-xs hover:bg-[#e09129]"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer Name & Type */}
          <div className="pt-2 border-t border-lumo-niebla space-y-3">
            <div>
              <label className="block text-xs font-bold text-lumo-noche mb-1">
                {locale === 'es' ? 'Tu Nombre:' : 'Your Name:'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Martín González"
                className="min-h-touch w-full px-3 py-2 rounded-xl border border-lumo-niebla text-sm text-lumo-noche focus:border-lumo-ambar outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`min-h-touch py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  orderType === 'pickup'
                    ? 'bg-lumo-noche text-white border-lumo-noche'
                    : 'bg-white border-lumo-niebla text-lumo-pizarra'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>{locale === 'es' ? 'Recoger en Local' : 'Pickup'}</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`min-h-touch py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  orderType === 'delivery'
                    ? 'bg-lumo-noche text-white border-lumo-noche'
                    : 'bg-white border-lumo-niebla text-lumo-pizarra'
                }`}
              >
                <Car className="w-3.5 h-3.5 shrink-0" />
                <span>{locale === 'es' ? 'Llevar a Domicilio' : 'Delivery'}</span>
              </button>
            </div>
          </div>

          {/* Total & Send WhatsApp */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-sm font-extrabold text-lumo-noche">
              <span>Total Estimado:</span>
              <span className="text-lg text-emerald-700">${total.toFixed(2)} USD</span>
            </div>
            <p className="text-[11px] text-lumo-pizarra">
              Al tocar el botón se abrirá WhatsApp con tu pedido ya redactado listo para enviar.
            </p>
          </div>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="min-h-touch w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-98 text-white font-black text-sm shadow-lg transition-transform text-center"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>{locale === 'es' ? 'Enviar Pedido por WhatsApp' : 'Send Order to WhatsApp'}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

