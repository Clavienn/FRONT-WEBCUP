import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchResults } from "@/components/search/search-results"

export const metadata: Metadata = {
  title: "Recherche | Terra Nova",
  description: "Résultats de recherche sur les services, lieux, projets et annonces de Terra Nova.",
}

export default function SearchPage() {
  return (
    // useSearchParams (?q=) impose une limite Suspense
    <Suspense>
      <SearchResults />
    </Suspense>
  )
}
