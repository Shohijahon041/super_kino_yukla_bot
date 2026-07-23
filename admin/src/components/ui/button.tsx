import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "brand" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]";

    const variants: Record<string, string> = {
      default: "bg-white text-gray-950 shadow-sm hover:bg-gray-100 hover:shadow-md",
      destructive: "bg-red-500/90 text-white shadow-sm hover:bg-red-500 hover:shadow-md",
      outline: "border border-gray-700/50 bg-transparent shadow-sm hover:bg-white/5 hover:border-gray-600 hover:text-white",
      secondary: "bg-white/5 text-gray-300 shadow-sm hover:bg-white/10 hover:text-white border border-white/5",
      ghost: "text-gray-400 hover:bg-white/5 hover:text-white",
      link: "text-brand-400 underline-offset-4 hover:underline hover:text-brand-300",
      brand: "gradient-brand text-white shadow-sm hover:shadow-glow hover:brightness-110",
      success: "bg-emerald-500/90 text-white shadow-sm hover:bg-emerald-500 hover:shadow-md",
    };

    const sizes: Record<string, string> = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-11 rounded-xl px-6",
      icon: "h-9 w-9 rounded-xl",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
