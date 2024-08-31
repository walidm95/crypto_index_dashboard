'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, GripHorizontal } from 'lucide-react'
import { createChart } from 'lightweight-charts'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Resizable } from 're-resizable'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const dummyChartData = [
  { time: '2023-01-01', open: 100, high: 105, low: 98, close: 103 },
  { time: '2023-01-02', open: 103, high: 107, low: 101, close: 105 },
  { time: '2023-01-03', open: 105, high: 110, low: 103, close: 108 },
  { time: '2023-01-04', open: 108, high: 112, low: 106, close: 110 },
  { time: '2023-01-05', open: 110, high: 115, low: 108, close: 113 },
]

const availableCoins = [
  { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 45000, volume: 28000000000, change: 2.5, sector: 'Currency' },
  { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3200, volume: 15000000000, change: -1.2, sector: 'Smart Contracts' },
  { id: 3, name: 'Cardano', symbol: 'ADA', price: 1.2, volume: 1500000000, change: 0.8, sector: 'Smart Contracts' },
  { id: 4, name: 'Binance Coin', symbol: 'BNB', price: 420, volume: 2000000000, change: 3.1, sector: 'Exchange' },
  { id: 5, name: 'Solana', symbol: 'SOL', price: 150, volume: 3000000000, change: -2.3, sector: 'Smart Contracts' },
]

const resolutions = [
  { value: '1', label: '1 minute' },
  { value: '5', label: '5 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: 'D', label: '1 day' },
]

export default function CryptoSpreadInstrumentBuilder() {
  const [selectedCoins, setSelectedCoins] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showIndividualCoins, setShowIndividualCoins] = useState(false)
  const [showAggregates, setShowAggregates] = useState(false)
  const [resolution, setResolution] = useState('D')
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (chartContainerRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: 'solid', color: '#ffffff' },
          textColor: '#333333',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        },
      })

      const candlestickSeries = chartRef.current.addCandlestickSeries({
        upColor: '#4CAF50',
        downColor: '#FF5252',
        borderVisible: false,
        wickUpColor: '#4CAF50',
        wickDownColor: '#FF5252',
      })

      candlestickSeries.setData(dummyChartData)

      const handleResize = () => {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chartRef.current.remove()
      }
    }
  }, [])

  const handleAddCoin = (coin) => {
    if (!selectedCoins.find(c => c.id === coin.id)) {
      setSelectedCoins([...selectedCoins, { ...coin, position: 'long', weight: 1 }])
    }
  }

  const handleRemoveCoin = (coinId) => {
    setSelectedCoins(selectedCoins.filter(c => c.id !== coinId))
  }

  const handlePositionChange = (coinId, position) => {
    setSelectedCoins(selectedCoins.map(c => c.id === coinId ? { ...c, position } : c))
  }

  const handleWeightChange = (coinId, weight) => {
    setSelectedCoins(selectedCoins.map(c => c.id === coinId ? { ...c, weight: parseFloat(weight) } : c))
  }

  const filteredCoins = availableCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const onDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(selectedCoins)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedCoins(items)
  }

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-4xl font-bold mb-8 text-blue-900">Crypto Spread Instrument Builder</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Resizable
            defaultSize={{
              width: '100%',
              height: 'auto',
            }}
            minWidth="300px"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-blue-900">Available Coins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Input
                    type="text"
                    placeholder="Search coins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>24h %</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCoins.map(coin => (
                        <TableRow key={coin.id}>
                          <TableCell>{coin.name} ({coin.symbol})</TableCell>
                          <TableCell>${coin.price.toLocaleString()}</TableCell>
                          <TableCell>${(coin.volume / 1e9).toFixed(2)}B</TableCell>
                          <TableCell className={coin.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {coin.change.toFixed(2)}%
                          </TableCell>
                          <TableCell>{coin.sector}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleAddCoin(coin)}>
                              <Plus size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </Resizable>
          <Resizable
            defaultSize={{
              width: '100%',
              height: 'auto',
            }}
            minWidth="300px"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-blue-900">Selected Coins</CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="selected-coins">
                  {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {selectedCoins.map((coin, index) => (
                        <Draggable key={coin.id} draggableId={coin.id.toString()} index={index}>
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
                                <Select value={coin.position} onValueChange={(value) => handlePositionChange(coin.id, value)}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="long">Long</SelectItem>
                                    <SelectItem value="short">Short</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  value={coin.weight}
                                  onChange={(e) => handleWeightChange(coin.id, e.target.value)}
                                  className="w-20"
                                  min="0"
                                  step="0.1"
                                />
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveCoin(coin.id)} className="text-red-500 hover:text-red-700">
                                  <Minus size={16} />
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
              </CardContent>
            </Card>
          </Resizable>
        </div>
        <div className="mt-8">
          <Resizable
            defaultSize={{
              width: '100%',
              height: 'auto',
            }}
            minHeight="500px"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-blue-900">Spread Instrument Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-individual"
                      checked={showIndividualCoins}
                      onCheckedChange={setShowIndividualCoins}
                    />
                    <Label htmlFor="show-individual">Show Individual Coins</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-aggregates"
                      checked={showAggregates}
                      onCheckedChange={setShowAggregates}
                    />
                    <Label htmlFor="show-aggregates">Show Long/Short Aggregates</Label>
                  </div>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutions.map((res) => (
                        <SelectItem key={res.value} value={res.value}>{res.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div ref={chartContainerRef} className="w-full h-[400px]" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-900">Total Return</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">+15.2%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-900">Annualized Volatility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-yellow-600">22.5%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-900">Sharpe Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">1.8</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-900">Max Drawdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">-12.3%</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </Resizable>
        </div>
      </DragDropContext>
    </div>
  )
}