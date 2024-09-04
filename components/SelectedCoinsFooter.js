import React from 'react';
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const SelectedCoinsFooter = React.memo(({ selectedCoins, onRemoveCoin, onCreateBasket, onEditBasket, onResetBasket, basketCreated }) => {
  return (
    <CardFooter className="border-t">
      <div className="w-full">
        <h3 className="font-semibold mb-2">Selected Coins:</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCoins.map(coin => (
            <Button
              key={coin.symbol}
              variant="outline"
              size="sm"
              disabled={basketCreated}
              onClick={() => !basketCreated && onRemoveCoin(coin.symbol)}
              className={`flex items-center gap-1 ${
                basketCreated 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              }`}
            >
              {coin.symbol}
              {!basketCreated && <X size={14} />}
            </Button>
          ))}
        </div>
        {basketCreated ? (
          <div className="flex gap-2">
            <Button 
              onClick={onEditBasket} 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Edit Basket
            </Button>
            <Button 
              onClick={onResetBasket} 
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Reset
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onCreateBasket} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Create Basket ({selectedCoins.length})
          </Button>
        )}
      </div>
    </CardFooter>
  );
});

SelectedCoinsFooter.displayName = 'SelectedCoinsFooter';

export default SelectedCoinsFooter;