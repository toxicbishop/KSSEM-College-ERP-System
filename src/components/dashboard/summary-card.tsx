"use client";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "destructive";
  subtitle?: string;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
}: SummaryCardProps) {
  return (
    <div className="card-prestige group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-kssem-text-muted text-xs font-bold uppercase tracking-wider mb-1">
            {title}
          </p>
          <p
            className={cn(
              "font-serif font-bold text-3xl",
              variant === "destructive"
                ? "text-destructive"
                : "text-kssem-text",
            )}>
            {value}
          </p>
        </div>
        <div
          className={cn(
            "p-2 rounded-sm transition-colors",
            variant === "destructive"
              ? "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white"
              : "bg-kssem-navy/5 text-kssem-navy group-hover:bg-kssem-navy group-hover:text-white",
          )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {subtitle && (
        <div
          className={cn(
            "mt-4 text-xs font-medium flex items-center gap-1",
            variant === "destructive" ? "text-destructive" : "text-emerald-600",
          )}>
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
