import { useState, useEffect, useCallback } from 'react';

const useExchangeInfo = () => {
  const [symbolsInfo, setSymbolsInfo] = useState({});
  const [error, setError] = useState(null);

  const fetchExchangeInfo = useCallback(async () => {
    try {
      const response = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
      const data = await response.json();

      const newSymbolsInfo = {};
      data.symbols.forEach(symbol => {
        if (symbol.symbol.endsWith('USDT')) {
          newSymbolsInfo[symbol.symbol] = {
            pricePrecision: symbol.pricePrecision,
            quantityPrecision: symbol.quantityPrecision,
            category: symbol.underlyingSubType || 'Unknown'
          };
        }
      });

      setSymbolsInfo(newSymbolsInfo);
      setError(null);
    } catch (err) {
      console.error('Error fetching exchange info:', err);
      setError('Failed to fetch exchange info. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchExchangeInfo();
  }, [fetchExchangeInfo]);

  return { symbolsInfo, error };
};

export default useExchangeInfo;