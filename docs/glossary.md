# Glossary — Iron Ore Trading Terminology

## Trade Terms

| Term                | Definition                                                                 |
|---------------------|---------------------------------------------------------------------------|
| **Physical trading** | Buying/selling actual commodities (vs. derivatives/paper trading)         |
| **Counterparty**    | The other party in a trade (buyer or seller)                               |
| **Direction**       | Buy (long) or Sell (short)                                                 |
| **DMT**             | Dry Metric Ton — standard unit for Iron Ore quantity                       |
| **Delivery Period** | The window during which cargo is expected to be delivered                   |

## Incoterms

| Term    | Definition                                                                  |
|---------|----------------------------------------------------------------------------|
| **CFR** | Cost and Freight — seller pays freight to destination port                  |
| **CIF** | Cost, Insurance and Freight — seller pays freight + insurance               |
| **FOB** | Free On Board — buyer pays freight from load port                           |

## Pricing & Benchmarks

| Term                  | Definition                                                              |
|-----------------------|-------------------------------------------------------------------------|
| **TSI 62% Fe CFR China** | Platts TSI Iron Ore 62% Fe CFR China — primary benchmark index       |
| **TSI 58% Fe**        | Lower-grade Iron Ore benchmark                                          |
| **MB 62% Fe**         | Metal Bulletin 62% Fe index (alternative benchmark)                     |
| **QP (Quotational Period)** | Date range over which curve prices are averaged to determine the contract price |
| **QP Convention**     | Rule defining the QP relative to BL date (month of BL, month prior, etc.) |
| **Price Curve**       | Time series of daily benchmark prices                                    |
| **Curve Snapshot**    | Point-in-time capture of a curve (for historical valuation)              |

## Shipping & Execution

| Term              | Definition                                                                |
|-------------------|--------------------------------------------------------------------------|
| **BL (Bill of Lading)** | Shipping document confirming cargo loaded on vessel                 |
| **BL Date**       | Date on the Bill of Lading — anchors the QP calculation                   |
| **BL Quantity**    | Quantity stated on the BL (actual loaded quantity)                         |
| **Vessel**        | Ship carrying the cargo                                                    |
| **Load Port**     | Port where cargo is loaded onto the vessel                                 |
| **Discharge Port** | Port where cargo is unloaded from the vessel                              |

## Quality & Assays

| Term              | Definition                                                                |
|-------------------|--------------------------------------------------------------------------|
| **Assay**         | Chemical analysis of cargo quality (Fe, moisture, impurities)              |
| **Provisional Assay** | Assay performed at load port (initial quality assessment)              |
| **Final Assay**   | Assay performed at discharge port (definitive quality assessment)          |
| **Fe %**          | Iron content percentage — primary quality metric                           |
| **Moisture %**    | Water content — penalized above threshold (typically 8%)                   |
| **SiO2 (Silica)** | Impurity — penalized above specification                                  |
| **Al2O3 (Alumina)** | Impurity — penalized above specification                                |
| **P (Phosphorus)** | Impurity — penalized above specification                                  |
| **S (Sulphur)**   | Impurity — penalized above specification                                   |

## Settlement

| Term                    | Definition                                                          |
|-------------------------|---------------------------------------------------------------------|
| **Provisional Price**   | Price computed using provisional assay + QP curve average            |
| **Final Price**         | Price computed using final assay + QP curve average                  |
| **P&F (Provisional & Final)** | Settlement process: adjusting payment based on final vs provisional price |
| **P&F Adjustment**      | (Final Price - Provisional Price) × BL Quantity                     |

## Risk Management

| Term                  | Definition                                                            |
|-----------------------|-----------------------------------------------------------------------|
| **MTM (Mark-to-Market)** | Unrealized P&L based on current market price vs contract price      |
| **Exposure**          | Open quantity subject to price risk                                    |
| **Net Exposure**      | Long exposure minus short exposure (by period)                         |
| **Gross Exposure**    | Total open quantity regardless of direction                            |
| **Direction Factor**  | +1 for Buy (benefits from price rise), -1 for Sell (benefits from price fall) |

## P&L

| Term                  | Definition                                                            |
|-----------------------|-----------------------------------------------------------------------|
| **Realized P&L**      | Profit/loss on matched buy-sell pairs                                  |
| **Unrealized P&L**    | Profit/loss on unmatched open positions (= MTM)                        |
| **FIFO Matching**     | First-In-First-Out: match oldest buy against oldest sell               |
| **Manual Matching**   | User-selected buy-sell pairings                                        |
| **Matched Quantity**  | Quantity paired between a buy and sell contract                         |
| **Open Quantity**     | Quantity not yet matched (still exposed to market)                     |
