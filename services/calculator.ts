
import { CltInputs, PjInputs, CalculationResult } from '../types';

/**
 * 2024 Progressive INSS Brackets
 */
const calculateINSS = (salary: number): number => {
  const brackets = [
    { limit: 1412.00, rate: 0.075 },
    { limit: 2666.68, rate: 0.09 },
    { limit: 4000.03, rate: 0.12 },
    { limit: 7786.02, rate: 0.14 }
  ];

  let total = 0;
  let previousLimit = 0;

  for (const bracket of brackets) {
    if (salary > bracket.limit) {
      total += (bracket.limit - previousLimit) * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      total += (salary - previousLimit) * bracket.rate;
      // Use break to return total after processing
      break;
    }
  }

  // Teto INSS 2024: 908.85
  return -Math.min(total, 908.85); 
};

/**
 * 2024 Progressive IRRF Brackets
 */
const calculateIRRF = (taxableBase: number): number => {
  const brackets = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 }
  ];

  for (const bracket of brackets) {
    if (taxableBase <= bracket.limit) {
      const tax = (taxableBase * bracket.rate) - bracket.deduction;
      return -Math.max(0, tax);
    }
  }
  return 0;
};

/**
 * Simples Nacional Anexo III (2024 Approximation)
 */
const calculateSimplesNacional = (annualBilling: number, monthlyBilling: number): number => {
  const brackets = [
    { limit: 180000, rate: 0.06, deduction: 0 },
    { limit: 360000, rate: 0.112, deduction: 9360 },
    { limit: 720000, rate: 0.135, deduction: 17640 },
    { limit: 1800000, rate: 0.16, deduction: 35640 },
    { limit: 3600000, rate: 0.21, deduction: 125640 },
    { limit: 4800000, rate: 0.33, deduction: 648000 }
  ];

  for (const bracket of brackets) {
    if (annualBilling <= bracket.limit) {
      // Effective Rate Calculation: (Annual Billing * Nominal Rate - Deduction) / Annual Billing
      const effectiveRate = ((annualBilling * bracket.rate) - bracket.deduction) / annualBilling;
      return -Math.max(0, monthlyBilling * effectiveRate);
    }
  }
  return -monthlyBilling * 0.33; // Default to max
};

export const calculateFullComparison = (clt: CltInputs, pj: PjInputs): CalculationResult => {
  // --- CLT CALCULATIONS ---
  const cltInss = calculateINSS(clt.grossSalary);
  
  // Rule 3.2: Base = Salário Bruto + INSS (INSS is negative)
  // Also deduct dependents (standard R$ 189,59 per dependent)
  const cltIrBase = Math.max(0, clt.grossSalary + cltInss - (clt.dependents * 189.59));
  const cltIrrf = calculateIRRF(cltIrBase);
  
  const cltTotalTaxes = cltInss + cltIrrf;
  const cltNetMonthly = clt.grossSalary + cltTotalTaxes;
  
  // Rule 3.6: Custo Empresa = Salário Bruto * (1 + Encargos Patronais)
  const employerCost = clt.grossSalary * (1 + clt.employerChargesRate);

  // --- PJ CALCULATIONS ---
  const proLabore = Math.max(0.01, pj.billingMonthly * pj.proLaboreRate);
  
  // Rule 4.2: INSS Patronal (Note: In some SIMPLES scenarios this is 0, but following doc literally)
  // "INSS Patronal = Pró-Labore * alíquota (limitado ao teto)"
  // Assuming 20% for patronal rule if defined, but usually Simples III includes it. 
  // Document says "INSS = Pró-Labore * alíquota". Let's assume standard 20% if doc doesn't specify.
  const inssPatronal = -Math.min(proLabore * 0.20, 1557.20); // Using 20% patronal constant

  // Rule 4.3: INSS Pessoa Física (Sócio)
  const inssPF = calculateINSS(proLabore);

  // Rule 4.4 & 4.5: IRRF on Pró-labore
  const pjIrBase = Math.max(0, proLabore + inssPF);
  const pjIrrf = calculateIRRF(pjIrBase);

  // Rule 4.6: Simples Nacional Anexo III
  const annualPjBilling = pj.billingMonthly * 12;
  const simplesNacional = calculateSimplesNacional(annualPjBilling, pj.billingMonthly);

  // Rule 4.7: Custos Mensais
  const pjCosts = -(pj.billingMonthly * pj.costsRate);

  // Rule 4.8: Total de Impostos e Custos PJ
  const pjTotalTaxesAndCosts = inssPatronal + inssPF + pjIrrf + simplesNacional + pjCosts;
  
  // Rule 4.9: Valor Líquido PJ
  const pjNetMonthly = pj.billingMonthly + pjTotalTaxesAndCosts;

  return {
    clt: {
      grossMonthly: clt.grossSalary,
      inss: cltInss,
      irrf: cltIrrf,
      totalTaxes: cltTotalTaxes,
      netMonthly: cltNetMonthly,
      employerCost: employerCost,
      totalAnnualNet: cltNetMonthly * 12 
    },
    pj: {
      billingMonthly: pj.billingMonthly,
      proLabore: proLabore,
      inssPatronal: inssPatronal,
      inssPF: inssPF,
      irrf: pjIrrf,
      simplesNacional: simplesNacional,
      costs: pjCosts,
      totalTaxesAndCosts: pjTotalTaxesAndCosts,
      netMonthly: pjNetMonthly,
      totalAnnualNet: pjNetMonthly * 12
    },
    difference: {
      monthly: pjNetMonthly - cltNetMonthly,
      annual: (pjNetMonthly * 12) - (cltNetMonthly * 12),
      percent: ((pjNetMonthly / cltNetMonthly) - 1) * 100
    }
  };
};
