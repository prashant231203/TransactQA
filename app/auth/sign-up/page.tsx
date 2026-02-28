import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const signUp = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) return;

    const supabase = await createServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/callback`,
      },
    });

    if (error) {
      return redirect("/auth/sign-up?message=Could not authenticate user");
    }

    return redirect("/auth/sign-up?message=Check email to continue sign in process");
  };

  return (
    <Card className="w-full">
      <CardHeader>Create account</CardHeader>
      <CardContent>
        <form action={signUp} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">Sign Up</Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-slate-600 border-t pt-4">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="ml-1 font-medium underline text-slate-900">
          Sign in
        </Link>
      </CardFooter>
    </Card >
  );
}
