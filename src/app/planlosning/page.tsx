import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { listPlans } from "@/lib/planner/server";
import { Planner } from "@/components/planner/planner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planlösningar",
};

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ plan?: string | string[] }> }) {
  const session = await auth();
  if (session?.role !== "minister") return notFound();

  const { plan } = await searchParams;
  return <main className="px-0!">
    <Planner me={{ id: session.userId, name: session.name }} plans={await listPlans(session.userId)} initialPlanId={typeof plan === "string" ? plan : null} />
  </main>;
}
