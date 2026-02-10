import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center pt-8 pb-6">
          <PawPrint className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Looks like this page wandered off. Let's get you back on track.
          </p>
          <Button asChild data-testid="link-go-home">
            <Link href="/">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
