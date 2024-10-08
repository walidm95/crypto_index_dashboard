import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { createChartInstance, addLineSeries, updateChartSize, calculateAggregatedLine } from '@/utils/chartUtils';
import BasketStatistics from './BasketStatistics';

const BasketChart = ({
  selectedCoins,
  resolution,
  onResolutionChange,
  showComponentLines,
  setShowComponentLines,
  showLongShortLines,
  setShowLongShortLines,
  symbolsInfo,
  basketData,
  componentData,
  basketStats,
  isLoading,
  error,
  onLoadBasket
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const [savedBaskets, setSavedBaskets] = useState([]);
  const [newBasketName, setNewBasketName] = useState('');
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
  const [isLoadPopoverOpen, setIsLoadPopoverOpen] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState(null);

  useEffect(() => {
    const storedBaskets = localStorage.getItem('savedBaskets');
    if (storedBaskets) {
      setSavedBaskets(JSON.parse(storedBaskets));
    }
  }, []);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChartInstance(chartContainerRef.current);

      if (basketData.length > 0) {
        addLineSeries(chart, basketData, '#2962FF', 3, 'Basket');

        if (showComponentLines) {
          const vividColors = [
            '#FF1493', // Deep Pink
            '#00FF00', // Lime
            '#1E90FF', // Dodger Blue
            '#FFD700', // Gold
            '#FF4500', // Orange Red
            '#8A2BE2', // Blue Violet
            '#00FFFF', // Cyan
            '#FF69B4', // Hot Pink
            '#32CD32', // Lime Green
            '#FF00FF', // Magenta
          ];

          componentData.forEach((component, index) => {
            const color = vividColors[index % vividColors.length];
            addLineSeries(chart, component.data, color, 1.5, component.symbol);
          });
        }

        if (showLongShortLines) {
          addLineSeries(chart, calculateAggregatedLine(componentData, selectedCoins, 'long'), 'rgba(0, 255, 0, 0.8)', 2, 'Longs');
          addLineSeries(chart, calculateAggregatedLine(componentData, selectedCoins, 'short'), 'rgba(255, 0, 0, 0.8)', 2, 'Shorts');
        }
      }

      const handleResize = () => {
        updateChartSize(chart);
      };

      window.addEventListener('resize', handleResize);

      chartRef.current = chart;

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [basketData, componentData, showComponentLines, showLongShortLines, symbolsInfo, resolution]);

  const handleSaveBasket = () => {
    if (newBasketName) {
      const updatedBaskets = [...savedBaskets, { name: newBasketName, coins: selectedCoins }];
      setSavedBaskets(updatedBaskets);
      localStorage.setItem('savedBaskets', JSON.stringify(updatedBaskets));
      setNewBasketName('');
      setIsSavePopoverOpen(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-x-4">
        <div className="flex items-center space-x-4">
          <Select value={resolution} onValueChange={onResolutionChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select resolution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 minute</SelectItem>
              <SelectItem value="5m">5 minutes</SelectItem>
              <SelectItem value="15m">15 minutes</SelectItem>
              <SelectItem value="30m">30 minutes</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="4h">4 hour</SelectItem>
              <SelectItem value="1d">1 day</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-individual"
              checked={showComponentLines}
              onCheckedChange={setShowComponentLines}
            />
            <Label htmlFor="show-individual">Show Individual Coins</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-aggregates"
              checked={showLongShortLines}
              onCheckedChange={setShowLongShortLines}
            />
            <Label htmlFor="show-aggregates">Show Long/Short Aggregates</Label>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select onValueChange={(basket) => {
            setSelectedBasket(basket);
            onLoadBasket(basket);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Saved Baskets" />
            </SelectTrigger>
            <SelectContent>
              {savedBaskets.map((basket, index) => (
                <SelectItem key={index} value={basket}>{basket.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover open={isSavePopoverOpen} onOpenChange={setIsSavePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">New</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col space-y-2">
                <Input
                  type="text"
                  placeholder="Basket name"
                  value={newBasketName}
                  onChange={(e) => setNewBasketName(e.target.value)}
                />
                <Button onClick={handleSaveBasket}>Save</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {selectedCoins.length > 0 ? (
          <>
            <div className="flex-grow relative">
              {isLoading ? (
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
              )}
            </div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
            <BasketStatistics basketStats={basketStats} />
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 text-lg">Create a basket to view the chart</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BasketChart;