import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteField,
} from "firebase/firestore";
import { Tag, Percent, Trash2, AlertCircle, X, Package } from "lucide-react";

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

const DiscountManager = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [affectedProducts, setAffectedProducts] = useState(0);
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);

  // Estados para el modal de productos
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

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
    "box",
    "skincare",
  ];

  const discountOptions = [5, 10, 15, 20, 25, 30, 40, 50];

  // Mostrar mensaje
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // Contar productos afectados
  const countAffectedProducts = async (category) => {
    try {
      const q = query(
        collection(db, "sakura-products"),
        where("category", "==", category)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error counting products:", error);
      return 0;
    }
  };

  // Actualizar contador cuando cambia la categoría
  useEffect(() => {
    if (selectedCategory) {
      countAffectedProducts(selectedCategory).then(setAffectedProducts);
    } else {
      setAffectedProducts(0);
    }
  }, [selectedCategory]);

  // Cargar descuentos activos al montar el componente
  useEffect(() => {
    loadActiveDiscounts();
  }, []);

  // Función para cargar descuentos activos
  const loadActiveDiscounts = async () => {
    setLoadingDiscounts(true);
    try {
      const snapshot = await getDocs(collection(db, "sakura-products"));
      const discountsByCategory = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.salePrice && data.price) {
          const category = data.category;
          const discountPercentage = Math.round(
            ((data.price - data.salePrice) / data.price) * 100
          );

          if (!discountsByCategory[category]) {
            discountsByCategory[category] = {
              count: 0,
              totalDiscount: 0,
            };
          }

          discountsByCategory[category].count++;
          discountsByCategory[category].totalDiscount += discountPercentage;
        }
      });

      // Convertir a array y calcular promedio
      const discountsArray = Object.keys(discountsByCategory).map((cat) => ({
        category: cat,
        productCount: discountsByCategory[cat].count,
        averageDiscount: Math.round(
          discountsByCategory[cat].totalDiscount /
            discountsByCategory[cat].count
        ),
      }));

      setActiveDiscounts(discountsArray);
    } catch (error) {
      console.error("Error loading active discounts:", error);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  // Función para quitar descuento de una categoría específica desde la lista
  const removeDiscountFromList = async (category) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar el descuento de la categoría "${category}"?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "sakura-products"),
        where("category", "==", category)
      );
      const snapshot = await getDocs(q);

      let updatedCount = 0;
      for (const docSnapshot of snapshot.docs) {
        await updateDoc(doc(db, "sakura-products", docSnapshot.id), {
          salePrice: deleteField(),
        });
        updatedCount++;
      }

      showMessage(
        "success",
        `✅ Descuento eliminado de ${updatedCount} productos de "${category}"`
      );

      // Recargar lista de descuentos activos
      await loadActiveDiscounts();
    } catch (error) {
      console.error("Error removing discount:", error);
      showMessage("error", `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el modal de productos de una categoría
  const openProductsModal = async (category) => {
    setLoadingProducts(true);
    setShowProductsModal(true);
    setSelectedProductIds([]);

    try {
      const q = query(
        collection(db, "sakura-products"),
        where("category", "==", category)
      );
      const snapshot = await getDocs(q);

      const productsWithDiscount = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.salePrice) {
          productsWithDiscount.push({
            id: doc.id,
            name: data.name,
            price: data.price,
            salePrice: data.salePrice,
          });
        }
      });

      setSelectedCategoryProducts(productsWithDiscount);
    } catch (error) {
      console.error("Error loading products:", error);
      showMessage("error", "Error al cargar productos");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Función para manejar selección de productos
  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Función para seleccionar/deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedProductIds.length === selectedCategoryProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(selectedCategoryProducts.map((p) => p.id));
    }
  };

  // Función para quitar descuento de productos seleccionados
  const removeDiscountFromSelected = async () => {
    if (selectedProductIds.length === 0) {
      showMessage("error", "Selecciona al menos un producto");
      return;
    }

    if (
      !window.confirm(
        `¿Estás seguro de eliminar el descuento de ${selectedProductIds.length} producto(s)?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      for (const productId of selectedProductIds) {
        await updateDoc(doc(db, "sakura-products", productId), {
          salePrice: deleteField(),
        });
      }

      showMessage(
        "success",
        `✅ Descuento eliminado de ${selectedProductIds.length} producto(s)`
      );

      // Recargar lista
      await loadActiveDiscounts();
      setShowProductsModal(false);
      setSelectedProductIds([]);
    } catch (error) {
      console.error("Error removing discount:", error);
      showMessage("error", `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  };

  // Aplicar descuento
  const applyDiscount = async () => {
    if (!selectedCategory || !discountPercentage) {
      showMessage(
        "error",
        "Selecciona una categoría y un porcentaje de descuento"
      );
      return;
    }

    setShowConfirmation(true);
    setConfirmAction("apply");
  };

  // Quitar descuento
  const removeDiscount = async () => {
    if (!selectedCategory) {
      showMessage("error", "Selecciona una categoría");
      return;
    }

    setShowConfirmation(true);
    setConfirmAction("remove");
  };

  // Confirmar acción
  const confirmActionHandler = async () => {
    setShowConfirmation(false);
    setLoading(true);

    try {
      const q = query(
        collection(db, "sakura-products"),
        where("category", "==", selectedCategory)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        showMessage("error", "No se encontraron productos en esta categoría");
        setLoading(false);
        return;
      }

      let updatedCount = 0;

      if (confirmAction === "apply") {
        // Aplicar descuento
        const discount = parseInt(discountPercentage);

        for (const docSnapshot of snapshot.docs) {
          const productData = docSnapshot.data();
          const originalPrice = productData.price;
          const calculatedPrice =
            originalPrice - (originalPrice * discount) / 100;

          // Redondear hacia arriba a la centena más cercana
          const roundedSalePrice = Math.ceil(calculatedPrice / 100) * 100;

          // Crear o actualizar salePrice como número
          await updateDoc(doc(db, "sakura-products", docSnapshot.id), {
            salePrice: Number(roundedSalePrice),
          });
          updatedCount++;
        }

        showMessage(
          "success",
          `✅ Descuento del ${discount}% aplicado a ${updatedCount} productos de la categoría "${selectedCategory}"`
        );
      } else if (confirmAction === "remove") {
        // Quitar descuento
        for (const docSnapshot of snapshot.docs) {
          await updateDoc(doc(db, "sakura-products", docSnapshot.id), {
            salePrice: deleteField(),
          });
          updatedCount++;
        }

        showMessage(
          "success",
          `✅ Descuento eliminado de ${updatedCount} productos de la categoría "${selectedCategory}"`
        );
      }

      // Resetear formulario
      setSelectedCategory("");
      setDiscountPercentage("");
      setAffectedProducts(0);

      // Recargar lista de descuentos activos
      await loadActiveDiscounts();
    } catch (error) {
      console.error("Error updating products:", error);
      showMessage("error", `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancelar confirmación
  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151b23] to-[#1e1e2f] p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Gestión de Descuentos
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Aplica o elimina descuentos por categoría de productos
          </p>

          {/* Mensaje de estado */}
          {message.text && (
            <div
              className={`mt-4 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                message.type === "success"
                  ? "bg-green-100 border border-green-300 text-green-800"
                  : "bg-red-100 border border-red-300 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Panel principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 relative">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl sm:rounded-2xl flex items-center justify-center z-[5]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600 font-medium px-4">
                  {confirmAction === "apply"
                    ? "Aplicando descuentos..."
                    : "Eliminando descuentos..."}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Selector de categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Selecciona la categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-pink-500 focus:ring-0 transition-colors text-sm sm:text-base"
              >
                <option value="">-- Elige una categoría --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>

              {/* Contador de productos */}
              {selectedCategory && affectedProducts > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-blue-50 px-3 sm:px-4 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>
                    Esta acción afectará a{" "}
                    <strong className="text-blue-700">
                      {affectedProducts} producto
                      {affectedProducts !== 1 ? "s" : ""}
                    </strong>{" "}
                    de la categoría "{selectedCategory}"
                  </span>
                </div>
              )}
            </div>

            {/* Selector de descuento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Porcentaje de descuento
              </label>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {discountOptions.map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setDiscountPercentage(percentage.toString())}
                    disabled={loading}
                    className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all ${
                      discountPercentage === percentage.toString()
                        ? "bg-pink-400 border border-pink-200 text-white shadow-lg scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>

            {/* Preview del descuento */}
            {selectedCategory && discountPercentage && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                    Vista previa del descuento
                  </h3>
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                  <p>
                    <strong>Categoría:</strong> {selectedCategory}
                  </p>
                  <p>
                    <strong>Descuento:</strong> {discountPercentage}%
                  </p>
                  <p>
                    <strong>Productos afectados:</strong> {affectedProducts}
                  </p>
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-pink-200">
                    <p className="text-xs text-gray-600">
                      Ejemplo: Un producto de $100 quedará en $
                      {(
                        100 -
                        (100 * parseInt(discountPercentage)) / 100
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
              <button
                onClick={applyDiscount}
                disabled={loading || !selectedCategory || !discountPercentage}
                className="flex-1 py-3 sm:py-4 bg-purple-500 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                Aplicar Descuento
              </button>

              <button
                onClick={removeDiscount}
                disabled={loading || !selectedCategory}
                className="flex-1 py-3 sm:py-4 bg-red-500 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Quitar Descuento
              </button>
            </div>

            {/* Información adicional */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Información importante:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      El descuento se aplica sobre el precio original del
                      producto
                    </li>
                    <li>
                      El nuevo precio se guarda en el campo "salePrice" de cada
                      producto
                    </li>
                    <li>
                      Al quitar el descuento, se elimina el campo "salePrice" de
                      los productos
                    </li>
                    <li>
                      Los cambios son permanentes hasta que decidas modificarlos
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de descuentos activos */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mt-4 sm:mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Descuentos Activos
            </h2>
          </div>

          {loadingDiscounts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Cargando descuentos...</p>
            </div>
          ) : activeDiscounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">
                No hay descuentos activos en este momento
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDiscounts.map((discount) => (
                <div
                  key={discount.category}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg sm:rounded-xl"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg capitalize">
                      {discount.category}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      <strong className="text-purple-600">
                        {discount.averageDiscount}% de descuento
                      </strong>{" "}
                      • {discount.productCount} producto
                      {discount.productCount !== 1 ? "s" : ""} con oferta
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => openProductsModal(discount.category)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <Package className="h-4 w-4" />
                      Ver Productos
                    </button>
                    <button
                      onClick={() => removeDiscountFromList(discount.category)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <Trash2 className="h-4 w-4" />
                      Quitar Descuento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de productos por categoría */}
      {showProductsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Productos con Descuento
              </h3>
              <button
                onClick={() => setShowProductsModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loadingProducts ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            ) : (
              <>
                {/* Seleccionar todos */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        selectedProductIds.length ===
                          selectedCategoryProducts.length &&
                        selectedCategoryProducts.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-gray-700">
                      Seleccionar todos ({selectedCategoryProducts.length})
                    </span>
                  </label>
                </div>

                {/* Lista de productos */}
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {selectedCategoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-5 h-5 text-blue-600 rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                          {product.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm">
                          <span className="text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-green-600 font-bold">
                            {formatPrice(product.salePrice)}
                          </span>
                          <span className="text-purple-600 font-semibold">
                            (
                            {Math.round(
                              ((product.price - product.salePrice) /
                                product.price) *
                                100
                            )}
                            % OFF)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={removeDiscountFromSelected}
                    disabled={selectedProductIds.length === 0 || loading}
                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Quitar Descuento ({selectedProductIds.length})
                  </button>
                  <button
                    onClick={() => setShowProductsModal(false)}
                    className="flex-1 py-3 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación - MEJORADO */}
      {showConfirmation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">
              {confirmAction === "apply"
                ? "¿Confirmar aplicación de descuento?"
                : "¿Confirmar eliminación de descuento?"}
            </h3>

            <div className="mb-4 sm:mb-6 space-y-2 text-sm sm:text-base text-gray-700">
              {confirmAction === "apply" ? (
                <>
                  <p>
                    Estás por aplicar un descuento del{" "}
                    <strong className="text-pink-600">
                      {discountPercentage}%
                    </strong>{" "}
                    a{" "}
                    <strong className="text-pink-600">
                      {affectedProducts} producto
                      {affectedProducts !== 1 ? "s" : ""}
                    </strong>{" "}
                    de la categoría{" "}
                    <strong className="text-pink-600">
                      "{selectedCategory}"
                    </strong>
                    .
                  </p>
                  <p className="text-xs sm:text-sm bg-yellow-50 border border-yellow-200 rounded p-2 sm:p-3 mt-3">
                    ⚠️ Esta acción calculará y agregará el campo "salePrice" a
                    cada producto de la categoría seleccionada.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Estás por eliminar el descuento de{" "}
                    <strong className="text-red-600">
                      {affectedProducts} producto
                      {affectedProducts !== 1 ? "s" : ""}
                    </strong>{" "}
                    de la categoría{" "}
                    <strong className="text-red-600">
                      "{selectedCategory}"
                    </strong>
                    .
                  </p>
                  <p className="text-xs sm:text-sm bg-yellow-50 border border-yellow-200 rounded p-2 sm:p-3 mt-3">
                    ⚠️ Esta acción eliminará el campo "salePrice" de cada
                    producto de la categoría seleccionada.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmActionHandler}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-colors shadow-lg ${
                  confirmAction === "apply"
                    ? "bg-pink-500 hover:bg-pink-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Sí, confirmar
              </button>
              <button
                onClick={cancelConfirmation}
                className="flex-1 py-3 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold text-base transition-colors shadow-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManager;
