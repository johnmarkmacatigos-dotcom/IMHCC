import { PublicChrome } from "@/components/site/PublicChrome";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicChrome>{children}</PublicChrome>;
}
