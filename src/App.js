import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const App = () => {
  const [coins, setCoins] = useState([]);
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [basketData, setBasketData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [resolution, setResolution] = useState('1h');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [basketStats, setBasketStats] = useState({
    totalReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    annualizedVolatility: 0,
    individualReturns: []
  });
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    fetchCoinsData();
  }, []);

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
        const lineSeries = chart.addLineSeries({
          color: '#2962FF',
          lineWidth: 2,
        });

        lineSeries.setData(basketData);
      }

      window.addEventListener('resize', handleResize);

      chartRef.current = chart;

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [basketData, selectedCoin]);

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
    const longCoins = coins.filter(coin => coin.position === 'long');
    const shortCoins = coins.filter(coin => coin.position === 'short');
    
    const longWeight = 50 / longCoins.length;
    const shortWeight = 50 / shortCoins.length;

    const adjustedCoins = coins.map(coin => ({
      ...coin,
      weight: coin.position === 'long' ? longWeight : shortWeight
    }));

    return adjustedCoins;
  };

  const handleWeightChange = (symbol, weight) => {
    setSelectedCoins(prev => {
      const updatedCoins = prev.map(coin => 
        coin.symbol === symbol ? { ...coin, weight: parseFloat(weight) } : coin
      );
      
      const totalWeight = updatedCoins.reduce((sum, coin) => sum + coin.weight, 0);
      
      return updatedCoins.map(coin => ({
        ...coin,
        weight: (coin.weight / totalWeight) * 100
      }));
    });
  };

  const removeCoin = (symbol) => {
    setSelectedCoins(prev => {
      const updatedCoins = prev.filter(coin => coin.symbol !== symbol);
      return adjustWeights(updatedCoins);
    });
  };

  const fetchBasketData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
      const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;

      const coinDataPromises = selectedCoins.map(async (coin) => {
        let url = `https://fapi.binance.com/fapi/v1/klines?symbol=${coin.symbol}&interval=${resolution}`;
        if (startTimestamp) url += `&startTime=${startTimestamp}`;
        if (endTimestamp) url += `&endTime=${endTimestamp}`;
        if (!startTimestamp && !endTimestamp) url += '&limit=500';

        const response = await fetch(url);
        const data = await response.json();
        return { symbol: coin.symbol, weight: coin.weight, position: coin.position, data };
      });

      const coinsData = await Promise.all(coinDataPromises);

      const minLength = Math.min(...coinsData.map(coin => coin.data.length));

      const indexValue = {};
      const initialPrices = {};

      coinsData.forEach(coin => {
        initialPrices[coin.symbol] = parseFloat(coin.data[0][4]);
      });

      for (let i = 0; i < minLength; i++) {
        const time = coinsData[0].data[i][0];

        let basketValue = 0;

        coinsData.forEach(coin => {
          const currentPrice = parseFloat(coin.data[i][4]);
          const priceChange = (currentPrice / initialPrices[coin.symbol] - 1) * 100;
          const positionMultiplier = coin.position === 'long' ? 1 : -1;
          basketValue += priceChange * (coin.weight / 100) * positionMultiplier;
        });

        indexValue[i] = { time, value: basketValue };
      }

      const chartData = Object.entries(indexValue).map(([index, { time, value }]) => ({
        time: parseInt(time / 1000),
        value: value
      }));

      chartData.sort((a, b) => a.time - b.time);

      setBasketData(chartData);
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
      const sharpeRatio = totalReturn / annualizedVolatility;

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
  };

  const handleCoinClick = async (symbol) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${resolution}`;
      const startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
      const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;
      
      if (startTimestamp) url += `&startTime=${startTimestamp}`;
      if (endTimestamp) url += `&endTime=${endTimestamp}`;
      if (!startTimestamp && !endTimestamp) url += '&limit=500';

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
    } catch (error) {
      console.error('Error fetching coin data:', error);
      setError('Failed to fetch coin data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolutionChange = (newResolution) => {
    setResolution(newResolution);
    if (selectedCoin) {
      handleCoinClick(selectedCoin.symbol);
    } else if (selectedCoins.length > 0) {
      fetchBasketData();
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">Custom Index Builder</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Available Coins</h2>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <table className="w-full table-auto">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-200">
                  <th className="px-2 py-2">Coin</th>
                  <th className="px-2 py-2">Price</th>
                  <th className="px-2 py-2">24h Change</th>
                  <th className="px-2 py-2">Volume (USD)</th>
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
        
        <div className="flex flex-col">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Selected Coins</h2>
            <ul className="mb-4">
              {selectedCoins.map(coin => (
                <li key={coin.symbol} className="flex items-center justify-between py-1">
                  <span>{coin.symbol} ({coin.position})</span>
                  <span>{coin.weight.toFixed(2)}%</span>
                  <button
                    onClick={() => removeCoin(coin.symbol)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm ml-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={fetchBasketData}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Update Basket
            </button>
          </div>

          <div className="flex-grow">
            <h2 className="text-xl font-semibold mb-2">
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
              <label className="mr-2">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-2 py-1 mr-4"
              />
              <label className="mr-2">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-2 py-1 mr-4"
              />
            </div>
            {isLoading ? (
              <div className="text-center">Loading chart data...</div>
            ) : (
              <div ref={chartContainerRef} className="w-full" />
            )}
            {!selectedCoin && basketStats && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Basket Statistics</h3>
                <ul>
                  <li>Total Return: {basketStats.totalReturn.toFixed(2)}%</li>
                  <li>Annualized Volatility: {basketStats.annualizedVolatility.toFixed(2)}%</li>
                  <li>Sharpe Ratio: {basketStats.sharpeRatio.toFixed(2)}</li>
                  <li>Max Drawdown: {basketStats.maxDrawdown.toFixed(2)}%</li>
                </ul>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;