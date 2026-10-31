import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/consultor/LoginForm";
import { isConsultor } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Ingreso de consultores",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await isConsultor()) redirect("/consultor");
  return (
    <section className="wrap consultor-wrap">
      <LoginForm />
    </section>
  );
}
