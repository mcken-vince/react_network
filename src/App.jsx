import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
