import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight">
            dhp都市開発GP
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            プロジェクト情報データベース
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-gray-400">
          社内専用ツール／社員IDでログインしてください
        </p>
      </div>
    </main>
  );
}
