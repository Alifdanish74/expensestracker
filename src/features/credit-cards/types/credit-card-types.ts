export type CreditCardBalanceType = 'outstanding' | 'clear' | 'credit'

export interface CreditCardBalanceState {
  type: CreditCardBalanceType
  label: string
  secondaryBadge?: string
  rawBalance: number
  displayAmount: number
}

export interface StatementBalanceState {
  type: CreditCardBalanceType
  label: string
  secondaryBadge?: string
  rawBalance: number
  displayAmount: number
}

export interface CreditCardCalculations {
  balanceState: CreditCardBalanceState
  utilisationPercentage: number | null
  estimatedAvailableCredit: number | null
}

export interface CreditCardStatementFormValues {
  statementYear: number
  statementMonth: number
  statementDate: string
  dueDate: string
  statementBalance: string
  minimumPayment?: string
  notes?: string
}
