export interface DateRange {
  start: Date
  end: Date
}

export type TimeWindow = '7d' | '15d' | '1m' | '3m' | '6m' | '1y' | 'all'

export interface FilterState {
  timeWindow: TimeWindow
  selectedMonth: string | null
  selectedCategories: string[]
  selectedPaymentMethods: string[]
  selectedCurrency: string | null
}

export interface PieChartDataItem {
  value: number
  color: string
  text: string
  percentage: number
  category: string
}

export interface PaymentMethodChartDataItem {
  value: number
  color: string
  text: string
  percentage: number
  paymentMethodType: string
}

export interface PaymentMethodTrendSeries {
  value: number
  color: string
  text: string
  paymentMethodType: string
  points: LineChartDataItem[]
}

export interface LineChartDataItem {
  value: number
  date: string
  label: string
  dataPointText?: string
}
