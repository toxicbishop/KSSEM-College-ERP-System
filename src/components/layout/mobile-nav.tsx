"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();

  // Show only top 5 items on mobile to avoid crowding
  const displayItems = items.slice(0, 5);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[#2a3441] bg-[#1A222C] px-2 pb-safe md:hidden">
      {displayItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" &&
            pathname.startsWith(item.href) &&
            (item.href === "/dashboard" ? pathname === "/dashboard" : true));

        // Specific case for dashboard/home
        const finalIsActive =
          item.href === "/dashboard" ||
          item.href === "/faculty" ||
          item.href === "/admin"
            ? pathname === item.href
            : isActive;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              finalIsActive
                ? "text-[#2dd4bf]"
                : "text-[#8A99BB] hover:text-white",
            )}>
            <item.icon
              className={cn(
                "h-5 w-5",
                finalIsActive && "animate-in fade-in zoom-in duration-300",
              )}
            />
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
