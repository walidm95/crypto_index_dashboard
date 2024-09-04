import { useState, useCallback } from 'react';

const useBasketData = (selectedCoins, resolution) => {
    const [basketData, setBasketData] = useState([]);
    const [componentData, setComponentData] = useState([]);
    const [basketStats, setBasketStats] = useState({
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        annualizedVolatility: 0,
        individualReturns: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCoinData = async (symbol, resolution) => {
        const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}USDT&interval=${resolution}&limit=500`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code && data.msg) {
                throw new Error(`API Error: ${data.msg}`);
            }
            
            return data.map(candle => ({
                time: candle[0],
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4])
            }));
        } catch (error) {
            console.error(`Error fetching data for ${symbol}: ${error.message}`);
            return [];
        }
    };

    const fetchBasketData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const coinDataPromises = selectedCoins.map(async (coin) => {
                const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${coin.symbol}USDT&interval=${resolution}&limit=500`;
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
                        time: parseInt(time),
                        value: priceChange + 100
                    });
                });

                indexValue[i] = { time, value: basketValue + 100 };
            }

            const chartData = Object.entries(indexValue).map(([, { time, value }]) => ({
                time: parseInt(time),
                value: value
            }));

            chartData.sort((a, b) => a.time - b.time);

            setBasketData(chartData);
            setComponentData(Object.entries(componentValues).map(([symbol, data]) => ({
                symbol,
                data
            })));

            // Calculate basket statistics
            const returns = chartData.map(data => data.value / 100);
            const periodMultiplier = getPeriodMultiplier(resolution);

            const annualizedVolatility = calculateAnnualizedVolatility(returns, periodMultiplier);
            const totalReturn = (returns[returns.length - 1] - returns[0]) * 100;
            const sharpeRatio = totalReturn / annualizedVolatility;
            const maxDrawdown = calculateMaxDrawdown(returns);

            setBasketStats({
                annualizedVolatility,
                sharpeRatio,
                totalReturn,
                maxDrawdown: maxDrawdown * 100,
                individualReturns: calculateIndividualReturns(coinsData)
            });

        } catch (error) {
            console.error('Error fetching basket data:', error);
            setError('Failed to fetch basket data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedCoins, resolution]);

    // Add a new function to manually trigger data fetching
    const refreshData = useCallback(() => {
        if (selectedCoins && selectedCoins.length > 0) {
            fetchBasketData();
        } else {
            setBasketData([]);
            setComponentData([]);
            setBasketStats({
                totalReturn: 0,
                sharpeRatio: 0,
                maxDrawdown: 0,
                annualizedVolatility: 0,
                individualReturns: []
            });
        }
    }, [selectedCoins, fetchBasketData]);

    return { basketData, componentData, basketStats, isLoading, error, fetchBasketData, fetchCoinData, refreshData };
};

const getPeriodMultiplier = (resolution) => {
    const multipliers = {
        '1m': 24 * 60 * 365,
        '5m': 24 * 12 * 365,
        '15m': 24 * 4 * 365,
        '30m': 24 * 2 * 365,
        '1h': 24 * 365,
        '4h': 6 * 365,
        '1d': 365
    };
    return multipliers[resolution] || 365;
};

const calculateAnnualizedVolatility = (returns, periodMultiplier) => {
    const dailyReturns = returns.map((r, i, arr) => i === 0 ? 0 : r / arr[i - 1] - 1);
    const variance = dailyReturns.reduce((sum, r) => sum + r * r, 0) / (dailyReturns.length - 1);
    return Math.sqrt(variance * periodMultiplier) * 100;
};

const calculateMaxDrawdown = (returns) => {
    let peak = -Infinity;
    let maxDrawdown = 0;
    for (const r of returns) {
        if (r > peak) peak = r;
        const drawdown = (peak - r) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    return maxDrawdown;
};

const calculateIndividualReturns = (coinsData) => {
    return coinsData.map(coin => ({
        symbol: coin.symbol,
        return: ((parseFloat(coin.data[coin.data.length - 1][4]) / parseFloat(coin.data[0][4])) - 1) * 100
    }));
};

export default useBasketData;