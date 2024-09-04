import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';

const SpreadConfigModal = ({ isOpen, onClose, selectedCoins, onConfirm, onRemoveCoin, onUpdateCoin }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Spread</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {selectedCoins.map((coin, index) => (
            <div key={coin.symbol} className="flex items-center gap-2">
              <span className="w-20">{coin.symbol}</span>
              <Select
                value={coin.position}
                onValueChange={(value) => onUpdateCoin(index, { ...coin, position: value })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={coin.weight}
                onChange={(e) => onUpdateCoin(index, { ...coin, weight: parseFloat(e.target.value) })}
                className="w-20"
              />
              <Button variant="ghost" size="sm" onClick={() => onRemoveCoin(coin.symbol)}>
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onConfirm(selectedCoins)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpreadConfigModal;