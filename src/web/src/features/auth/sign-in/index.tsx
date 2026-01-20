import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthLayout from "../auth-layout";
import { UserAuthForm } from "./components/user-auth-form";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";
import { router } from "@/QueryClient";
import { Route } from "@/routes/(auth)/sign-in";

export default function SignIn() {
  const { user, initAuth } = useAuthStore();
  const { redirect } = Route.useSearch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setLoading(true);
        await initAuth(redirect as string);
        setLoading(false);
      } else {
        if (redirect) {
          router.history.push(redirect as string); 
        } else {
          router.navigate({ to: `/${user.role}` });
        }
      }
    };

    checkAuth();
  }, [user, initAuth, redirect]);

  if (loading) {
    return (
      <div className="fixed top-4 left-4 flex items-center space-x-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="text-lg font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm shadow-lg border-border">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-2xl font-bold">Noah Garden HOA</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter className="flex justify-center border-t bg-muted/30 pt-4">
          <p className="text-xs text-muted-foreground/60">
            Restricted Access &bull; Noah Garden HOA
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
