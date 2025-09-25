"use client";

import { Button } from "@/components/ui/Button";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  onSelect: () => void;
}

export default function PricingCard({ 
  title, 
  price, 
  description, 
  features, 
  isPopular = false, 
  buttonText, 
  onSelect 
}: PricingCardProps) {
  return (
    <div className={`relative rounded-lg border p-6 ${isPopular ? 'border-emerald-400 bg-emerald-500/5' : 'border-white/10 bg-black/20'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-medium">
            Most Popular
          </span>
        </div>
      )}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="text-3xl font-bold mb-2">{price}</div>
        <p className="text-white/70 text-sm mb-6">{description}</p>
        <ul className="space-y-3 mb-6 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <span className="text-emerald-400 mr-2">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <Button 
          variant={isPopular ? "primary" : "outline"} 
          size="lg" 
          className="w-full"
          onClick={onSelect}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}


