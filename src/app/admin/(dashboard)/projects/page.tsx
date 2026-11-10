import { CategoryTag } from "@/components/site/CategoryTag";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Projects" };

type Row = { id: string; title: string; category: string; status: string; location: string | null; cover_image: string | null; is_published: boolean; is_featured: boolean; photos: { count: number }[] };

export default async function ProjectsPage() {
  const s = await requireAdmin("edit");
  const { data } = await s.db
    .from("projects")
    .select("id, title, category, status, location, cover_image, is_published, is_featured, photos:project_photos(count)")
    .order("sort_order")
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  return (
    <>
      <PageHeader
        title="Projects"
        intro="Finished and ongoing jobs shown on the website, with before, during, and after photos."
        action={
          <Link href="/admin/projects/new" className="btn-gold">
            <Plus className="size-4" aria-hidden /> Add project
          </Link>
        }
      />
      {data && data.length > 0 ? (
        <Table head={["Project", "Category", "Photos", "Website"]}>
          {data.map((p) => (
            <tr key={p.id} className="hover:bg-mist">
              <Td>
                <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-3">
                  {p.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_image} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="h-12 w-16 shrink-0 rounded bg-gray-100" />
                  )}
                  <span>
                    <span className="block font-semibold text-navy-800">{p.title}</span>
                    <span className="text-[13px] text-gray-500">{p.location ?? "—"}</span>
                  </span>
                </Link>
              </Td>
              <Td>
                <CategoryTag category={p.category} />
              </Td>
              <Td>{p.photos[0]?.count ?? 0}</Td>
              <Td>
                <span className="flex flex-wrap gap-1.5">
                  {p.is_published ? <Badge tone="green">Shown</Badge> : <Badge>Draft</Badge>}
                  {p.is_featured && <Badge tone="goldSolid">Featured</Badge>}
                </span>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>No projects yet. Add your first one to show it on the website.</EmptyState>
      )}
    </>
  );
}
