
export interface CltInputs {
  grossSalary: number;
  employerChargesRate: number; // e.g. 0.338 for 33.8%
}

export interface PjInputs {
  billingMonthly: number;
  proLaboreRate: number; // Fator R, e.g. 0.28
  costsRate: number;     // monthly operational costs %
}

export interface CalculationResult {
  clt: {
    grossMonthly: number;
    inss: number;        // negative
    irrf: number;        // negative
    totalTaxes: number;  // negative
    netMonthly: number;
    employerCost: number;
    totalAnnualNet: number;
  };
  pj: {
    billingMonthly: number;
    proLabore: number;
    inssProLabore: number;   // negative (11% do sócio como contribuinte individual, retido do pró-labore)
    irrf: number;            // negative
    simplesNacional: number; // negative
    costs: number;           // negative
    totalTaxesAndCosts: number;
    netMonthly: number;
    totalAnnualNet: number;
  };
  difference: {
    monthly: number;
    annual: number;
    percent: number;
  };
}
