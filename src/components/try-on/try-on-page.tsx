import React, { useState, useEffect } from "react";
import { ModelSelectionModal, DEFAULT_MODELS } from "./model-selection-modal";
import {
  GarmentSelector,
  GarmentSelectionModal,
  MultipleGarmentSelector,
  MultipleGarmentSelectionModal,
  GarmentItem,
  DEFAULT_GARMENTS,
} from "./garment-selector";
import { UserSelector } from "./user-selector";
import { AISizeCheckerModal, NoGarmentSelectedModal } from "./size-checker";
import { fetchAllCatalogProducts, normalizeCategory } from "@/services/outfit-api";
import apiClient, { generateTryOnImage } from "@/services/api";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { AddToCartModal, type AddToCartItem } from "@/components/cart/add-to-cart-modal";

const TryOnPage = () => {
  const { addToCart, openCart } = useShopifyCart();
  const [activeTab, setActiveTab] = useState<"model" | "photos">("model");
  const [selectedModel, setSelectedModel] = useState("Model 1");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGarmentModalOpen, setIsGarmentModalOpen] = useState(false);
  const [isSizeCheckerOpen, setIsSizeCheckerOpen] = useState(false);
  const [isNoGarmentModalOpen, setIsNoGarmentModalOpen] = useState(false);
  const [cartModalItems, setCartModalItems] = useState<AddToCartItem[] | null>(null);
  const [garmentMode, setGarmentMode] = useState<"single" | "multiple">(
    "single",
  );
  const [selectedGarments, setSelectedGarments] = useState<string[]>([]);
  const [garments, setGarments] = useState<GarmentItem[]>(DEFAULT_GARMENTS);
  const [isLoadingGarments, setIsLoadingGarments] = useState(true);

  // AI Try-On Generation State
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);
  const [tryOnResultImage, setTryOnResultImage] = useState<string | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);

  const models = DEFAULT_MODELS;

  const handleOpenSizeChecker = () => {
    if (selectedGarments.length === 0) {
      setIsNoGarmentModalOpen(true);
    } else {
      setIsSizeCheckerOpen(true);
    }
  };

  const handleAddToCartCanvas = () => {
    if (selectedGarments.length === 0) {
      setIsNoGarmentModalOpen(true);
      return;
    }

    const selectedItems = garments.filter((g) => selectedGarments.includes(g.name));
    const items: AddToCartItem[] = selectedItems.map((item) => ({
      handle: item.handle || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: item.name,
      image: item.image,
      price: item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : "",
      category: item.category,
    }));

    setCartModalItems(items);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const products = await fetchAllCatalogProducts();
        if (isMounted && products && products.length > 0) {
          const mapped: GarmentItem[] = products
            .map((p) => ({
              id: p.id,
              name: p.title,
              category: normalizeCategory(p.productType || "Apparel"),
              image: p.image || p.images?.[0] || "",
              price: p.price,
              handle: p.handle,
              images: p.images,
            }))
            .filter((g) => Boolean(g.image));

          if (mapped.length > 0) {
            setGarments(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch products from API:", err);
      } finally {
        if (isMounted) {
          setIsLoadingGarments(false);
        }
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "face" | "body",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (type === "face") {
      setFaceFile(file);
      setFaceImage(url);
    } else {
      setBodyFile(file);
      setBodyImage(url);
    }
    setTryOnResultImage(null);
    setTryOnError(null);
  };

  const handleRemovePhoto = (type: "face" | "body") => {
    if (type === "face") {
      setFaceFile(null);
      setFaceImage(null);
    } else {
      setBodyFile(null);
      setBodyImage(null);
    }
    setTryOnResultImage(null);
    setTryOnError(null);
  };

  const toggleGarment = (name: string) => {
    if (garmentMode === "single") {
      setSelectedGarments((current) =>
        current.includes(name) ? [] : [name]
      );
      return;
    }

    setSelectedGarments((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  };

  const clearSelectedGarments = () => {
    setSelectedGarments([]);
  };

  const handleTryOn = async () => {
    if (selectedGarments.length === 0) return;

    setIsGeneratingTryOn(true);
    setTryOnError(null);

    try {
      const selectedGarmentItems = garments.filter((g) =>
        selectedGarments.includes(g.name)
      );
      if (selectedGarmentItems.length === 0) {
        throw new Error("No garments selected");
      }

      let personSource: File | string;
      if (activeTab === "photos" && (bodyFile || bodyImage)) {
        personSource = bodyFile || bodyImage!;
      } else {
        const selectedModelObj = models.find((m) => m.name === selectedModel);
        if (!selectedModelObj?.image) {
          throw new Error("Please select a model or upload a photo");
        }
        personSource = selectedModelObj.image;
      }

      const faceSource =
        activeTab === "photos" && (faceFile || faceImage)
          ? faceFile || faceImage
          : null;

      const topGarment = selectedGarmentItems[0];
      const bottomGarment =
        garmentMode === "multiple" && selectedGarmentItems.length > 1
          ? selectedGarmentItems[1]
          : null;

      const resultUrl = await generateTryOnImage({
        personImage: personSource,
        faceImage: faceSource,
        garmentImage: topGarment.image,
        bottomGarmentImage: bottomGarment?.image || null,
      });

      setTryOnResultImage(resultUrl);
    } catch (err) {
      console.error("Virtual Try-On error:", err);
      setTryOnError(
        err instanceof Error
          ? err.message
          : "Virtual try-on generation failed. Please try again."
      );
    } finally {
      setIsGeneratingTryOn(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 flex flex-col items-center">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center w-full gap-7 lg:gap-8">
        {/* left panel try on uploader */}
        <UserSelector
          activeTab={activeTab}
          selectedModel={selectedModel}
          faceImage={faceImage}
          bodyImage={bodyImage}
          models={models}
          onOpenModal={() => setIsModalOpen(true)}
          onOpenGarmentModal={() => setIsGarmentModalOpen(true)}
          onOpenSizeChecker={handleOpenSizeChecker}
          onAddToCart={handleAddToCartCanvas}
          selectedGarmentsCount={selectedGarments.length}
          onTryOn={handleTryOn}
          isGenerating={isGeneratingTryOn}
          tryOnResultImage={tryOnResultImage}
          tryOnError={tryOnError}
          onClearResult={() => {
            setTryOnResultImage(null);
            setTryOnError(null);
          }}
        />

        {/* right panel garment selector */}
        {garmentMode === "multiple" ? (
          <MultipleGarmentSelector
            garments={garments}
            garmentMode={garmentMode}
            onGarmentModeChange={setGarmentMode}
            selectedGarments={selectedGarments}
            onToggleGarment={toggleGarment}
            onClearSelection={clearSelectedGarments}
            isLoading={isLoadingGarments}
          />
        ) : (
          <GarmentSelector
            garments={garments}
            garmentMode={garmentMode}
            onGarmentModeChange={setGarmentMode}
            selectedGarments={selectedGarments}
            onToggleGarment={toggleGarment}
            onClearSelection={clearSelectedGarments}
            isLoading={isLoadingGarments}
          />
        )}
      </div>

      {/* Model Selection Modal */}
      <ModelSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setTryOnResultImage(null);
          setTryOnError(null);
        }}
        selectedModel={selectedModel}
        onSelectModel={(modelName) => {
          setSelectedModel(modelName);
          setTryOnResultImage(null);
          setTryOnError(null);
        }}
        faceImage={faceImage}
        bodyImage={bodyImage}
        onFileChange={handleFile}
        onRemovePhoto={handleRemovePhoto}
        models={models}
      />

      {/* Garment Selection Modal (Mobile) */}
      {garmentMode === "multiple" ? (
        <MultipleGarmentSelectionModal
          isOpen={isGarmentModalOpen}
          onClose={() => setIsGarmentModalOpen(false)}
          garments={garments}
          garmentMode={garmentMode}
          onGarmentModeChange={setGarmentMode}
          selectedGarments={selectedGarments}
          onToggleGarment={toggleGarment}
          onClearSelection={clearSelectedGarments}
          isLoading={isLoadingGarments}
        />
      ) : (
        <GarmentSelectionModal
          isOpen={isGarmentModalOpen}
          onClose={() => setIsGarmentModalOpen(false)}
          garments={garments}
          garmentMode={garmentMode}
          onGarmentModeChange={setGarmentMode}
          selectedGarments={selectedGarments}
          onToggleGarment={toggleGarment}
          isLoading={isLoadingGarments}
        />
      )}

      {/* AI Size Checker Modal */}
      <AISizeCheckerModal
        isOpen={isSizeCheckerOpen}
        onClose={() => setIsSizeCheckerOpen(false)}
        selectedGarments={garments.filter((g) =>
          selectedGarments.includes(g.name)
        )}
      />

      {/* Alert modal when trying to check size without selecting a garment */}
      <NoGarmentSelectedModal
        isOpen={isNoGarmentModalOpen}
        onClose={() => setIsNoGarmentModalOpen(false)}
        onSelectGarmentsNow={() => setIsGarmentModalOpen(true)}
      />

      {/* Add To Cart Size Selector Modal (Supports Single & Multiple Garments) */}
      {cartModalItems && (
        <AddToCartModal
          items={cartModalItems}
          onClose={() => setCartModalItems(null)}
        />
      )}
    </div>
  );
};

export default TryOnPage;
