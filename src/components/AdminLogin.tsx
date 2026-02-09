import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus, KeyRound } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("خطأ في تسجيل الدخول: " + error.message);
        return;
      }

      if (data.user) {
        // Check if user has admin role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError || !roleData) {
          toast.error("ليس لديك صلاحيات المسؤول");
          await supabase.auth.signOut();
          return;
        }

        toast.success("تم تسجيل الدخول بنجاح");
        onLoginSuccess();
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/training-gallery`,
        },
      });

      if (error) {
        toast.error("خطأ في إنشاء الحساب: " + error.message);
        return;
      }

      if (data.user) {
        toast.success("تم إنشاء الحساب بنجاح! يرجى التواصل مع المطور لتفعيل صلاحيات المسؤول.");
        setIsSignUp(false);
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/training-gallery?reset=true`,
      });

      if (error) {
        toast.error("خطأ في إرسال رابط إعادة التعيين: " + error.message);
        return;
      }

      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      setIsResetPassword(false);
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (isResetPassword) return "إعادة تعيين كلمة المرور";
    if (isSignUp) return "إنشاء حساب مسؤول";
    return "دخول المسؤول";
  };

  const getSubmitHandler = () => {
    if (isResetPassword) return handleResetPassword;
    if (isSignUp) return handleSignUp;
    return handleLogin;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={getSubmitHandler()} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              dir="ltr"
            />
          </div>
          {!isResetPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : isResetPassword ? (
              <KeyRound className="w-4 h-4 ml-2" />
            ) : isSignUp ? (
              <UserPlus className="w-4 h-4 ml-2" />
            ) : (
              <LogIn className="w-4 h-4 ml-2" />
            )}
            {isResetPassword ? "إرسال رابط التعيين" : isSignUp ? "إنشاء الحساب" : "تسجيل الدخول"}
          </Button>
        </form>
        <div className="mt-4 text-center space-y-2">
          {!isResetPassword && (
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-muted-foreground"
            >
              {isSignUp ? "لديك حساب؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
            </Button>
          )}
          <Button
            variant="link"
            onClick={() => {
              setIsResetPassword(!isResetPassword);
              setIsSignUp(false);
            }}
            className="text-muted-foreground block w-full"
          >
            {isResetPassword ? "العودة لتسجيل الدخول" : "نسيت كلمة المرور؟"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminLogin;
