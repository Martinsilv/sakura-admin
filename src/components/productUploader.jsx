import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDSJnfC29h8dKcPrfF3lEivDoRm1653aQk",
  authDomain: "sakura-f9829.firebaseapp.com",
  projectId: "sakura-f9829",
  storageBucket: "sakura-f9829.firebasestorage.app",
  messagingSenderId: "1086014402145",
  appId: "1:1086014402145:web:be38eba41007c2e6530420",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ProductUploader = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    image: "",
    price: "",
  });

  const [useImages, setUseImages] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([""]);

  const [inventoryType, setInventoryType] = useState("quantity");
  const [quantity, setQuantity] = useState("");
  const [variants, setVariants] = useState([{ name: "", quantity: "" }]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const categories = [
    "todos",
    "ramen",
    "dulces",
    "snacks",
    "refrescos",
    "bazar",
    "indumentaria",
    "peluches",
    "libreria",
    "deco",
  ];

  // Manejar cambios en el formulario principal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejar imágenes adicionales
  const addImageField = () => {
    setAdditionalImages((prev) => [...prev, ""]);
  };

  const removeImageField = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (index, value) => {
    setAdditionalImages((prev) =>
      prev.map((img, i) => (i === index ? value : img))
    );
  };

  // Manejar variantes
  const addVariantField = () => {
    setVariants((prev) => [...prev, { name: "", quantity: "" }]);
  };

  const removeVariantField = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      image: "",
      price: "",
    });
    setUseImages(false);
    setAdditionalImages([""]);
    setInventoryType("quantity");
    setQuantity("");
    setVariants([{ name: "", quantity: "" }]);
    setMessage({ type: "", text: "" });
  };

  // Mostrar mensaje
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (
        !formData.name.trim() ||
        !formData.category ||
        !formData.description.trim() ||
        !formData.image.trim()
      ) {
        throw new Error("Todos los campos obligatorios deben ser completados");
      }

      const price = parseFloat(formData.price);
      if (price <= 0 || isNaN(price)) {
        throw new Error("El precio debe ser mayor a 0");
      }

      // Crear objeto del producto
      const product = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        image: formData.image.trim(),
        price: price,
        timestamp: serverTimestamp(),
      };

      // Agregar imágenes adicionales si están habilitadas
      if (useImages) {
        const validImages = additionalImages.filter((img) => img.trim());
        if (validImages.length > 0) {
          product.images = validImages;
        }
      }

      // Manejar inventario
      if (inventoryType === "quantity") {
        const qty = parseInt(quantity);
        if (qty < 0 || isNaN(qty)) {
          throw new Error(
            "La cantidad debe ser un número válido y no negativo"
          );
        }
        product.quantity = qty;
      } else {
        // Construir variants object
        const variantsObj = {};
        let hasValidVariants = false;

        variants.forEach((variant) => {
          if (variant.name.trim() && variant.quantity.trim()) {
            const qty = parseInt(variant.quantity);
            if (!isNaN(qty) && qty >= 0) {
              variantsObj[variant.name.trim()] = qty;
              hasValidVariants = true;
            }
          }
        });

        if (!hasValidVariants) {
          throw new Error("Debes agregar al menos una variante válida");
        }

        product.variants = variantsObj;
      }

      // Subir a Firebase
      await addDoc(collection(db, "sakura-products"), product);

      showMessage("success", "¡Producto subido exitosamente!");
      setTimeout(resetForm, 2000);
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151b23]  to-[#1e1e2f] p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-pink-400 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">🌸 Sakura Market</h1>
          <p className="text-lg opacity-90">
            Panel de administración - Subir productos
          </p>
        </div>

        <div className="p-8">
          {/* Mensajes */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 border border-green-300 text-green-800"
                  : "bg-red-100 border border-red-300 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="mb-6 text-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Subiendo producto...</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors resize-none"
                placeholder="Describe el producto..."
              />
            </div>

            {/* Imagen principal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL de la Imagen Principal *
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            {/* Imágenes adicionales */}
            <div>
              <label className="flex items-center space-x-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useImages}
                  onChange={(e) => setUseImages(e.target.checked)}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm font-semibold text-gray-700">
                  ¿Agregar imágenes adicionales? (Opcional)
                </span>
              </label>

              {useImages && (
                <div className="space-y-3 pl-6 border-l-2 border-purple-200">
                  {additionalImages.map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) =>
                          handleImageChange(index, e.target.value)
                        }
                        placeholder="URL de imagen adicional"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImageField}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    + Agregar Imagen
                  </button>
                </div>
              )}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio * (en números, ej: 15.99)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
              />
            </div>

            {/* Tipo de inventario */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tipo de inventario:
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="quantity"
                    checked={inventoryType === "quantity"}
                    onChange={(e) => setInventoryType(e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span>Cantidad simple</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="variants"
                    checked={inventoryType === "variants"}
                    onChange={(e) => setInventoryType(e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span>Variantes del producto</span>
                </label>
              </div>
            </div>

            {/* Cantidad simple */}
            {inventoryType === "quantity" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad en Stock *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
                />
              </div>
            )}

            {/* Variantes */}
            {inventoryType === "variants" && (
              <div className="pl-6 border-l-2 border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Variantes del Producto
                </label>
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) =>
                          handleVariantChange(index, "name", e.target.value)
                        }
                        placeholder="Nombre (ej: talla_S, sabor_chocolate)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-0"
                      />
                      <input
                        type="number"
                        value={variant.quantity}
                        onChange={(e) =>
                          handleVariantChange(index, "quantity", e.target.value)
                        }
                        placeholder="Cantidad"
                        min="0"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantField(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addVariantField}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    + Agregar Variante
                  </button>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="space-y-3 pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Subiendo..." : "Subir Producto"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="w-full py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
              >
                Limpiar Formulario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductUploader;
