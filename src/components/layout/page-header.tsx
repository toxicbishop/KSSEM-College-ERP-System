"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="border-b border-kssem-border pb-6 mb-8 mt-2">
      <div className="max-w-7xl mx-auto w-full relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1">
            {breadcrumbs && (
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-kssem-gold">
                {breadcrumbs}
              </div>
            )}
            <h1 className="text-kssem-navy text-3xl md:text-[2.75rem] font-serif font-bold leading-none tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-kssem-text-muted text-sm mt-3 max-w-3xl font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0 items-center">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
