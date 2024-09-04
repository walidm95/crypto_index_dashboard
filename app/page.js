"use client";

import React, { useState, useCallback, useEffect } from 'react';
import BasketChart from '@/components/BasketChart';
import AvailableCoins from '@/components/AvailableCoins';
import useCoinsData from '@/hooks/useCoinData'
import useBasketData from '@/hooks/useBasketData';
import SpreadConfigModal from '@/components/SpreadConfigModal';

const App = () => {
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [resolution, setResolution] = useState('1h');
  const [showComponentLines, setShowComponentLines] = useState(false);
  const [showLongShortLines, setShowLongShortLines] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);
  const [tempSelectedCoins, setTempSelectedCoins] = useState([]);

  const { coins, setCoins, error: coinsError } = useCoinsData();
  const {
    basketData,
    componentData,
    basketStats,
    isLoading,
    error: basketError,
    fetchBasketData,
  } = useBasketData(selectedCoins, resolution);

  const handleCoinSelection = useCallback((symbol) => {
    setTempSelectedCoins(prevCoins => {
      const index = prevCoins.findIndex(coin => coin.symbol === symbol);
      if (index !== -1) {
        return prevCoins.filter(coin => coin.symbol !== symbol);
      } else {
        return [...prevCoins, { symbol, weight: 0, position: 'long' }];
      }
    });
  }, []);

  const handleRemoveCoin = useCallback((symbol) => {
    setTempSelectedCoins(prevCoins => prevCoins.filter(coin => coin.symbol !== symbol));
  }, []);

  const handleCreateSpread = useCallback(() => {
    setIsSpreadModalOpen(true);
  }, []);

  const handleConfirmSpread = useCallback((configuredCoins) => {
    setSelectedCoins(configuredCoins);
    setIsSpreadModalOpen(false);
  }, []);

  const handleCloseSpreadModal = useCallback(() => {
    setIsSpreadModalOpen(false);
  }, []);

  const handleUpdateCoin = useCallback((index, updatedCoin) => {
    setTempSelectedCoins(prevCoins => {
      const newCoins = [...prevCoins];
      newCoins[index] = updatedCoin;
      return newCoins;
    });
  }, []);

  const handleResolutionChange = useCallback((newResolution) => {
    setResolution(newResolution);
  }, []);

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

  const handleResetSpread = useCallback(() => {
    setSelectedCoins([]);
    setTempSelectedCoins([]);
  }, []);

  useEffect(() => {
    if (selectedCoins.length > 0) {
      fetchBasketData();
    }
  }, [resolution, selectedCoins, fetchBasketData]);

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-4xl font-bold mb-8 text-blue-900">Crypto Spread Instrument Builder</h1>

      {(coinsError || basketError) && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{coinsError || basketError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[calc(100vh-150px)] max-h-[900px]">
        <div className="h-full overflow-hidden">
          <AvailableCoins
            coins={coins}
            onCoinSelection={handleCoinSelection}
            onSort={handleSort}
            sortConfig={sortConfig}
            selectedCoins={tempSelectedCoins}
            onRemoveCoin={handleRemoveCoin}
            onCreateSpread={handleCreateSpread}
          />
        </div>
        <div className="h-full md:col-span-2">
          <BasketChart
            selectedCoins={selectedCoins}
            resolution={resolution}
            onResolutionChange={handleResolutionChange}
            showComponentLines={showComponentLines}
            setShowComponentLines={setShowComponentLines}
            showLongShortLines={showLongShortLines}
            setShowLongShortLines={setShowLongShortLines}
            symbolsInfo={coins.reduce((acc, coin) => ({ ...acc, [coin.symbol]: coin }), {})}
            onEditSpread={() => setIsSpreadModalOpen(true)}
            onResetSpread={handleResetSpread}
          />
        </div>
      </div>
      <SpreadConfigModal
        isOpen={isSpreadModalOpen}
        onClose={handleCloseSpreadModal}
        selectedCoins={tempSelectedCoins}
        onConfirm={handleConfirmSpread}
        onRemoveCoin={handleRemoveCoin}
        onUpdateCoin={handleUpdateCoin}
      />
    </div>
  );
}

export default function Home() {
  return <App />;
}