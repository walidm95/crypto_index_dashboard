import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from 'lucide-react';

const AvailableCoins = ({ coins, onCoinSelection, onCoinClick, onSort, sortConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCoins = coins.filter(coin => 
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <CardHeader className="sticky top-0 z-10 bg-white">
        <CardTitle className="text-xl font-semibold text-blue-900">Available Coins</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-auto">
        <div className="sticky top-0 z-10 bg-white px-4 py-2">
          <div className="relative mb-4">
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
              <TableHead className="sticky top-0 bg-white w-1/4" onClick={() => handleSort('symbol')}>
                Name {getSortIcon('symbol')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/6 text-right" onClick={() => handleSort('price')}>
                Price {getSortIcon('price')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/6 text-right" onClick={() => handleSort('volume')}>
                Volume {getSortIcon('volume')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/6 text-right" onClick={() => handleSort('priceChange')}>
                24h % {getSortIcon('priceChange')}
              </TableHead>
              <TableHead className="sticky top-0 bg-white w-1/4 text-center">Trade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoins.map(coin => (
              <TableRow key={coin.id} onClick={() => onCoinClick(coin.symbol)}>
                <TableCell className="w-1/4">{coin.name} {coin.symbol}</TableCell>
                <TableCell className="w-1/6 text-right">${coin.price.toLocaleString()}</TableCell>
                <TableCell className="w-1/6 text-right">${(coin.volume / 1e9).toFixed(2)}B</TableCell>
                <TableCell className={`w-1/6 text-right ${coin.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {coin.priceChange}%
                </TableCell>
                <TableCell className="w-1/4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-700 hover:bg-green-50 mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCoinSelection(coin.symbol, 'long');
                    }}
                  >
                    Long
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCoinSelection(coin.symbol, 'short');
                    }}
                  >
                    Short
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