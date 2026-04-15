// Tipos compartilhados entre web, api e workers.
// Conforme schema do DESIGN.mnd §6.

export type UserRole = "admin" | "analista";

export type LicitacaoStatus =
  | "aguardando_edital"
  | "analisando_edital"
  | "elaborando_proposta_tecnica"
  | "montando_orcamento"
  | "revisao_humana"
  | "concluido";

export type ArquivoTipo = "edital" | "proposta_tecnica" | "orcamento" | "template";

export type AgenteId = 1 | 2 | 3;

export type AgenteStatus = "running" | "success" | "error";
