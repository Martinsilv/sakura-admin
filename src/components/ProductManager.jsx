import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  Search,
  Edit,
  Trash2,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [message, setMessage] = useState({ type: "", text: "" });

  // Estados para modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalData, setModalData] = useState({});

  // Estados para modal de imagen
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  // Cargar productos desde Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "sakura-products"),
      (snapshot) => {
        const productsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsList);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtrar y ordenar productos
  useEffect(() => {
    let filtered = products.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy, sortOrder]);

  // Mostrar mensaje
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // Abrir modal para editar stock
  const openEditModal = (product) => {
    setEditingProduct(product);
    if (product.variants) {
      setModalData({ variants: { ...product.variants } });
    } else {
      setModalData({ quantity: product.quantity || 0 });
    }
    setIsModalOpen(true);
  };

  // Guardar cambios de stock
  const saveStockChanges = async () => {
    if (!editingProduct) return;

    try {
      const productRef = doc(db, "sakura-products", editingProduct.id);
      await updateDoc(productRef, modalData);

      showMessage("success", "Stock actualizado correctamente");
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating stock:", error);
      showMessage("error", "Error al actualizar el stock");
    }
  };

  // Eliminar producto
  const deleteProduct = async (productId, productName) => {
    if (window.confirm(`¿Estás seguro de eliminar "${productName}"?`)) {
      try {
        await deleteDoc(doc(db, "sakura-products", productId));
        showMessage("success", "Producto eliminado correctamente");
      } catch (error) {
        console.error("Error deleting product:", error);
        showMessage("error", "Error al eliminar el producto");
      }
    }
  };

  // Abrir galería de imágenes
  const openImageModal = (product) => {
    const allImages = [product.image, ...(product.images || [])].filter(
      Boolean
    );
    setImageModal({ isOpen: true, images: allImages, currentIndex: 0 });
  };

  // Cerrar galería de imágenes
  const closeImageModal = () => {
    setImageModal({ isOpen: false, images: [], currentIndex: 0 });
  };

  // Navegar en galería
  const navigateImage = (direction) => {
    setImageModal((prev) => ({
      ...prev,
      currentIndex:
        direction === "next"
          ? (prev.currentIndex + 1) % prev.images.length
          : prev.currentIndex === 0
          ? prev.images.length - 1
          : prev.currentIndex - 1,
    }));
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  };

  // Calcular stock total
  const getTotalStock = (product) => {
    if (product.variants) {
      return Object.values(product.variants).reduce(
        (total, qty) => total + qty,
        0
      );
    }
    return product.quantity || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151b23]  to-[#1e1e2f] p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            📦 Gestión de Inventario
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Administra el stock y productos de Sakura Store
          </p>

          {/* Mensaje de estado */}
          {message.text && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 border border-green-300 text-green-800"
                  : "bg-red-100 border border-red-300 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Controles de ordenamiento */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="name">Nombre</option>
                  <option value="category">Categoría</option>
                  <option value="price">Precio</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              {/* Contador de productos */}
              <div className="text-sm text-gray-600">
                {filteredProducts.length} productos encontrados
              </div>
            </div>
          </div>
        </div>

        {/* Vista responsiva de productos */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Vista de tabla para desktop */}
          <div className="hidden lg:block">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-20 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="w-1/3 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="w-24 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="w-24 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="w-24 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="w-24 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    {/* Imagen */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openImageModal(product)}
                        className="relative group"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                        />
                        {product.images && product.images.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            +{product.images.length}
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Producto info */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {product.description}
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {product.category}
                      </span>
                    </td>

                    {/* Precio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {product.variants ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              Total: {getTotalStock(product)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Object.keys(product.variants).length} variantes
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium text-gray-900">
                            {product.quantity || 0} unidades
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar stock"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            deleteProduct(product.id, product.name)
                          }
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas para móvil y tablet */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex gap-4">
                  {/* Imagen del producto */}
                  <button
                    onClick={() => openImageModal(product)}
                    className="relative group flex-shrink-0"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                    />
                    {product.images && product.images.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        +{product.images.length}
                      </span>
                    )}
                  </button>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate pr-2">
                        {product.name}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar stock"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            deleteProduct(product.id, product.name)
                          }
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {product.description}
                    </p>

                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {product.category}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <div className="mt-2 text-sm">
                      {product.variants ? (
                        <div>
                          <span className="font-medium text-gray-900">
                            Stock total: {getTotalStock(product)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({Object.keys(product.variants).length} variantes)
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">
                          Stock: {product.quantity || 0} unidades
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No se encontraron productos
              </p>
              <p className="text-gray-400 text-sm">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Modal para editar stock */}
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
                Editar Stock
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {editingProduct.name}
              </p>

              {editingProduct.variants ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm sm:text-base">
                    Variantes:
                  </h4>
                  {Object.keys(editingProduct.variants).map((variant) => (
                    <div
                      key={variant}
                      className="flex justify-between items-center gap-3"
                    >
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {variant}:
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={modalData.variants?.[variant] || 0}
                        onChange={(e) =>
                          setModalData((prev) => ({
                            ...prev,
                            variants: {
                              ...prev.variants,
                              [variant]: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cantidad:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalData.quantity || 0}
                    onChange={(e) =>
                      setModalData({ quantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={saveStockChanges}
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para galería de imágenes */}
        {imageModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Botón de cerrar mejorado */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Imagen */}
              <img
                src={imageModal.images[imageModal.currentIndex]}
                alt="Producto"
                className="max-w-full max-h-full object-contain"
              />

              {/* Controles de navegación */}
              {imageModal.images.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage("prev")}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => navigateImage("next")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  {/* Indicador de posición */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {imageModal.currentIndex + 1} / {imageModal.images.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;
