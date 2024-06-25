import pandas as pd
import numpy as np
import streamlit as st
import plotly.graph_objects as go
from datetime import datetime, timedelta
import requests
from typing import List, Dict
from dataclasses import dataclass
from functools import lru_cache

@dataclass
class Coin:
    symbol: str
    price: float
    beta: float
    is_buy: bool = False

class BinanceFuturesAPI:
    BASE_URL = "https://fapi.binance.com"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'CryptoDashboard/1.0'})

    @st.cache_data(ttl=3600)
    def _make_request(_self, endpoint: str, params: Dict = None) -> Dict:
        url = f"{_self.BASE_URL}{endpoint}"
        try:
            response = _self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            st.error(f"Error making request to {url}: {e}")
            return {}

    @lru_cache(maxsize=1)
    def get_futures_symbols(self) -> List[str]:
        endpoint = "/fapi/v1/exchangeInfo"
        exchange_info = self._make_request(endpoint)
        return [symbol['symbol'] for symbol in exchange_info.get('symbols', []) if symbol['symbol'].endswith('USDT')]

    def get_futures_prices(self, symbols: List[str]) -> Dict[str, float]:
        endpoint = "/fapi/v1/ticker/price"
        tickers = self._make_request(endpoint)
        return {ticker['symbol']: float(ticker['price']) for ticker in tickers if ticker['symbol'] in symbols}
    
    def get_futures_data(self) -> List[Coin]:
        symbols = self.get_futures_symbols()
        prices = self.get_futures_prices(symbols)
        
        # TODO: Implement actual beta calculation
        return [Coin(symbol=symbol, price=prices.get(symbol, 0), beta=1.0) for symbol in symbols]

    def get_historical_klines(self, symbol: str, interval: str, start_str: str, end_str: str = None) -> pd.DataFrame:
        endpoint = "/fapi/v1/klines"
        params = {
            "symbol": symbol,
            "interval": interval,
            "startTime": int(datetime.strptime(start_str, "%Y-%m-%d").timestamp() * 1000)
        }
        if end_str:
            params["endTime"] = int(datetime.strptime(end_str, "%Y-%m-%d").timestamp() * 1000)

        klines = self._make_request(endpoint, params)
        
        if not klines:
            return pd.DataFrame()

        df = pd.DataFrame(klines, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume', 'close_time', 'quote_asset_volume', 'number_of_trades', 'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        return df[['open', 'high', 'low', 'close', 'volume']].astype(float)


class CryptoDashboard:
    def __init__(self):
        self.binance_api = BinanceFuturesAPI()
        self.timeframe = '1h'

    @st.cache_data(ttl=300)
    def fetch_perp_data(_self):
        return _self.binance_api.get_futures_data()

    def handle_coin_selection(self, symbol: str, is_buy: bool):
        if 'selected_coins' not in st.session_state:
            st.session_state.selected_coins = []

        coin = next((coin for coin in st.session_state.selected_coins if coin.symbol == symbol), None)
        if coin:
            coin.is_buy = is_buy
        else:
            new_coin = next(coin for coin in st.session_state.perp_data if coin.symbol == symbol)
            new_coin.is_buy = is_buy
            st.session_state.selected_coins.append(new_coin)
        self.update_synthetic_product()

    def remove_coin(self, symbol: str):
        st.session_state.selected_coins = [coin for coin in st.session_state.selected_coins if coin.symbol != symbol]
        self.update_synthetic_product()

    def update_synthetic_product(self):
        if not st.session_state.selected_coins:
            st.session_state.synthetic_product = pd.DataFrame()
            return

        start_str = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        end_str = datetime.now().strftime("%Y-%m-%d")

        dfs = []
        for coin in st.session_state.selected_coins:
            df = self.binance_api.get_historical_klines(coin.symbol, self.timeframe, start_str, end_str)
            if not df.empty:
                df['return'] = df['close'].pct_change()
                df['weighted_return'] = df['return'] * coin.beta * (1 if coin.is_buy else -1)
                dfs.append(df['weighted_return'])

        if dfs:
            combined_returns = pd.concat(dfs, axis=1).sum(axis=1)
            cumulative_returns = (1 + combined_returns).cumprod()
            st.session_state.synthetic_product = pd.DataFrame({"time": cumulative_returns.index, "value": cumulative_returns.values * 100})
        else:
            st.session_state.synthetic_product = pd.DataFrame()

    def run(self):
        st.set_page_config(page_title="Advanced Crypto Beta Dashboard", layout="wide")
        st.title("Advanced Crypto Beta Dashboard")

        if 'perp_data' not in st.session_state:
            st.session_state.perp_data = self.fetch_perp_data()
        
        if 'selected_coins' not in st.session_state:
            st.session_state.selected_coins = []

        if 'synthetic_product' not in st.session_state:
            st.session_state.synthetic_product = pd.DataFrame()

        col1, col2 = st.columns([2, 1])

        with col1:
            st.subheader("Synthetic Product Chart")
            self.update_chart()

            st.subheader("Selected Coins")
            self.update_selected_coins()

        with col2:
            st.subheader("Perpetual Contracts")
            self.display_perp_contracts()

        self.apply_custom_css()

    def update_chart(self):
        if not st.session_state.synthetic_product.empty:
            fig = go.Figure(data=go.Scatter(x=st.session_state.synthetic_product['time'], 
                                            y=st.session_state.synthetic_product['value'],
                                            mode='lines'))
            fig.update_layout(title="Synthetic Product Performance",
                              xaxis_title="Time",
                              yaxis_title="Value",
                              height=400)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No data to display. Please select coins.")

    def update_selected_coins(self):
        for i, coin in enumerate(st.session_state.selected_coins):
            col1, col2 = st.columns([3, 1])
            col1.write(f"{coin.symbol} ({'Buy' if coin.is_buy else 'Sell'})")
            if col2.button("Remove", key=f"remove_{coin.symbol}_{i}"):
                self.remove_coin(coin.symbol)

    def display_perp_contracts(self):
        for i, coin in enumerate(st.session_state.perp_data):
            col1, col2, col3 = st.columns([2, 1, 1])
            col1.write(f"{coin.symbol} (β: {coin.beta:.2f})")
            
            if col2.button("Buy", key=f"buy_{coin.symbol}_{i}"):
                self.handle_coin_selection(coin.symbol, True)
            
            if col3.button("Sell", key=f"sell_{coin.symbol}_{i}"):
                self.handle_coin_selection(coin.symbol, False)

    @staticmethod
    def apply_custom_css():
        st.markdown(
            """
            <style>
                [data-testid="stVerticalBlock"] > [style*="flex-direction: column;"] > [data-testid="stVerticalBlock"] {
                    max-height: 600px;
                    overflow-y: auto;
                }
            </style>
            """,
            unsafe_allow_html=True,
        )

if __name__ == "__main__":
    dashboard = CryptoDashboard()
    dashboard.run()