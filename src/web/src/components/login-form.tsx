import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { type User } from "@/lib/store";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    phone: "",
    password: "",
    general: "",
  });

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = { phone: "", password: "", general: "" };

    if (!phone) {
      newErrors.phone = "Phone is required";
    } else if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      newErrors.phone = "Phone number is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return !newErrors.phone && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ phone: "", password: "", general: "" });

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { phone, password });

      const user: User = {
        id: data.user.id,
        name: `${data.user.first_name} ${data.user.last_name}`,
        phone: data.user.phone,
        role: data.user.role,
      };

      setAuth(user, data.token);
      navigate("/admin");
    } catch (err: any) {
      console.error("Login error:", err);

      if (err.response?.data) {
        const { message, errors: apiErrors } = err.response.data;

        // Extract specific field errors if present
        const newErrors = { phone: "", password: "", general: "" };

        if (apiErrors) {
          if (apiErrors.phone?.length) newErrors.phone = apiErrors.phone[0];
          if (apiErrors.password?.length)
            newErrors.password = apiErrors.password[0];
        }

        // Set general error if message exists and isn't field-specific
        if (message && !newErrors.phone && !newErrors.password) {
          newErrors.general = message;
        }

        setErrors(newErrors);
      } else if (err.request) {
        setErrors({
          phone: "",
          password: "",
          general: "No response from server. Please try again later.",
        });
      } else {
        setErrors({
          phone: "",
          password: "",
          general: "An unexpected error occurred.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>
            Login to continue to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            <div className="grid gap-6">
              {/* Phone Field */}
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="0911......"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone)
                      setErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs">
        By using this system, you agree to our{" "}
        <a href="#" className="underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
