import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const BasketStatistics = ({ basketStats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <Card>
        <CardContent>
          <h4 className="text-sm font-medium text-blue-900">Total Return</h4>
          <p className="text-2xl font-bold text-green-600">+{basketStats.totalReturn.toFixed(2)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h4 className="text-sm font-medium text-blue-900">Annualized Volatility</h4>
          <p className="text-2xl font-bold text-yellow-600">{basketStats.annualizedVolatility.toFixed(2)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h4 className="text-sm font-medium text-blue-900">Sharpe Ratio</h4>
          <p className="text-2xl font-bold text-blue-600">{basketStats.sharpeRatio.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h4 className="text-sm font-medium text-blue-900">Max Drawdown</h4>
          <p className="text-2xl font-bold text-red-600">-{basketStats.maxDrawdown.toFixed(2)}%</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasketStatistics;