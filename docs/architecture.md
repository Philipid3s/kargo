# Architecture & Technical Decisions

## Tech Stack

| Component    | Choice       | Rationale                                          |
|--------------|--------------|-----------------------------------------------------|
| Database     | SQLite       | Zero-config, file-based, perfect for POC            |
| Schema style | Relational   | Natural fit for commodity trading domain             |
| ENUMs        | CHECK constraints | SQLite doesn't support native ENUMs              |
| Timestamps   | TEXT (ISO 8601) | SQLite has no native datetime; store as text      |
| IDs          | INTEGER PK AUTOINCREMENT | Simple, sequential, SQLite-native       |

## Design Principles

1. **Backend-first**: Domain model and calculations are the priority; UI is secondary
2. **Clarity over abstraction**: No unnecessary design patterns
3. **Extensibility**: Schema designed to accommodate future multi-commodity, multi-currency
4. **Correctness**: Pricing calculations must be verifiable with sample data
5. **Auditability**: Store full price breakdowns and MTM history

## Key Design Decisions

### Pricing Formulas as Structured Data
Formulas are stored as structured fields (not as expression strings or code). This is simpler, safer, and sufficient for the Iron Ore use case where the formula structure is well-defined.

**Trade-off**: Less flexible than a DSL/expression engine, but much simpler to implement and validate.

### Curve Snapshots for MTM History
Rather than relying on "latest curve data" for historical MTM, we store curve snapshots. This enables accurate historical revaluation and scenario analysis.

### Separate Provisional/Final Price Records
Each shipment can have up to two price records (provisional + final) with full breakdowns. This supports the P&F settlement workflow and provides full audit trail.

### Matching Independent of Shipping
Contract matching (for P&L) is decoupled from shipment execution. A contract can be matched before it's shipped, or shipped before it's matched. This reflects real trading operations.

---

## PostgreSQL Migration Notes

When migrating from SQLite to PostgreSQL:

| Change                        | SQLite                           | PostgreSQL                        |
|-------------------------------|----------------------------------|-----------------------------------|
| ENUMs                         | CHECK constraints                | Native ENUM types                 |
| Auto-increment                | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` |
| Dates                         | TEXT (ISO 8601)                  | `DATE` / `TIMESTAMP`              |
| Boolean                       | INTEGER (0/1)                    | `BOOLEAN`                         |
| String types                  | TEXT                             | `VARCHAR(n)` where appropriate    |
| Concurrency                   | File-level locking               | Row-level locking (MVCC)          |
| Full-text search              | FTS5 extension                   | Native `tsvector`                 |

### Migration Steps
1. Convert CHECK constraints to ENUM types
2. Replace AUTOINCREMENT with SERIAL/IDENTITY
3. Add proper DATE/TIMESTAMP types
4. Add indexes for performance (SQLite indexes work but PostgreSQL has more options)
5. Add connection pooling and transaction isolation levels

---

## Future Extensions

### Multi-Commodity
- Add `commodity` table and FK on contracts
- Generalize quality specs (currently Iron Ore-specific)
- Add commodity-specific formula templates

### FX Handling
- Add `currency` field on contracts and curves
- FX rate curves alongside commodity curves
- Convert exposure and P&L to reporting currency

### Derivative Hedging Overlay
- Add `hedge` entity (swaps, futures)
- Link hedges to physical contracts
- Net exposure = physical exposure + hedge positions

### Logistics Module
- Vessel tracking, ETA management
- Demurrage calculations
- Document management (BL, certificates)

### Reporting / BI Layer
- Dashboard views: exposure heat map, P&L waterfall
- Scheduled MTM runs with email alerts
- Export to Excel / PDF
