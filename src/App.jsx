import { useState } from "react";
import "./App.css";
import ProductUploader from "./components/productUploader";
import ProductManager from "./components/ProductManager";

function App() {
  const [currentView, setCurrentView] = useState("upload");
  return (
    <>
      <div>
        {/* Menú de navegación */}
        <nav className="bg-white shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex gap-4">
            <button
              onClick={() => setCurrentView("upload")}
              className={`px-4 py-2 rounded-lg ${
                currentView === "upload"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              📤 Subir Productos
            </button>
            <button
              onClick={() => setCurrentView("manage")}
              className={`px-4 py-2 rounded-lg ${
                currentView === "manage"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              📦 Gestionar Inventario
            </button>
          </div>
        </nav>

        {/* Contenido */}
        {currentView === "upload" && <ProductUploader />}
        {currentView === "manage" && <ProductManager />}
      </div>
    </>
  );
}

export default App;
