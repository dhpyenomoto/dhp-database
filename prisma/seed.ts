import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 初期投入用の値（本番では必ずパスワードを変更してください）
const INITIAL_ADMIN = {
  employeeId: "admin",
  name: "初期管理者",
  password: "admin1234",
  role: "admin" as const,
};

const SAMPLE_MEMBER = {
  employeeId: "yamada",
  name: "山田 太郎",
  password: "password123",
  role: "member" as const,
};

async function main() {
  // --- 社員アカウント ---
  const adminHash = await bcrypt.hash(INITIAL_ADMIN.password, 10);
  await prisma.user.upsert({
    where: { employeeId: INITIAL_ADMIN.employeeId },
    update: {},
    create: {
      employeeId: INITIAL_ADMIN.employeeId,
      name: INITIAL_ADMIN.name,
      passwordHash: adminHash,
      role: INITIAL_ADMIN.role,
    },
  });

  const memberHash = await bcrypt.hash(SAMPLE_MEMBER.password, 10);
  await prisma.user.upsert({
    where: { employeeId: SAMPLE_MEMBER.employeeId },
    update: {},
    create: {
      employeeId: SAMPLE_MEMBER.employeeId,
      name: SAMPLE_MEMBER.name,
      passwordHash: memberHash,
      role: SAMPLE_MEMBER.role,
    },
  });

  // --- サンプルプロジェクト（既存があればスキップ） ---
  const existing = await prisma.project.count();
  if (existing === 0) {
    const samples = [
      {
        projectNo: "P-0001",
        status: "進行中",
        name: "渋谷区道玄坂 テナントビル開発",
        category: "テナントビル用地",
        summary:
          "駅徒歩3分の好立地。既存古ビルを取得し、地上げ後にテナントビルへ建替えを検討。",
        owner: "山田 太郎",
        infoRoute: "提携仲介A社からの持ち込み",
        approach: "開発",
        landSize: "540.20㎡（163.46坪）",
        buildingSize: "7F / 延床 3,200㎡",
        buildingType: "古ビル",
        priceSummary: "土地 8.0億円（税別）想定",
        createdById: "admin",
        updatedById: "admin",
      },
      {
        projectNo: "P-0002",
        status: "検討中",
        name: "熱海 ホテル用地",
        category: "ホテル用地",
        summary: "海一望の高台。リゾートホテル開発のポテンシャル調査中。",
        owner: "山田 太郎",
        infoRoute: "地主からの直接相談",
        approach: "地上げ",
        landSize: "約3,200㎡（約968坪）",
        buildingSize: "",
        buildingType: "",
        priceSummary: "土地 5.5億円（税別）打診中",
        createdById: "yamada",
        updatedById: "yamada",
      },
      {
        projectNo: "P-0003",
        status: "決定",
        name: "新宿区 既存マンション一棟",
        category: "既存マンション",
        summary: "満室稼働中の一棟マンション。転売目的で取得決定。",
        owner: "佐藤 花子",
        infoRoute: "金融機関紹介",
        approach: "転売",
        landSize: "320.00㎡（96.80坪）",
        buildingSize: "RC 8F / 24戸",
        buildingType: "マンション",
        priceSummary: "12.5億円（税別）で取得合意",
        createdById: "admin",
        updatedById: "admin",
      },
    ];

    for (const s of samples) {
      const project = await prisma.project.create({ data: s });
      await prisma.auditLog.create({
        data: {
          entityType: "project",
          entityId: project.id,
          action: "create",
          actorId: s.createdById,
          fieldChanges: JSON.stringify({
            projectNo: s.projectNo,
            name: s.name,
          }),
        },
      });
    }

    // サンプル進捗ログ（P-0001）
    const p1 = await prisma.project.findUnique({
      where: { projectNo: "P-0001" },
    });
    if (p1) {
      const e1 = await prisma.progressEntry.create({
        data: {
          projectId: p1.id,
          body: "売主と初回面談。価格感に大きな隔たりはなし。次回は条件提示。",
          authorId: "yamada",
        },
      });
      await prisma.auditLog.create({
        data: {
          entityType: "progressEntry",
          entityId: e1.id,
          action: "create",
          actorId: "yamada",
          fieldChanges: JSON.stringify({ body: "売主と初回面談。…" }),
        },
      });
      const e2 = await prisma.progressEntry.create({
        data: {
          projectId: p1.id,
          body: "意向表明書を提出。融資内諾も取得済み。",
          authorId: "admin",
        },
      });
      await prisma.auditLog.create({
        data: {
          entityType: "progressEntry",
          entityId: e2.id,
          action: "create",
          actorId: "admin",
          fieldChanges: JSON.stringify({ body: "意向表明書を提出。…" }),
        },
      });
    }
  }

  console.log("✅ シード完了");
  console.log(
    `   初期管理者: 社員ID="${INITIAL_ADMIN.employeeId}" / パスワード="${INITIAL_ADMIN.password}"`
  );
  console.log(
    `   一般社員  : 社員ID="${SAMPLE_MEMBER.employeeId}" / パスワード="${SAMPLE_MEMBER.password}"`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
