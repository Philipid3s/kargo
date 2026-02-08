// Enums
export type Direction = 'BUY' | 'SELL'
export type ContractStatus = 'OPEN' | 'EXECUTED' | 'CLOSED' | 'CANCELLED'
export type ShipmentStatus = 'PLANNED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
export type AssayType = 'PROVISIONAL' | 'FINAL'
export type QPConvention = 'MONTH_OF_BL' | 'MONTH_PRIOR_BL' | 'MONTH_AFTER_BL' | 'CUSTOM'

// Price Curves
export interface CurveDataCreate {
  price_date: string
  price: number
  snapshot_date: string
}

export interface CurveDataOut {
  id: number
  curve_id: number
  price_date: string
  price: number
  snapshot_date: string
}

export interface PriceCurveCreate {
  code: string
  name: string
  currency: string
  uom: string
}

export interface PriceCurveUpdate {
  name?: string
  currency?: string
  uom?: string
}

export interface PriceCurveOut {
  id: number
  code: string
  name: string
  currency: string
  uom: string
}

export interface PriceCurveWithData extends PriceCurveOut {
  data_points: CurveDataOut[]
}

export interface BulkCurveDataUpload {
  data_points: CurveDataCreate[]
}

export interface CurveAverageResponse {
  curve_id: number
  start_date: string
  end_date: string
  average_price: number
  data_point_count: number
}

// Pricing Formulas
export interface FormulaAdjustmentCreate {
  element: string
  threshold: number
  penalty_per_pct: number
}

export interface FormulaAdjustmentOut {
  id: number
  formula_id: number
  element: string
  threshold: number
  penalty_per_pct: number
}

export interface PricingFormulaCreate {
  name: string
  curve_id: number
  basis_fe: number
  fe_rate_per_pct: number
  moisture_threshold: number
  moisture_penalty_per_pct: number
  fixed_premium: number
  adjustments: FormulaAdjustmentCreate[]
}

export interface PricingFormulaUpdate {
  name?: string
  curve_id?: number
  basis_fe?: number
  fe_rate_per_pct?: number
  moisture_threshold?: number
  moisture_penalty_per_pct?: number
  fixed_premium?: number
}

export interface PricingFormulaOut {
  id: number
  name: string
  curve_id: number
  basis_fe: number
  fe_rate_per_pct: number
  moisture_threshold: number
  moisture_penalty_per_pct: number
  fixed_premium: number
  adjustments: FormulaAdjustmentOut[]
}

export interface PriceBreakdown {
  base_price: number
  fe_adjustment: number
  moisture_penalty: number
  impurity_penalties: Record<string, number>
  fixed_premium: number
  total_price: number
}

export interface FormulaEvaluateRequest {
  qp_average: number
  fe?: number
  moisture?: number
  sio2?: number
  al2o3?: number
  p?: number
  s?: number
}

// Contracts
export interface ContractCreate {
  reference: string
  direction: Direction
  counterparty: string
  commodity: string
  quantity: number
  uom: string
  incoterm: string
  delivery_start: string
  delivery_end: string
  status: ContractStatus
  qp_convention: QPConvention
  qp_start_offset?: number
  qp_end_offset?: number
  pricing_formula_id: number
}

export interface ContractUpdate {
  reference?: string
  direction?: Direction
  counterparty?: string
  commodity?: string
  quantity?: number
  uom?: string
  incoterm?: string
  delivery_start?: string
  delivery_end?: string
  qp_convention?: QPConvention
  qp_start_offset?: number
  qp_end_offset?: number
  pricing_formula_id?: number
}

export interface ContractOut {
  id: number
  reference: string
  direction: Direction
  counterparty: string
  commodity: string
  quantity: number
  uom: string
  incoterm: string
  delivery_start: string
  delivery_end: string
  status: ContractStatus
  qp_convention: QPConvention
  qp_start_offset: number | null
  qp_end_offset: number | null
  pricing_formula_id: number
}

export interface ContractOpenQuantity {
  contract_id: number
  total_quantity: number
  shipped_quantity: number
  open_quantity: number
}

// Shipments
export interface ShipmentCreate {
  reference: string
  contract_id: number
  vessel_name: string
  bl_date: string
  bl_quantity: number
  status: ShipmentStatus
}

export interface ShipmentUpdate {
  vessel_name?: string
  bl_date?: string
  bl_quantity?: number
}

export interface ShipmentOut {
  id: number
  reference: string
  contract_id: number
  vessel_name: string
  bl_date: string
  bl_quantity: number
  status: ShipmentStatus
  provisional_price: number | null
  final_price: number | null
  pnf_amount: number | null
}

export interface ProvisionalPriceResponse {
  shipment_id: number
  provisional_price: number
  breakdown: PriceBreakdown
  qp_start: string
  qp_end: string
  average_price: number
}

export interface FinalPriceResponse {
  shipment_id: number
  final_price: number
  provisional_price: number
  pnf_amount: number
  breakdown: PriceBreakdown
}

// Assays
export interface AssayCreate {
  shipment_id: number
  assay_type: AssayType
  fe?: number
  moisture?: number
  sio2?: number
  al2o3?: number
  p?: number
  s?: number
}

export interface AssayUpdate {
  fe?: number
  moisture?: number
  sio2?: number
  al2o3?: number
  p?: number
  s?: number
}

export interface AssayOut {
  id: number
  shipment_id: number
  assay_type: AssayType
  fe: number | null
  moisture: number | null
  sio2: number | null
  al2o3: number | null
  p: number | null
  s: number | null
}

// MTM
export interface MtmRunRequest {
  valuation_date: string
  snapshot_date?: string
}

export interface MtmRecordOut {
  id: number
  contract_id: number
  valuation_date: string
  curve_price: number
  contract_price: number
  open_quantity: number
  direction: Direction
  mtm_value: number
}

export interface MtmPortfolioOut {
  valuation_date: string
  records: MtmRecordOut[]
  total_mtm: number
}

// Exposure
export interface ExposureByMonth {
  month: string
  long_quantity: number
  short_quantity: number
  net_quantity: number
  net_exposure_usd: number
}

export interface ExposureByDirection {
  direction: Direction
  total_open_quantity: number
  total_exposure_usd: number
}

export interface ExposureSummary {
  by_month: ExposureByMonth[]
  by_direction: ExposureByDirection[]
  total_net_exposure_usd: number
}

// Matching
export interface MatchCreate {
  buy_contract_id: number
  sell_contract_id: number
  matched_quantity: number
  match_date: string
}

export interface MatchOut {
  id: number
  buy_contract_id: number
  sell_contract_id: number
  matched_quantity: number
  buy_price: number | null
  sell_price: number | null
  realized_pnl: number | null
  match_date: string
}

// P&L
export interface RealizedPnlItem {
  match_id: number
  buy_contract_id: number
  sell_contract_id: number
  matched_quantity: number
  buy_price: number | null
  sell_price: number | null
  realized_pnl: number | null
}

export interface UnrealizedPnlItem {
  contract_id: number
  direction: Direction
  open_quantity: number
  contract_price: number | null
  market_price: number | null
  unrealized_pnl: number | null
}

export interface PnlByContract {
  contract_id: number
  reference: string
  direction: Direction
  realized_pnl: number
  unrealized_pnl: number
  total_pnl: number
}

export interface PnlSummary {
  total_realized: number
  total_unrealized: number
  total_pnl: number
  by_contract: PnlByContract[]
}

// Dashboard
export interface DashboardSummary {
  total_contracts: number
  open_contracts: number
  total_shipments: number
  active_shipments: number
  exposure: ExposureSummary
  pnl: PnlSummary
}
