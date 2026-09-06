import React, { useState, useEffect } from "react";
import { ModelSelectionModal, DEFAULT_MODELS } from "./model-selection-modal";
import { GarmentSelector, GarmentSelectionModal, GarmentItem, DEFAULT_GARMENTS } from "./garment-selector";
import { UserSelector } from "./user-selector";
import { fetchAllCatalogProducts, normalizeCategory } from "@/services/outfit-api";
import { generateTryOnImage } from "@/services/api";

const TryOnPage = () => {
  const [activeTab, setActiveTab] = useState<"model" | "photos">("model");
  const [selectedModel, setSelectedModel] = useState("Model 1");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGarmentModalOpen, setIsGarmentModalOpen] = useState(false);
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
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: "28px",
          width: "100%",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
        className="flex-col md:flex-row w-full gap-7 lg:gap-8"
      >
        {/* left panel try on uploader */}
        <UserSelector
          activeTab={activeTab}
          selectedModel={selectedModel}
          faceImage={faceImage}
          bodyImage={bodyImage}
          models={models}
          onOpenModal={() => setIsModalOpen(true)}
          onOpenGarmentModal={() => setIsGarmentModalOpen(true)}
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
        <GarmentSelector
          garments={garments}
          garmentMode={garmentMode}
          onGarmentModeChange={setGarmentMode}
          selectedGarments={selectedGarments}
          onToggleGarment={toggleGarment}
          onClearSelection={clearSelectedGarments}
          isLoading={isLoadingGarments}
        />
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
    </div>
  );
};

export default TryOnPage;
