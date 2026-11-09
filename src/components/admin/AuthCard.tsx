import Image from "next/image";
import Link from "next/link";

export function AuthCard({ title, intro, children, footer }: { title: string; intro?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-mist px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-200 sm:p-9">
        <Link href="/" className="self-start" aria-label="Back to the website">
          <Image src="/images/logo.jpg" alt="Iloilo Modern Homes" width={498} height={250} className="h-14 w-auto" priority />
        </Link>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl">{title}</h1>
          {intro && <p className="text-[15px] leading-relaxed text-gray-600">{intro}</p>}
        </div>
        {children}
        {footer && <div className="border-t border-gray-100 pt-5 text-sm text-gray-600">{footer}</div>}
      </div>
    </main>
  );
}
