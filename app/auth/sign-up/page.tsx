import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SignUpPageProps {
  searchParams: { message?: string };
}

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  return (
    <Card className="w-full">
      <CardHeader>Create account</CardHeader>
      <CardContent>
        <form action={signUpAction} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          {searchParams.message && (
            <p className={`rounded-md p-3 text-sm ${searchParams.message.toLowerCase().includes('check') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {searchParams.message}
            </p>
          )}
          <Button type="submit" className="w-full">Create Account</Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-slate-600 border-t pt-4">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="ml-1 font-medium underline text-slate-900">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
