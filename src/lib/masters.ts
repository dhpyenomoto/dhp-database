// 選択肢マスタ（enum ではなく定数配列で一元管理。将来「その他」項目を増やせる）
// 値（value）は DB 保存値であり、日本語ラベルそのものを使用します。

/** 2. プロジェクト状況 */
export const PROJECT_STATUSES = ["検討中", "決定", "進行中", "完了", "見送り"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** 状況バッジの色（一覧でひと目で分かるよう色分け） */
export const STATUS_BADGE_CLASS: Record<string, string> = {
  検討中: "bg-amber-100 text-amber-800 border border-amber-300",
  決定: "bg-blue-100 text-blue-800 border border-blue-300",
  進行中: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  完了: "bg-gray-200 text-gray-700 border border-gray-300",
  見送り: "bg-rose-100 text-rose-800 border border-rose-300",
};

/** 4. 区分 */
export const CATEGORIES = [
  "転売用土地",
  "マンション用地",
  "オフィスビル用地",
  "テナントビル用地",
  "ホテル用地",
  "既存マンション",
  "既存ホテル",
  "既存オフィスビル",
  "既存テナントビル",
  "その他",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** 8. 取組方針 */
export const APPROACHES = ["地上げ", "仲介", "転売", "開発", "その他"] as const;
export type Approach = (typeof APPROACHES)[number];

/** 11. 建物種別 */
export const BUILDING_TYPES = [
  "古ビル",
  "マンション",
  "オフィスビル",
  "テナントビル",
  "ホテル",
  "その他",
] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

/** プロジェクト本体フィールドの日本語ラベル（変更履歴の差分表示などに使用） */
export const FIELD_LABELS: Record<string, string> = {
  projectNo: "プロジェクトNO.",
  status: "プロジェクト状況",
  name: "プロジェクト名称",
  category: "区分",
  summary: "概要",
  owner: "担当者名",
  infoRoute: "情報ルート",
  approach: "取組方針",
  landSize: "土地規模",
  buildingSize: "建物規模",
  buildingType: "建物種別",
  priceSummary: "価格概要",
};
