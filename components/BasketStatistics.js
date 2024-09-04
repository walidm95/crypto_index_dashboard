import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const BasketStatistics = ({ basketStats }) => {
  const getTotalReturnColor = (value) => value < 0 ? 'text-red-600' : 'text-green-600';
  
  const getSharpeRatioColor = (value) => {
    if (value < 0) return 'text-red-600';
    if (value < 1) return 'text-orange-500';
    return 'text-green-600';
  };
  
  const getMaxDrawdownColor = (value) => {
    if (value <= -50) return 'text-red-700';
    if (value <= -25) return 'text-red-600';
    return 'text-orange-500';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Total Return</h4>
          <p className={`text-3xl font-bold ${getTotalReturnColor(basketStats.totalReturn)}`}>
            {basketStats.totalReturn >= 0 ? '+' : ''}{basketStats.totalReturn.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Annualized Volatility</h4>
          <p className="text-3xl font-bold text-blue-600">
            {basketStats.annualizedVolatility.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Sharpe Ratio</h4>
          <p className={`text-3xl font-bold ${getSharpeRatioColor(basketStats.sharpeRatio)}`}>
            {basketStats.sharpeRatio.toFixed(2)}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Max Drawdown</h4>
          <p className={`text-3xl font-bold ${getMaxDrawdownColor(basketStats.maxDrawdown)}`}>
            -{basketStats.maxDrawdown.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasketStatistics;