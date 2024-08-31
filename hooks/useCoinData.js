import { useState, useEffect, useCallback } from 'react';
import useExchangeInfo from './useExchangeInfo';

const useCoinsData = () => {
    const [coins, setCoins] = useState([]);
    const [error, setError] = useState(null);
    const { symbolsInfo } = useExchangeInfo();

    const fetchCoinsData = useCallback(async () => {
        try {
            const tickerResponse = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
            const tickerData = await tickerResponse.json();

            const usdtCoins = tickerData.filter(coin => coin.symbol.endsWith('USDT'));
            const sortedCoins = usdtCoins.sort((a, b) => parseFloat(b.volume * b.lastPrice) - parseFloat(a.volume * a.lastPrice));

            setCoins(sortedCoins.map(coin => ({
                symbol: coin.symbol,
                price: parseFloat(coin.lastPrice).toFixed(symbolsInfo[coin.symbol]?.pricePrecision || 2),
                priceChange: parseFloat(coin.priceChangePercent).toFixed(2),
                volume: parseFloat(coin.volume * coin.lastPrice).toFixed(2),
                weight: 0,
                position: null
            })));
        } catch (error) {
            console.error('Error fetching coins data:', error);
            setError('Failed to fetch coins data. Please try again later.');
        }
    }, [symbolsInfo]);

    useEffect(() => {
        fetchCoinsData();
    }, [fetchCoinsData]);

    return { coins, setCoins, error };
};

export default useCoinsData;