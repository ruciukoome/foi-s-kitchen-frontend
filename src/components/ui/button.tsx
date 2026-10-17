import type { ButtonHTMLAttributes } from "react";
import { primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(primaryButtonClass, className)} {...props} />;
}