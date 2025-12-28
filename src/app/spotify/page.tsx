"use server";
import "server-only";
import type { Album, User } from "@/app/spotify/types";
import { isMinister } from "@/lib/auth";
import { notFound } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import FetchFilterContextProvider from "@/app/spotify/context/fetch-filter-context";
import LocalFilterContextProvider from "@/app/spotify/context/local-filter-context";
import FilterPanel from "@/app/spotify/components/filter-panel";
import TrackList from "@/app/spotify/components/track-list";
import { prisma } from "@/lib/prisma";

  const clerk = await clerkClient();

export default async function SpotifyPage() {
  const userId = (await auth()).userId;
  if (!userId) return notFound();
  if (!await isMinister(userId)) return notFound();

  return <main>

  </main>;
}