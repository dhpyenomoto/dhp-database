import { prisma } from "@/lib/prisma";
import { FIELD_LABELS } from "@/lib/masters";

export type AuditAction = "create" | "update" | "delete" | "restore";
export type EntityType = "project" | "progressEntry" | "projectResource";

export interface FieldChange {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
}

/** 監査ログを1件記録する */
export async function recordAudit(params: {
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  actorId: string;
  changes?: FieldChange[] | Record<string, unknown> | null;
}) {
  const { entityType, entityId, action, actorId, changes } = params;
  await prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actorId,
      fieldChanges: changes ? JSON.stringify(changes) : null,
    },
  });
}

/**
 * 2つのオブジェクトを比較し、変更されたフィールドの差分（前→後）を返す。
 * プロジェクト本体の update 時に使用。
 */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    const b = before[field] ?? null;
    const a = after[field] ?? null;
    if (b !== a) {
      changes.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        before: b,
        after: a,
      });
    }
  }
  return changes;
}
