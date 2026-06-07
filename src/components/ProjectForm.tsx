"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ProjectFormState } from "@/actions/projects";
import {
  PROJECT_STATUSES,
  CATEGORIES,
  APPROACHES,
  BUILDING_TYPES,
} from "@/lib/masters";

export interface ProjectDefaults {
  projectNo?: string;
  status?: string;
  name?: string;
  category?: string;
  summary?: string;
  owner?: string;
  infoRoute?: string;
  approach?: string;
  landSize?: string;
  buildingSize?: string;
  buildingType?: string;
  priceSummary?: string;
}

const inputCls =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function ProjectForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
  isEdit = false,
}: {
  action: (
    prev: ProjectFormState,
    formData: FormData
  ) => Promise<ProjectFormState>;
  defaults?: ProjectDefaults;
  submitLabel: string;
  cancelHref: string;
  isEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      {/* 1. プロジェクトNO. */}
      <div>
        <label className="block text-sm font-medium">
          1. プロジェクトNO.
        </label>
        <input
          name="projectNo"
          defaultValue={defaults.projectNo ?? ""}
          placeholder={isEdit ? "" : "空欄で自動採番（例 P-0001）"}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-gray-400">
          一意の番号。空欄なら自動採番、手動上書きも可。
        </p>
      </div>

      {/* 2. プロジェクト状況 */}
      <div>
        <label className="block text-sm font-medium">
          2. プロジェクト状況 <span className="text-red-500">*</span>
        </label>
        <select
          name="status"
          defaultValue={defaults.status ?? PROJECT_STATUSES[0]}
          required
          className={inputCls}
        >
          {PROJECT_STATUSES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 3. プロジェクト名称 */}
      <div>
        <label className="block text-sm font-medium">
          3. プロジェクト名称 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          defaultValue={defaults.name ?? ""}
          required
          className={inputCls}
        />
      </div>

      {/* 4. 区分 */}
      <div>
        <label className="block text-sm font-medium">
          4. 区分 <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          defaultValue={defaults.category ?? CATEGORIES[0]}
          required
          className={inputCls}
        >
          {CATEGORIES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 5. 概要 */}
      <div>
        <label className="block text-sm font-medium">5. 概要（自由記述）</label>
        <textarea
          name="summary"
          defaultValue={defaults.summary ?? ""}
          rows={4}
          className={inputCls}
        />
      </div>

      {/* 6. 担当者名 */}
      <div>
        <label className="block text-sm font-medium">6. 担当者名</label>
        <input
          name="owner"
          defaultValue={defaults.owner ?? ""}
          className={inputCls}
        />
      </div>

      {/* 7. 情報ルート */}
      <div>
        <label className="block text-sm font-medium">7. 情報ルート</label>
        <input
          name="infoRoute"
          defaultValue={defaults.infoRoute ?? ""}
          placeholder="案件の入手経路"
          className={inputCls}
        />
      </div>

      {/* 8. 取組方針 */}
      <div>
        <label className="block text-sm font-medium">8. 取組方針</label>
        <select
          name="approach"
          defaultValue={defaults.approach ?? ""}
          className={inputCls}
        >
          <option value="">（未選択）</option>
          {APPROACHES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 9. 土地規模 */}
      <div>
        <label className="block text-sm font-medium">9. 土地規模</label>
        <input
          name="landSize"
          defaultValue={defaults.landSize ?? ""}
          placeholder="例: 540.20㎡（163.46坪）"
          className={inputCls}
        />
      </div>

      {/* 10. 建物規模 */}
      <div>
        <label className="block text-sm font-medium">10. 建物規模</label>
        <input
          name="buildingSize"
          defaultValue={defaults.buildingSize ?? ""}
          placeholder="例: 7F / 延床 3,200㎡"
          className={inputCls}
        />
      </div>

      {/* 11. 建物種別 */}
      <div>
        <label className="block text-sm font-medium">11. 建物種別</label>
        <select
          name="buildingType"
          defaultValue={defaults.buildingType ?? ""}
          className={inputCls}
        >
          <option value="">（未選択）</option>
          {BUILDING_TYPES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 12. 価格概要 */}
      <div>
        <label className="block text-sm font-medium">12. 価格概要</label>
        <input
          name="priceSummary"
          defaultValue={defaults.priceSummary ?? ""}
          placeholder="例: 土地 8.0億円（税別）想定"
          className={inputCls}
        />
      </div>

      <p className="text-xs text-gray-400">
        13. プロジェクトの現状（進捗ログ）は、保存後に詳細画面から追記できます。
      </p>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "保存中…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="text-sm text-gray-500 hover:underline"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
