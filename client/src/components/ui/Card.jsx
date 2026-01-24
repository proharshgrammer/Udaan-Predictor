import { cn } from '../../lib/utils';

export const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const GlassCard = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border border-white/20 shadow-xl rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
