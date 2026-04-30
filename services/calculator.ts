
import { CltInputs, PjInputs, CalculationResult } from '../types';

// 2026 constants
const SALARIO_MINIMO = 1621.00;
const DESCONTO_SIMPLIFICADO = 607.20;
const FGTS_RATE = 0.08;
const FATOR_R = 0.28;
const INSS_PATRONAL_RATE = 0.11; // Simples Nacional
const INSS_PATRONAL_TETO = 932.31;

/**
 * 2026 Progressive INSS Brackets (simplified formula: salary * rate - deduction)
 */
const calculateINSS = (salary: number): number => {
  const brackets = [
    { limit: 1621.00, rate: 0.075, deduction: 0 },
    { limit: 2902.84, rate: 0.09, deduction: 24.315 },
    { limit: 4354.27, rate: 0.12, deduction: 111.40 },
    { limit: 8475.55, rate: 0.14, deduction: 198.49 },
  ];
  const teto = 988.09;

  for (const bracket of brackets) {
    if (salary <= bracket.limit) {
      return -(salary * bracket.rate - bracket.deduction);
    }
  }
  return -teto;
};

/**
 * 2026 IRRF with isenção progressiva (reform: incomes up to R$5.000 fully exempt)
 */
const calculateIRRF = (base: number): number => {
  if (base <= 0) return 0;

  // Standard IRRF table 2026
  const brackets = [
    { limit: 2428.80, rate: 0,     deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 182.16 },
    { limit: 3751.05, rate: 0.15,  deduction: 394.16 },
    { limit: 4664.68, rate: 0.225, deduction: 675.49 },
    { limit: Infinity, rate: 0.275, deduction: 908.72 },
  ];

  let standardTax = 0;
  for (const bracket of brackets) {
    if (base <= bracket.limit) {
      standardTax = -(base * bracket.rate - bracket.deduction);
      break;
    }
  }

  // Isenção progressiva 2026
  let isencao = 0;
  if (base <= 5000) {
    isencao = 312.89;
  } else if (base <= 7350) {
    isencao = 978.62 - 0.133145 * base;
  }

  return Math.min(0, isencao + standardTax);
};

/**
 * Simples Nacional Anexo III — monthly billing thresholds
 */
const calculateSimplesNacional = (monthlyBilling: number): number => {
  const brackets = [
    { limit: 15000,  rate: 0.06,  deduction: 0 },
    { limit: 30000,  rate: 0.112, deduction: 780 },
    { limit: 60000,  rate: 0.135, deduction: 1470 },
    { limit: 150000, rate: 0.16,  deduction: 2970 },
    { limit: 300000, rate: 0.21,  deduction: 10470 },
    { limit: 400000, rate: 0.33,  deduction: 54000 },
  ];

  for (const bracket of brackets) {
    if (monthlyBilling <= bracket.limit) {
      return -(monthlyBilling * bracket.rate - bracket.deduction);
    }
  }
  return -(monthlyBilling * 0.33 - 54000);
};

export const calculateFullComparison = (clt: CltInputs, pj: PjInputs): CalculationResult => {
  // --- CLT CALCULATIONS ---
  const cltInss = calculateINSS(clt.grossSalary);

  // IRRF base: MIN(salary - INSS, salary - descontoSimplificado) = salary - MAX(INSS_abs, descontoSimplificado)
  const cltIrBase = Math.max(0, clt.grossSalary - Math.max(-cltInss, DESCONTO_SIMPLIFICADO));
  const cltIrrf = calculateIRRF(cltIrBase);

  const cltTotalTaxes = cltInss + cltIrrf;
  const cltNetMonthly = clt.grossSalary + cltTotalTaxes;

  // Employer cost = grossSalary * (1 + patronal charges rate)
  const employerCost = clt.grossSalary * (1 + clt.employerChargesRate);

  // --- PJ CALCULATIONS ---
  // Pró-labore: MAX(billing * fatorR, salárioMínimo)
  const proLabore = Math.max(pj.billingMonthly * pj.proLaboreRate, SALARIO_MINIMO);

  // INSS Patronal (Simples Nacional: 11%, paid by empresa)
  const inssPatronal = -Math.min(proLabore * INSS_PATRONAL_RATE, INSS_PATRONAL_TETO);

  // IRRF on pró-labore: base = MIN(proLabore - INSS_patronal_abs, proLabore - descontoSimplificado)
  const pjIrBase = Math.max(0, proLabore - Math.max(-inssPatronal, DESCONTO_SIMPLIFICADO));
  const pjIrrf = calculateIRRF(pjIrBase);

  // Simples Nacional DAS
  const simplesNacional = calculateSimplesNacional(pj.billingMonthly);

  // Operational costs
  const pjCosts = -(pj.billingMonthly * pj.costsRate);

  // Total taxes and costs PJ
  const pjTotalTaxesAndCosts = inssPatronal + pjIrrf + simplesNacional + pjCosts;

  // Net PJ
  const pjNetMonthly = pj.billingMonthly + pjTotalTaxesAndCosts;

  return {
    clt: {
      grossMonthly: clt.grossSalary,
      inss: cltInss,
      irrf: cltIrrf,
      totalTaxes: cltTotalTaxes,
      netMonthly: cltNetMonthly,
      employerCost: employerCost,
      totalAnnualNet: cltNetMonthly * 12,
    },
    pj: {
      billingMonthly: pj.billingMonthly,
      proLabore: proLabore,
      inssPatronal: inssPatronal,
      irrf: pjIrrf,
      simplesNacional: simplesNacional,
      costs: pjCosts,
      totalTaxesAndCosts: pjTotalTaxesAndCosts,
      netMonthly: pjNetMonthly,
      totalAnnualNet: pjNetMonthly * 12,
    },
    difference: {
      monthly: pjNetMonthly - cltNetMonthly,
      annual: (pjNetMonthly - cltNetMonthly) * 12,
      percent: cltNetMonthly !== 0 ? ((pjNetMonthly / cltNetMonthly) - 1) * 100 : 0,
    },
  };
};
