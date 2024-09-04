"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import SelectedCoins from '@/components/SelectedCoins';
import BasketChart from '@/components/BasketChart';
import AvailableCoins from '@/components/AvailableCoins';
import useCoinsData from '@/hooks/useCoinData'
import useBasketData from '@/hooks/useBasketData';
import { adjustWeights, updateCoinWeight } from '@/lib/weightUtils';

const App = () => {
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [resolution, setResolution] = useState('1h');
  const [selectedCoin, setSelectedCoin] = useState({ symbol: 'BTC', data: [] });
  const [showComponentLines, setShowComponentLines] = useState(false);
  const [showLongShortLines, setShowLongShortLines] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const { coins, setCoins, error: coinsError } = useCoinsData();
  const {
    basketData,
    componentData,
    basketStats,
    isLoading,
    error: basketError,
    fetchBasketData,
    fetchCoinData,
    refreshData
  } = useBasketData(selectedCoins, resolution);

  const handleCoinSelection = useCallback((symbol, position) => {
    setSelectedCoins(prevCoins => {
      const index = prevCoins.findIndex(coin => coin.symbol === symbol);
      if (index !== -1) {
        const updatedCoins = prevCoins.filter(coin => coin.symbol !== symbol);
        return adjustWeights(updatedCoins);
      } else {
        const updatedCoins = [...prevCoins, { symbol, weight: 0, position }];
        return adjustWeights(updatedCoins);
      }
    });
  }, []);

  const handleUpdateBasket = useCallback(() => {
    fetchBasketData();
  }, [fetchBasketData]);

  const handleClearBasket = useCallback(() => {
    setSelectedCoins([]);
  }, []);

  const handleRemoveCoin = useCallback((symbol) => {
    setSelectedCoins(prevCoins => {
      const newCoins = prevCoins.filter(coin => coin.symbol !== symbol);
      return adjustWeights(newCoins);
    });
  }, []);

  const handleWeightChange = useCallback((symbol, newWeight) => {
    setSelectedCoins(prevCoins => updateCoinWeight(prevCoins, symbol, newWeight));
  }, []);

  const handleResolutionChange = useCallback((newResolution) => {
    setResolution(newResolution);
  }, []);

  const handleCoinClick = useCallback(async (coin) => {
    const data = await fetchCoinData(coin.symbol, resolution);
    setSelectedCoin({ symbol: coin.symbol, data });
  }, [resolution, fetchCoinData]);

  const handleSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedCoins = [...coins].sort((a, b) => {
      if (key === 'symbol' || key === 'category') {
        if (a[key] < b[key]) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else {
        const aValue = parseFloat(a[key]);
        const bValue = parseFloat(b[key]);
        if (aValue < bValue) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'ascending' ? 1 : -1;
        }
        return 0;
      }
    });

    setCoins(sortedCoins);
  }, [coins, sortConfig]);

  useEffect(() => {
    if (selectedCoins.length > 0) {
      fetchBasketData();
    }
  }, [resolution, selectedCoins, fetchBasketData]);

  useEffect(() => {
    if (selectedCoin.symbol !== 'BTC' && selectedCoin.data.length === 0) {
      handleCoinClick({ symbol: selectedCoin.symbol });
    }
  }, [selectedCoin.symbol, handleCoinClick]);

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-4xl font-bold mb-8 text-blue-900">Crypto Spread Instrument Builder</h1>

      {(coinsError || basketError) && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{coinsError || basketError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-200px)] max-h-[800px]">
        <Card className="h-full overflow-hidden">
          <CardContent className="p-4 h-full overflow-auto">
            <AvailableCoins
              coins={coins}
              onCoinSelection={handleCoinSelection}
              onCoinClick={handleCoinClick}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          </CardContent>
        </Card>
        <Card className="h-full flex flex-col overflow-hidden md:col-span-2">
          <CardContent className="p-4 flex-grow flex flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0 overflow-auto">
              <SelectedCoins
                selectedCoins={selectedCoins}
                onUpdateBasket={handleUpdateBasket}
                onClearBasket={handleClearBasket}
                onRemoveCoin={handleRemoveCoin}
                onWeightChange={handleWeightChange}
              />
            </div>
            <div className="flex-grow overflow-hidden">
              <BasketChart
                basketData={basketData}
                componentData={componentData}
                selectedCoin={selectedCoin}
                resolution={resolution}
                onResolutionChange={handleResolutionChange}
                basketStats={basketStats}
                isLoading={isLoading}
                showComponentLines={showComponentLines}
                setShowComponentLines={setShowComponentLines}
                showLongShortLines={showLongShortLines}
                setShowLongShortLines={setShowLongShortLines}
                symbolsInfo={coins.reduce((acc, coin) => ({ ...acc, [coin.symbol]: coin }), {})}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  return <App />;
}