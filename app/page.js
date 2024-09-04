"use client";

import React, { useState, useCallback, useEffect } from 'react';
import BasketChart from '@/components/BasketChart';
import AvailableCoins from '@/components/AvailableCoins';
import useCoinsData from '@/hooks/useCoinData'
import useBasketData from '@/hooks/useBasketData';
import BasketConfigModal from '@/components/BasketConfigModal';

const App = () => {
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [resolution, setResolution] = useState('1h');
  const [showComponentLines, setShowComponentLines] = useState(false);
  const [showLongShortLines, setShowLongShortLines] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [tempSelectedCoins, setTempSelectedCoins] = useState([]);
  const [confirmedSelectedCoins, setConfirmedSelectedCoins] = useState([]);
  const [basketCreated, setBasketCreated] = useState(false);

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

  const handleCreateBasket = useCallback(() => {
    setIsBasketModalOpen(true);
  }, []);

  const handleEditBasket = useCallback(() => {
    const coinsToEdit = confirmedSelectedCoins.length > 0 ? confirmedSelectedCoins : selectedCoins;
    setTempSelectedCoins(coinsToEdit.map(coin => ({
      ...coin,
      weight: coin.weight || 0,
      position: coin.position || 'long'
    })));
    setIsBasketModalOpen(true);
  }, [confirmedSelectedCoins, selectedCoins]);

  const handleConfirmBasket = useCallback((configuredCoins) => {
    setConfirmedSelectedCoins(configuredCoins);
    setSelectedCoins(configuredCoins);
    setIsBasketModalOpen(false);
    setBasketCreated(true);
  }, []);

  const handleCloseBasketModal = useCallback(() => {
    setIsBasketModalOpen(false);
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

  const handleResetBasket = useCallback(() => {
    setSelectedCoins([]);
    setTempSelectedCoins([]);
    setConfirmedSelectedCoins([]);
    setBasketCreated(false);
  }, []);

  const handleLoadBasket = useCallback((basket) => {
    setConfirmedSelectedCoins(basket.coins);
    setSelectedCoins(basket.coins);
    setBasketCreated(true);
  }, []);

  useEffect(() => {
    if (confirmedSelectedCoins.length > 0) {
      fetchBasketData();
    }
  }, [resolution, confirmedSelectedCoins, fetchBasketData]);

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-4xl font-bold mb-8 text-blue-900">Basket Builder</h1>

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
            confirmedSelectedCoins={confirmedSelectedCoins}
            onRemoveCoin={handleRemoveCoin}
            onCreateBasket={handleCreateBasket}
            onEditBasket={handleEditBasket}
            basketCreated={basketCreated}
            onResetBasket={handleResetBasket}
          />
        </div>
        <div className="h-full md:col-span-2">
          <BasketChart
            selectedCoins={confirmedSelectedCoins}
            resolution={resolution}
            onResolutionChange={handleResolutionChange}
            showComponentLines={showComponentLines}
            setShowComponentLines={setShowComponentLines}
            showLongShortLines={showLongShortLines}
            setShowLongShortLines={setShowLongShortLines}
            symbolsInfo={coins.reduce((acc, coin) => ({ ...acc, [coin.symbol]: coin }), {})}
            onEditBasket={() => setIsBasketModalOpen(true)}
            onResetBasket={handleResetBasket}
            basketData={basketData}
            componentData={componentData}
            basketStats={basketStats}
            isLoading={isLoading}
            error={basketError}
            onLoadBasket={handleLoadBasket}
          />
        </div>
      </div>
      <BasketConfigModal
        isOpen={isBasketModalOpen}
        onClose={handleCloseBasketModal}
        selectedCoins={tempSelectedCoins}
        onConfirm={handleConfirmBasket}
      />
    </div>
  );
}

export default function Home() {
  return <App />;
}