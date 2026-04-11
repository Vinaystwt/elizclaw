'use client';

import { Component, ErrorInfo, ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ElizClaw error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="page-frame route-fade pt-12">
          <Panel className="mx-auto max-w-[36rem]">
            <div className="flex flex-col gap-4">
              <Badge tone="danger">Session interrupted</Badge>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-text-primary">The desk needs a refresh.</h1>
                <p className="max-w-[44ch] text-[0.98rem] leading-7 text-text-secondary">
                  The interface hit an unexpected state. Reload the page and ElizClaw will reconnect to the live data surfaces.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      );
    }

    return this.props.children;
  }
}
