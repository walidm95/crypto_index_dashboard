import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from 'lucide-react';
import useExchangeInfo from '@/hooks/useExchangeInfo';
import SpreadConfigModal from './SpreadConfigModal';

const AvailableCoins = ({ coins, onCoinSelection, onSort, sortConfig, selectedCoins, onRemoveCoin, onCreateSpread }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { symbolsInfo } = useExchangeInfo();
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);

  const filteredCoins = coins.filter(coin =>
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price, symbol, symbolsInfo) => {
    const precision = symbolsInfo[symbol + 'USDT']?.pricePrecision || 2;
    return parseFloat(price).toFixed(precision);
  };

  const handleSort = (key) => {
    onSort(key);
  };

  const getSortIcon = (key) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return null;
  };

  const handleCoinSelection = (coin) => {
    onCoinSelection(coin.symbol);
  };

  const handleCreateSpread = () => {
    onCreateSpread();
  };

  const handleCloseSpreadModal = () => {
    setIsSpreadModalOpen(false);
  };

  const handleConfirmSpread = (configuredCoins) => {
    console.log("Spread confirmed with configured coins:", configuredCoins);
    setIsSpreadModalOpen(false);
    //onConfirmSpread(configuredCoins);
  };

  const handleUpdateCoin = (index, updatedCoin) => {
    // This function is not used in this component, but kept for potential future use
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="sticky flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-blue-900">Available Coins</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-auto">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 bg-white w-1/4 py-2" onClick={() => handleSort('symbol')}>
                Name {getSortIcon('symbol')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/4 text-right py-2" onClick={() => handleSort('price')}>
                Price {getSortIcon('price')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/4 text-right py-2" onClick={() => handleSort('volume')}>
                Volume {getSortIcon('volume')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/4 text-right py-2" onClick={() => handleSort('priceChange')}>
                24h % {getSortIcon('priceChange')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoins.map(coin => (
              <TableRow 
                key={`${coin.symbol}-${coin.id}`} 
                className={`h-8 ${selectedCoins.some(selectedCoin => selectedCoin.symbol === coin.symbol) ? 'bg-blue-100' : ''} cursor-pointer hover:bg-blue-50`}
                onClick={() => handleCoinSelection(coin)}
              >
                <TableCell className="w-1/4 py-1">{coin.name} {coin.symbol}</TableCell>
                <TableCell className="w-1/4 text-right py-1">
                  ${formatPrice(coin.price, coin.symbol, symbolsInfo)}
                </TableCell>
                <TableCell className="w-1/4 text-right py-1">${(coin.volume / 1e9).toFixed(2)}B</TableCell>
                <TableCell className={`w-1/4 text-right py-1 ${coin.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {coin.priceChange}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {selectedCoins.length > 0 && (
        <CardFooter className="border-t">
          <div className="w-full">
            <h3 className="font-semibold mb-2">Selected Coins:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCoins.map(coin => (
                <Button
                  key={coin.symbol}
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveCoin(coin.symbol)}
                  className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800"
                >
                  {coin.symbol}
                  <X size={14} />
                </Button>
              ))}
            </div>
            <Button 
              onClick={onCreateSpread} 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Create Spread ({selectedCoins.length})
            </Button>
          </div>
        </CardFooter>
      )}
      <SpreadConfigModal
        isOpen={isSpreadModalOpen}
        onClose={handleCloseSpreadModal}
        selectedCoins={selectedCoins}
        onConfirm={handleConfirmSpread}
        onRemoveCoin={onRemoveCoin}
        onUpdateCoin={handleUpdateCoin}
      />
    </Card>
  );
};

export default AvailableCoins;