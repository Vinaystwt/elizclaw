export type TaskRecord = {
  id: number;
  name: string;
  type: string;
  schedule: string;
  config?: Record<string, unknown> | null;
  is_active: number;
  created_at?: string | null;
  updated_at?: string | null;
  last_run?: string | null;
  next_run?: string | null;
  _error?: string | null;
  _status?: string | null;
};

export type LogRecord = {
  id?: string;
  task_id?: number;
  task_name?: string | null;
  task_type?: string | null;
  type?: string | null;
  status?: string | null;
  output?: string | null;
  executed_at?: string | null;
};

export type DigestRecord = {
  timestamp?: string;
  brief?: string;
  topAlert?: string;
  nextScheduled?: string;
};

export type ReportRecord = {
  successRate?: number;
  uptime?: number;
  mostUsedAction?: string;
  mostUsedName?: string;
  mostUsedCount?: number;
  failed?: number;
  recentFailures?: Array<{ task?: string; taskName?: string; error?: string; output?: string; time?: string; executed_at?: string }>;
  successful?: number;
  totalExecuted?: number;
  totalTasks?: number;
  activeTasks?: number;
  tasksRunToday?: number;
  todayCount?: number;
};

export type WatchlistItem = {
  coin: string;
  symbol: string;
  addedAt: string;
  currentPrice: number;
  priceAtAdd: number;
  change24h: number;
};
