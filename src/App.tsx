import { AppRoutes } from "@/routes";
import { useSessionBootstrap } from "@/hooks/useSessionBootstrap";

export default function App() {
  useSessionBootstrap();
  return <AppRoutes />;
}
