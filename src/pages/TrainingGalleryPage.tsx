import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import TrainingGallery from "@/components/TrainingGallery";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/AdminPanel";
import UpdatePassword from "@/components/UpdatePassword";
import { supabase } from "@/integrations/supabase/client";

const TrainingGalleryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Check if this is a password reset flow
      const isReset = searchParams.get("reset") === "true";
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // If reset=true and user is authenticated, show password update form
        if (isReset) {
          setShowUpdatePassword(true);
          setIsCheckingAuth(false);
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (roleData) {
          setIsAdmin(true);
        }
      }
      setIsCheckingAuth(false);
    };

    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setShowAdminLogin(false);
        setShowUpdatePassword(false);
      }
      
      // Handle password recovery event
      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
  };

  const handlePasswordUpdateSuccess = async () => {
    setShowUpdatePassword(false);
    // Clear the reset parameter from URL
    setSearchParams({});
    
    // Check if user is admin and show admin panel
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (roleData) {
        setIsAdmin(true);
      }
    }
  };

  const handlePasswordUpdateCancel = async () => {
    setShowUpdatePassword(false);
    setSearchParams({});
    await supabase.auth.signOut();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/images/nafs-background.jpeg')" }}
    >
      <div className="min-h-screen bg-background/85 dark:bg-background/90">
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")} 
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            رجوع للرئيسية
          </Button>
        </div>

        {showUpdatePassword ? (
          <div className="container mx-auto px-4 pb-8">
            <UpdatePassword 
              onSuccess={handlePasswordUpdateSuccess}
              onCancel={handlePasswordUpdateCancel}
            />
          </div>
        ) : isAdmin ? (
          <div className="container mx-auto px-4 pb-8">
            <AdminPanel onLogout={handleLogout} />
          </div>
        ) : showAdminLogin ? (
          <div className="container mx-auto px-4 pb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdminLogin(false)} 
              className="text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              رجوع للمعرض
            </Button>
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          </div>
        ) : (
          <>
            <TrainingGallery />
            <div className="flex justify-center pb-8 mt-8">
              <Button 
                variant="outline" 
                onClick={() => setShowAdminLogin(true)}
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                دخول المسؤول
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrainingGalleryPage;
