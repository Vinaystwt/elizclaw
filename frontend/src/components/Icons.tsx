import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

function svgClass(className?: string) {
  return cn("h-[1.05rem] w-[1.05rem]", className);
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M4 4h7v7H4V4Zm9 0h7v11h-7V4ZM4 13h7v7H4v-7Zm9 4h7v3h-7v-3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function TasksIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M8 7h12M8 12h12M8 17h12M4.5 7h.01M4.5 12h.01M4.5 17h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function ActivityIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M4 13h4l2-6 4 10 2-4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function WatchlistIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="m12 3 2.7 5.48 6.05.88-4.37 4.26 1.03 6.02L12 16.82l-5.41 2.85 1.03-6.02L3.25 9.36l6.05-.88L12 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function ReportIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M5 19V8m7 11V5m7 14v-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M12 9.5A2.5 2.5 0 1 0 12 14.5A2.5 2.5 0 1 0 12 9.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.83 2.83l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.91V20a2 2 0 1 1-4 0v-.15a1 1 0 0 0-.66-.95 1 1 0 0 0-1.08.24l-.1.1a2 2 0 1 1-2.83-2.83l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.91-.6H4a2 2 0 1 1 0-4h.15a1 1 0 0 0 .95-.66 1 1 0 0 0-.24-1.08l-.1-.1a2 2 0 1 1 2.83-2.83l.1.1a1 1 0 0 0 1.1.2H8.9A1 1 0 0 0 9.5 4.15V4a2 2 0 1 1 4 0v.15a1 1 0 0 0 .66.95 1 1 0 0 0 1.08-.24l.1-.1a2 2 0 1 1 2.83 2.83l-.1.1a1 1 0 0 0-.2 1.1v.11a1 1 0 0 0 .91.6H20a2 2 0 1 1 0 4h-.15a1 1 0 0 0-.95.66V15Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M12 20V10m0 0 4 4m-4-4-4 4M5 5h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M17 17a7 7 0 0 1-11.95-2M7 7a7 7 0 0 1 11.95 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={svgClass(className)} fill="none" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}
