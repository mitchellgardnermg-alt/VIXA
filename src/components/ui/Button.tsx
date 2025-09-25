"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:pointer-events-none disabled:opacity-50 border",
  {
    variants: {
      variant: {
        primary: "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400",
        secondary: "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400",
        subtle: "bg-white/8 text-white border-white/12 hover:bg-white/14",
        outline: "bg-transparent text-white border-white/20 hover:bg-white/6",
        ghost: "bg-transparent text-white border-transparent hover:bg-white/6",
        danger: "bg-red-500 text-white border-red-400 hover:bg-red-400",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-3.5",
        lg: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "subtle",
      size: "md",
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={[buttonVariants({ variant, size }), className].filter(Boolean).join(" ")} {...props} />;
  }
);
Button.displayName = "Button";

export default Button;




