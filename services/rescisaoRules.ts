
export type TipoRescisao =
  | 'sem_justa_causa'
  | 'pedido_demissao'
  | 'acordo'
  | 'justa_causa'
  | 'rescisao_indireta'
  | 'prazo_determinado';

export type ModoAvisoPrevio = 'indenizado' | 'trabalhado' | 'dispensado';

export interface RegraRescisao {
  avisoPrevioFator: number;
  decimoTerceiro: boolean;
  feriasVencidas: boolean;
  feriasProporcionais: boolean;
  percentualSaqueFGTS: number;
  percentualMultaFGTS: number;
  seguroDesemprego: boolean;
}

export const REGRAS: Record<TipoRescisao, RegraRescisao> = {
  sem_justa_causa: {
    avisoPrevioFator: 1,
    decimoTerceiro: true,
    feriasVencidas: true,
    feriasProporcionais: true,
    percentualSaqueFGTS: 1,
    percentualMultaFGTS: 0.4,
    seguroDesemprego: true,
  },
  pedido_demissao: {
    avisoPrevioFator: 1,
    decimoTerceiro: true,
    feriasVencidas: true,
    feriasProporcionais: true,
    percentualSaqueFGTS: 0,
    percentualMultaFGTS: 0,
    seguroDesemprego: false,
  },
  acordo: {
    avisoPrevioFator: 0.5,
    decimoTerceiro: true,
    feriasVencidas: true,
    feriasProporcionais: true,
    percentualSaqueFGTS: 0.8,
    percentualMultaFGTS: 0.2,
    seguroDesemprego: false,
  },
  justa_causa: {
    avisoPrevioFator: 0,
    decimoTerceiro: false,
    feriasVencidas: true,
    feriasProporcionais: false,
    percentualSaqueFGTS: 0,
    percentualMultaFGTS: 0,
    seguroDesemprego: false,
  },
  rescisao_indireta: {
    avisoPrevioFator: 1,
    decimoTerceiro: true,
    feriasVencidas: true,
    feriasProporcionais: true,
    percentualSaqueFGTS: 1,
    percentualMultaFGTS: 0.4,
    seguroDesemprego: true,
  },
  prazo_determinado: {
    avisoPrevioFator: 0,
    decimoTerceiro: true,
    feriasVencidas: true,
    feriasProporcionais: true,
    percentualSaqueFGTS: 1,
    percentualMultaFGTS: 0,
    seguroDesemprego: false,
  },
};

export const LABELS_TIPO: Record<TipoRescisao, string> = {
  sem_justa_causa: 'Demissão sem Justa Causa',
  pedido_demissao: 'Pedido de Demissão',
  acordo: 'Acordo (Art. 484-A)',
  justa_causa: 'Demissão por Justa Causa',
  rescisao_indireta: 'Rescisão Indireta',
  prazo_determinado: 'Término de Contrato por Prazo Determinado',
};
