import { describe, it, expect } from 'vitest';
import {
  calcularINSS,
  calcularAvisoPrevio,
  calcularDecimoTerceiro,
  calcularRescisao,
  mesesComRegra15Dias,
} from '../services/rescisaoCalculator';

// ── calcularINSS ──────────────────────────────────────────────────────────────
describe('calcularINSS', () => {
  it('salário mínimo R$ 1.621 → 7,5%', () => {
    const result = calcularINSS(1621);
    // 1621 * 0.075 - 0 = 121.575
    expect(result).toBeCloseTo(-121.575, 2);
  });

  it('salário R$ 5.000 → tabela progressiva', () => {
    // 5000 <= 8475.55 → 14% bracket: 5000 * 0.14 - 198.49 = 700 - 198.49 = 501.51
    const result = calcularINSS(5000);
    expect(result).toBeCloseTo(-501.51, 2);
  });

  it('salário acima do teto R$ 10.000 → teto R$ 988,09', () => {
    const result = calcularINSS(10000);
    expect(result).toBeCloseTo(-988.09, 2);
  });
});

// ── calcularAvisoPrevio ───────────────────────────────────────────────────────
describe('calcularAvisoPrevio', () => {
  it('0 anos trabalhados → 30 dias', () => {
    const admissao = new Date(2025, 0, 1);
    const desligamento = new Date(2025, 5, 1); // 5 meses
    const { dias } = calcularAvisoPrevio(5000, admissao, desligamento);
    expect(dias).toBe(30);
  });

  it('1 ano trabalhado → 30 dias', () => {
    const admissao = new Date(2024, 0, 1);
    const desligamento = new Date(2025, 0, 1); // exatamente 1 ano
    const { dias } = calcularAvisoPrevio(5000, admissao, desligamento);
    expect(dias).toBe(30);
  });

  it('5 anos trabalhados → 42 dias', () => {
    // 30 + (5-1)*3 = 30+12 = 42
    const admissao = new Date(2019, 0, 1);
    const desligamento = new Date(2024, 0, 1);
    const { dias } = calcularAvisoPrevio(5000, admissao, desligamento);
    expect(dias).toBe(42);
  });

  it('21 anos trabalhados → 90 dias (máximo)', () => {
    // 30 + (21-1)*3 = 30+60 = 90
    const admissao = new Date(2003, 0, 1);
    const desligamento = new Date(2024, 0, 1);
    const { dias } = calcularAvisoPrevio(5000, admissao, desligamento);
    expect(dias).toBe(90);
  });
});

// ── calcularDecimoTerceiro ────────────────────────────────────────────────────
describe('calcularDecimoTerceiro', () => {
  it('Admitido jan, demitido jun (6 meses) → 6/12 do salário', () => {
    const admissao = new Date(2024, 0, 1);
    const desligamento = new Date(2024, 5, 30); // 30 jun
    const { meses, valor } = calcularDecimoTerceiro(5000, admissao, desligamento);
    expect(meses).toBe(6);
    expect(valor).toBeCloseTo(2500, 1);
  });

  it('Admitido 16 nov, demitido 15 dez → 2/12', () => {
    // nov: de 16 até 30 = 15 dias → conta
    // dez: 1 até 15 = 15 dias → conta
    const admissao = new Date(2024, 10, 16); // 16 nov
    const desligamento = new Date(2024, 11, 15); // 15 dez
    const { meses } = calcularDecimoTerceiro(5000, admissao, desligamento);
    expect(meses).toBe(2);
  });

  it('Admitido 1 jan, demitido 14 jan (< 15 dias) → 0', () => {
    const admissao = new Date(2024, 0, 1);
    const desligamento = new Date(2024, 0, 14); // 14 jan
    const { meses } = calcularDecimoTerceiro(5000, admissao, desligamento);
    expect(meses).toBe(0);
  });
});

// ── calcularRescisao - sem justa causa ────────────────────────────────────────
describe('calcularRescisao - Demissão sem justa causa', () => {
  const base = {
    salario: 5000,
    admissao: new Date(2022, 0, 1),
    desligamento: new Date(2024, 5, 15),
    tipo: 'sem_justa_causa' as const,
    modoAvisoPrevio: 'indenizado' as const,
    saldoFGTS: 8000,
    mediaVariavel: 0,
    feriasVencidasPendentes: false,
    dependentes: 0,
  };

  it('verifica multa FGTS 40%', () => {
    const r = calcularRescisao(base);
    expect(r.multaFGTS).toBeGreaterThan(0);
    // multa = 40% sobre (saldoFGTS + deposito do período)
    expect(r.multaFGTS).toBeGreaterThan(8000 * 0.4);
    expect(r.multaFGTS).toBeLessThan(8000 * 0.4 * 1.1);
  });

  it('verifica seguro-desemprego = true', () => {
    const r = calcularRescisao(base);
    expect(r.seguroDesemprego).toBe(true);
  });

  it('verifica que férias proporcionais estão presentes', () => {
    const r = calcularRescisao(base);
    const fp = r.verbas.find(v => v.id === 'ferias_proporcionais');
    expect(fp).toBeDefined();
    expect(fp!.valorBruto).toBeGreaterThan(0);
  });
});

// ── calcularRescisao - pedido de demissão ─────────────────────────────────────
describe('calcularRescisao - Pedido de demissão', () => {
  const base = {
    salario: 5000,
    admissao: new Date(2022, 0, 1),
    desligamento: new Date(2024, 5, 15),
    tipo: 'pedido_demissao' as const,
    modoAvisoPrevio: 'indenizado' as const,
    saldoFGTS: 5000,
    mediaVariavel: 0,
    feriasVencidasPendentes: false,
    dependentes: 0,
  };

  it('percentualSaqueFGTS = 0 (saque zero)', () => {
    const r = calcularRescisao(base);
    expect(r.saqueFGTS).toBe(0);
  });

  it('multa FGTS = 0', () => {
    const r = calcularRescisao(base);
    expect(r.multaFGTS).toBe(0);
  });

  it('aviso prévio indenizado gera desconto negativo', () => {
    const r = calcularRescisao(base);
    const ap = r.verbas.find(v => v.id === 'aviso_previo');
    expect(ap).toBeDefined();
    expect(ap!.valorBruto).toBeLessThan(0);
  });
});

// ── calcularRescisao - acordo Art. 484-A ─────────────────────────────────────
describe('calcularRescisao - Acordo Art. 484-A', () => {
  const base = {
    salario: 5000,
    admissao: new Date(2022, 0, 1),
    desligamento: new Date(2024, 5, 15),
    tipo: 'acordo' as const,
    modoAvisoPrevio: 'indenizado' as const,
    saldoFGTS: 8000,
    mediaVariavel: 0,
    feriasVencidasPendentes: false,
    dependentes: 0,
  };

  it('multa FGTS 20%', () => {
    const r = calcularRescisao(base);
    // 20% sobre (saldoFGTS + deposito do período)
    expect(r.multaFGTS).toBeGreaterThan(8000 * 0.2);
    expect(r.multaFGTS).toBeLessThan(8000 * 0.2 * 1.1);
  });

  it('aviso prévio 50% do valor', () => {
    const r = calcularRescisao(base);
    const ap = r.verbas.find(v => v.id === 'aviso_previo');
    expect(ap).toBeDefined();
    // 50% do salário (≈ dias/30 * salario * 0.5)
    expect(ap!.valorBruto).toBeGreaterThan(0);
    // Deve ser metade do que seria sem acordo
    const rSemAcordo = calcularRescisao({ ...base, tipo: 'sem_justa_causa' });
    const apSemAcordo = rSemAcordo.verbas.find(v => v.id === 'aviso_previo');
    expect(ap!.valorBruto).toBeCloseTo(apSemAcordo!.valorBruto * 0.5, 0);
  });

  it('saque FGTS 80%', () => {
    const r = calcularRescisao(base);
    // saldo + deposito * 0.8
    expect(r.saqueFGTS).toBeGreaterThan(0);
    expect(r.saqueFGTS).toBeLessThan(8500); // menor que 100%
  });
});

// ── calcularRescisao - justa causa ───────────────────────────────────────────
describe('calcularRescisao - Justa causa', () => {
  const base = {
    salario: 5000,
    admissao: new Date(2022, 0, 1),
    desligamento: new Date(2024, 5, 15),
    tipo: 'justa_causa' as const,
    modoAvisoPrevio: 'indenizado' as const,
    saldoFGTS: 5000,
    mediaVariavel: 0,
    feriasVencidasPendentes: true,
    dependentes: 0,
  };

  it('13º salário = 0 (não tem direito)', () => {
    const r = calcularRescisao(base);
    const d = r.verbas.find(v => v.id === 'decimo_terceiro');
    expect(d).toBeUndefined();
  });

  it('férias proporcionais = 0 (não tem direito)', () => {
    const r = calcularRescisao(base);
    const fp = r.verbas.find(v => v.id === 'ferias_proporcionais');
    expect(fp).toBeUndefined();
  });

  it('totalLiquido > 0 (ainda tem saldo salário + férias vencidas)', () => {
    const r = calcularRescisao(base);
    expect(r.totalLiquido).toBeGreaterThan(0);
  });
});

// ── mesesComRegra15Dias ───────────────────────────────────────────────────────
describe('mesesComRegra15Dias', () => {
  it('início dia 1, fim dia 14 → 0 meses', () => {
    const inicio = new Date(2024, 0, 1);
    const fim = new Date(2024, 0, 14);
    expect(mesesComRegra15Dias(inicio, fim)).toBe(0);
  });

  it('início dia 1, fim dia 15 → 1 mês', () => {
    const inicio = new Date(2024, 0, 1);
    const fim = new Date(2024, 0, 15);
    expect(mesesComRegra15Dias(inicio, fim)).toBe(1);
  });

  it('início dia 16, fim dia 28 → 1 mês (restante >= 15 dias)', () => {
    const inicio = new Date(2024, 0, 16); // 16 jan
    const fim = new Date(2024, 0, 31);   // 31 jan — 16 dias restantes (16..31 = 16 dias)
    expect(mesesComRegra15Dias(inicio, fim)).toBe(1);
  });
});
