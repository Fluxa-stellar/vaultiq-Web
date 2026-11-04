export type RuleType =
  | "LOW_BALANCE"
  | "LARGE_TRANSACTION"
  | "SCHEDULED_TRANSFER"
  | "EXCESS_BALANCE"
  | "INCOMING_PAYMENT";

export type ExecutionMode =
  | "RECOMMEND"
  | "REQUIRE_APPROVAL"
  | "AUTOMATIC";

export interface RuleCondition {
  threshold?: string;
  token?: string;
  targetAddress?: string;
  intervalHours?: number;
  [key: string]: unknown;
}

export interface RuleAction {
  notify?: boolean;
  createApproval?: boolean;
  rebalanceTo?: string;
  [key: string]: unknown;
}

export interface Rule {
  id: string;
  treasuryId: string;
  name: string;
  description?: string | null;
  type: RuleType;
  condition: RuleCondition;
  action: RuleAction;
  executionMode: ExecutionMode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleDto {
  name: string;
  description?: string;
  type: RuleType;
  condition: RuleCondition;
  action: RuleAction;
  executionMode?: ExecutionMode;
  isActive?: boolean;
}

export interface UpdateRuleDto {
  name?: string;
  description?: string;
  type?: RuleType;
  condition?: RuleCondition;
  action?: RuleAction;
  executionMode?: ExecutionMode;
  isActive?: boolean;
}

export interface EvaluationItemResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  reason: string;
}

export interface RuleEvaluationData {
  evaluatedCount: number;
  triggeredCount: number;
  results: EvaluationItemResult[];
}

