import { SuggestionTable } from "@/components/admin/suggestion-table";

export const metadata = { title: "Event Suggestions — TechWeek" };

export default function AdminSuggestionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Event Suggestions</h1>
      <SuggestionTable />
    </div>
  );
}
