"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/25",
      secondary:
        "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg hover:shadow-orange-500/25",
      ghost:
        "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20",
      danger:
        "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white",
      outline:
        "border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-5 py-2.5 text-sm rounded-xl",
      lg: "px-7 py-3.5 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon && iconPosition === "left" && icon
        )}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
