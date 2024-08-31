import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createChartInstance, addLineSeries, addCandlestickSeries, updateChartSize } from '@/lib/chartUtils';
import BasketStatistics from './BasketStatistics';

const BasketChart = ({
  basketData,
  componentData,
  selectedCoin,
  resolution,
  onResolutionChange,
  basketStats,
  isLoading,
  showComponentLines,
  setShowComponentLines,
  showLongShortLines,
  setShowLongShortLines,
  symbolsInfo
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    if ((basketData.length > 0 || selectedCoin) && chartContainerRef.current) {
      const chart = createChartInstance(chartContainerRef.current);

      if (selectedCoin) {
        const pricePrecision = symbolsInfo[selectedCoin.symbol]?.pricePrecision || 2;
        addCandlestickSeries(chart, selectedCoin.data, pricePrecision);
      } else {
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
    }, [basketData, componentData, selectedCoin, showComponentLines, showLongShortLines, symbolsInfo]);
  
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-900">Spread Instrument Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Select value={resolution} onValueChange={onResolutionChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="D">1 day</SelectItem>
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
          </div>
          <div className="flex-grow">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div ref={chartContainerRef} className="w-full h-full" />
            )}
          </div>
          <BasketStatistics basketStats={basketStats} />
        </CardContent>
      </Card>
    );
  };
  
  export default BasketChart;