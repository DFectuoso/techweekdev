import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist.
      </p>
      <Link href="/">
        <Button variant="outline">Go home</Button>
      </Link>
    </div>
  );
}
