import { redirect } from "next/navigation";

// Root route ( / ) — just redirects to /login for now.
// Later this becomes: if token exists → /dashboard, else → /login
export default function Home() {
  redirect("/login");
}
