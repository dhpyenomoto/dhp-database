import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatJst } from "@/lib/datetime";
import StatusBadge from "@/components/StatusBadge";
import {
  PROJECT_STATUSES,
  CATEGORIES,
  APPROACHES,
  BUILDING_TYPES,
} from "@/lib/masters";
import type { Prisma } from "@prisma/client";

type SP = Record<string, string | string[] | undefined>;

function s(sp: SP, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function ProjectListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireUser();
  const sp = await searchParams;

  const q = s(sp, "q").trim();
  const status = s(sp, "status");
  const category = s(sp, "category");
  const approach = s(sp, "approach");
  const buildingType = s(sp, "buildingType");
  const sort = s(sp, "sort") || "updated";
  const showDeleted = s(sp, "showDeleted") === "1";

  const where: Prisma.ProjectWhereInput = {};
  if (!showDeleted) where.isDeleted = false;
  if (status) where.status = status;
  if (category) where.category = category;
  if (approach) where.approach = approach;
  if (buildingType) where.buildingType = buildingType;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { owner: { contains: q } },
      { summary: { contains: q } },
      { projectNo: { contains: q } },
    ];
  }

  const orderBy: Prisma.ProjectOrderByWithRelationInput =
    sort === "no"
      ? { projectNo: "asc" }
      : sort === "status"
        ? { status: "asc" }
        : { updatedAt: "desc" };

  const projects = await prisma.project.findMany({ where, orderBy });

  const selectCls =
    "rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">プロジェクト一覧</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ＋新規プロジェクト
        </Link>
      </div>

      {/* 検索・絞り込み・並べ替え（GETフォーム） */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-gray-500">検索</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="名称・担当者・概要・NO."
            className="w-56 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-gray-500">状況</label>
          <select name="status" defaultValue={status} className={selectCls}>
            <option value="">すべて</option>
            {PROJECT_STATUSES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-gray-500">区分</label>
          <select name="category" defaultValue={category} className={selectCls}>
            <option value="">すべて</option>
            {CATEGORIES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-gray-500">取組方針</label>
          <select name="approach" defaultValue={approach} className={selectCls}>
            <option value="">すべて</option>
            {APPROACHES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-gray-500">建物種別</label>
          <select
            name="buildingType"
            defaultValue={buildingType}
            className={selectCls}
          >
            <option value="">すべて</option>
            {BUILDING_TYPES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-gray-500">並べ替え</label>
          <select name="sort" defaultValue={sort} className={selectCls}>
            <option value="updated">更新日時（新しい順）</option>
            <option value="status">状況</option>
            <option value="no">NO.</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            name="showDeleted"
            value="1"
            defaultChecked={showDeleted}
          />
          削除済みを表示
        </label>
        <button
          type="submit"
          className="rounded-md bg-gray-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          適用
        </button>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          クリア
        </Link>
      </form>

      {/* 一覧テーブル */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">NO.</th>
              <th className="px-3 py-2">状況</th>
              <th className="px-3 py-2">名称</th>
              <th className="px-3 py-2">区分</th>
              <th className="px-3 py-2">担当者</th>
              <th className="px-3 py-2">価格概要</th>
              <th className="px-3 py-2 whitespace-nowrap">最終更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  該当するプロジェクトがありません。
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-gray-50 ${
                  p.isDeleted ? "bg-red-50/40 text-gray-400 line-through" : ""
                }`}
              >
                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                  {p.projectNo}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                  {p.isDeleted && (
                    <span className="ml-2 text-xs text-red-500 no-underline">
                      （削除: {p.deletedById}・{formatJst(p.deletedAt)}）
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{p.category}</td>
                <td className="px-3 py-2 whitespace-nowrap">{p.owner ?? ""}</td>
                <td className="px-3 py-2">{p.priceSummary ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {formatJst(p.updatedAt)}
                  <br />
                  <span className="text-gray-400">{p.updatedById}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs text-gray-400">
        {projects.length} 件
      </p>
    </div>
  );
}
