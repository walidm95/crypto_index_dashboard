import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { createChartInstance, addLineSeries, updateChartSize } from '@/lib/chartUtils';
import BasketStatistics from './BasketStatistics';
import useBasketData from '@/hooks/useBasketData';

const BasketChart = ({
  selectedCoins,
  resolution,
  onResolutionChange,
  showComponentLines,
  setShowComponentLines,
  showLongShortLines,
  setShowLongShortLines,
  symbolsInfo,
  onEditSpread,
  onResetSpread
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  const { basketData, componentData, basketStats, isLoading, error, refreshData } = useBasketData(selectedCoins, resolution);

  useEffect(() => {
    refreshData(); // Fetch data when the component mounts
  }, [refreshData]);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChartInstance(chartContainerRef.current);

      if (basketData.length > 0) {
        addLineSeries(chart, basketData, '#2962FF', 3, 'Basket Index');

        if (showComponentLines) {
          componentData.forEach((component, index) => {
            const color = `rgba(${index * 50 % 255}, ${(index * 100) % 255}, ${(index * 150) % 255}, 0.7)`;
            addLineSeries(chart, component.data, color, 1, component.symbol);
          });
        }

        if (showLongShortLines) {
          addLineSeries(chart, calculateAggregatedLine('long'), 'rgba(0, 255, 0, 0.8)', 2, 'Longs');
          addLineSeries(chart, calculateAggregatedLine('short'), 'rgba(255, 0, 0, 0.8)', 2, 'Shorts');
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

  const getChartTitle = () => {
    return "Custom Spread Chart";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-blue-900">{getChartTitle()}</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={onEditSpread}>Edit</Button>
          <Button onClick={onResetSpread} variant="outline">Reset</Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
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
                <SelectItem value="1d">1 day</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          {/* <Button onClick={refreshData}>Refresh Data</Button> */}
        </div>
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
      </CardContent>
    </Card>
  );
};

export default BasketChart;