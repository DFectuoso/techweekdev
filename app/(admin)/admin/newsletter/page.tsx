import { NewsletterTest } from "@/components/admin/newsletter-test";

export const metadata = { title: "Newsletter — TechWeek" };

export default function AdminNewsletterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Newsletter</h1>
      <NewsletterTest />
    </div>
  );
}
