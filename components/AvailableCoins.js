import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from 'lucide-react';
import useExchangeInfo from '@/hooks/useExchangeInfo';

const AvailableCoins = ({ coins, onCoinSelection, onCoinClick, onSort, sortConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { symbolsInfo } = useExchangeInfo();

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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="sticky top-0 z-10 bg-white py-2">
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
              <TableHead className="sticky top-0 bg-white w-1/5 py-2" onClick={() => handleSort('symbol')}>
                Name {getSortIcon('symbol')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/5 text-right py-2" onClick={() => handleSort('price')}>
                Price {getSortIcon('price')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/5 text-right py-2" onClick={() => handleSort('volume')}>
                Volume {getSortIcon('volume')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/5 text-right py-2" onClick={() => handleSort('priceChange')}>
                24h % {getSortIcon('priceChange')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/5 text-center py-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoins.map(coin => (
              <TableRow key={`${coin.symbol}-${coin.id}`} onClick={() => onCoinClick(coin)} className="h-8">
                <TableCell className="w-1/4 py-1">{coin.name} {coin.symbol}</TableCell>
                <TableCell className="w-1/5 text-right py-1">
                  ${formatPrice(coin.price, coin.symbol, symbolsInfo)}
                </TableCell>
                <TableCell className="w-1/5 text-right py-1">${(coin.volume / 1e9).toFixed(2)}B</TableCell>
                <TableCell className={`w-1/5 text-right py-1 ${coin.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {coin.priceChange}%
                </TableCell>
                <TableCell className="w-1/5 text-center p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCoinSelection(coin.symbol, 'long');
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AvailableCoins;