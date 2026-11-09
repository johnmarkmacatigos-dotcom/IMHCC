import { AdminForm } from "@/components/admin/Form";
import { Badge, Card, PageHeader, timeAgo } from "@/components/admin/ui";
import { type Profile, type Role, requireAdmin, roleHelp, roleLabels } from "@/lib/admin/session";
import { updateMember } from "./actions";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const s = await requireAdmin("manage");
  const { data } = await s.db.from("profiles").select("id, full_name, email, role, is_active, created_at").order("is_active").order("created_at").returns<(Profile & { created_at: string })[]>();
  const roles = (Object.keys(roleLabels) as Role[]).filter((r) => r !== "owner" || s.can.owner);

  return (
    <>
      <PageHeader
        title="Team"
        intro="New team members create an account at /admin/signup. Their access stays off until you switch it on here."
      />
      <Card title="What each role can do">
        <dl className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(roleLabels) as Role[]).map((r) => (
            <div key={r}>
              <dt className="font-semibold text-navy-800">{roleLabels[r]}</dt>
              <dd className="text-sm text-gray-600">{roleHelp[r]}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((m) => {
          const self = m.id === s.userId;
          const locked = self || (m.role === "owner" && !s.can.owner);
          return (
            <li key={m.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy-800">{m.full_name ?? m.email}</span>
                    {self && <Badge tone="navy">You</Badge>}
                    {m.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="gold">Waiting for access</Badge>}
                  </div>
                  <div className="break-all text-sm text-gray-600">
                    {m.email} · joined {timeAgo(m.created_at)}
                  </div>
                </div>
                {locked ? (
                  <span className="text-sm text-gray-600">{roleLabels[m.role]}</span>
                ) : (
                  <AdminForm action={updateMember} submitLabel="Save" className="flex-row flex-wrap items-start gap-3 [&>div:last-child]:self-end">
                    <input type="hidden" name="id" value={m.id} />
                    <label className="field-label">
                      Role
                      <select name="role" defaultValue={m.role} className="field-input">
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      Access
                      <select name="is_active" defaultValue={String(m.is_active)} className="field-input">
                        <option value="true">On</option>
                        <option value="false">Off</option>
                      </select>
                    </label>
                  </AdminForm>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
