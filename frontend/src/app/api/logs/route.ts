import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Resolve data directory — matches tasks/route.ts DATA_DIR env var
const DATA = process.env.DATA_DIR || path.join(process.cwd(), '../data');
const STORE = path.join(DATA, 'store.json');

function readStore(): any {
  if (!fs.existsSync(STORE)) return {};
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch { return {}; }
}

export async function GET(req: NextRequest) {
  try {
    const store = readStore();
    const logs = store.LOGS || [];
    const tasks = store.TASKS || [];
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '50');

    // Enrich logs with task names/types for the UI
    const enrichedLogs = logs.slice(-limit).reverse().map((l: any) => {
      const task = tasks.find((t: any) => t.id === l.task_id);
      return { ...l, task_name: task?.name || null, task_type: task?.type || null };
    });

    // Today's stats for dashboard stat cards
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter((l: any) => l.executed_at?.startsWith(today));
    const stats = {
      total: todayLogs.length,
      success: todayLogs.filter((l: any) => l.status === 'success').length,
      failed: todayLogs.filter((l: any) => l.status === 'failed').length,
      running: todayLogs.filter((l: any) => l.status === 'running').length,
    };

    return NextResponse.json({ logs: enrichedLogs, stats, unreadNotifications: [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
