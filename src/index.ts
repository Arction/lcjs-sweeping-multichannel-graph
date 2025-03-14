import {
  lightningChart,
  Themes,
  AxisTickStrategies,
  emptyLine,
  emptyFill,
} from "@lightningchart/lcjs";

const CONFIG = {
  timeView: 5_000, // milliseconds
  sampleRate: 1_000, // Hz, samples per second
  chCount: 100,
  axisCount: 10,
};
const sampleCount = Math.ceil((CONFIG.sampleRate * CONFIG.timeView) / 1000);

const lc = lightningChart({
  // Place license key here
  license: "",
});
const chart = lc
  .ChartXY({
    theme: Themes.darkGold,
  })
  .setTitle(
    `Sweeping Real-Time Graph ${CONFIG.chCount} channels ${CONFIG.sampleRate} Hz`
  )
  .setCursorMode(undefined);
chart.axisX
  .setDefaultInterval({ start: 0, end: CONFIG.timeView })
  .setTickStrategy(AxisTickStrategies.Empty);
chart.axisY.dispose();

const axes = Array.from({ length: CONFIG.axisCount }, (_, i) =>
  chart
    .addAxisY({ iStack: -i })
    .setStrokeStyle(emptyLine)
    .setTickStrategy(AxisTickStrategies.Empty)
);

const channels = Array.from({ length: CONFIG.chCount }, (_, i) => {
  const axisY = axes[i % axes.length];
  const series = chart
    .addPointLineAreaSeries({ axisY, dataPattern: "ProgressiveX" })
    .setAreaFillStyle(emptyFill)
    .setPointFillStyle(emptyFill)
    .setStrokeStyle((stroke) => stroke.setThickness(-1))
    .setMaxSampleCount(sampleCount);
  return { series };
});

// Keep track which index last existing sample is positioned at
let lastSampleIndex = -1;
const handleIncomingData = (yValues: number[][]) => {
  const count = yValues[0].length;
  // Calculate which samples can be appended to right side, and which have to be started again from left side of sweeping history.
  const space = sampleCount - (lastSampleIndex + 1);
  // Put first set of samples to extend previous samples.
  const countRight = Math.min(space, count);
  channels.forEach((ch, i) =>
    ch.series.alterSamples(lastSampleIndex + 1, {
      yValues: yValues[i],
      count: countRight,
    })
  );
  lastSampleIndex += countRight;
  if (countRight < space) {
    // Remove the few oldest points that would be connected to last points pushed just now, to leave a gap between newest and oldest data.
    const gapCount = Math.min(
      Math.round(sampleCount * 0.01),
      sampleCount - (lastSampleIndex + 1)
    );
    // Gap is displayed by using NaN as Y values.
    channels.forEach((ch, i) =>
      ch.series.alterSamples(lastSampleIndex + 1, {
        yValues: new Array(gapCount).fill(Number.NaN),
      })
    );
  }
  // Put other samples (if any) to beginning of sweeping history.
  const countLeft = count - countRight;
  if (countLeft > 0) {
    channels.forEach((ch, i) =>
      ch.series.alterSamples(0, { yValues: yValues[i], offset: countRight })
    );
    lastSampleIndex = countLeft - 1;
  }

  // NOTE: Case not handled if remaining data would somehow immediately complete another full sweep.
};

// Push random data to chart every ~16 milliseconds (60 FPS)
let tLast = performance.now();
let dModulus = 0;
let counter = 0;
const generatorTypes = [
  (x: number) => Math.sin(x / 100),
  (x: number) => Math.cos(x / 400),
  (x: number) => Math.sin(x / 50),
];
const generators = Array.from({ length: channels.length }, (_, i) => {
  const rand = Math.random();
  return (x: number) => generatorTypes[i % generatorTypes.length](x) * rand;
});
const streamRandomExampleData = () => {
  const tNow = performance.now();
  const tDelta = Math.min(tNow - tLast, 2000); // if tab is inactive for more than 2 seconds, prevent adding crazy amounts of data in attempt to catch up.
  let pointsToAdd = (tDelta * CONFIG.sampleRate) / 1000 + dModulus;
  dModulus = pointsToAdd % 1;
  pointsToAdd = Math.floor(pointsToAdd);
  tLast = tNow;
  //
  const yValues: number[][] = channels.map((_, ch) => {
    const ys: number[] = new Array(pointsToAdd);
    for (let i = 0; i < pointsToAdd; i += 1) {
      const y = generators[ch % generators.length](counter + i);
      ys[i] = y;
    }
    return ys;
  });
  counter += pointsToAdd;
  handleIncomingData(yValues);
  //
  requestAnimationFrame(streamRandomExampleData);
};
streamRandomExampleData();

// Measure FPS
(() => {
  const title = chart.getTitle();
  let frames = 0;
  let tPrevUpdate = performance.now();
  const _updt = () => {
    frames += 1;
    const tNow = performance.now();
    if (tNow - tPrevUpdate > 2000) {
      const fps = 1000 / ((tNow - tPrevUpdate) / frames);
      chart.setTitle(`${title} FPS=${fps.toFixed(1)}`);
      frames = 0;
      tPrevUpdate = tNow;
    }
    requestAnimationFrame(_updt);
  };
  _updt();
})();
