'use client'

import { useState, useTransition, useMemo } from 'react'
import { updateFinancialSettings } from '../server/financial-settings-actions'
import { formatCurrency } from '@/lib/format'

interface FinancialSettingsFormProps {
  initialIncome: string | null
  initialSalaryDay: number | null
}

// ── Malaysian Tax & Statutory Deduction Helper Functions (YA 2026) ─────────────

export interface TaxCalculationResult {
  grossSalary: number
  epf: number
  socso: number
  eis: number
  lindung24: number
  annualGross: number
  individualRelief: number
  epfRelief: number
  childRelief: number
  totalReliefs: number
  chargeableIncome: number
  annualTax: number
  pcbMonthly: number
  totalDeductions: number
  netTakeHomePay: number
}

export function calculateMalaysianNetSalary(
  gross: number,
  category: 'K1' | 'K2' | 'SINGLE', // K1: Married Spouse Not Working, K2: Married Spouse Working (Individual Assessment), SINGLE: Single
  childrenCount: number
): TaxCalculationResult {
  if (gross <= 0 || isNaN(gross)) {
    return {
      grossSalary: 0,
      epf: 0,
      socso: 0,
      eis: 0,
      lindung24: 0,
      annualGross: 0,
      individualRelief: 9000,
      epfRelief: 0,
      childRelief: 0,
      totalReliefs: 9000,
      chargeableIncome: 0,
      annualTax: 0,
      pcbMonthly: 0,
      totalDeductions: 0,
      netTakeHomePay: 0,
    }
  }

  // 1. Employee Statutory Deductions
  // EPF / KWSP: Standard 11%
  const epf = Math.round(gross * 0.11 * 100) / 100

  // SOCSO / PERKESO: Act 4 employee portion (capped at RM 6,000 salary ceiling)
  // For salary > RM 5,900 up to ceiling RM 6,000+, max contribution is RM 29.75
  const socsoWageCap = Math.min(gross, 6000)
  const socso = socsoWageCap >= 6000 ? 29.75 : Math.min(Math.round(socsoWageCap * 0.005 * 100) / 100, 29.75)

  // EIS / SIP: Act 800 employee portion (0.2%, capped at RM 6,000 salary ceiling -> max RM 11.90)
  const eisWageCap = Math.min(gross, 6000)
  const eis = eisWageCap >= 6000 ? 11.90 : Math.min(Math.round(eisWageCap * 0.002 * 100) / 100, 11.90)

  // LINDUNG 24 Jam / SKBBK: Phase 1 employee contribution at 0.75%, capped at RM 45.00
  const lindung24 = Math.min(Math.round(gross * 0.0075 * 100) / 100, 45.00)

  // 2. Monthly Tax Deduction (PCB / MTD) Calculation
  const annualGross = gross * 12
  const annualEpf = epf * 12

  // Tax Reliefs (YA 2026)
  const individualRelief = 9000
  // EPF Relief cap: RM 4,000
  const epfRelief = Math.min(annualEpf, 4000)
  // Child Relief: RM 2,000 per qualifying child
  const childRelief = Math.max(0, childrenCount) * 2000
  // Spouse relief (if category K1 - Married Spouse non-working)
  const spouseRelief = category === 'K1' ? 4000 : 0

  const totalReliefs = individualRelief + epfRelief + childRelief + spouseRelief
  const chargeableIncome = Math.max(0, annualGross - totalReliefs)

  // Progressive Tax Brackets (YA 2026)
  let annualTax = 0
  const ci = chargeableIncome

  if (ci > 5000) {
    if (ci <= 20000) {
      annualTax += (ci - 5000) * 0.01
    } else {
      annualTax += 15000 * 0.01 // 150
      if (ci <= 35000) {
        annualTax += (ci - 20000) * 0.03
      } else {
        annualTax += 15000 * 0.03 // 450
        if (ci <= 50000) {
          annualTax += (ci - 35000) * 0.06
        } else {
          annualTax += 15000 * 0.06 // 900
          if (ci <= 70000) {
            annualTax += (ci - 50000) * 0.11
          } else {
            annualTax += 20000 * 0.11 // 2200
            if (ci <= 100000) {
              annualTax += (ci - 70000) * 0.19
            } else {
              annualTax += 30000 * 0.19 // 5700
              if (ci <= 250000) {
                annualTax += (ci - 100000) * 0.25
              } else {
                annualTax += 150000 * 0.25 // 37500
                if (ci <= 400000) {
                  annualTax += (ci - 250000) * 0.26
                } else {
                  annualTax += 150000 * 0.26 // 39000
                  if (ci <= 600000) {
                    annualTax += (ci - 400000) * 0.28
                  } else {
                    annualTax += 200000 * 0.28
                    annualTax += (ci - 600000) * 0.30
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Tax rebate for chargeable income <= 35,000 (RM 400 for individual)
  if (chargeableIncome <= 35000 && annualTax > 0) {
    annualTax = Math.max(0, annualTax - 400)
  }

  const pcbMonthly = Math.round((annualTax / 12) * 100) / 100
  const totalDeductions = Math.round((epf + socso + eis + lindung24 + pcbMonthly) * 100) / 100
  const netTakeHomePay = Math.round((gross - totalDeductions) * 100) / 100

  return {
    grossSalary: gross,
    epf,
    socso,
    eis,
    lindung24,
    annualGross,
    individualRelief,
    epfRelief,
    childRelief,
    totalReliefs,
    chargeableIncome,
    annualTax: Math.round(annualTax * 100) / 100,
    pcbMonthly,
    totalDeductions,
    netTakeHomePay,
  }
}

export function FinancialSettingsForm({
  initialIncome,
  initialSalaryDay,
}: FinancialSettingsFormProps) {
  const [calculationMode, setCalculationMode] = useState<'AUTO' | 'MANUAL'>('AUTO')

  // Gross Salary calculator state defaults (pre-set to RM 7,500 and Category 3 K2 / 1 Child as per prompt)
  const [grossSalaryInput, setGrossSalaryInput] = useState('7500')
  const [category, setCategory] = useState<'K1' | 'K2' | 'SINGLE'>('K2')
  const [childrenCount, setChildrenCount] = useState(1)

  // Direct net income state saved to profile
  const [income, setIncome] = useState(initialIncome ?? '6200.85')
  const [salaryDay, setSalaryDay] = useState(
    initialSalaryDay != null ? String(initialSalaryDay) : ''
  )

  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<
    { success: true } | { success: false; error: string } | null
  >(null)

  // Compute breakdown dynamically
  const calcResult = useMemo(() => {
    const grossNum = parseFloat(grossSalaryInput) || 0
    return calculateMalaysianNetSalary(grossNum, category, childrenCount)
  }, [grossSalaryInput, category, childrenCount])

  // Sync auto-calculated net pay to income field when in AUTO mode
  const handleGrossChange = (val: string) => {
    setGrossSalaryInput(val)
    if (calculationMode === 'AUTO') {
      const gNum = parseFloat(val) || 0
      const res = calculateMalaysianNetSalary(gNum, category, childrenCount)
      setIncome(res.netTakeHomePay > 0 ? res.netTakeHomePay.toFixed(2) : '')
    }
  }

  const handleCategoryChange = (newCat: 'K1' | 'K2' | 'SINGLE') => {
    setCategory(newCat)
    if (calculationMode === 'AUTO') {
      const gNum = parseFloat(grossSalaryInput) || 0
      const res = calculateMalaysianNetSalary(gNum, newCat, childrenCount)
      setIncome(res.netTakeHomePay > 0 ? res.netTakeHomePay.toFixed(2) : '')
    }
  }

  const handleChildrenChange = (count: number) => {
    setChildrenCount(count)
    if (calculationMode === 'AUTO') {
      const gNum = parseFloat(grossSalaryInput) || 0
      const res = calculateMalaysianNetSalary(gNum, category, count)
      setIncome(res.netTakeHomePay > 0 ? res.netTakeHomePay.toFixed(2) : '')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await updateFinancialSettings({
        monthlyNetIncome: income,
        salaryDay,
      })
      setResult(res)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Mode Switcher */}
      <div className="bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
        <button
          type="button"
          onClick={() => {
            setCalculationMode('AUTO')
            setIncome(calcResult.netTakeHomePay > 0 ? calcResult.netTakeHomePay.toFixed(2) : '')
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${calculationMode === 'AUTO'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          🇲🇾 Malaysian Net Salary Calculator
        </button>
        <button
          type="button"
          onClick={() => setCalculationMode('MANUAL')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${calculationMode === 'MANUAL'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Manual Net Income
        </button>
      </div>

      {calculationMode === 'AUTO' && (
        <div className="space-y-5 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Payroll Tax & Statutory Inputs (YA 2026)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
              Auto-Calculated
            </span>
          </div>

          {/* Gross Remuneration */}
          <div className="space-y-1.5">
            <label htmlFor="monthly-gross-salary" className="block text-xs font-medium text-slate-300">
              Monthly Gross Remuneration <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">
                RM
              </span>
              <input
                id="monthly-gross-salary"
                name="monthly-gross-salary"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="7500.00"
                value={grossSalaryInput}
                onChange={(e) => handleGrossChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Marital & Tax Assessment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="tax-category" className="block text-xs font-medium text-slate-300">
                Marital / Assessment Category
              </label>
              <select
                id="tax-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as 'K1' | 'K2' | 'SINGLE')}
                className="w-full px-3 py-2.5 min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="K2">Married - Spouse Working (Category 3 / K2)</option>
                <option value="SINGLE">Single (Category 1)</option>
                <option value="K1">Married - Spouse Not Working (Category 2 / K1)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="children-count" className="block text-xs font-medium text-slate-300">
                Qualifying Children (&lt; 18 yrs)
              </label>
              <input
                id="children-count"
                type="number"
                min="0"
                max="10"
                value={childrenCount}
                onChange={(e) => handleChildrenChange(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2.5 min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Itemized Statutory & Tax Breakdown Table */}
          {calcResult.grossSalary > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1">
                Detailed Monthly Statutory & PCB Breakdown
              </h4>

              {/* Statutory Deductions */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">EPF / KWSP (Employee 11%)</span>
                  <span className="font-mono text-slate-200">{formatCurrency(calcResult.epf)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">SOCSO / PERKESO (Act 4, cap RM6k)</span>
                  <span className="font-mono text-slate-200">{formatCurrency(calcResult.socso)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">EIS / SIP (Act 800, cap RM6k)</span>
                  <span className="font-mono text-slate-200">{formatCurrency(calcResult.eis)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">LINDUNG 24 Jam / SKBBK (0.75%, cap RM45)</span>
                  <span className="font-mono text-slate-200">{formatCurrency(calcResult.lindung24)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Monthly Tax Deduction (PCB / MTD)</span>
                  <span className="font-mono text-rose-400 font-semibold">{formatCurrency(calcResult.pcbMonthly)}</span>
                </div>
              </div>

              {/* Chargeable Income Step-by-Step Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] space-y-1 text-slate-400">
                <div className="font-semibold text-slate-300 text-xs mb-1">
                  Tax Calculation Step-by-Step:
                </div>
                <div className="flex justify-between">
                  <span>Annual Gross Remuneration:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(calcResult.annualGross)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Individual Relief:</span>
                  <span className="font-mono text-emerald-400">-{formatCurrency(calcResult.individualRelief)}</span>
                </div>
                <div className="flex justify-between">
                  <span>EPF Relief (capped at RM 4,000):</span>
                  <span className="font-mono text-emerald-400">-{formatCurrency(calcResult.epfRelief)}</span>
                </div>
                {calcResult.childRelief > 0 && (
                  <div className="flex justify-between">
                    <span>Child Relief ({childrenCount} child):</span>
                    <span className="font-mono text-emerald-400">-{formatCurrency(calcResult.childRelief)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800 pt-1 font-semibold text-slate-200">
                  <span>Annual Chargeable Income:</span>
                  <span className="font-mono">{formatCurrency(calcResult.chargeableIncome)}</span>
                </div>
              </div>

              {/* Summary Totals */}
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Gross Remuneration:</span>
                  <span className="font-semibold">{formatCurrency(calcResult.grossSalary)}</span>
                </div>
                <div className="flex justify-between text-xs text-rose-400">
                  <span>Total Statutory Deductions:</span>
                  <span className="font-semibold">-{formatCurrency(calcResult.totalDeductions)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-400 border-t border-slate-800 pt-2">
                  <span>Final Net Take-Home Pay:</span>
                  <span className="text-base font-mono">{formatCurrency(calcResult.netTakeHomePay)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Net Income Field (Auto-filled or Manual Input) */}
      <div className="space-y-1.5">
        <label
          htmlFor="monthly-net-income"
          className="block text-sm font-medium text-slate-300"
        >
          Monthly Net Income (Take-Home Pay)
          <span className="ml-1 text-xs text-slate-500 font-normal">(RM)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">
            RM
          </span>
          <input
            id="monthly-net-income"
            name="monthly-net-income"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="6200.85"
            value={income}
            onChange={(e) => {
              setIncome(e.target.value)
              setResult(null)
            }}
            disabled={isPending}
            className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50 font-semibold text-emerald-400"
            aria-describedby="income-help"
          />
        </div>
        <p id="income-help" className="text-xs text-slate-500 leading-relaxed">
          {calculationMode === 'AUTO'
            ? 'Automatically synced from the Malaysian Net Salary Calculator above. Will be saved to your dashboard.'
            : 'Your monthly take-home pay used to calculate remaining balance. Leave empty to clear.'}
        </p>
      </div>

      {/* Salary Day */}
      <div className="space-y-1.5">
        <label
          htmlFor="salary-day"
          className="block text-sm font-medium text-slate-300"
        >
          Salary Day
          <span className="ml-1 text-xs text-slate-500 font-normal">(optional)</span>
        </label>
        <input
          id="salary-day"
          name="salary-day"
          type="number"
          inputMode="numeric"
          min="1"
          max="31"
          step="1"
          placeholder="25"
          value={salaryDay}
          onChange={(e) => {
            setSalaryDay(e.target.value)
            setResult(null)
          }}
          disabled={isPending}
          className="w-full px-4 py-3 min-h-[48px] bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50"
          aria-describedby="salary-day-help"
        />
        <p id="salary-day-help" className="text-xs text-slate-500 leading-relaxed">
          Day of the month you normally receive salary (1–31). Informational only.
        </p>
      </div>

      {/* Feedback */}
      {result && !result.success && (
        <div
          role="alert"
          className="flex items-start gap-2.5 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl"
        >
          <span className="mt-0.5 flex-shrink-0 h-4 w-4 text-rose-400">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 4a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0V5Zm.75 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
            </svg>
          </span>
          <p className="text-sm text-rose-300">{result.error}</p>
        </div>
      )}

      {result?.success && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
        >
          <span className="flex-shrink-0 h-4 w-4 text-emerald-400">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06l2.69 2.69 6.72-6.72a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </span>
          <p className="text-sm text-emerald-300 font-medium">Financial settings updated.</p>
        </div>
      )}

      {/* Submit */}
      <button
        id="save-financial-settings"
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-6 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Saving…
          </>
        ) : (
          'Save Settings'
        )}
      </button>
    </form>
  )
}
