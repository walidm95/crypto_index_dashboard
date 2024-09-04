export const formatPrice = (price, symbol, symbolsInfo) => {
    const precision = symbolsInfo[symbol + 'USDT']?.pricePrecision || 2;
    return parseFloat(price).toFixed(precision);
};