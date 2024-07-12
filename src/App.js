import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, PriceScaleMode } from 'lightweight-charts';

const App = () => {
  const [coins, setCoins] = useState([]);
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [basketData, setBasketData] = useState([]);
  const [componentData, setComponentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [resolution, setResolution] = useState('1h');
  const [basketStats, setBasketStats] = useState({
    totalReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    annualizedVolatility: 0,
    individualReturns: []
  });
  const [showComponentLines, setShowComponentLines] = useState(true);
  const [showLongShortLines, setShowLongShortLines] = useState(false);
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    fetchCoinsData();
  }, []);

  const calculateAggregatedLine = useCallback((position) => {
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
  }, [componentData, selectedCoins]);

  useEffect(() => {
    if ((basketData.length > 0 || selectedCoin) && chartContainerRef.current) {
      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      };

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
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
          mode: selectedCoin ? PriceScaleMode.Normal : PriceScaleMode.Percentage,
        },
      });

      if (selectedCoin) {
        const candleSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        candleSeries.setData(selectedCoin.data.map(item => ({
          time: item.time / 1000,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        })));
      } else {
        // Add basket index line
        const basketSeries = chart.addLineSeries({
          color: '#2962FF',
          lineWidth: 3,
          title: 'Basket Index',
        });
        basketSeries.setData(basketData);

        if (showComponentLines) {
          // Add component lines
          const longColors = [
            'rgba(0, 255, 0, 0.7)',
            'rgba(0, 200, 0, 0.7)',
            'rgba(0, 150, 0, 0.7)',
            'rgba(0, 100, 0, 0.7)',
            'rgba(0, 50, 0, 0.7)'
          ];
          const shortColors = [
            'rgba(255, 0, 0, 0.7)',
            'rgba(200, 0, 0, 0.7)',
            'rgba(150, 0, 0, 0.7)',
            'rgba(100, 0, 0, 0.7)',
            'rgba(50, 0, 0, 0.7)'
          ];

          let longIndex = 0;
          let shortIndex = 0;

          componentData.forEach((component) => {
            const coin = selectedCoins.find(c => c.symbol === component.symbol);
            if (!coin) {
              console.warn(`Coin not found for component: ${component.symbol}`);
              return;
            }
            const isLong = coin.position === 'long';
            const colorArray = isLong ? longColors : shortColors;
            const colorIndex = isLong ? longIndex++ : shortIndex++;

            const componentSeries = chart.addLineSeries({
              color: colorArray[colorIndex % colorArray.length],
              lineWidth: 1,
              title: component.symbol,
            });
            componentSeries.setData(component.data);
          });
        }

        if (showLongShortLines) {
          // Add longs line
          const longsSeries = chart.addLineSeries({
            color: 'rgba(0, 255, 0, 0.8)',
            lineWidth: 2,
            title: 'Longs',
          });
          longsSeries.setData(calculateAggregatedLine('long'));

          // Add shorts line
          const shortsSeries = chart.addLineSeries({
            color: 'rgba(255, 0, 0, 0.8)',
            lineWidth: 2,
            title: 'Shorts',
          });
          shortsSeries.setData(calculateAggregatedLine('short'));
        }
      }

      window.addEventListener('resize', handleResize);

      chartRef.current = chart;

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [basketData, componentData, selectedCoin, showComponentLines, showLongShortLines, calculateAggregatedLine, selectedCoins]);

  const fetchBasketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const coinDataPromises = selectedCoins.map(async (coin) => {
        let url = `https://fapi.binance.com/fapi/v1/klines?symbol=${coin.symbol}&interval=${resolution}&limit=500`;
        const response = await fetch(url);
        const data = await response.json();
        return { symbol: coin.symbol, weight: coin.weight, position: coin.position, data };
      });

      const coinsData = await Promise.all(coinDataPromises);

      const minLength = Math.min(...coinsData.map(coin => coin.data.length));

      const indexValue = {};
      const initialPrices = {};
      const componentValues = {};

      coinsData.forEach(coin => {
        initialPrices[coin.symbol] = parseFloat(coin.data[0][4]);
        componentValues[coin.symbol] = [];
      });

      for (let i = 0; i < minLength; i++) {
        const time = coinsData[0].data[i][0];

        let basketValue = 0;

        coinsData.forEach(coin => {
          const currentPrice = parseFloat(coin.data[i][4]);
          const priceChange = (currentPrice / initialPrices[coin.symbol] - 1) * 100;
          const positionMultiplier = coin.position === 'long' ? 1 : -1;
          const coinContribution = priceChange * (coin.weight / 100) * positionMultiplier;
          basketValue += coinContribution;

          componentValues[coin.symbol].push({
            time: parseInt(time / 1000),
            value: priceChange + 100
          });
        });

        indexValue[i] = { time, value: basketValue + 100 };
      }

      const chartData = Object.entries(indexValue).map(([index, { time, value }]) => ({
        time: parseInt(time / 1000),
        value: value
      }));

      chartData.sort((a, b) => a.time - b.time);

      setBasketData(chartData);
      setComponentData(Object.entries(componentValues).map(([symbol, data]) => ({
        symbol,
        data
      })));
      setSelectedCoin(null);

      // Calculate basket statistics
      const returns = chartData.map(data => data.value / 100);
      const periodMultiplier = resolution === '1h' ? 24 * 365 :
        resolution === '1d' ? 365 :
          resolution === '1m' ? 24 * 60 * 365 :
            resolution === '5m' ? 24 * 12 * 365 :
              resolution === '15m' ? 24 * 4 * 365 :
                resolution === '4h' ? 6 * 365 : 365;

      const annualizedVolatility = Math.sqrt(
        returns.reduce((sum, r, index, array) => {
          if (index === 0) return sum;
          const diff = r - array[index - 1];
          return sum + diff * diff;
        }, 0) / (returns.length - 1)
      ) * Math.sqrt(periodMultiplier) * 100;

      const totalReturn = returns[returns.length - 1] - returns[0];
      const sharpeRatio = totalReturn * 100 / annualizedVolatility;

      // Calculate max drawdown
      let peak = -Infinity;
      let maxDrawdown = 0;
      for (let i = 0; i < returns.length; i++) {
        if (returns[i] > peak) {
          peak = returns[i];
        }
        const drawdown = (peak - returns[i]) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      setBasketStats({
        annualizedVolatility,
        sharpeRatio,
        totalReturn: totalReturn * 100,
        maxDrawdown: maxDrawdown * 100,
        individualReturns: coinsData.map(coin => ({
          symbol: coin.symbol,
          return: ((parseFloat(coin.data[coin.data.length - 1][4]) / parseFloat(coin.data[0][4])) - 1) * 100
        }))
      });

    } catch (error) {
      console.error('Error fetching basket data:', error);
      setError('Failed to fetch basket data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoins, resolution]);

  useEffect(() => {
    if (selectedCoins.length > 0) {
      fetchBasketData();
    }
  }, [selectedCoins, resolution, fetchBasketData]);

  const fetchCoinsData = async () => {
    try {
      const tickerResponse = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
      const tickerData = await tickerResponse.json();

      const usdtCoins = tickerData.filter(coin => coin.symbol.endsWith('USDT'));
      const sortedCoins = usdtCoins.sort((a, b) => parseFloat(b.volume * b.lastPrice) - parseFloat(a.volume * a.lastPrice));

      setCoins(sortedCoins.map(coin => ({
        symbol: coin.symbol,
        price: parseFloat(coin.lastPrice).toFixed(2),
        priceChange: parseFloat(coin.priceChangePercent).toFixed(2),
        volume: parseFloat(coin.volume * coin.lastPrice).toFixed(2),
        weight: 0,
        position: null
      })));
    } catch (error) {
      console.error('Error fetching coins data:', error);
      setError('Failed to fetch coins data. Please try again later.');
    }
  };

  const handleCoinSelection = (symbol, position) => {
    setSelectedCoins(prev => {
      const index = prev.findIndex(coin => coin.symbol === symbol);
      if (index !== -1) {
        const updatedCoins = prev.filter(coin => coin.symbol !== symbol);
        return adjustWeights(updatedCoins);
      } else {
        const updatedCoins = [...prev, { symbol, weight: 0, position }];
        return adjustWeights(updatedCoins);
      }
    });
  };

  const adjustWeights = (coins) => {
    if (!coins || coins.length === 0) {
      return [];
    }

    const longCoins = coins.filter(coin => coin && coin.position === 'long');
    const shortCoins = coins.filter(coin => coin && coin.position === 'short');

    const longWeight = longCoins.length > 0 ? 50 / longCoins.length : 0;
    const shortWeight = shortCoins.length > 0 ? 50 / shortCoins.length : 0;

    const adjustedCoins = coins.map(coin => {
      if (!coin) return null;
      return {
        ...coin,
        weight: coin.position === 'long' ? longWeight : (coin.position === 'short' ? shortWeight : 0)
      };
    }).filter(Boolean);

    return adjustedCoins;
  };

  const removeCoin = (symbol) => {
    setSelectedCoins(prev => {
      const updatedCoins = prev.filter(coin => coin.symbol !== symbol);
      return adjustWeights(updatedCoins);
    });
  };

  const handleCoinClick = async (symbol) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${resolution}&limit=500`;

      const response = await fetch(url);
      const data = await response.json();
      const formattedData = data.map(candle => ({
        time: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4])
      }));
      setSelectedCoin({ symbol, data: formattedData });
      setBasketData([]);  // Clear basket data when selecting a single coin
      setComponentData([]);  // Clear component data when selecting a single coin
    } catch (error) {
      console.error('Error fetching coin data:', error);
      setError('Failed to fetch coin data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolutionChange = (newResolution) => {
    setResolution(newResolution);
  };

  const handleUpdateBasket = () => {
    fetchBasketData();
  };

  const handleClearBasket = () => {
    setSelectedCoins([]);
    setBasketData([]);
    setComponentData([]);
    setBasketStats({
      totalReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      annualizedVolatility: 0,
      individualReturns: []
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Custom Index Builder</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex flex-col h-full">
        {/* Top half: Selected Coins and Chart */}
        <div className="h-1/2 flex">
          {/* Left side: Selected Coins */}
          <div className="w-1/2 pr-2 overflow-y-auto">
            <div className="flex justify-between items-center mb-2 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Selected Coins</h2>
              <div>
                <button
                  onClick={handleUpdateBasket}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2"
                >
                  Update
                </button>
                <button
                  onClick={handleClearBasket}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2 font-semibold">
              <div>Coin</div>
              <div className="text-right">Weight</div>
              <div className="text-center">Action</div>
            </div>
            <ul className="mb-4">
              {selectedCoins.map(coin => (
                <li key={coin.symbol} className="grid grid-cols-3 gap-2 items-center py-1">
                  <span>{coin.symbol} ({coin.position})</span>
                  <span className="text-right">{coin.weight.toFixed(2)}%</span>
                  <div className="text-center">
                    <button
                      onClick={() => removeCoin(coin.symbol)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right side: Chart and Statistics */}
          <div className="w-1/2 pl-2 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-2 sticky top-0 bg-white">
              {selectedCoin ? `${selectedCoin.symbol} Performance` : 'Basket Performance'} {selectedCoin ? '(OHLC)' : '(Close)'}
            </h2>
            <div className="mb-4 flex items-center">
              <label className="mr-2">Resolution:</label>
              <select
                value={resolution}
                onChange={(e) => handleResolutionChange(e.target.value)}
                className="border px-2 py-1 mr-4"
              >
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="1d">1 day</option>
              </select>
              <label className="mr-2">
                <input
                  type="checkbox"
                  checked={showComponentLines}
                  onChange={(e) => setShowComponentLines(e.target.checked)}
                  className="mr-1"
                />
                Show components
              </label>
              <label className="ml-4">
                <input
                  type="checkbox"
                  checked={showLongShortLines}
                  onChange={(e) => setShowLongShortLines(e.target.checked)}
                  className="mr-1"
                />
                Show long/short aggregates
              </label>
            </div>

            {!selectedCoin && basketStats && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-1">
                  <div>Total Return: {basketStats.totalReturn.toFixed(2)}%</div>
                  <div>Annualized Volatility: {basketStats.annualizedVolatility.toFixed(2)}%</div>
                  <div>Sharpe Ratio: {basketStats.sharpeRatio.toFixed(2)}</div>
                  <div>Max Drawdown: {basketStats.maxDrawdown.toFixed(2)}%</div>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="text-center">Loading chart data...</div>
            ) : (
              <div ref={chartContainerRef} className="w-full h-64" />
            )}
          </div>
        </div>

        {/* Bottom half: Available Coins */}
        <div className="h-1/2 mb-4">
          <h2 className="text-xl font-semibold mb-2">Available Coins</h2>
          <div className="overflow-y-auto h-[calc(100%-2rem)]">
            <table className="w-full table-auto">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-200">
                  <th className="px-2 py-2">Coin</th>
                  <th className="px-2 py-2">Price</th>
                  <th className="px-2 py-2">24h Change</th>
                  <th className="px-2 py-2">Volume (USD)</th>
                  <th className="px-2 py-2">Beta</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Correlation</th>
                  <th className="px-2 py-2">Volatility</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {coins.map(coin => (
                  <tr key={coin.symbol} className="border-b cursor-pointer" onClick={() => handleCoinClick(coin.symbol)}>
                    <td className="px-2 py-2">{coin.symbol}</td>
                    <td className="px-2 py-2">${coin.price}</td>
                    <td className={`px-2 py-2 ${parseFloat(coin.priceChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {coin.priceChange}%
                    </td>
                    <td className="px-2 py-2">${parseFloat(coin.volume).toLocaleString()}</td>
                    <td className="px-2 py-2">{coin.beta || 'N/A'}</td>
                    <td className="px-2 py-2">{coin.category || 'N/A'}</td>
                    <td className="px-2 py-2">{coin.correlation || 'N/A'}</td>
                    <td className="px-2 py-2">{coin.volatility || 'N/A'}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoinSelection(coin.symbol, 'long');
                        }}
                        className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-2"
                      >
                        Long
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoinSelection(coin.symbol, 'short');
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Short
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;