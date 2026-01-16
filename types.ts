
export interface CltInputs {
  grossSalary: number;
  dependents: number;
  employerChargesRate: number; // e.g. 0.338 for 33.8% (INSS Patronal, FGTS, etc)
}

export interface PjInputs {
  billingMonthly: number;
  proLaboreRate: number; // e.g. 0.28 for Factor R or fixed
  costsRate: number; // monthly operational costs %
}

export interface CalculationResult {
  clt: {
    grossMonthly: number;
    inss: number; // Negative value
    irrf: number; // Negative value
    totalTaxes: number; // Negative value
    netMonthly: number;
    employerCost: number;
    totalAnnualNet: number;
  };
  pj: {
    billingMonthly: number;
    proLabore: number;
    inssPatronal: number; // Negative value
    inssPF: number; // Negative value
    irrf: number; // Negative value
    simplesNacional: number; // Negative value
    costs: number; // Negative value
    totalTaxesAndCosts: number; // Negative value
    netMonthly: number;
    totalAnnualNet: number;
  };
  difference: {
    monthly: number;
    annual: number;
    percent: number;
  };
}
