import React, { useRef } from 'react';
import { Gift, Truck, Percent } from 'lucide-react';

interface TieredDiscount {
  id: number;
  min_spend: number;
  max_spend: number | null;
  discount_percent: number;
  free_shipping: boolean;
  is_active: boolean;
}

interface TieredDiscountBannerProps {
  tieredDiscounts: TieredDiscount[];
  isFeatureActive: boolean;
}

const TieredDiscountBanner: React.FC<TieredDiscountBannerProps> = ({ 
  tieredDiscounts, 
  isFeatureActive 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Filter dan urutkan diskon: prioritas yang punya diskon persen
  const activeDiscounts = tieredDiscounts
    .filter(discount => discount.is_active && (discount.discount_percent > 0 || discount.free_shipping))
    .sort((a, b) => {
      const aHasDiscount = a.discount_percent > 0;
      const bHasDiscount = b.discount_percent > 0;

      if (aHasDiscount && !bHasDiscount) return -1;
      if (!aHasDiscount && bHasDiscount) return 1;

      if (aHasDiscount && bHasDiscount) {
        return b.discount_percent - a.discount_percent;
      }
      
      return a.min_spend - b.min_spend;
    });

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '∞';
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(amount);
  };
  
  const renderBenefits = (discount: TieredDiscount) => {
    const minText = formatCurrency(discount.min_spend);
    const maxText = discount.max_spend ? formatCurrency(discount.max_spend) : '∞';
    
    const hasDiscount = discount.discount_percent > 0;
    const hasFreeShipping = discount.free_shipping;
    
    const discountElement = hasDiscount ? (
      <span className="flex items-center">
        <span>DISKON {discount.discount_percent}%</span>
        {/* <Percent className="w-3.5 h-3.5 ml-1.5" /> */}
      </span>
    ) : null;
    
    const shippingElement = hasFreeShipping ? (
      <span className="flex items-center">
        <span>GRATIS ONGKIR</span>
        <Truck className="w-4 h-4 ml-1.5" />
      </span>
    ) : null;

    return (
      <div className="flex items-center text-white font-semibold tracking-wide">
        {discountElement}
        {discountElement && shippingElement && <span className="mx-2 font-light">+</span>}
        {shippingElement}
        <span className="ml-3 opacity-90 font-normal">untuk Belanja {minText} - {maxText}</span>
      </div>
    );
  };

  if (!isFeatureActive || activeDiscounts.length === 0) {
    return null;
  }

  const MarqueeContent = () => (
    <div className="flex-shrink-0 flex items-center justify-around">
      {activeDiscounts.map((discount, index) => (
        <div 
          key={`${discount.id}-marquee-${index}`}
          className="flex items-center space-x-3 mx-6"
        >
          <Gift className="w-5 h-5 text-yellow-300 flex-shrink-0" />
          {renderBenefits(discount)}
          <span className="text-yellow-300 flex-shrink-0 text-lg">•</span>
        </div>
      ))}
    </div>
  );

  return (
    <div 
      className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-500 overflow-hidden shadow-sm group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent pointer-events-none" />
      
      <div className="flex whitespace-nowrap py-3">
        <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
          <MarqueeContent />
          <MarqueeContent />
        </div>
      </div>
    </div>
  );
};

export default TieredDiscountBanner; 