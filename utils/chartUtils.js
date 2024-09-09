import { createChart, ColorType, PriceScaleMode } from 'lightweight-charts';

export const createChartInstance = (container, usePercentage = true) => {
  return createChart(container, {
    layout: {
      background: { type: ColorType.Solid, color: 'white' },
      textColor: 'black',
    },
    grid: {
      vertLines: { color: '#e0e0e0' },
      horzLines: { color: '#e0e0e0' },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: {
      borderVisible: false,
      mode: usePercentage ? PriceScaleMode.Percentage : PriceScaleMode.Normal,
    },
  });
};

export function convertToLocalTime(data) {
  return data.map(item => ({
    ...item,
    time: new Date(item.time * 1000).getTime() / 1000
  }));
}

export const addCandlestickSeries = (chart, data, pricePrecision) => {
  const candleSeries = chart.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
    priceFormat: {
      type: 'price',
      precision: pricePrecision,
      minMove: 1 / Math.pow(10, pricePrecision),
    },
  });

  candleSeries.setData(data.map(item => ({
    time: item.time / 1000,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
  })));

  return candleSeries;
};

export const addLineSeries = (chart, data, color, lineWidth, title) => {
  const lineSeries = chart.addLineSeries({
    color: color,
    lineWidth: lineWidth,
    title: title,
  });
  lineSeries.setData(data);
  return lineSeries;
};

export const calculateAggregatedLine = (componentData, selectedCoins, position) => {
  const relevantComponents = componentData.filter(component =>
    selectedCoins.find(coin => coin.symbol === component.symbol && coin.position === position)
  );

  if (relevantComponents.length === 0) return [];

  const aggregatedData = [];
  for (let i = 0; i < relevantComponents[0].data.length; i++) {
    let sum = 0;
    for (const component of relevantComponents) {
      sum += component.data[i].value - 100;  // Subtract 100 to get the actual percentage change
    }
    aggregatedData.push({
      time: relevantComponents[0].data[i].time,
      value: (sum / relevantComponents.length) + 100  // Add 100 back to normalize
    });
  }

  return aggregatedData;
};

export const updateChartSize = (chart, width, height) => {
  chart.applyOptions({ width, height });
};