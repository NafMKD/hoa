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
  const [ loading, setLoading ] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setLoading(true);
        await initAuth(redirect as string); 
        setLoading(false);
      } else {
        router.navigate({ to: (redirect as string) || `/${user.role}` });
      }
    };

    checkAuth();
  }, [user, initAuth, redirect]);

  if(loading) {
    return (
      <div className="fixed top-4 left-4 flex items-center space-x-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="text-lg font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader className="flex flex-col items-center text-center">
          <CardTitle className="text-lg tracking-tight">Sign In</CardTitle>
          <CardDescription>Sign In in to start your session.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground px-8 text-center text-sm">
            By clicking Sign In, you agree to our{" "}
            <a
              href="/terms"
              className="hover:text-primary underline underline-offset-4"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="hover:text-primary underline underline-offset-4"
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
