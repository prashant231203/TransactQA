import Link from "next/link";
import { signInAction } from "@/app/auth/actions";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SignInPageProps {
  searchParams: { message?: string };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <Card className="w-full">
      <CardHeader>Sign in</CardHeader>
      <CardContent>
        <form action={signInAction} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {searchParams.message && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{searchParams.message}</p>
          )}
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-slate-600 border-t pt-4">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="ml-1 font-medium underline text-slate-900">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
