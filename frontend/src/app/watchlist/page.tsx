'use client';

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MonoText } from "@/components/ui/MonoText";
import { Panel } from "@/components/ui/Panel";
import { fetchJson, resolveApiUrl } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { WatchlistItem } from "@/lib/types";

type WatchlistResponse = {
  watchlist?: WatchlistItem[];
};

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedSymbols, setUpdatedSymbols] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchJson<WatchlistResponse>("/api/watchlist");
        if (!active) return;

        setItems((current) => {
          const changed = (data.watchlist || [])
            .filter((next) => current.find((previous) => previous.symbol === next.symbol && previous.currentPrice !== next.currentPrice))
            .map((item) => item.symbol);
          setUpdatedSymbols(changed);
          window.setTimeout(() => setUpdatedSymbols([]), 360);
          return data.watchlist || [];
        });
      } catch {
        if (!active) return;
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function addCoin() {
    const coin = draft.trim();
    if (!coin) return;
    try {
      await fetchJson("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin }),
      });
      setStatus(`${coin.toUpperCase()} added to your watchlist.`);
      setDraft("");
      const refreshed = await fetchJson<WatchlistResponse>("/api/watchlist");
      setItems(refreshed.watchlist || []);
    } catch {
      setStatus("That coin could not be added.");
    } finally {
      window.setTimeout(() => setStatus(""), 2400);
    }
  }

  async function removeCoin(symbol: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.symbol !== symbol));
    try {
      await fetch(resolveApiUrl(`/api/watchlist/${symbol}`), { method: "DELETE" });
    } catch {
      setItems(previous);
    }
  }

  const rows = useMemo(
    () =>
      items.map((item) => {
        const changeSinceAdd = item.currentPrice - item.priceAtAdd;
        const changeTone = changeSinceAdd >= 0 ? "text-success" : "text-danger";
        const dailyTone = item.change24h >= 0 ? "text-success" : "text-danger";
        return { ...item, changeSinceAdd, changeTone, dailyTone };
      }),
    [items],
  );

  return (
    <div className="page-frame route-fade">
      <div className="page-intro">
        <div className="space-y-3">
          <Badge tone="accent">Watchlist</Badge>
          <div className="space-y-2">
            <h1 className="page-title">A compact surveillance board built for fast scanning.</h1>
            <p className="page-copy">Add a symbol, glance at the line item, and move on.</p>
          </div>
        </div>
      </div>

      <Panel>
        <div className="space-y-4">
          <Badge>Add coin</Badge>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="input-base flex-1"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCoin();
                }
              }}
              placeholder="Add a coin — try BTC, SOL, ETH"
              value={draft}
            />
            <button className="button-primary" onClick={addCoin} type="button">
              Add
            </button>
          </div>
          {status ? <p className="text-[0.84rem] text-text-secondary">{status}</p> : null}
        </div>
      </Panel>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="surface-row h-[6rem] animate-pulse" key={index} />
          ))}
        </div>
      ) : rows.length ? (
        <Panel>
          <div className="space-y-3">
            {rows.map((item) => (
              <article className="group surface-row" key={item.symbol}>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_0.9fr_0.75fr_0.85fr_0.85fr_auto] md:items-center">
                  <div>
                    <p className="text-[1rem] font-semibold tracking-[-0.03em] text-text-primary">{item.symbol}</p>
                    <p className="text-[0.84rem] text-text-secondary">{item.coin}</p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Current</p>
                    <MonoText className={`pt-2 block text-[0.98rem] text-text-primary ${updatedSymbols.includes(item.symbol) ? "number-update" : ""}`}>
                      {formatCurrency(item.currentPrice, item.currentPrice < 10 ? 2 : 0)}
                    </MonoText>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">24h</p>
                    <MonoText className={`pt-2 block text-[0.92rem] ${item.dailyTone}`}>{formatPercent(item.change24h, 2)}</MonoText>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">At add</p>
                    <MonoText className="pt-2 block text-[0.92rem] text-text-secondary">{formatCurrency(item.priceAtAdd, item.priceAtAdd < 10 ? 2 : 0)}</MonoText>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-secondary">Since add</p>
                    <MonoText className={`pt-2 block text-[0.92rem] ${item.changeTone}`}>{formatCurrency(item.changeSinceAdd, item.changeSinceAdd % 1 === 0 ? 0 : 2)}</MonoText>
                  </div>
                  <button className="button-ghost opacity-100 md:opacity-0 md:group-hover:opacity-100" onClick={() => removeCoin(item.symbol)} type="button">
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="space-y-3 text-center">
            <Badge>Your watchlist is empty</Badge>
            <p className="text-[0.95rem] text-text-primary">Add a coin above to start tracking.</p>
          </div>
        </Panel>
      )}
    </div>
  );
}
