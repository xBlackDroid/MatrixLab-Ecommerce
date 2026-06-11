import type { CategoryRow } from "@/lib/db/types";
import CategoryCard from "@/components/store/CategoryCard";

export default function CategoryGrid({
  categories,
}: {
  categories: CategoryRow[];
}) {
  if (categories.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-ml-white/60">
        El catálogo se está preparando. Vuelve pronto o escríbenos por WhatsApp.
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
