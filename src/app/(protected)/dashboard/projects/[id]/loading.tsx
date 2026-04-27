import { SkeletonBlock, SkeletonRow } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <style>{`@keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "70% 1fr", gap: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <SkeletonBlock height="2.5rem" width="70%" />
            <SkeletonBlock height="1rem" width="90%" />
            <SkeletonBlock height="1rem" width="80%" />
          </div>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <SkeletonBlock height="0.7rem" width="120px" />
            {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <SkeletonBlock height="0.7rem" width="80px" />
              <SkeletonBlock height="0.875rem" />
              <SkeletonBlock height="0.875rem" width="80%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
