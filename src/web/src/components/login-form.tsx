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
  const [error, setError] = useState("");

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  // Simple client-side validation
  const validateForm = () => {
    if (!phone) return "Phone is required";
    if (!/^\+?[0-9]{10,15}$/.test(phone)) return "Phone number is invalid";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { phone, password });

      const user: User = {
        id: data.user.id,
        name: `${data.user.first_name} ${data.user.last_name}`,
        phone: data.user.phone,
        role: data.user.role,
      };

      console.log("Logged in user:", user);
      
      // Save encrypted store
      setAuth(user, data.token);

      navigate("/admin");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please check your credentials.");
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
          <CardDescription>Login to continue to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="0911......"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={error.includes("Phone") ? "border-red-500" : ""}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={error.includes("Password") ? "border-red-500" : ""}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        By using this system, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
