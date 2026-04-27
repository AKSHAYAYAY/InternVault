import { IdeaCard } from "./IdeaCard"

export function IdeaList({ ideas }: { ideas: any[] }) {
  if (ideas.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "0.5rem" }}>
        No ideas found for this department yet.
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
      {ideas.map(idea => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  )
}
