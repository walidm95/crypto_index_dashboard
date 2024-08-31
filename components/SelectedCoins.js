import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripHorizontal } from 'lucide-react';

const SelectedCoins = ({ selectedCoins, onUpdateBasket, onClearBasket, onRemoveCoin, onWeightChange }) => {
  const totalWeight = selectedCoins.reduce((sum, coin) => sum + parseFloat(coin.weight), 0);

  const onDragEnd = (result) => {
    // Implement drag and drop functionality here
    
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-900">Selected Coins</CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-grow">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="selected-coins">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {selectedCoins.map((coin, index) => (
                  <Draggable key={coin.symbol} draggableId={coin.symbol} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center justify-between p-2 bg-blue-100 rounded"
                      >
                        <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                          <GripHorizontal size={16} className="text-blue-500" />
                        </div>
                        <span className="font-medium text-blue-900">{coin.symbol}</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={coin.weight}
                            onChange={(e) => onWeightChange(coin.symbol, e.target.value)}
                            className="w-20"
                            min="0"
                            step="0.1"
                          />
                          <Button variant="ghost" size="sm" onClick={() => onRemoveCoin(coin.symbol)} className="text-red-500 hover:text-red-700">
                            Remove
                          </Button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
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