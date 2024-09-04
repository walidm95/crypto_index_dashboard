import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';
import { adjustWeights, updateCoinWeight } from '@/utils/weightUtils';
import { Label } from "@/components/ui/label";

const BasketConfigModal = ({ isOpen, onClose, selectedCoins, onConfirm}) => {
  const [localCoins, setLocalCoins] = useState(selectedCoins);

  useEffect(() => {
    setLocalCoins(adjustWeights(selectedCoins));
  }, [selectedCoins]);

  const handleWeightChange = (index, newWeight) => {
    setLocalCoins(updateCoinWeight(localCoins, localCoins[index].symbol, newWeight));
  };

  const handlePositionChange = (index, newPosition) => {
    const updatedCoins = [...localCoins];
    updatedCoins[index] = { ...updatedCoins[index], position: newPosition };
    setLocalCoins(adjustWeights(updatedCoins));
  };

  const handleRemoveCoin = (symbol) => {
    setLocalCoins(adjustWeights(localCoins.filter(coin => coin.symbol !== symbol)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600">Configure Basket</DialogTitle>
          <p className="text-gray-600">Adjust the weights and positions for your selected coins. The total weight per position (long or short) will always be 50%.</p>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th className="py-2 px-3 text-left font-semibold text-gray-700">Coin</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-700">Position</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-700">Weight (%)</th>
                <th className="py-2 px-3 text-left font-semibold text-gray-700">Remove</th>
              </tr>
            </thead>
            <tbody>
              {localCoins.map((coin, index) => (
                <tr key={coin.symbol} className={`border-b border-gray-200 hover:bg-gray-50 ${coin.position === 'long' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <td className="py-2 px-3">
                    <Label className="font-medium text-blue-700">{coin.symbol}</Label>
                  </td>
                  <td className="py-2 px-3">
                    <Select value={coin.position} onValueChange={(value) => handlePositionChange(index, value)}>
                      <SelectTrigger className={`w-full ${coin.position === 'long' ? 'text-green-600' : 'text-red-600'}`}>
                        <SelectValue placeholder="Side" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long" className="text-green-600">Long</SelectItem>
                        <SelectItem value="short" className="text-red-600">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      value={coin.weight}
                      onChange={(e) => handleWeightChange(index, parseFloat(e.target.value))}
                      className="w-full"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveCoin(coin.symbol)} className="text-red-500 hover:text-red-700">
                      <X size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="mr-2">Cancel</Button>
          <Button onClick={() => onConfirm(localCoins)} className="bg-blue-600 hover:bg-blue-700">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BasketConfigModal;