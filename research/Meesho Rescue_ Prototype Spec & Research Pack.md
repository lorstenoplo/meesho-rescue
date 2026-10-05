# Meesho Rescue: Prototype Spec & Research Pack

Rescue = when a COD parcel is refused at the door, offer it to a nearby interested buyer instead of sending it back to the seller. Scoring logic is exactly as in the Meesho Rescue spec PDF (two stages). This doc adds the build specs, data sources and corrections.

## 1. Corrections to the Zomato-based assumptions

| Earlier assumption | Why it was wrong | Corrected design |
| --- | --- | --- |
| 3 km radius | Zomato's radius exists because food gets cold. Tier 2/3 buyers travel easily and kirana stores anchor local life. | Eligibility is based on the **Rescue Point** (a partner kirana near the refusal location) and the last-mile hub catchment. Radius is a slider, default **10 km** (my assumption, tune it). |
| Claim window of a few minutes | Nobody buys a kurti within minutes of a push. | Offer lives for **hours to days**. Default: Wave 1 (top 3) holds 12 h, Wave 2 (next 5, wider radius) holds 12 h, then fall back to standard RTO. Windows are configurable. |
| Perishables excluded | Meesho sells clothes, not food. | Tier C ("not eligible") becomes: very low value items, hygiene items (e.g. innerwear), damaged or opened parcels, anything where RTO cost beats resale value. These are my suggested rules; the spec only defines Tier C abstractly. |

The kirana is the key difference from Zomato: it acts as a **handoff point**, so the parcel waits there while the offer is live and the buyer picks up or the rider completes delivery.

## 2. Prototype scope

Goal: a business-competition demo that *shows* the flow, with enough realism to be credible. Not a production system.

**Stack (suggested):** React frontend with Leaflet and OpenStreetMap tiles (free, no API key), FastAPI backend, SQLite, an XGBoost model file loaded at startup, a simulated clock so a 24 h offer plays out in seconds.

**Screens**

1. **Ops console:** live list of parcels. A "Refuse at door" button simulates a COD refusal.
2. **Map:** the refusal location, nearby real kirana stores (pins), candidate buyers (anonymised dots) colored by score.
3. **Scoring inspector:** for a chosen parcel, a table of candidates showing Base weight × Best signal × Match multiplier = Final score, plus SHAP bars explaining the intent model.
4. **Buyer phone mock:** the push notification and offer card (rescue price, pickup kirana, expiry countdown, prepaid-only pay button).
5. **Outcome tile:** rescued vs. fell back to RTO, with a counter. Use the case-book cost figures only if you want a savings number.

**Demo script (about 2 minutes)**

1. Parcel is out for delivery, a Tier B kurti, seller opted in.
2. Buyer refuses at the door (COD).
3. Stage 1 runs: opted in? yes. Tier B, base weight 0.8.
4. Stage 2 scores candidates in the catchment. Show the two worked examples from the PDF (0.64 and 0.192) live.
5. Top 3 get offers. One accepts and pays via UPI. Parcel is picked up at the kirana. Counter ticks up.
6. Toggle "Spec mode" and "Enhanced mode" to show how the intent model demotes idle carts.

## 3. Scoring engine (exact spec)

```python
BASE = {"A": 1.0, "B": 0.8, "C": 0.0}
MATCH = {"A": {"exact": 1.0, "similar": 0.8},
         "B": {"exact": 1.0, "similar": 0.4}}

def cart_score(hours):      # Signal 1
    return 1.0 if hours < 3 else 0.8 if hours < 24 else 0.5 if hours < 72 else 0.2
def wish_score(hours):
    return 0.9 if hours < 3 else 0.7 if hours < 24 else 0.4 if hours < 72 else 0.1
def search_score(days):     # Signal 2
    return 0.6 if days <= 3 else 0.4 if days <= 7 else 0.2
REGION = {"high_30d": 0.5, "repeat_buyer": 0.3, "category_only": 0.1}  # Signal 3

def final_score(parcel, cand):
    if not parcel.seller_opted_in: return 0.0          # Gate a
    base = BASE[parcel.tier]
    if base == 0: return 0.0                           # Gate b
    signals = [s for s in cand.signals]                # each already scored
    best = max(signals, default=0.0)                   # MAX, never sum
    return base * best * MATCH[parcel.tier][cand.match_type]
```

**Enhanced mode (my extension, off by default):** replace Signal 1's step buckets with a smooth decay and multiply by an intent-quality score (0.3 to 1.0) from a gradient-boosting model. Keep the max rule and the final formula unchanged.

**Intent features (reasoned, not sourced):** item view count, time since last interaction, wishlist to cart move, buyer's past cart-to-order rate, past COD refusals (negative), cart size.

## 4. Data sources

**Behavior data for the intent model**

- REES46 multi-category store dataset (events: view, cart, remove_from_cart, purchase): [https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store](https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store)
  - Kaggle login required, multi-GB. Use one month (the files are 2019-Oct and 2019-Nov) or a sample. A loading example is in this notebook: [https://nbviewer.org/format/script/github/recohut/notebook/blob/master/\_notebooks/2021-06-19-recsys20-tutorial-feature-engineering-part-1.ipynb](https://nbviewer.org/format/script/github/recohut/notebook/blob/master/_notebooks/2021-06-19-recsys20-tutorial-feature-engineering-part-1.ipynb)
  - A cosmetics-store sibling dataset ("eCommerce Events History in Cosmetics Shop", same author) exists on Kaggle, but I didn't verify its link; search it by name.
  - Limitation: it is electronics and cosmetics, not clothing. Use it to learn behavior patterns, then map categories to your clothing SKUs in the simulation.
  - A paper using it reports heavy imbalance (non-purchase to purchase about 7:1 for cosmetics and 35:1 for electronics at the user-journey level), so optimize recall/F1 and use class weights: [https://ar5iv.labs.arxiv.org/html/2102.01625](https://ar5iv.labs.arxiv.org/html/2102.01625)
- UCI "Online Shoppers Purchasing Intention" dataset (12,330 sessions). I didn't verify the UCI link; search it by name. It has no cart-specific fields.

**Existing code you can adapt**

- XGBoost + SHAP + Streamlit demo on the UCI dataset (PR-AUC 0.75): [https://github.com/Pradakshana3435/cart-abandonment-prediction](https://github.com/Pradakshana3435/cart-abandonment-prediction)
- Gradient boosting pipeline on the same data (ROC-AUC about 0.936): [https://github.com/grarun2001/online-shoppers-purchase-prediction](https://github.com/grarun2001/online-shoppers-purchase-prediction)

Neither is Meesho-specific. Treat them as scaffolding for training, SHAP and thresholds.

**Kirana / store locations**

- OpenStreetMap via the Overpass API. Endpoint: `https://overpass-api.de/api/interpreter`. Query tool: [https://overpass-turbo.eu](https://overpass-turbo.eu)
- Tags to try: `shop=convenience`, `shop=general`, plus `shop=clothes` for competitor context. An OSM India thread confirms `shop=convenience` is the community choice for small local shops: [https://lists.openstreetmap.org/pipermail/talk-in/2017-May/002892.html](https://lists.openstreetmap.org/pipermail/talk-in/2017-May/002892.html)
- Coverage in smaller towns may be thin. I haven't verified it for your target city, so run the query first.
- Fallback: Google Places API (paid, official). Don't scrape Google Maps; it violates their terms.

```
[out:json][timeout:60];
area["name"="Coimbatore"]->.a;
( node["shop"~"convenience|general"](area.a);
  way["shop"~"convenience|general"](area.a); );
out center;
```

(Swap in your demo city. Save the result as `kirana.json`.)

**Synthetic data (you generate this)**

- \~2,000 buyers scattered around the chosen city, each with a home pincode and nearest kirana.
- \~5,000 events per buyer-week sampled from REES46-like patterns (cart, wishlist, search with timestamps).
- \~200 parcels (clothing SKUs, tiers A/B/C) with seller opt-in flags.
- Meesho's real internal data is not public, so label all of this clearly as simulated.

## 5. API sketch

| Endpoint | Purpose |
| --- | --- |
| `POST /parcels/{id}/refuse` | Triggers Stage 1, then Stage 2 |
| `GET /parcels/{id}/candidates` | Ranked candidates with score breakdown |
| `POST /offers/{id}/accept` | Marks accepted, locks parcel to the kirana |
| `POST /sim/advance` | Moves the simulated clock |
| `GET /kirana?near=lat,lng&r=km` | Nearby Rescue Points |

**Tables:** `parcel`, `buyer`, `event`, `kirana`, `offer`.

## 6. Realism rules to include

- Offers are prepaid only (UPI), otherwise the rescued buyer can refuse too.
- One rescue push per buyer per day, to avoid spamming.
- The original buyer and their pincode neighborhood never see the offer (same principle Zomato uses).
- If nobody accepts by the end of Wave 2, the parcel continues as normal RTO. No extra cost beyond holding time.
- Rescue price is a configurable discount (default 10 to 20%, my assumption).

## 7. Build order

1. Scoring engine and unit tests using both PDF worked examples (0.64 and 0.192).
2. Overpass pull for kirana data plus the synthetic generator.
3. Map UI with ranked candidates and the scoring inspector.
4. Buyer phone mock and offer flow.
5. Enhanced mode: XGBoost intent model plus SHAP.
6. Polish and rehearse the 2-minute demo.

## 8. Unverified items to check

- Overpass coverage for your demo city's kirana stores.
- Links to the UCI dataset and the cosmetics Kaggle dataset.
- Default radius, wave timings and discount: my assumptions, tune with a mentor or user survey.