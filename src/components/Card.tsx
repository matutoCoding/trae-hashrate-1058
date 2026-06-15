import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function Card({ children, className, title, subtitle, icon }: CardProps) {
  return (
    <div className={cn(
      'rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden',
      className
    )}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center text-amber-400">
              {icon}
            </div>
          )}
          <div>
            {title && <h3 className="text-white font-semibold">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
