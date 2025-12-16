import { useState } from "react";
import "./App.css";
import ProductUploader from "./components/productUploader";
import ProductManager from "./components/ProductManager";
import DiscountManager from "./components/DiscountManager";

function App() {
  const [currentView, setCurrentView] = useState("upload");
  return (
    <>
      <div>
        {/* Menú de navegación */}
        <nav className="bg-white shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
            <button
              onClick={() => setCurrentView("upload")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === "upload"
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              📤 Subir Productos
            </button>
            <button
              onClick={() => setCurrentView("manage")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === "manage"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              📦 Gestionar Inventario
            </button>
            <button
              onClick={() => setCurrentView("discount")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === "discount"
                  ? "bg-pink-500 text-white shadow-md"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              🏷️ Gestión de Descuentos
            </button>
          </div>
        </nav>

        {/* Contenido */}
        {currentView === "upload" && <ProductUploader />}
        {currentView === "manage" && <ProductManager />}
        {currentView === "discount" && <DiscountManager />}
      </div>
    </>
  );
}

export default App;
