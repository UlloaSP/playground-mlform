export const PLAYGROUND_WIZARD_LAYOUTS = {
  concise: {
    kind: "wizard",
    steps: [
      {
        id: "profile",
        title: "Release profile",
        description: "Core release metadata and primary rollout controls.",
        children: [
          {
            kind: "group",
            columns: 2,
            children: [
              { kind: "field", field: "release-name" },
              { kind: "field", field: "training-epochs" },
              { kind: "field", field: "confidence-threshold" },
              { kind: "field", field: "human-approval" },
            ],
          },
        ],
      },
      {
        id: "targeting",
        title: "Targeting",
        description: "Deployment channel and execution date.",
        children: [
          {
            kind: "group",
            columns: 2,
            children: [
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
        id: "signals",
        title: "Signals",
        description: "Series inputs and final comparison report.",
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
          { kind: "report", report: "backend-compare" },
        ],
      },
    ],
  },
  review: {
    kind: "wizard",
    steps: [
      {
        id: "identity",
        title: "Identity",
        description: "Naming, confidence and human gate.",
        children: [
          {
            kind: "section",
            title: "Basics",
            children: [
              { kind: "field", field: "release-name" },
              {
                kind: "group",
                columns: 3,
                children: [
                  { kind: "field", field: "training-epochs" },
                  { kind: "field", field: "confidence-threshold" },
                  { kind: "field", field: "human-approval" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "rollout",
        title: "Rollout plan",
        description: "Where and when release should go live.",
        children: [
          {
            kind: "group",
            columns: 2,
            children: [
              { kind: "field", field: "deployment-channel" },
              { kind: "field", field: "evaluation-date" },
              { kind: "field", field: "channel-prototype" },
              { kind: "field", field: "channel-canary" },
              { kind: "field", field: "channel-regional" },
              { kind: "field", field: "channel-production" },
            ],
          },
          { kind: "field", field: "channel-performance" },
        ],
      },
      {
        id: "observability",
        title: "Observed signals",
        description: "Time-series and feature rollout signals.",
        children: [
          { kind: "field", field: "daily-signal" },
          {
            kind: "group",
            columns: 2,
            children: [
              { kind: "field", field: "feature-flags" },
              { kind: "field", field: "version-scores" },
            ],
          },
        ],
      },
      {
        id: "review",
        title: "Review reports",
        description: "Compare all backend outputs before submit result review.",
        children: [
          {
            kind: "section",
            title: "Per-backend reports",
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
            ],
          },
          { kind: "report", report: "backend-compare" },
        ],
      },
    ],
  },
  reports: {
    kind: "wizard",
    steps: [
      {
        id: "inputs-a",
        title: "Core controls",
        description: "General controls first.",
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
        id: "inputs-b",
        title: "Operational signals",
        description: "High-cardinality inputs on dedicated step.",
        children: [
          { kind: "field", field: "daily-signal" },
          { kind: "field", field: "channel-performance" },
          { kind: "field", field: "feature-flags" },
          { kind: "field", field: "version-scores" },
        ],
      },
      {
        id: "reports",
        title: "Reports pane inside wizard",
        description: "Final step with all reports grouped by backend and aggregate view.",
        children: [
          {
            kind: "section",
            title: "Decision",
            children: [
              {
                kind: "group",
                columns: 3,
                children: [
                  { kind: "report", report: "baseline-recommendation" },
                  { kind: "report", report: "optimistic-recommendation" },
                  { kind: "report", report: "conservative-recommendation" },
                ],
              },
            ],
          },
          {
            kind: "section",
            title: "Latency",
            children: [
              {
                kind: "group",
                columns: 3,
                children: [
                  { kind: "report", report: "baseline-latency" },
                  { kind: "report", report: "optimistic-latency" },
                  { kind: "report", report: "conservative-latency" },
                ],
              },
            ],
          },
          { kind: "report", report: "backend-compare" },
        ],
      },
    ],
  },
};
