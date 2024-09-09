import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from 'lucide-react';

const SelectedCoins = ({ selectedCoins, onUpdateBasket, onClearBasket, onRemoveCoin, onWeightChange, onSideChange }) => {
  const totalWeight = selectedCoins.reduce((sum, coin) => sum + parseFloat(coin.weight), 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-900">Selected Coins</CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-grow">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Name</TableHead>
              <TableHead className="w-1/4">Side</TableHead>
              <TableHead className="w-1/4">Weight</TableHead>
              <TableHead className="w-1/4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedCoins.map((coin) => (
              <TableRow key={coin.symbol} className="h-10">
                <TableCell className="font-medium">{coin.symbol}</TableCell>
                <TableCell>
                  <Select value={coin.position} onValueChange={(value) => onSideChange(coin.symbol, value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={coin.weight}
                    onChange={(e) => onWeightChange(coin.symbol, e.target.value)}
                    className="w-full"
                    min="0"
                    step="0.1"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onRemoveCoin(coin.symbol)} className="p-0">
                    <X size={16} className="text-red-500 hover:text-red-700" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex justify-between">
          <Button onClick={onUpdateBasket} className="bg-blue-500 hover:bg-blue-600 text-white">
            Update Basket
          </Button>
          <Button onClick={onClearBasket} variant="destructive">
            Clear Basket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedCoins;