import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Spinner } from "@/components/ui/spinner";
import api from "@/lib/api";
import { useAuthStore, type User } from "@/stores/auth-store";
import { router } from "@/QueryClient";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

const formSchema = z.object({
  phone: z
    .string()
    .min(1, { message: "Please enter your phone number" })
    .regex(/^\d{10,15}$/, { message: "Invalid phone number" }),
  password: z
    .string()
    .min(1, { message: "Please enter your password" })
    .min(7, { message: "Password must be at least 7 characters long" }),
});

type FormValues = z.infer<typeof formSchema>;

export function UserAuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { phone: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setGeneralError(null);

    try {
      const res = await api.post("/v1/auth/login", data);

      const user: User = {
        id: res.data.user.id,
        name: `${res.data.user.first_name} ${res.data.user.last_name}`,
        phone: res.data.user.phone,
        role: res.data.user.role,
      };

      useAuthStore.getState().setAuth(user, res.data.token);

      // Redirect after login
      const redirect =
        new URLSearchParams(window.location.search).get("redirect") ||
        `/${user.role}`;
      router.navigate({ to: redirect });
    } catch (err: any) {
      console.error("Login error:", err);

      if (err.response?.data) {
        const { message, errors: apiErrors } = err.response.data;

        // Set field-specific errors
        if (apiErrors) {
          Object.entries(apiErrors).forEach(([field, messages]: any) => {
            if (messages.length) {
              form.setError(field as keyof FormValues, {
                message: messages[0],
              });
            }
          });
        }

        // Set general error if not field-specific
        if (message && (!apiErrors || Object.keys(apiErrors).length === 0)) {
          setGeneralError(message);
        }
      } else if (err.request) {
        setGeneralError("No response from server. Please try again later.");
      } else {
        setGeneralError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
        {generalError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{generalError}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="0911212121" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="mt-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner />
              Loading...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </Form>
  );
}
