import React, { useState, useEffect } from 'react';
import { Clock, Zap, Gift, ArrowRight } from 'lucide-react';

interface PromotionalBannerProps {
  title: string;
  subtitle: string;
  discountPercent: number;
  endDate: Date;
  ctaText: string;
  onCtaClick: () => void;
  gimmickType?: 'pulse' | 'glow' | 'shake' | 'countdown';
}

const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  title,
  subtitle,
  discountPercent,
  endDate,
  ctaText,
  onCtaClick,
  gimmickType = 'pulse'
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const getGimmickClasses = () => {
    switch (gimmickType) {
      case 'pulse':
        return 'animate-pulse';
      case 'glow':
        return 'animate-pulse shadow-2xl shadow-orange-500/50';
      case 'shake':
        return 'hover:animate-bounce';
      default:
        return '';
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v-40c11.046 0 20 8.954 20 20zM0 20c0-11.046 8.954-20 20-20v40c-11.046 0-20-8.954-20-20z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Content */}
          <div className="flex-1 text-center lg:text-left mb-6 lg:mb-0">
            {/* Discount Badge */}
            <div className={`inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold mb-4 ${getGimmickClasses()}`}>
              <Gift className="h-4 w-4" />
              <span>PROMO SPESIAL</span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-3 leading-tight">
              {title}
            </h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl">
              {subtitle}
            </p>

            {/* Discount Display */}
            <div className="flex items-center justify-center lg:justify-start space-x-4 mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-4xl lg:text-6xl font-black text-white">
                  {discountPercent}%
                </div>
                <div className="text-sm text-white/80 font-medium">DISKON</div>
              </div>
              <div className="text-white">
                <Zap className="h-8 w-8 mb-2 animate-bounce" />
                <div className="text-sm font-medium">Hemat Jutaan</div>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-2 text-white mb-4">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Berakhir Dalam:</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Hari', value: timeLeft.days },
                  { label: 'Jam', value: timeLeft.hours },
                  { label: 'Menit', value: timeLeft.minutes },
                  { label: 'Detik', value: timeLeft.seconds }
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-white/20 rounded-lg p-3 mb-1">
                      <div className="text-2xl font-bold text-white">
                        {item.value.toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-xs text-white/80 font-medium">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={onCtaClick}
                className="w-full bg-white hover:bg-gray-100 text-orange-600 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
              >
                <span>{ctaText}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;