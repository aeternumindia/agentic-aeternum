"use client";

import { useState, useCallback } from "react";
import type { TryOnFlowStep } from "@/types/outfit";
import { useOutfitBuilder } from "@/contexts/outfit-builder";
import { StepCategorySelect } from "./step-category-select";
import { StepProductBrowser } from "./step-product-browser";
import { OutfitCard } from "./outfit-card";
import { StepPhotoUpload } from "./step-photo-upload";
import { StepTryOnPreview } from "./step-try-on-preview";

export function TryOnFlow() {
  const [step, setStep] = useState<TryOnFlowStep>("category_select");
  const [category, setCategory] = useState<"top" | "bottom" | null>(null);
  const [fullBodyFile, setFullBodyFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const { hasTop, hasBottom, reset } = useOutfitBuilder();

  const goTo = useCallback((s: TryOnFlowStep) => setStep(s), []);

  const handleCategoryPick = useCallback(
    (choice: "top" | "bottom") => {
      setCategory(choice);
      if (choice === "top") goTo("product_browser_top");
      else goTo("product_browser_bottom");
    },
    [goTo]
  );

  const handleProductSelected = useCallback(
    (pickedCategory: "top" | "bottom") => {
      if (pickedCategory === "top" && !hasBottom) {
        setCategory("bottom");
        goTo("product_browser_bottom");
      } else if (pickedCategory === "bottom" && !hasTop) {
        setCategory("top");
        goTo("product_browser_top");
      } else {
        goTo("outfit_review");
      }
    },
    [hasTop, hasBottom, goTo]
  );

  const handlePhotosComplete = useCallback(
    (photos: { fullBody: File; selfie: File }) => {
      setFullBodyFile(photos.fullBody);
      setSelfieFile(photos.selfie);
      goTo("try_on_preview");
    },
    [goTo]
  );

  const handleStartOver = useCallback(() => {
    reset();
    setFullBodyFile(null);
    setSelfieFile(null);
    setCategory(null);
    goTo("category_select");
  }, [reset, goTo]);

  const handleBack = useCallback(() => {
    switch (step) {
      case "product_browser_top":
        goTo("category_select");
        break;
      case "product_browser_bottom":
        goTo(hasTop ? "outfit_review" : "category_select");
        break;
      case "outfit_review":
        if (hasBottom) goTo("product_browser_bottom");
        else if (hasTop) goTo("product_browser_top");
        else goTo("category_select");
        break;
      case "photo_upload":
        goTo("outfit_review");
        break;
      case "try_on_preview":
        goTo("photo_upload");
        break;
      default:
        goTo("category_select");
    }
  }, [step, hasTop, hasBottom, goTo]);

  const handleChangeTop = useCallback(() => {
    setCategory("top");
    goTo("product_browser_top");
  }, [goTo]);

  const handleChangeBottom = useCallback(() => {
    setCategory("bottom");
    goTo("product_browser_bottom");
  }, [goTo]);

  switch (step) {
    case "category_select":
      return (
        <StepCategorySelect
          onSelect={handleCategoryPick}
          hasTop={hasTop}
          hasBottom={hasBottom}
        />
      );

    case "product_browser_top":
    case "product_browser_bottom":
      return (
        <StepProductBrowser
          key={category ?? "top"}
          category={category ?? "top"}
          onSelect={handleProductSelected}
          onBack={handleBack}
        />
      );

    case "outfit_review":
      return (
        <OutfitCard
          onContinue={() => goTo("photo_upload")}
          onBack={handleBack}
          onChangeTop={handleChangeTop}
          onChangeBottom={handleChangeBottom}
        />
      );

    case "photo_upload":
      return (
        <StepPhotoUpload
          onComplete={handlePhotosComplete}
          onBack={handleBack}
        />
      );

    case "try_on_preview":
      return fullBodyFile && selfieFile ? (
        <StepTryOnPreview
          fullBodyFile={fullBodyFile}
          selfieFile={selfieFile}
          onStartOver={handleStartOver}
          onBack={handleBack}
        />
      ) : (
        <StepPhotoUpload
          onComplete={handlePhotosComplete}
          onBack={handleBack}
        />
      );

    default:
      return (
        <StepCategorySelect
          onSelect={handleCategoryPick}
          hasTop={hasTop}
          hasBottom={hasBottom}
        />
      );
  }
}
