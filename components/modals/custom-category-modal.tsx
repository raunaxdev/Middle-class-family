"use client";

import React, { useState } from "react";
import { useLedger } from "@/lib/context/ledger-context";
import { X, FolderPlus, Wrench, Dog, Sparkles, Car, Shield, Gift, Coffee, Palette } from "lucide-react";
import { toast } from "sonner";

interface CustomCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ICONS = [
  { name: "Wrench", icon: Wrench, label: "Repairs & Maintenance" },
  { name: "Car", icon: Car, label: "Vehicle & Fuel" },
  { name: "Dog", icon: Dog, label: "Pet Care" },
  { name: "Gift", icon: Gift, label: "Festivals & Gifts" },
  { name: "Coffee", icon: Coffee, label: "Dining & Snacks" },
  { name: "Shield", icon: Shield, label: "Insurance & Security" },
  { name: "Palette", icon: Palette, label: "Hobbies & Leisure" },
  { name: "Sparkles", icon: Sparkles, label: "Puja & Ceremonies" },
];

export function CustomCategoryModal({ isOpen, onClose }: CustomCategoryModalProps) {
  const { addCustomCategory } = useLedger();

  const [name, setName] = useState("");
  const [hindiName, setHindiName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("3000");
  const [selectedIcon, setSelectedIcon] = useState("Wrench");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const budgetNum = parseFloat(budget) || 0;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    addCustomCategory({
      slug,
      name: name.trim(),
      hindi_name: hindiName.trim() || name.trim(),
      description: description.trim() || "Custom household ledger module",
      icon_name: selectedIcon,
      monthly_budget: budgetNum,
    });

    setName("");
    setHindiName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-slate-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <FolderPlus className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-text">Add Custom Household Category</h2>
              <p className="text-xs text-slate-muted">Create a personalized tracking ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-muted hover:bg-slate-card hover:text-slate-text"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Category Title (English) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Home Renovation, Pet Care, Puja & Festival"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Category Title (Hindi / Hinglish)
            </label>
            <input
              type="text"
              placeholder="e.g. घर की मरम्मत, पालतू पशु, पूजा खर्च"
              value={hindiName}
              onChange={(e) => setHindiName(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Monthly Budget (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-muted">₹</span>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-md border border-slate-border bg-surface pl-7 pr-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-text mb-2">
              Select Category Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary-light text-primary font-semibold"
                        : "border-slate-border bg-surface text-slate-muted hover:bg-slate-card"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" strokeWidth={1.75} />
                    <span className="text-[10px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-text mb-1">
              Short Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Plumbing, paint repairs and carpenter work"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-border bg-surface px-3 py-2 text-sm text-slate-text focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-border text-slate-text hover:bg-slate-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
