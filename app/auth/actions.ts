'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export async function signInAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return redirect('/auth/sign-in?message=Email and password are required');
    }

    const supabase = await createServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return redirect(`/auth/sign-in?message=${encodeURIComponent(error.message)}`);
    }

    return redirect('/dashboard');
}

export async function signUpAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return redirect('/auth/sign-up?message=Email and password are required');
    }

    if (password.length < 6) {
        return redirect('/auth/sign-up?message=Password must be at least 6 characters');
    }

    const supabase = await createServerClient();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'https://') ?? 'http://localhost:3000'}/api/auth/callback`,
        },
    });

    if (error) {
        return redirect(`/auth/sign-up?message=${encodeURIComponent(error.message)}`);
    }

    return redirect('/auth/sign-up?message=Check your email to confirm your account');
}
