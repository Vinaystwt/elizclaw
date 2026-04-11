'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { Panel } from "@/components/ui/Panel";
import { fetchJson } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  highlight?: boolean;
};

type WorkingState = "idle" | "thinking" | "fetching" | "cross-referencing" | "digest ready";

const prompts = [
  "What moved overnight?",
  "Morning brief",
  "Check my watchlist",
  "Any whale activity?",
];

const stateCopy: Record<Exclude<WorkingState, "idle">, string> = {
  thinking: "ElizClaw is working...",
  fetching: "Fetching on-chain data...",
  "cross-referencing": "Cross-referencing whale activity...",
  "digest ready": "Digest ready.",
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function splitSections(content: string) {
  return content
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [workingState, setWorkingState] = useState<WorkingState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, workingState]);

  const hasMessages = messages.length > 0;

  const assistantStatus = useMemo(() => {
    if (workingState === "idle") return null;
    return stateCopy[workingState];
  }, [workingState]);

  async function sendMessage(seed?: string) {
    const nextPrompt = (seed ?? input).trim();
    if (!nextPrompt || submitting) return;

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: nextPrompt,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSubmitting(true);
    setWorkingState("thinking");

    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      setWorkingState("fetching");
      await new Promise((resolve) => setTimeout(resolve, 900));
      setWorkingState("cross-referencing");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const data = await fetchJson<{ response?: string }>("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nextPrompt }),
      });

      setWorkingState("digest ready");
      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: data.response || "The desk is quiet right now.",
        createdAt: new Date().toISOString(),
        highlight: true,
      };
      setMessages((current) => [...current, assistantMessage]);

      window.setTimeout(() => {
        setMessages((current) => current.map((message) => (message.id === assistantMessage.id ? { ...message, highlight: false } : message)));
        setWorkingState("idle");
      }, 520);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: "The agent is quiet for the moment. Try again shortly.",
          createdAt: new Date().toISOString(),
        },
      ]);
      setWorkingState("idle");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full min-h-[34rem] flex-col">
      <div className="flex items-center justify-between gap-4 pb-4">
        <div className="space-y-2">
          <Badge tone="accent">Chat brain</Badge>
          <p className="max-w-[42ch] text-[0.86rem] leading-6 text-text-secondary">
            Ask for the overnight brief, watchlist context, whale overlap, or alert rationale.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1" ref={scrollerRef}>
        {!hasMessages ? (
          <div className="flex min-h-full flex-col justify-between gap-8">
            <div className="space-y-4">
              <Panel innerClassName="space-y-4">
                <Badge tone="neutral">ElizClaw</Badge>
                <div className="space-y-2">
                  <h3 className="text-[1.18rem] font-semibold tracking-[-0.04em] text-text-primary">A calm analyst, already listening.</h3>
                  <p className="max-w-[42ch] text-[0.94rem] leading-7 text-text-secondary">
                    Start with the morning brief, ask what changed, or pull a watchlist read without leaving the desk.
                  </p>
                </div>
              </Panel>
              <div className="grid gap-3 md:grid-cols-2">
                {prompts.map((prompt) => (
                  <button className="surface-row text-left hover:border-accent hover:bg-surface-3" key={prompt} onClick={() => sendMessage(prompt)} type="button">
                    <p className="text-[0.84rem] uppercase tracking-[0.18em] text-text-muted">Suggested prompt</p>
                    <p className="pt-2 text-[0.96rem] text-text-primary">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
            <MonoText className="pb-2 text-[0.72rem] uppercase tracking-[0.18em] text-text-muted">Agent ready on the same desk you wake up to.</MonoText>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const sections = splitSections(message.content);
              return (
                <article className={`rounded-[1.55rem] border px-4 py-4 transition-colors duration-300 ${message.highlight ? "border-accent bg-surface-3" : "border-border bg-surface-2"}`} key={message.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge tone={message.role === "assistant" ? "accent" : "neutral"}>
                      {message.role === "assistant" ? "ElizClaw" : "You"}
                    </Badge>
                    <MonoText className="text-[0.72rem] uppercase tracking-[0.16em] text-text-muted">{formatTimestamp(message.createdAt)}</MonoText>
                  </div>
                  <div className="mt-4 space-y-3">
                    {sections.map((section, index) => (
                      <Panel className="bg-transparent p-0 shadow-none" innerClassName="rounded-[1.2rem] border border-border bg-transparent px-0 py-0" key={`${message.id}-${index}`}>
                        <div className="space-y-2 px-0 py-0">
                          <p className="text-[0.94rem] leading-7 text-text-primary">{section}</p>
                        </div>
                      </Panel>
                    ))}
                  </div>
                </article>
              );
            })}

            {assistantStatus ? (
              <div className={`rounded-[1.5rem] border px-4 py-4 ${workingState === "digest ready" ? "border-accent bg-surface-3" : "border-border bg-surface-2"}`}>
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="neutral">Status</Badge>
                  <MonoText className="text-[0.72rem] uppercase tracking-[0.16em] text-text-muted">{formatTimestamp(new Date().toISOString())}</MonoText>
                </div>
                <p className="mt-4 flex items-center gap-2 text-[0.9rem] text-text-secondary">
                  <span className="thinking inline-flex h-2 w-8 rounded-full bg-accent" />
                  {assistantStatus}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <input
          className="input-base flex-1"
          disabled={submitting}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask for the brief, a watchlist check, or an alert rationale"
          value={input}
        />
        <button className="button-primary" disabled={submitting || !input.trim()} onClick={() => sendMessage()} type="button">
          Send
        </button>
      </div>
    </div>
  );
}
