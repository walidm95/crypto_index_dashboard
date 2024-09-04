/**
 * Adjusts the weights of selected coins to ensure they sum up to 100%.
 * @param {Array} coins - Array of selected coin objects.
 * @returns {Array} - Array of coins with adjusted weights.
 */
export const adjustWeights = (coins) => {
    if (!coins || coins.length === 0) {
      return [];
    }
  
    const longCoins = coins.filter(coin => coin && coin.position === 'long');
    const shortCoins = coins.filter(coin => coin && coin.position === 'short');
  
    // If all coins are on the same side, distribute weights equally
    if (longCoins.length === 0 || shortCoins.length === 0) {
      const weight = 100 / coins.length;
      return coins.map(coin => ({
        ...coin,
        weight: parseFloat(weight.toFixed(2))
      }));
    }
  
    // If there's a mix of long and short positions, maintain the 50/50 split
    const longWeight = 50 / longCoins.length;
    const shortWeight = 50 / shortCoins.length;
  
    return coins.map(coin => ({
      ...coin,
      weight: parseFloat((coin.position === 'long' ? longWeight : shortWeight).toFixed(2))
    }));
  };
  
  /**
   * Updates the weight of a specific coin and adjusts other coins' weights proportionally.
   * @param {Array} coins - Array of selected coin objects.
   * @param {string} symbol - Symbol of the coin to update.
   * @param {number} newWeight - New weight for the specified coin.
   * @returns {Array} - Array of coins with adjusted weights.
   */
  export const updateCoinWeight = (coins, symbol, newWeight) => {
    const updatedCoins = [...coins];
    const changedCoin = updatedCoins.find(coin => coin.symbol === symbol);
    const oldWeight = changedCoin.weight;
    const newWeightValue = parseFloat(newWeight);
  
    // Calculate the weight difference
    const weightDiff = newWeightValue - oldWeight;
  
    // Update the changed coin's weight
    changedCoin.weight = newWeightValue;
  
    // Adjust other coins' weights proportionally
    const otherCoins = updatedCoins.filter(coin => coin.symbol !== symbol);
    const totalOtherWeight = otherCoins.reduce((sum, coin) => sum + coin.weight, 0);
  
    if (totalOtherWeight > 0) {
      otherCoins.forEach(coin => {
        const proportion = coin.weight / totalOtherWeight;
        coin.weight = Math.max(0, coin.weight - (weightDiff * proportion));
      });
    }
  
    // Ensure the total is exactly 100%
    const totalWeight = updatedCoins.reduce((sum, coin) => sum + coin.weight, 0);
    if (totalWeight !== 100) {
      const adjustment = (100 - totalWeight) / updatedCoins.length;
      updatedCoins.forEach(coin => {
        coin.weight = Math.max(0, coin.weight + adjustment);
      });
    }
  
    // Round weights to two decimal places
    return updatedCoins.map(coin => ({
      ...coin,
      weight: parseFloat(coin.weight.toFixed(2))
    }));
  };
  
  /**
   * Calculates the total weight of coins in a specific position.
   * @param {Array} coins - Array of coin objects.
   * @param {string} position - Position to calculate total weight for ('long' or 'short').
   * @returns {number} - Total weight of coins in the specified position.
   */
  export const calculateTotalWeight = (coins, position) => {
    return coins
      .filter(coin => coin.position === position)
      .reduce((total, coin) => total + coin.weight, 0);
  };
  
  /**
   * Validates if the total weight of all coins is 100%.
   * @param {Array} coins - Array of coin objects.
   * @returns {boolean} - True if total weight is 100%, false otherwise.
   */
  export const validateTotalWeight = (coins) => {
    const totalWeight = coins.reduce((sum, coin) => sum + coin.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01; // Allow for small floating-point errors
  };