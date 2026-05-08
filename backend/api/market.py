"""
Market Data API routes for BitScan
- Live cryptocurrency prices via CoinGecko
- Crypto news feed via CryptoPanic
- Server-side caching to avoid rate limits
"""

import time
import logging
from typing import Optional, Dict, Any
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter()

# ──────────────────────────────────────────────
# In-memory cache
# ──────────────────────────────────────────────
_cache: Dict[str, Any] = {}

def _get_cached(key: str, max_age_seconds: int) -> Optional[Any]:
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < max_age_seconds:
        return entry["data"]
    return None

def _set_cache(key: str, data: Any):
    _cache[key] = {"data": data, "ts": time.time()}


# ──────────────────────────────────────────────
# Coin list
# ──────────────────────────────────────────────
COIN_IDS = "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,polkadot,matic-network"

COIN_SYMBOLS = {
    "bitcoin": {"symbol": "BTC", "name": "Bitcoin", "color": "#F7931A"},
    "ethereum": {"symbol": "ETH", "name": "Ethereum", "color": "#627EEA"},
    "solana": {"symbol": "SOL", "name": "Solana", "color": "#9945FF"},
    "binancecoin": {"symbol": "BNB", "name": "BNB", "color": "#F3BA2F"},
    "ripple": {"symbol": "XRP", "name": "XRP", "color": "#00AAE4"},
    "cardano": {"symbol": "ADA", "name": "Cardano", "color": "#0033AD"},
    "dogecoin": {"symbol": "DOGE", "name": "Dogecoin", "color": "#C2A633"},
    "avalanche-2": {"symbol": "AVAX", "name": "Avalanche", "color": "#E84142"},
    "polkadot": {"symbol": "DOT", "name": "Polkadot", "color": "#E6007A"},
    "matic-network": {"symbol": "MATIC", "name": "Polygon", "color": "#8247E5"},
}


# ──────────────────────────────────────────────
# Routes — Crypto Prices
# ──────────────────────────────────────────────
@router.get("/prices", tags=["Market"])
async def get_crypto_prices():
    """
    Fetch live prices for top cryptocurrencies from CoinGecko.
    Cached for 30 seconds to respect rate limits.
    """
    cached = _get_cached("prices", 30)
    if cached:
        return cached

    url = (
        "https://api.coingecko.com/api/v3/coins/markets"
        f"?vs_currency=usd&ids={COIN_IDS}"
        "&order=market_cap_desc&per_page=20&page=1"
        "&sparkline=false&price_change_percentage=24h"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            raw = resp.json()

        coins = []
        for item in raw:
            cid = item.get("id", "")
            meta = COIN_SYMBOLS.get(cid, {})
            coins.append({
                "id": cid,
                "symbol": meta.get("symbol", item.get("symbol", "").upper()),
                "name": meta.get("name", item.get("name", "")),
                "color": meta.get("color", "#60a5fa"),
                "image": item.get("image", ""),
                "current_price": item.get("current_price", 0),
                "market_cap": item.get("market_cap", 0),
                "market_cap_rank": item.get("market_cap_rank", 0),
                "total_volume": item.get("total_volume", 0),
                "price_change_24h": item.get("price_change_24h", 0),
                "price_change_percentage_24h": item.get("price_change_percentage_24h", 0),
                "high_24h": item.get("high_24h", 0),
                "low_24h": item.get("low_24h", 0),
                "last_updated": item.get("last_updated", ""),
            })

        result = {
            "coins": coins,
            "updated_at": datetime.utcnow().isoformat(),
            "currency": "USD",
        }
        _set_cache("prices", result)
        return result

    except httpx.HTTPStatusError as e:
        logger.error("CoinGecko HTTP error: %s", e)
        # Return stale cache if available
        stale = _get_cached("prices", 300)
        if stale:
            stale["stale"] = True
            return stale
        raise HTTPException(status_code=502, detail="Failed to fetch crypto prices")
    except Exception as e:
        logger.error("CoinGecko error: %s", e)
        stale = _get_cached("prices", 300)
        if stale:
            stale["stale"] = True
            return stale
        raise HTTPException(status_code=502, detail="Failed to fetch crypto prices")


# ──────────────────────────────────────────────
# Routes — Crypto News
# ──────────────────────────────────────────────
@router.get("/news", tags=["Market"])
async def get_crypto_news():
    """
    Fetch latest crypto news from CryptoPanic public API.
    Cached for 5 minutes.
    """
    cached = _get_cached("news", 300)
    if cached:
        return cached

    url = "https://cointelegraph.com/rss"

    try:
        import xml.etree.ElementTree as ET
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            root = ET.fromstring(resp.content)

        articles = []
        for item in root.findall('.//item')[:20]:
            title = item.find('title')
            title_text = title.text if title is not None and title.text else ""
            title_lower = title_text.lower()
            
            link = item.find('link')
            link_text = link.text if link is not None and link.text else ""
            
            pubDate = item.find('pubDate')
            pubDate_text = pubDate.text if pubDate is not None and pubDate.text else datetime.utcnow().isoformat()
            
            # Simple sentiment heuristic based on title keywords
            sentiment = "neutral"
            if any(w in title_lower for w in ["bull", "surge", "jump", "soar", "high", "gain", "buy", "up"]):
                sentiment = "bullish"
            elif any(w in title_lower for w in ["bear", "crash", "plunge", "drop", "low", "loss", "sell", "hack", "down"]):
                sentiment = "bearish"

            categories = []
            for cat in item.findall('category'):
                if cat.text:
                    categories.append(cat.text)
            currencies = [{"code": c.upper(), "title": c.upper()} for c in categories if len(c) <= 5 and c.isalpha()][:3]

            articles.append({
                "id": str(time.time() + hash(title_text)),
                "title": title_text,
                "url": link_text,
                "source": "CoinTelegraph",
                "source_domain": "cointelegraph.com",
                "published_at": pubDate_text,
                "sentiment": sentiment,
                "currencies": currencies,
                "votes": {
                    "positive": 0,
                    "negative": 0,
                },
            })

        result = {
            "articles": articles,
            "updated_at": datetime.utcnow().isoformat(),
        }
        _set_cache("news", result)
        return result

    except httpx.HTTPStatusError as e:
        logger.error("CryptoPanic HTTP error: %s", e)
        stale = _get_cached("news", 1800)
        if stale:
            stale["stale"] = True
            return stale
        # Return empty list instead of failing
        return {"articles": [], "updated_at": datetime.utcnow().isoformat(), "error": "News unavailable"}
    except Exception as e:
        logger.error("CryptoPanic error: %s", e)
        stale = _get_cached("news", 1800)
        if stale:
            stale["stale"] = True
            return stale
        return {"articles": [], "updated_at": datetime.utcnow().isoformat(), "error": "News unavailable"}
