export const PLAYGROUND_ACCORDION_LAYOUTS = {
  classic: {
    kind: "stacked",
    children: [
      {
        kind: "section",
        id: "release",
        title: "Release controls",
        description: "Core metadata and rollout controls.",
        defaultOpen: true,
        children: [
          {
            kind: "group",
            columns: 2,
            children: [
              { kind: "field", field: "release-name" },
              { kind: "field", field: "deployment-channel" },
              { kind: "field", field: "training-epochs" },
              { kind: "field", field: "evaluation-date" },
              { kind: "field", field: "confidence-threshold" },
              { kind: "field", field: "human-approval" },
              { kind: "field", field: "channel-prototype" },
              { kind: "field", field: "channel-canary" },
              { kind: "field", field: "channel-regional" },
              { kind: "field", field: "channel-production" },
            ],
          },
        ],
      },
      {
        kind: "section",
        id: "signals",
        title: "Signals",
        description: "Time-series and operational feature inputs.",
        defaultOpen: true,
        children: [
          { kind: "field", field: "daily-signal" },
          {
            kind: "group",
            columns: 2,
            children: [
              { kind: "field", field: "channel-performance" },
              { kind: "field", field: "feature-flags" },
            ],
          },
          { kind: "field", field: "version-scores" },
        ],
      },
      {
        kind: "section",
        id: "reports",
        title: "Reports",
        description: "Backend outputs and aggregate comparison.",
        defaultOpen: false,
        children: [
          { kind: "report", report: "backend-compare" },
          {
            kind: "group",
            columns: 2,
            children: [
              { kind: "report", report: "baseline-recommendation" },
              { kind: "report", report: "baseline-latency" },
              { kind: "report", report: "optimistic-recommendation" },
              { kind: "report", report: "optimistic-latency" },
              { kind: "report", report: "conservative-recommendation" },
              { kind: "report", report: "conservative-latency" },
            ],
          },
        ],
      },
    ],
  },
  review: {
    kind: "stacked",
    children: [
      {
        kind: "section",
        id: "identity",
        title: "Identity",
        description: "Naming, thresholds and approval.",
        defaultOpen: true,
        children: [
          {
            kind: "group",
            columns: 3,
            children: [
              { kind: "field", field: "release-name" },
              { kind: "field", field: "training-epochs" },
              { kind: "field", field: "confidence-threshold" },
              { kind: "field", field: "human-approval" },
              { kind: "field", field: "deployment-channel" },
              { kind: "field", field: "evaluation-date" },
              { kind: "field", field: "channel-prototype" },
              { kind: "field", field: "channel-canary" },
              { kind: "field", field: "channel-regional" },
              { kind: "field", field: "channel-production" },
            ],
          },
        ],
      },
      {
        kind: "section",
        id: "evidence",
        title: "Evidence",
        description: "Observed data grouped by source.",
        defaultOpen: false,
        children: [
          { kind: "field", field: "daily-signal" },
          { kind: "field", field: "channel-performance" },
          { kind: "field", field: "feature-flags" },
          { kind: "field", field: "version-scores" },
        ],
      },
      {
        kind: "section",
        id: "decision",
        title: "Decision",
        description: "Aggregate and per-backend reports for final review.",
        defaultOpen: false,
        children: [
          { kind: "report", report: "backend-compare" },
          {
            kind: "group",
            columns: 3,
            children: [
              { kind: "report", report: "baseline-recommendation" },
              { kind: "report", report: "optimistic-recommendation" },
              { kind: "report", report: "conservative-recommendation" },
              { kind: "report", report: "baseline-latency" },
              { kind: "report", report: "optimistic-latency" },
              { kind: "report", report: "conservative-latency" },
            ],
          },
        ],
      },
    ],
  },
};
