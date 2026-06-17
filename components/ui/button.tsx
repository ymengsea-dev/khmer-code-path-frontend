"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import {
  bouncyPressHover,
  bouncyPressTap,
  bouncyTransitions,
} from "@/lib/motion/bouncy-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-clip-padding text-sm font-semibold whitespace-nowrap shadow-sm shadow-slate-900/4 outline-none select-none hover:bg-white/45 hover:shadow-md hover:shadow-slate-900/6 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:border-white/10 dark:shadow-black/18 dark:hover:bg-white/10 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        default:
          "border-[#305FC9]/20 bg-[#305FC9] text-white hover:bg-[#2854b8] hover:text-white dark:border-[#305FC9]/30",
        inverse:
          "bg-foreground/88 text-background hover:bg-foreground hover:text-background dark:bg-white/88 dark:text-zinc-950 dark:hover:bg-white",
        outline:
          "bg-white/30 text-foreground hover:bg-white/48 hover:text-foreground aria-expanded:bg-white/48 aria-expanded:text-foreground dark:bg-white/6 dark:text-foreground dark:hover:bg-white/10 dark:hover:text-foreground",
        secondary:
          "bg-secondary/75 text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent bg-transparent text-foreground shadow-none hover:bg-white/35 hover:text-foreground aria-expanded:bg-white/35 aria-expanded:text-foreground dark:hover:bg-white/8 dark:hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-4 in-data-[slot=button-group]:rounded-xl has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-8 gap-1.5 rounded-xl px-3 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9.5 gap-1.5 rounded-xl px-3.5 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9.5 rounded-xl in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  disabled,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled}
      render={(renderProps) => (
        <motion.button
          {...renderProps}
          whileTap={disabled ? undefined : bouncyPressTap}
          whileHover={
            disabled
              ? undefined
              : { ...bouncyPressHover, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }
          }
          transition={bouncyTransitions.press}
        />
      )}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
