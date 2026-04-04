import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Resolve data directory — works both locally and in Docker
// In Docker, DATA_DIR is set to /app/data; otherwise relative to repo root
const DATA = process.env.DATA_DIR || path.join(process.cwd(), '../data');
const STORE = path.join(DATA, 'store.json');

function readStore(): any {
  if (!fs.existsSync(STORE)) return {};
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch { return {}; }
}

function writeStore(d: any) {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(d, null, 2));
}

export async function GET() {
  try {
    const store = readStore();
    const tasks = store.TASKS || [];
    return NextResponse.json({ tasks, activeCount: tasks.filter((t: any) => t.is_active).length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, description, schedule, config, condition } = body;
    if (!name || !type || !schedule) return NextResponse.json({ error: 'name, type, schedule required' }, { status: 400 });

    const store = readStore();
    const tasks = store.TASKS || [];
    const nextRun = calcNext(schedule);
    const task = { id: tasks.length + 1, name, type, description: description || null, schedule, config: config || null, condition: condition || null, is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_run: null, next_run: nextRun?.toISOString() || null };
    tasks.push(task);
    store.TASKS = tasks;
    writeStore(store);
    return NextResponse.json({ task }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const store = readStore();
    const tasks = store.TASKS || [];
    const idx = tasks.findIndex((t: any) => t.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    Object.assign(tasks[idx], updates, { updated_at: new Date().toISOString() });
    store.TASKS = tasks;
    writeStore(store);
    return NextResponse.json({ task: tasks[idx] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(new URL(req.url).searchParams.get('id') || '0');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const store = readStore();
    store.TASKS = (store.TASKS || []).filter((t: any) => t.id !== id);
    writeStore(store);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function calcNext(schedule: string): Date | null {
  const now = new Date();
  if (schedule.includes('every day') || schedule.includes('daily')) {
    const m = schedule.match(/at\s*(\d{1,2}):(\d{2})/);
    if (m) { const n = new Date(now); n.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0); if (n <= now) n.setDate(n.getDate() + 1); return n; }
    const n = new Date(now); n.setDate(n.getDate() + 1); n.setHours(0, 0, 0, 0); return n;
  }
  if (schedule.includes('hour')) { const m = schedule.match(/(\d+)/); return new Date(now.getTime() + (m ? parseInt(m[1]) : 1) * 3600000); }
  if (schedule.includes('week')) { const n = new Date(now); n.setDate(n.getDate() + 7); return n; }
  return new Date(now.getTime() + 3600000);
}
