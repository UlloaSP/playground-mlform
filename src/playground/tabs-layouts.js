export const PLAYGROUND_TABS_LAYOUTS = {
  classic: {
    kind: "tabs",
    tabs: [
      {
        id: "basics",
        title: "Basics",
        description: "Core release controls.",
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
        id: "signals",
        title: "Signals",
        description: "Operational series fields.",
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
        id: "reports",
        title: "Reports",
        description: "Backend outputs and aggregate comparison.",
        children: [
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
          { kind: "report", report: "backend-compare" },
        ],
      },
    ],
  },
  compact: {
    kind: "tabs",
    tabs: [
      {
        id: "inputs",
        title: "Inputs",
        description: "All fields grouped in one place.",
        children: [
          {
            kind: "section",
            title: "Release",
            children: [
              {
                kind: "group",
                columns: 3,
                children: [
                  { kind: "field", field: "release-name" },
                  { kind: "field", field: "deployment-channel" },
                  { kind: "field", field: "evaluation-date" },
                  { kind: "field", field: "training-epochs" },
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
            title: "Series",
            children: [
              { kind: "field", field: "daily-signal" },
              { kind: "field", field: "channel-performance" },
              { kind: "field", field: "feature-flags" },
              { kind: "field", field: "version-scores" },
            ],
          },
        ],
      },
      {
        id: "compare",
        title: "Compare",
        description: "Aggregate and per-backend reports.",
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
