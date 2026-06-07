"use client";

import { useActionState } from "react";
import {
  createUser,
  setUserActive,
  resetPassword,
  type AdminUserState,
} from "@/actions/admin";
import { formatJst } from "@/lib/datetime";

export interface UserView {
  id: string;
  employeeId: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const inputCls =
  "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

function CreateUserForm() {
  const [state, action, pending] = useActionState<AdminUserState, FormData>(
    createUser,
    {}
  );
  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">社員ID</label>
        <input name="employeeId" required className={inputCls} />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">表示名（任意）</label>
        <input name="name" className={inputCls} />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">初期パスワード</label>
        <input
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="8文字以上"
          className={inputCls}
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">権限</label>
        <select name="role" defaultValue="member" className={inputCls}>
          <option value="member">一般（member）</option>
          <option value="admin">管理者（admin）</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "発行中…" : "アカウント発行"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="w-full text-sm text-emerald-600">{state.success}</p>
      )}
    </form>
  );
}

function PasswordReset({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<AdminUserState, FormData>(
    resetPassword,
    {}
  );
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="password"
        type="text"
        placeholder="新PW(8文字+)"
        minLength={8}
        className="w-28 rounded border border-gray-300 px-1.5 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-60"
      >
        PW再設定
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.success && (
        <span className="text-xs text-emerald-600">変更済</span>
      )}
    </form>
  );
}

export default function AdminUsers({
  users,
  currentUserId,
}: {
  users: UserView[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <CreateUserForm />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">社員ID</th>
              <th className="px-3 py-2">表示名</th>
              <th className="px-3 py-2">権限</th>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">作成日時</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2 font-medium">{u.employeeId}</td>
                <td className="px-3 py-2">{u.name ?? ""}</td>
                <td className="px-3 py-2">
                  {u.role === "admin" ? "管理者" : "一般"}
                </td>
                <td className="px-3 py-2">
                  {u.isActive ? (
                    <span className="text-emerald-600">有効</span>
                  ) : (
                    <span className="text-gray-400">無効</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {formatJst(u.createdAt)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {u.id !== currentUserId && (
                      <form
                        action={setUserActive.bind(null, u.id, !u.isActive)}
                      >
                        <button
                          type="submit"
                          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                        >
                          {u.isActive ? "無効化" : "有効化"}
                        </button>
                      </form>
                    )}
                    <PasswordReset userId={u.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
