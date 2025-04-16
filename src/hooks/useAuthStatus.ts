import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<User>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("checkAuthStatus", user);
      setIsAuthenticated(!!user);
    };

    checkAuthStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      setUserInfo(session?.user);
      console.log(userInfo);
      console.log("user session usestatushook", session?.user);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { isAuthenticated, userInfo };
};
