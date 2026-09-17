// Balance knobs. Never inline these numbers in core logic (ai/ARCHITECTURE.md).
export const CONFIG = {
  tileSize: 32,
  simTickHz: 60,

  bombFuseSeconds: 2.5,
  bombPulseWarningSeconds: 0.75, // fuse remaining at which the bomb starts pulsing
  explosionLifetimeSeconds: 0.5,

  defaultFire: 1,
  defaultMaxBombs: 1,
  defaultSpeed: 1,

  fireCap: 6,
  maxBombsCap: 6,
  speedCap: 3,
  speedTilesPerSecondBase: 3.2, // speed stat 1 -> this many tiles/sec
  speedTilesPerSecondStep: 0.9, // added per speed stat point above 1

  enemySpeedTilesPerSecond: 2.2,

  restartDelaySeconds: 0, // instant restart; UI may add a short input-buffer only
} as const;
