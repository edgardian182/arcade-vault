import { notFound } from "next/navigation";
import { GAMES } from "@/lib/games";
import { GamePlayerShell } from "@/components/game-player-shell";

export default async function GamePlayerPage({ params }: PageProps<"/jugar/[id]">) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  return <GamePlayerShell game={game} />;
}
