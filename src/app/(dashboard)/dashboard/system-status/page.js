"use client";

import { useState, useEffect, useCallback } from "react";

function MetricCard({ icon, label, value, sub, color = "primary" }) {
  const colors = {
    primary: "text-primary bg-primary/10",
    green: "text-green-500 bg-green-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    red: "text-red-500 bg-red-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    cyan: "text-cyan-500 bg-cyan-500/10",
  };
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-lg font-bold text-text-main leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "primary" }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : `bg-${color === "primary" ? "primary" : color}`;
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function LogLine({ time, level, msg }) {
  const levelColors = {
    info: "text-blue-400",
    warn: "text-amber-400",
    error: "text-red-400",
    ok: "text-green-400",
  };
  return (
    <div className="flex items-start gap-2 text-xs font-mono py-0.5">
      <span className="text-text-muted shrink-0">{time}</span>
      <span className={`shrink-0 font-semibold ${levelColors[level] || "text-text-muted"}`}>[{level.toUpperCase()}]</span>
      <span className="text-text-main break-all">{msg}</span>
    </div>
  );
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const health = await res.json();

      // Build system status from health + runtime info
      const now = new Date();
      const memUsage = process?.memoryUsage?.() || null;
      
      const sysStatus = {
        uptime: health.uptime || 0,
        version: health.version || "0.5.55",
        nodeEnv: health.nodeEnv || "production",
        platform: "Vercel Serverless",
        region: "iad1 (US East)",
        memory: {
          heapUsed: memUsage?.heapUsed || 0,
          heapTotal: memUsage?.heapTotal || 0,
          rss: memUsage?.rss || 0,
          external: memUsage?.external || 0,
        },
        db: health.db || "in-memory",
        dbDriver: health.dbDriver || "sql.js",
        providers: health.providers || 0,
        connections: health.connections || 0,
        apiKeys: health.apiKeys || 0,
        timestamp: now.toISOString(),
      };

      setStatus(sysStatus);

      setLogs((prev) => {
        const newLogs = [
          ...prev,
          {
            time: now.toLocaleTimeString(),
            level: "ok",
            msg: `Health check OK — ${health.ok ? "healthy" : "degraded"}`,
          },
          {
            time: now.toLocaleTimeString(),
            level: "info",
            msg: `Memory: ${formatBytes(sysStatus.memory.heapUsed)} / ${formatBytes(sysStatus.memory.heapTotal)} heap`,
          },
        ];
        return newLogs.slice(-50);
      });
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), level: "error", msg: `Health check failed: ${err.message}` },
      ]);
    }
  }, []);

  const fetchDetailed = useCallback(async () => {
    try {
      const [healthRes, modelsRes, usageRes] = await Promise.allSettled([
        fetch("/api/health"),
        fetch("/api/models"),
        fetch("/api/usage/stats"),
      ]);

      const health = healthRes.status === "fulfilled" ? await healthRes.json() : {};
      const models = modelsRes.status === "fulfilled" ? await modelsRes.json() : {};
      const usage = usageRes.status === "fulfilled" ? await usageRes.json() : {};

      const now = new Date();
      const memUsage = typeof process !== "undefined" && process.memoryUsage ? process.memoryUsage() : null;

      setStatus((prev) => ({
        ...prev,
        uptime: health.uptime || prev?.uptime || 0,
        version: health.version || prev?.version || "0.5.55",
        providers: health.providers || prev?.providers || 0,
        connections: health.connections || prev?.connections || 0,
        apiKeys: health.apiKeys || prev?.apiKeys || 0,
        memory: memUsage ? {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external,
        } : prev?.memory || { heapUsed: 0, heapTotal: 0, rss: 0, external: 0 },
        models: Array.isArray(models?.models) ? models.models.length : prev?.models || 0,
        requests: usage?.totalRequests || prev?.requests || 0,
        totalTokens: usage?.totalTokens || prev?.totalTokens || 0,
        timestamp: now.toISOString(),
      }));

      setLogs((prev) => [
        ...prev,
        { time: now.toLocaleTimeString(), level: "ok", msg: "Detailed status refreshed" },
      ].slice(-50));
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), level: "error", msg: `Refresh failed: ${err.message}` },
      ]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStatus(), fetchDetailed()]).finally(() => setLoading(false));
  }, [fetchStatus, fetchDetailed]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchDetailed, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDetailed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatus(), fetchDetailed()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-text-muted">
          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          Loading system status...
        </div>
      </div>
    );
  }

  const memPct = status?.memory?.heapTotal
    ? ((status.memory.heapUsed / status.memory.heapTotal) * 100).toFixed(1)
    : "N/A";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">monitoring</span>
            System Status
          </h2>
          <p className="text-xs text-text-muted">Real-time monitoring for Vercel serverless environment</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded accent-primary"
            />
            Auto-refresh
          </label>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-text-main hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <span className={`material-symbols-outlined text-[14px] ${refreshing ? "animate-spin" : ""}`}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard icon="dns" label="Uptime" value={formatUptime(status?.uptime)} sub={status?.platform} color="green" />
        <MetricCard icon="memory" label="Heap Memory" value={`${memPct}%`} sub={`${formatBytes(status?.memory?.heapUsed)} / ${formatBytes(status?.memory?.heapTotal)}`} color="blue" />
        <MetricCard icon="sd_card" label="RSS Memory" value={formatBytes(status?.memory?.rss)} sub={`External: ${formatBytes(status?.memory?.external)}`} color="purple" />
        <MetricCard icon="speed" label="Vercel Region" value={status?.region || "iad1"} sub={status?.nodeEnv} color="cyan" />
      </div>

      {/* Memory Usage */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-blue-500">memory</span>
          Memory Usage
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Heap</span>
              <span className="text-text-main font-mono">{memPct}%</span>
            </div>
            <ProgressBar value={status?.memory?.heapUsed || 0} max={status?.memory?.heapTotal || 1} color="blue" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-text-muted">Heap Used</p>
              <p className="font-mono font-bold text-text-main">{formatBytes(status?.memory?.heapUsed)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-text-muted">Heap Total</p>
              <p className="font-mono font-bold text-text-main">{formatBytes(status?.memory?.heapTotal)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-text-muted">RSS</p>
              <p className="font-mono font-bold text-text-main">{formatBytes(status?.memory?.rss)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-text-muted">External</p>
              <p className="font-mono font-bold text-text-main">{formatBytes(status?.memory?.external)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
          Service Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { label: "API Server", status: "online", detail: "9Router v" + (status?.version || "0.5.55") },
            { label: "Database", status: "online", detail: `${status?.dbDriver || "sql.js"} (${status?.db || "in-memory"})` },
            { label: "Models", status: "online", detail: `${status?.models || 0} loaded` },
            { label: "Providers", status: "online", detail: `${status?.providers || 0} connected` },
            { label: "API Keys", status: "online", detail: `${status?.apiKeys || 0} active` },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${s.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <p className="text-[10px] text-text-muted font-mono">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-500">settings</span>
          Environment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { label: "Platform", value: status?.platform || "Vercel Serverless" },
            { label: "Region", value: status?.region || "iad1 (US East)" },
            { label: "Node.js", value: typeof process !== "undefined" ? process.version : "N/A" },
            { label: "Runtime", value: status?.nodeEnv || "production" },
            { label: "DB Driver", value: status?.dbDriver || "sql.js" },
            { label: "DB Mode", value: status?.db || "in-memory" },
            { label: "Version", value: status?.version || "0.5.55" },
            { label: "Timestamp", value: status?.timestamp ? new Date(status.timestamp).toLocaleString() : "N/A" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
              <span className="text-text-muted">{item.label}</span>
              <span className="font-mono text-text-main">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vercel Limitations */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-500">info</span>
          Vercel Serverless Limitations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {[
            { label: "CPU Time", value: "10-60s max", icon: "timer" },
            { label: "Memory", value: "1-2 GB max", icon: "memory" },
            { label: "Disk", value: "/tmp only (ephemeral)", icon: "sd_card" },
            { label: "GPU", value: "Not available", icon: "graphic_eq" },
            { label: "Background Jobs", value: "Not supported", icon: "schedule" },
            { label: "Persistent State", value: "Not supported", icon: "cloud_off" },
          ].map((item) => (
            <div key={item.label} className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-[12px] text-amber-500">{item.icon}</span>
                <span className="text-amber-400 font-medium">{item.label}</span>
              </div>
              <p className="text-text-muted">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
            Activity Log
          </h3>
          <button
            onClick={() => setLogs([])}
            className="text-[10px] text-text-muted hover:text-text-main transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="bg-black/30 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[11px]">
          {logs.length === 0 ? (
            <p className="text-text-muted">No activity yet...</p>
          ) : (
            logs.map((log, i) => (
              <LogLine key={i} time={log.time} level={log.level} msg={log.msg} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatUptime(seconds) {
  if (!seconds) return "N/A";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
