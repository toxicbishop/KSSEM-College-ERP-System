"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  title?: string;
  className?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Card
          className={`border-destructive/50 bg-destructive/5 ${this.props.className}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive text-sm opacity-80">
              <AlertTriangle className="h-4 w-4" />
              {this.props.title || "Something went wrong"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-center text-muted-foreground">
              The AI analysis could not be displayed at this time.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false })}
              className="gap-2">
              <RefreshCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
