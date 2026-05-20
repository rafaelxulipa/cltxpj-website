
import { TipoRescisao, ModoAvisoPrevio, REGRAS } from './rescisaoRules';

export type { TipoRescisao, ModoAvisoPrevio };

export interface RescisaoInputs {
  salario: number;
  admissao: Date;
  desligamento: Date;
  tipo: TipoRescisao;
  modoAvisoPrevio: ModoAvisoPrevio;
  saldoFGTS: number;
  mediaVariavel: number;
  feriasVencidasPendentes: boolean;
  dependentes: number;
}

export interface VerbaItem {
  id: string;
  descricao: string;
  baseCalculo: string;
  valorBruto: number;
  inssIncide: boolean;
  irrfIncide: boolean;
  inss: number;
  irrf: number;
  valorLiquido: number;
}

export interface RescisaoResult {
  verbas: VerbaItem[];
  avisoPrevioDias: number;
  periodoTrabalhado: { anos: number; meses: number; dias: number };
  totalBruto: number;
  totalINSS: number;
  totalIRRF: number;
  totalLiquido: number;
  saqueFGTS: number;
  multaFGTS: number;
  seguroDesemprego: boolean;
  salarioBase: number;
}

// ── Date utilities ────────────────────────────────────────────────────────────

export function anosCompletos(admissao: Date, desligamento: Date): number {
  let anos = desligamento.getFullYear() - admissao.getFullYear();
  const mMenos = desligamento.getMonth() < admissao.getMonth() ||
    (desligamento.getMonth() === admissao.getMonth() && desligamento.getDate() < admissao.getDate());
  if (mMenos) anos--;
  return Math.max(0, anos);
}

export function mesesCompletos(inicio: Date, fim: Date): number {
  let meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
  if (fim.getDate() < inicio.getDate()) meses--;
  return Math.max(0, meses);
}

// Conta meses onde o empregado trabalhou >= 15 dias
export function mesesComRegra15Dias(inicio: Date, fim: Date): number {
  if (fim <= inicio) return 0;
  let count = 0;

  const mesInicioKey = inicio.getFullYear() * 12 + inicio.getMonth();
  const mesFimKey = fim.getFullYear() * 12 + fim.getMonth();

  if (mesInicioKey === mesFimKey) {
    // Mesmo mês: conta dias de inicio.getDate() a fim.getDate()
    const dias = fim.getDate() - inicio.getDate() + 1;
    if (dias >= 15) count++;
    return count;
  }

  // Primeiro mês: dias de inicio até final do mês
  const diasNoMesInicio = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate() - inicio.getDate() + 1;
  if (diasNoMesInicio >= 15) count++;

  // Meses intermediários completos
  let cur = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
  const mesFimStart = new Date(fim.getFullYear(), fim.getMonth(), 1);
  while (cur < mesFimStart) {
    count++;
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  // Último mês: dias de 1 até fim.getDate()
  if (fim.getDate() >= 15) count++;

  return count;
}

export function inicioPeriodoAquisitivo(admissao: Date, desligamento: Date): Date {
  const anos = anosCompletos(admissao, desligamento);
  return new Date(admissao.getFullYear() + anos, admissao.getMonth(), admissao.getDate());
}

// ── Fiscal calculations ───────────────────────────────────────────────────────

export function calcularINSS(salario: number): number {
  const brackets = [
    { limit: 1621.00,  rate: 0.075, deduction: 0 },
    { limit: 2902.84,  rate: 0.09,  deduction: 24.315 },
    { limit: 4354.27,  rate: 0.12,  deduction: 111.40 },
    { limit: 8475.55,  rate: 0.14,  deduction: 198.49 },
  ];
  const teto = 988.09;

  for (const b of brackets) {
    if (salario <= b.limit) {
      return -(salario * b.rate - b.deduction);
    }
  }
  return -teto;
}

export function calcularIRRF(base: number, dependentes: number): number {
  if (base <= 0) return 0;
  const baseLiq = Math.max(0, base - dependentes * 189.59);

  const brackets = [
    { limit: 2428.80,  rate: 0,     deduction: 0 },
    { limit: 2826.65,  rate: 0.075, deduction: 182.16 },
    { limit: 3751.05,  rate: 0.15,  deduction: 394.16 },
    { limit: 4664.68,  rate: 0.225, deduction: 675.49 },
    { limit: Infinity, rate: 0.275, deduction: 908.72 },
  ];

  let standardTax = 0;
  for (const b of brackets) {
    if (baseLiq <= b.limit) {
      standardTax = -(baseLiq * b.rate - b.deduction);
      break;
    }
  }

  let isencao = 0;
  if (baseLiq <= 5000) {
    isencao = 312.89;
  } else if (baseLiq <= 7350) {
    isencao = 978.62 - 0.133145 * baseLiq;
  }

  return Math.min(0, isencao + standardTax);
}

// ── Verb calculations ─────────────────────────────────────────────────────────

export function calcularSaldoSalario(salarioBase: number, desligamento: Date): number {
  const diasNoMes = new Date(desligamento.getFullYear(), desligamento.getMonth() + 1, 0).getDate();
  return (salarioBase / diasNoMes) * desligamento.getDate();
}

export function calcularAvisoPrevio(
  salarioBase: number,
  admissao: Date,
  desligamento: Date,
): { dias: number; valor: number } {
  const anos = anosCompletos(admissao, desligamento);
  const dias = Math.min(30 + Math.max(0, anos - 1) * 3, 90);
  const valor = salarioBase * (dias / 30);
  return { dias, valor };
}

export function calcularDecimoTerceiro(
  salarioBase: number,
  admissao: Date,
  desligamento: Date,
): { meses: number; valor: number } {
  // 13º é calculado do início do ano atual até desligamento, mas considerar também período anterior
  // Padrão: meses trabalhados no ano corrente + aviso prévio se indenizado
  const inicioAno = new Date(desligamento.getFullYear(), 0, 1);
  const inicioContagem = admissao > inicioAno ? admissao : inicioAno;
  const meses = mesesComRegra15Dias(inicioContagem, desligamento);
  const valor = (salarioBase / 12) * meses;
  return { meses, valor };
}

export function calcularFeriasVencidas(salarioBase: number): number {
  return salarioBase * (4 / 3); // salário + 1/3
}

export function calcularFeriasProporcionais(
  salarioBase: number,
  admissao: Date,
  desligamento: Date,
): { meses: number; valor: number } {
  const inicioPeriodo = inicioPeriodoAquisitivo(admissao, desligamento);
  const meses = mesesComRegra15Dias(inicioPeriodo, desligamento);
  const valor = (salarioBase / 12) * meses * (4 / 3);
  return { meses, valor };
}

export function calcularFGTS(
  salarioBase: number,
  saldoFGTS: number,
  percentualMulta: number,
  diasTrabalhados: number,
): { deposito: number; saldoTotal: number; multa: number } {
  const diasNoMes = 30;
  const deposito = salarioBase * 0.08 * (diasTrabalhados / diasNoMes);
  const saldoTotal = saldoFGTS + deposito;
  const multa = saldoTotal * percentualMulta;
  return { deposito, saldoTotal, multa };
}

// ── Main calculator ───────────────────────────────────────────────────────────

export function calcularRescisao(inputs: RescisaoInputs): RescisaoResult {
  const {
    salario,
    admissao,
    desligamento,
    tipo,
    modoAvisoPrevio,
    saldoFGTS,
    mediaVariavel,
    feriasVencidasPendentes,
    dependentes,
  } = inputs;

  const salarioBase = salario + mediaVariavel;
  const regras = REGRAS[tipo];

  // Período trabalhado
  const totalDias = Math.floor((desligamento.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24));
  const anos = anosCompletos(admissao, desligamento);
  const mesesApos = mesesCompletos(
    new Date(admissao.getFullYear() + anos, admissao.getMonth(), admissao.getDate()),
    desligamento,
  );
  const dataAnosMeses = new Date(admissao.getFullYear() + anos, admissao.getMonth() + mesesApos, admissao.getDate());
  const diasRestantes = Math.floor((desligamento.getTime() - dataAnosMeses.getTime()) / (1000 * 60 * 60 * 24));

  // Saldo de salário
  const saldoSalarioValor = calcularSaldoSalario(salarioBase, desligamento);

  // Aviso prévio
  const apCalc = calcularAvisoPrevio(salarioBase, admissao, desligamento);
  const apDias = apCalc.dias;
  let apBruto = 0;
  let apDesconto = false; // pedido demissão sem aviso trabalhado

  if (regras.avisoPrevioFator > 0) {
    const valorBase = apCalc.valor * regras.avisoPrevioFator;
    if (tipo === 'pedido_demissao') {
      if (modoAvisoPrevio === 'indenizado') {
        // Empregado deve ao empregador: desconto
        apBruto = -valorBase;
        apDesconto = true;
      }
      // trabalhado ou dispensado: R$0 na rescisão
    } else {
      if (modoAvisoPrevio === 'indenizado') {
        // Empregador paga: positivo
        apBruto = valorBase;
      }
      // trabalhado ou dispensado: R$0 na rescisão
    }
  }

  // 13º
  const decimoTerceiro = regras.decimoTerceiro
    ? calcularDecimoTerceiro(salarioBase, admissao, desligamento)
    : { meses: 0, valor: 0 };

  // Férias vencidas
  const feriasVencidasValor = (regras.feriasVencidas && feriasVencidasPendentes)
    ? calcularFeriasVencidas(salarioBase)
    : 0;

  // Férias proporcionais
  const feriasProporcionais = regras.feriasProporcionais
    ? calcularFeriasProporcionais(salarioBase, admissao, desligamento)
    : { meses: 0, valor: 0 };

  // FGTS
  const diasNoMes = new Date(desligamento.getFullYear(), desligamento.getMonth() + 1, 0).getDate();
  const diasSaldoSalario = desligamento.getDate();
  const fgtsCalc = calcularFGTS(
    salarioBase,
    saldoFGTS,
    regras.percentualMultaFGTS,
    diasSaldoSalario,
  );

  // Base INSS: saldo salário + 13º + aviso prévio trabalhado (não indenizado)
  const apTrabalhado = (modoAvisoPrevio === 'trabalhado' || modoAvisoPrevio === 'dispensado') && regras.avisoPrevioFator > 0;
  const valorApParaINSS = apTrabalhado ? apCalc.valor * regras.avisoPrevioFator : 0;
  const baseINSS = saldoSalarioValor + decimoTerceiro.valor + valorApParaINSS;
  const inssTotal = calcularINSS(Math.max(0, baseINSS));

  // Base IRRF: saldo salário + 13º + aviso prévio (indenizado ou trabalhado) - INSS
  // Férias: ISENTAS de IRRF
  const apParaIRRF = apBruto !== 0 ? Math.abs(apBruto) : valorApParaINSS;
  const baseIRRFBruta = saldoSalarioValor + decimoTerceiro.valor + apParaIRRF;
  const baseIRRF = Math.max(0, baseIRRFBruta + inssTotal); // inssTotal é negativo
  const irrfTotal = calcularIRRF(baseIRRF, dependentes);

  // Distribuição proporcional de INSS/IRRF pelas verbas tributáveis
  const tributavelTotal = baseIRRFBruta > 0 ? baseIRRFBruta : 1;

  const propSaldo = baseIRRFBruta > 0 ? saldoSalarioValor / tributavelTotal : 0;
  const propDecimo = baseIRRFBruta > 0 ? decimoTerceiro.valor / tributavelTotal : 0;
  const propAP = baseIRRFBruta > 0 ? apParaIRRF / tributavelTotal : 0;

  // Montar verbas
  const verbas: VerbaItem[] = [];

  // 1. Saldo de salário
  const inssOnSaldo = inssTotal * propSaldo;
  const irrfOnSaldo = irrfTotal * propSaldo;
  verbas.push({
    id: 'saldo_salario',
    descricao: 'Saldo de Salário',
    baseCalculo: `${diasSaldoSalario} dias trabalhados`,
    valorBruto: saldoSalarioValor,
    inssIncide: true,
    irrfIncide: true,
    inss: inssOnSaldo,
    irrf: irrfOnSaldo,
    valorLiquido: saldoSalarioValor + inssOnSaldo + irrfOnSaldo,
  });

  // 2. Aviso prévio
  if (apBruto !== 0 || (regras.avisoPrevioFator > 0 && modoAvisoPrevio === 'trabalhado')) {
    const apInss = modoAvisoPrevio === 'indenizado' && !apDesconto ? 0 : inssTotal * propAP;
    const apIrrf = irrfTotal * propAP;
    verbas.push({
      id: 'aviso_previo',
      descricao: apDesconto ? 'Aviso Prévio (desconto)' : 'Aviso Prévio Indenizado',
      baseCalculo: `${apDias} dias`,
      valorBruto: apBruto,
      inssIncide: !apDesconto && modoAvisoPrevio !== 'indenizado',
      irrfIncide: apBruto !== 0,
      inss: apDesconto ? 0 : apInss,
      irrf: apDesconto ? 0 : apIrrf,
      valorLiquido: apBruto + (apDesconto ? 0 : apInss + apIrrf),
    });
  }

  // 3. 13º Salário
  if (decimoTerceiro.valor > 0) {
    const inssOnDecimo = inssTotal * propDecimo;
    const irrfOnDecimo = irrfTotal * propDecimo;
    verbas.push({
      id: 'decimo_terceiro',
      descricao: '13º Salário Proporcional',
      baseCalculo: `${decimoTerceiro.meses}/12 avos`,
      valorBruto: decimoTerceiro.valor,
      inssIncide: true,
      irrfIncide: true,
      inss: inssOnDecimo,
      irrf: irrfOnDecimo,
      valorLiquido: decimoTerceiro.valor + inssOnDecimo + irrfOnDecimo,
    });
  }

  // 4. Férias vencidas (ISENTAS de IRRF)
  if (feriasVencidasValor > 0) {
    verbas.push({
      id: 'ferias_vencidas',
      descricao: 'Férias Vencidas + 1/3',
      baseCalculo: '1 período aquisitivo completo',
      valorBruto: feriasVencidasValor,
      inssIncide: false,
      irrfIncide: false,
      inss: 0,
      irrf: 0,
      valorLiquido: feriasVencidasValor,
    });
  }

  // 5. Férias proporcionais (ISENTAS de IRRF)
  if (feriasProporcionais.valor > 0) {
    verbas.push({
      id: 'ferias_proporcionais',
      descricao: 'Férias Proporcionais + 1/3',
      baseCalculo: `${feriasProporcionais.meses}/12 avos`,
      valorBruto: feriasProporcionais.valor,
      inssIncide: false,
      irrfIncide: false,
      inss: 0,
      irrf: 0,
      valorLiquido: feriasProporcionais.valor,
    });
  }

  // 6. Multa FGTS (informativa, entra no bruto)
  if (fgtsCalc.multa > 0) {
    verbas.push({
      id: 'multa_fgts',
      descricao: `Multa FGTS (${Math.round(regras.percentualMultaFGTS * 100)}%)`,
      baseCalculo: `${Math.round(regras.percentualMultaFGTS * 100)}% sobre saldo FGTS`,
      valorBruto: fgtsCalc.multa,
      inssIncide: false,
      irrfIncide: false,
      inss: 0,
      irrf: 0,
      valorLiquido: fgtsCalc.multa,
    });
  }

  // Totais
  const totalBruto = verbas.reduce((s, v) => s + v.valorBruto, 0);
  const totalINSS = verbas.reduce((s, v) => s + v.inss, 0);
  const totalIRRF = verbas.reduce((s, v) => s + v.irrf, 0);
  const totalLiquido = verbas.reduce((s, v) => s + v.valorLiquido, 0);

  // Saque FGTS (separado, não entra no líquido)
  const saqueFGTS = fgtsCalc.saldoTotal * regras.percentualSaqueFGTS;

  return {
    verbas,
    avisoPrevioDias: apDias,
    periodoTrabalhado: { anos, meses: mesesApos, dias: diasRestantes },
    totalBruto,
    totalINSS,
    totalIRRF,
    totalLiquido,
    saqueFGTS,
    multaFGTS: fgtsCalc.multa,
    seguroDesemprego: regras.seguroDesemprego,
    salarioBase,
  };
}
