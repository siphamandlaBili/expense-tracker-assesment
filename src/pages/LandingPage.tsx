import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { SignInDialog } from "../components/auth/SignInDialog";
import type { SignInValues } from "../components/auth/signInSchema";
import { Features } from "../components/landing/Features";
import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";

export function LandingPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const [signInOpen, setSignInOpen] = useState(false);
  const closeSignIn = useCallback(() => setSignInOpen(false), []);

  // Already signed in: skip the form and go straight to the dashboard.
  const openSignIn = useCallback(() => {
    if (session) navigate("/dashboard");
    else setSignInOpen(true);
  }, [session, navigate]);

  const handleSignIn = async (values: SignInValues) => {
    await signIn(values);
    navigate("/dashboard");
  };

  return (
    <>
      <Header onSignIn={openSignIn} />
      <main>
        <Hero onSignIn={openSignIn} />
        <Features />
      </main>
      <SignInDialog
        open={signInOpen}
        onClose={closeSignIn}
        onSubmit={handleSignIn}
      />
    </>
  );
}
