# LightningChart JS Multichannel Sweeping Graph

Showcase project of displaying 100 sweeping trends with 1000 Hz data rate each in one view.

Based on this [online example](https://lightningchart.com/js-charts/interactive-examples/examples/lcjs-example-0041-sweepingLineChartNew.html)

LightningChart JS is much more optimized for scrolling time windows (for example, [this example](https://lightningchart.com/js-charts/interactive-examples/examples/lcjs-example-0028-multiChannelLineProgressiveOwnAxes.html)) but as seen in this example the performance is still amazing even for sweeping graphs.

100 channels with 1000 Hz data rate means a total of 100_000 new data points visualized **every second**.

With a different approach it is also possible to implement significantly more optimized sweeping graph rendering using LightningChart JS. However, the application code is slightly more complicated. Example of this can be found [here](https://lightningchart.com/js-charts/interactive-examples/examples/lcjs-example-0033-sweepingLineDashboard.html).

To view the example:

1. Install Node.JS
2. Run `npm install`
3. Run `npm start`
4. Open browser and navigate to http://localhost:8080
5. Write your license key (trial or purchased license) to `src/index.ts`

For more information about LightningChart JS please refer to our [website](https://lightningchart.com/).
