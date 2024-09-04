import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import useExchangeInfo from '@/hooks/useExchangeInfo';
import CoinList from './CoinList';
import SelectedCoinsFooter from './SelectedCoinsFooter';
import { useSortableData, useFilteredData } from '@/hooks/useData';
import { formatPrice } from '@/utils/formatters';

const AvailableCoins = ({ 
  coins, 
  onCoinSelection, 
  onRemoveCoin, 
  onCreateBasket,
  onEditBasket,
  onResetBasket, 
  basketCreated,
  confirmedSelectedCoins
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { symbolsInfo } = useExchangeInfo();
  const [selectedCoins, setSelectedCoins] = useState([]);

  const { items: sortedCoins, requestSort, sortConfig } = useSortableData(coins);
  const filteredCoins = useFilteredData(sortedCoins, searchTerm, 'symbol');

  const handleCoinSelection = useCallback((coin) => {
    if (!basketCreated) {
      setSelectedCoins(prev =>
        prev.some(c => c.symbol === coin.symbol)
          ? prev.filter(c => c.symbol !== coin.symbol)
          : [...prev, coin]
      );
      onCoinSelection(coin.symbol);
    }
  }, [onCoinSelection, basketCreated]);

  const handleRemoveCoin = useCallback((symbol) => {
    setSelectedCoins(prev => prev.filter(c => c.symbol !== symbol));
    onRemoveCoin(symbol);
  }, [onRemoveCoin]);

  const handleResetBasket = useCallback(() => {
    setSelectedCoins([]);
    onResetBasket();
  }, [onResetBasket]);

  useEffect(() => {
    if (basketCreated) {
      setSelectedCoins(confirmedSelectedCoins);
    }
  }, [confirmedSelectedCoins, basketCreated]);

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="px-0 py-2 flex-grow overflow-auto">
        <div className="sticky top-0 z-10 bg-white px-4 py-2">
          <div className="relative mb-2">
            <Input
              type="text"
              placeholder="Search coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
        <CoinList
          coins={filteredCoins}
          selectedCoins={selectedCoins}
          onCoinSelection={handleCoinSelection}
          onSort={requestSort}
          sortConfig={sortConfig}
          formatPrice={(price, symbol) => formatPrice(price, symbol, symbolsInfo)}
        />
      </CardContent>
      {selectedCoins.length > 0 && (
        <SelectedCoinsFooter
          selectedCoins={selectedCoins}
          onRemoveCoin={handleRemoveCoin}
          onCreateBasket={onCreateBasket}
          onEditBasket={onEditBasket}
          onResetBasket={handleResetBasket}
          basketCreated={basketCreated}
        />
      )}
    </Card>
  );
};

export default AvailableCoins;