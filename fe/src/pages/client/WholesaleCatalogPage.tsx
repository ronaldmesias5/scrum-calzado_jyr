import { useEffect, useState } from "react";
import { Loader2, Store } from "lucide-react";
import Pagination from "@/components/atoms/Pagination";
import { useAuth } from "@/hooks/useAuth";
import OrderFormModal from "@/features/admin/components/organisms/OrderFormModal";
import { WholesaleProductCard } from "@/features/client/components/molecules/WholesaleProductCard";
import { WholesaleCatalogFilters } from "@/features/client/components/molecules/WholesaleCatalogFilters";
import {
  getWholesaleProducts,
  getWholesaleCategories,
  getWholesaleBrands,
  getWholesaleStyles,
  getWholesaleColors,
  type WholesaleProduct,
  type Category,
  type Brand,
  type Style,
  type WholesaleCatalogFilters as Filters,
} from "@/services/wholesaleCatalogApi";

const PAGE_SIZE = 12;

export default function WholesaleCatalogPage() {
  const { user } = useAuth();
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStyles = selectedBrand
    ? styles.filter((s) => s.brand_id === selectedBrand)
    : styles;

  useEffect(() => {
    loadCatalogData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    selectedCategory,
    selectedBrand,
    selectedStyle,
    selectedColor,
    searchTerm,
  ]);

  useEffect(() => {
    if (selectedStyle) {
      const isValid = filteredStyles.some((s) => s.id === selectedStyle);
      if (!isValid) setSelectedStyle("");
    }
  }, [selectedBrand, filteredStyles, selectedStyle]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategory,
    selectedBrand,
    selectedStyle,
    selectedColor,
    searchTerm,
    page,
  ]);

  const loadCatalogData = async () => {
    try {
      setLoading(true);
      const [categoriesData, brandsData, stylesData, colorsData] =
        await Promise.all([
          getWholesaleCategories(),
          getWholesaleBrands(),
          getWholesaleStyles(),
          getWholesaleColors(),
        ]);
      setCategories(categoriesData);
      setBrands(brandsData);
      setStyles(stylesData);
      setColors(colorsData);
      await loadProducts();
      setError(null);
    } catch (err) {
      console.error("Error cargando datos del catálogo:", err);
      setError("No se pudieron cargar los datos del catálogo");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const filters: Filters = {
        category_id: selectedCategory || undefined,
        brand_id: selectedBrand || undefined,
        style_id: selectedStyle || undefined,
        color: selectedColor || undefined,
        search: searchTerm || undefined,
      };
      const data = await getWholesaleProducts(filters, page, PAGE_SIZE);
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error("Error cargando productos:", err);
      setError("No se pudieron cargar los productos");
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedStyle("");
    setSelectedColor("");
    setSearchTerm("");
  };

  const isFiltering =
    !!selectedCategory ||
    !!selectedBrand ||
    !!selectedStyle ||
    !!selectedColor ||
    !!searchTerm;

  const handleOrderClick = () => {
    setOrderModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors">
            <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Catálogo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Explora los modelos disponibles con precios al por mayor.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Cargando catálogo...
          </p>
        </div>
      ) : (
        <>
          <WholesaleCatalogFilters
            categories={categories}
            brands={brands}
            styles={filteredStyles}
            colors={colors}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            selectedStyle={selectedStyle}
            selectedColor={selectedColor}
            searchTerm={searchTerm}
            onCategoryChange={setSelectedCategory}
            onBrandChange={setSelectedBrand}
            onStyleChange={setSelectedStyle}
            onColorChange={setSelectedColor}
            onSearchChange={setSearchTerm}
            onClear={handleClearFilters}
            isFiltering={isFiltering}
          />

          {products.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                No se encontraron productos que coincidan con los criterios
                seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {total}{" "}
                  {total === 1 ? "modelo encontrado" : "modelos encontrados"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {products.map((product) => (
                  <WholesaleProductCard
                    key={product.id}
                    product={product}
                    onOrderClick={handleOrderClick}
                  />
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      <OrderFormModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSuccess={() => {
          setOrderModalOpen(false);
          window.dispatchEvent(new Event("orders-updated"));
        }}
        fixedCustomerId={user?.id ?? null}
      />
    </div>
  );
}
