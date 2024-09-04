import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CoinList = React.memo(({ coins, selectedCoins, onCoinSelection, onSort, sortConfig, formatPrice }) => {
  const getSortIcon = (key) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return null;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="sticky top-0 bg-white w-1/4 py-2" onClick={() => onSort('symbol')}>
            Name {getSortIcon('symbol')}
          </TableHead>
          <TableHead className="sticky top-0 bg-white w-1/4 text-right py-2" onClick={() => onSort('price')}>
            Price {getSortIcon('price')}
          </TableHead>
          <TableHead className="sticky top-0 bg-white w-1/4 text-right py-2" onClick={() => onSort('volume')}>
            Volume {getSortIcon('volume')}
          </TableHead>
          <TableHead className="sticky top-0 bg-white w-1/4 text-right py-2" onClick={() => onSort('priceChange')}>
            24h % {getSortIcon('priceChange')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {coins.map(coin => (
          <TableRow 
            key={`${coin.symbol}-${coin.id}`} 
            className={`h-8 ${selectedCoins.some(selectedCoin => selectedCoin.symbol === coin.symbol) ? 'bg-blue-100' : ''} cursor-pointer hover:bg-blue-50`}
            onClick={() => onCoinSelection(coin)}
          >
            <TableCell className="w-1/4 py-1">{coin.name} {coin.symbol}</TableCell>
            <TableCell className="w-1/4 text-right py-1">
              ${formatPrice(coin.price, coin.symbol)}
            </TableCell>
            <TableCell className="w-1/4 text-right py-1">
              ${coin.volume >= 1e9 
                ? (coin.volume / 1e9).toFixed(2) + 'B'
                : (coin.volume / 1e6).toFixed(2) + 'M'}
            </TableCell>
            <TableCell className={`w-1/4 text-right py-1 ${coin.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {coin.priceChange}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

export default CoinList;