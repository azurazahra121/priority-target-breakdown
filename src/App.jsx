import { useState, useEffect } from "react";

const PROXY_BASE = "/.netlify/functions/notion-proxy";

const COLORS = {
  bg: "#0D1117",
  surface: "#161B22",
  surfaceHover: "#1C2333",
  border: "#21262D",
  indigo: "#6366F1",
  indigoMuted: "#3730A3",
  amber: "#F59E0B",
  amberMuted: "#78350F",
  green: "#10B981",
  red: "#EF4444",
  textPrimary: "#F0F6FC",
  textSecondary: "#8B949E",
  textMuted: "#484F58",
};

const PRIORITY_CONFIG = {
  Critical: { color: COLORS.red, label: "CRITICAL" },
  High: { color: COLORS.amber, label: "HIGH" },
  Medium: { color: COLORS.indigo, label: "MED" },
  Low: { color: COLORS.textMuted, label: "LOW" },
};

const MOCK_GOALS = [
  {
    id: "q1",
    title: "Launch 8-Project AI Portfolio",
    quarter: "Q3 2026",
    progress: 62,
    milestones: [
      {
        id: "m1",
        title: "Complete VelocityIQ v2",
        month: "July",
        priority: "Critical",
        status: "In Progress",
        tasks: [
          { id: "t1", title: "Add trend chart module", day: "Today", est: "2h", status: "Todo", priority: "Critical" },
          { id: "t2", title: "Deploy to Netlify", day: "Tomorrow", est: "30m", status: "Todo", priority: "High" },
        ],
      },
      {
        id: "m2",
        title: "Publish TSMC Analysis Article",
        month: "July",
        priority: "High",
        status: "Todo",
        tasks: [
          { id: "t3", title: "Draft Section 2: Geopolitical Risk", day: "Today", est: "1.5h", status: "Todo", priority: "High" },
          { id: "t4", title: "Final edit + Medium publish", day: "Thu", est: "1h", status: "Todo", priority: "Medium" },
        ],
      },
      {
        id: "m3",
        title: "LinkedIn 3-Post Cadence",
        month: "July",
        priority: "Medium",
        status: "Done",
        tasks: [
          { id: "t5", title: "Post VelocityIQ case study", day: "Done", est: "45m", status: "Done", priority: "Medium" },
        ],
      },
    ],
  },
  {
    id: "q2",
    title: "Establish Automation Income Stream",
    quarter: "Q3 2026",
    progress: 15,
    milestones: [
      {
        id: "m4",
        title: "Define service offer + pricing",
        month: "August",
        priority: "Critical",
        status: "Todo",
        tasks: [
          { id: "t6", title: "Draft 3-tier service page copy", day: "This Week", est: "2h", status: "Todo", priority: "Critical" },
        ],
      },
    ],
  },
];

function ProgressRing({ value, size = 48, stroke = 4, color = COLORS.indigo }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.border} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function PriorityBadge({ level }) {
  const cfg = PRIORITY_CONFIG[level] || PRIORITY_CONFIG.Medium;
  return (
    <span style={{
      fontFamily: "monospace",
      fontSize: "10px",
      fontWeight: 700,
      color: cfg.color,
      border: `1px solid ${cfg.color}`,
      borderRadius: "3px",
      padding: "1px 5px",
      letterSpacing: "0.08em",
    }}>
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }) {
  const color = status === "Done" ? COLORS.green : status === "In Progress" ? COLORS.indigo : COLORS.textMuted;
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, marginRight: 6, flexShrink: 0, marginTop: 2 }} />;
}

function TaskRow({ task, onToggle }) {
  const done = task.status === "Done";
  return (
    <div
      onClick={() => onToggle(task.id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 12px",
        borderRadius: 6,
        background: done ? "transparent" : COLORS.surface,
        border: `1px solid ${done ? COLORS.textMuted + "30" : COLORS.border}`,
        marginBottom: 6,
        cursor: "pointer",
        opacity: done ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 4, border: `2px solid ${done ? COLORS.green : COLORS.border}`,
        background: done ? COLORS.green : "transparent", flexShrink: 0, marginTop: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: 13, color: COLORS.textPrimary,
          textDecoration: done ? "line-through" : "none",
          lineHeight: 1.4,
        }}>
          {task.title}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.textSecondary }}>{task.day}</span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.indigo }}>{task.est}</span>
          <PriorityBadge level={task.priority} />
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, onTaskToggle }) {
  const [expanded, setExpanded] = useState(milestone.status === "In Progress");
  const completedTasks = milestone.tasks.filter(t => t.status === "Done").length;
  return (
    <div style={{
      borderLeft: `2px solid ${milestone.status === "Done" ? COLORS.green : COLORS.indigoMuted}`,
      paddingLeft: 14,
      marginBottom: 16,
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: expanded ? 10 : 0 }}
      >
        <StatusDot status={milestone.status} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
            {milestone.title}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
            {milestone.month} — {completedTasks}/{milestone.tasks.length} tasks
          </div>
        </div>
        <PriorityBadge level={milestone.priority} />
        <span style={{ color: COLORS.textMuted, fontSize: 12, marginLeft: 4 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 8 }}>
          {milestone.tasks.map(task => (
            <TaskRow key={task.id} task={task} onToggle={onTaskToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onTaskToggle }) {
  const [expanded, setExpanded] = useState(true);
  const progressColor = goal.progress >= 70 ? COLORS.green : goal.progress >= 30 ? COLORS.indigo : COLORS.amber;
  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px",
          cursor: "pointer",
          background: expanded ? COLORS.surfaceHover : "transparent",
        }}
      >
        <ProgressRing value={goal.progress} color={progressColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.3 }}>
            {goal.title}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.textSecondary, marginTop: 3 }}>
            {goal.quarter} — {goal.progress}% complete
          </div>
        </div>
        <span style={{ color: COLORS.textMuted, fontSize: 13 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "4px 16px 16px" }}>
          <div style={{
            height: 1, background: COLORS.border, margin: "0 0 14px",
          }} />
          {goal.milestones.map(ms => (
            <MilestoneCard key={ms.id} milestone={ms} onTaskToggle={onTaskToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddGoalModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [quarter, setQuarter] = useState("Q3 2026");
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000099", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: COLORS.surface, borderRadius: "14px 14px 0 0",
        padding: 24, width: "100%", maxWidth: 480,
        border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 20 }}>
          New Quarterly Goal
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Goal title..."
          style={{
            width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: "10px 12px", color: COLORS.textPrimary,
            fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 12,
            outline: "none", boxSizing: "border-box",
          }}
        />
        <select
          value={quarter}
          onChange={e => setQuarter(e.target.value)}
          style={{
            width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: "10px 12px", color: COLORS.textPrimary,
            fontFamily: "monospace", fontSize: 13, marginBottom: 20, outline: "none",
          }}
        >
          {["Q3 2026", "Q4 2026", "Q1 2027"].map(q => <option key={q}>{q}</option>)}
        </select>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", borderRadius: 8,
              background: "transparent", border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif", fontSize: 13, cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={() => { if (title.trim()) { onAdd({ title, quarter }); onClose(); } }}
            style={{
              flex: 1, padding: "11px", borderRadius: 8,
              background: COLORS.indigo, border: "none",
              color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >Add Goal</button>
        </div>
      </div>
    </div>
  );
}

export default function PriorityTargetBreakdown() {
  const [goals, setGoals] = useState(MOCK_GOALS);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("local");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  // Notion proxy fetch — wired for Netlify serverless
  const fetchFromNotion = async () => {
    setLoading(true);
    setSyncStatus("syncing");
    try {
      const res = await fetch(`${PROXY_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query",
          resource: "goals",
        }),
      });
      if (!res.ok) throw new Error("Proxy error");
      const data = await res.json();
      if (data?.goals?.length) {
        setGoals(data.goals);
        setSyncStatus("synced");
      } else {
        setSyncStatus("local");
      }
    } catch {
      setSyncStatus("local");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId) => {
    setGoals(prev => prev.map(g => ({
      ...g,
      milestones: g.milestones.map(ms => ({
        ...ms,
        tasks: ms.tasks.map(t =>
          t.id === taskId
            ? { ...t, status: t.status === "Done" ? "Todo" : "Done" }
            : t
        ),
      })),
    })));
  };

  const handleAddGoal = ({ title, quarter }) => {
    const newGoal = {
      id: `q${Date.now()}`,
      title,
      quarter,
      progress: 0,
      milestones: [],
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const FILTERS = ["All", "Critical", "In Progress", "Todo", "Done"];
  const filteredGoals = activeFilter === "All" ? goals : goals.map(g => ({
    ...g,
    milestones: g.milestones.filter(ms => {
      if (activeFilter === "Critical") return ms.priority === "Critical";
      if (activeFilter === "In Progress") return ms.status === "In Progress";
      if (activeFilter === "Todo") return ms.status === "Todo";
      if (activeFilter === "Done") return ms.status === "Done";
      return true;
    }),
  })).filter(g => g.milestones.length > 0);

  const totalTasks = goals.flatMap(g => g.milestones.flatMap(m => m.tasks)).length;
  const doneTasks = goals.flatMap(g => g.milestones.flatMap(m => m.tasks)).filter(t => t.status === "Done").length;
  const todayTasks = goals.flatMap(g => g.milestones.flatMap(m => m.tasks)).filter(t => t.day === "Today" && t.status !== "Done");

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      fontFamily: "'Inter', sans-serif",
      maxWidth: 480, margin: "0 auto",
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        paddingBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.indigo, letterSpacing: "0.12em", marginBottom: 4 }}>
              PRIORITY & TARGET BREAKDOWN
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1.2 }}>
              Q3 Execution Hub
            </div>
          </div>
          <button
            onClick={fetchFromNotion}
            disabled={loading}
            style={{
              background: "transparent", border: `1px solid ${COLORS.border}`,
              borderRadius: 8, padding: "7px 12px",
              color: syncStatus === "synced" ? COLORS.green : COLORS.textSecondary,
              fontFamily: "monospace", fontSize: 11, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: syncStatus === "synced" ? COLORS.green : syncStatus === "syncing" ? COLORS.amber : COLORS.textMuted }} />
            {loading ? "SYNCING" : syncStatus === "synced" ? "SYNCED" : "SYNC"}
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {[
            { label: "GOALS", value: goals.length, color: COLORS.indigo },
            { label: "TASKS DONE", value: `${doneTasks}/${totalTasks}`, color: COLORS.green },
            { label: "TODAY", value: todayTasks.length, color: COLORS.amber },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, background: COLORS.surface, borderRadius: 8,
              padding: "10px 0", textAlign: "center",
              border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: COLORS.textMuted, marginTop: 2, letterSpacing: "0.08em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Priority Strip */}
      {todayTasks.length > 0 && (
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.amber, letterSpacing: "0.1em", marginBottom: 10 }}>
            TODAY'S CRITICAL ACTIONS
          </div>
          {todayTasks.map(task => (
            <div key={task.id} style={{
              background: COLORS.amberMuted + "30",
              border: `1px solid ${COLORS.amber}40`,
              borderLeft: `3px solid ${COLORS.amber}`,
              borderRadius: 8, padding: "10px 12px", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>{task.title}</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.amber, marginTop: 3 }}>{task.est}</div>
              </div>
              <PriorityBadge level={task.priority} />
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ padding: "16px 16px 0", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 0 }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              flexShrink: 0,
              padding: "6px 12px", borderRadius: 20,
              background: activeFilter === f ? COLORS.indigo : COLORS.surface,
              border: `1px solid ${activeFilter === f ? COLORS.indigo : COLORS.border}`,
              color: activeFilter === f ? "#fff" : COLORS.textSecondary,
              fontFamily: "monospace", fontSize: 11, cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Goal Cards */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", marginBottom: 12 }}>
          QUARTERLY GOALS — {filteredGoals.length} ACTIVE
        </div>
        {filteredGoals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onTaskToggle={handleTaskToggle} />
        ))}
        {filteredGoals.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textMuted, fontFamily: "monospace", fontSize: 12 }}>
            NO ITEMS MATCH THIS FILTER
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: "50%",
          background: COLORS.indigo, border: "none",
          color: "#fff", fontSize: 24, cursor: "pointer",
          boxShadow: `0 4px 20px ${COLORS.indigo}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50,
        }}
      >
        +
      </button>

      {showAddModal && (
        <AddGoalModal onClose={() => setShowAddModal(false)} onAdd={handleAddGoal} />
      )}
    </div>
  );
}