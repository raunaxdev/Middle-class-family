"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  AuthUser,
  CategoryMeta,
  CategorySlug,
  ChatMessage,
  Family,
  FamilyMember,
  ItemStatus,
  LedgerItem,
  UdhaarRepayment,
} from "@/types";
import { DEFAULT_SYSTEM_CATEGORIES, BLANK_HOUSEHOLD_TEMPLATES } from "@/lib/storage/templates";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  generateFamilyCode,
  getLocalDateString,
  isValidFamilyCode,
  sumMoney,
  toMoney,
} from "@/lib/utils";
import { toast } from "sonner";

interface LedgerContextType {
  // Auth state
  user: AuthUser | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;

  // Family state
  family: Family | null;
  currentMember: FamilyMember | null;
  categories: CategoryMeta[];
  items: LedgerItem[];
  chatMessages: ChatMessage[];
  isLoaded: boolean;
  isCloudSynced: boolean;

  // Onboarding actions
  createFamily: (name: string, monthlyBudget: number, headName: string) => Promise<Family>;
  joinFamily: (joinCode: string, memberName: string) => Promise<Family>;
  updateMonthlyBudget: (budget: number) => Promise<void>;

  // Ledger item actions
  addItem: (item: Omit<LedgerItem, "id" | "created_at" | "updated_at">) => LedgerItem;
  updateItem: (id: string, updates: Partial<LedgerItem>) => void;
  deleteItem: (id: string) => void;
  toggleItemStatus: (id: string) => void;

  // Template loader
  loadBlankTemplate: (categorySlug: string) => void;

  // Specialized modules
  updateMilkDays: (id: string, daysTaken: number) => void;
  addUdhaarRepayment: (itemId: string, repayment: Omit<UdhaarRepayment, "id" | "recorded_by">) => void;
  addCustomCategory: (category: Omit<CategoryMeta, "is_system">) => void;

  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChatHistory: () => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

const STORAGE_KEYS = {
  AUTH_USER: "griha_auth_user_v2",
  FAMILY: "griha_family_v2",
  ITEMS: "griha_ledger_items_v2",
  CATEGORIES: "griha_categories_v2",
  CHAT: "griha_chat_messages_v2",
};

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [categories, setCategories] = useState<CategoryMeta[]>(DEFAULT_SYSTEM_CATEGORIES);
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // 1. Initialize Auth State
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Family Member",
            });
          } else {
            // Check fallback local session
            const localUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
            if (localUser) setUser(JSON.parse(localUser));
          }

          // Listen to auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const u: AuthUser = {
                id: session.user.id,
                email: session.user.email || "",
                name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Family Member",
              };
              setUser(u);
              localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(u));
            } else {
              setUser(null);
              localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            }
          });

          return () => subscription.unsubscribe();
        } else {
          // Fallback offline session
          const localUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
          if (localUser) {
            setUser(JSON.parse(localUser));
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setAuthLoading(false);
      }
    }

    initAuth();
  }, []);

  // 2. Load Family Data for authenticated user
  const loadFamilyData = useCallback(async (activeUser: AuthUser) => {
    try {
      if (isSupabaseConfigured && supabase) {
        // Query user's family membership
        const { data: membership, error: memError } = await supabase
          .from("family_members")
          .select("family_id, role, name, relation, avatar_color")
          .eq("user_id", activeUser.id)
          .maybeSingle();

        if (membership?.family_id) {
          // Fetch family details
          const { data: famData } = await supabase
            .from("families")
            .select("*")
            .eq("id", membership.family_id)
            .single();

          // Fetch all family members
          const { data: allMembers } = await supabase
            .from("family_members")
            .select("*")
            .eq("family_id", membership.family_id);

          // Fetch categories
          const { data: famCategories } = await supabase
            .from("categories")
            .select("*")
            .eq("family_id", membership.family_id);

          // Fetch ledger items
          const { data: famItems } = await supabase
            .from("ledger_items")
            .select("*")
            .eq("family_id", membership.family_id)
            .order("created_at", { ascending: false });

          if (famData) {
            const assembledFamily: Family = {
              id: famData.id,
              name: famData.name,
              join_code: famData.join_code,
              monthly_budget: Number.isFinite(Number(famData.monthly_budget))
                ? Number(famData.monthly_budget)
                : 45000,
              currency: "INR",
              created_by: famData.created_by,
              created_at: famData.created_at,
              members: allMembers || [],
            };
            setFamily(assembledFamily);
            localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(assembledFamily));

            if (famCategories && famCategories.length > 0) {
              setCategories(famCategories);
            } else {
              setCategories(DEFAULT_SYSTEM_CATEGORIES);
            }
            setItems(famItems || []);
            setIsCloudSynced(true);
            return;
          }
        }
      }

      // Check localStorage for user-created family
      const storedFamily = localStorage.getItem(STORAGE_KEYS.FAMILY);
      const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

      if (storedFamily) {
        const parsedFam = JSON.parse(storedFamily);
        const isMember = Array.isArray(parsedFam?.members) && parsedFam.members.some(
          (member: FamilyMember) => member.user_id === activeUser.id
        );
        if (isMember) {
          setFamily(parsedFam);
          if (storedCategories) setCategories(JSON.parse(storedCategories));
          if (storedItems) setItems(JSON.parse(storedItems));
        } else {
          setFamily(null);
          setCategories(DEFAULT_SYSTEM_CATEGORIES);
          setItems([]);
        }
      } else {
        // Fresh start: No family linked yet
        setFamily(null);
        setCategories(DEFAULT_SYSTEM_CATEGORIES);
        setItems([]);
      }
    } catch {
      // Continue with clean state
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFamilyData(user);
    } else {
      setFamily(null);
      setItems([]);
      setIsLoaded(true);
    }
  }, [user, loadFamilyData]);

  // 3. Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !family?.id) return;

    const channel = supabase
      .channel(`family_sync_${family.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_items",
          filter: `family_id=eq.${family.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as LedgerItem;
            setItems((prev) => (prev.some((i) => i.id === newItem.id) ? prev : [newItem, ...prev]));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as LedgerItem;
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          } else if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id: string }).id;
            setItems((prev) => prev.filter((i) => i.id !== oldId));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "family_members",
          filter: `family_id=eq.${family.id}`,
        },
        async () => {
          // Re-fetch family members
          const { data: members } = await supabase!
            .from("family_members")
            .select("*")
            .eq("family_id", family.id);
          if (members) {
            setFamily((prev) => (prev ? { ...prev, members } : null));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `family_id=eq.${family.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newCat = payload.new as CategoryMeta;
            setCategories((prev) => (prev.some((c) => c.slug === newCat.slug) ? prev : [...prev, newCat]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [family?.id]);

  // 4. Persistence to localStorage
  useEffect(() => {
    if (!isLoaded || !user) return;
    try {
      if (family) {
        localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(family));
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      }
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
    } catch {
      // storage quota handled
    }
  }, [family, items, categories, chatMessages, isLoaded, user]);

  // Determine current active member in family
  const currentMember = useMemo<FamilyMember | null>(() => {
    if (!family || !user) return null;
    const found = family.members.find((m) => m.user_id === user.id);
    if (found) return found;

    // Fallback based on name or first member
    return (
      family.members[0] || {
        id: "mem-" + user.id,
        family_id: family.id,
        user_id: user.id,
        name: user.name || "Family Member",
        role: "Member",
        avatar_color: "#047857",
        relation: "Self",
      }
    );
  }, [family, user]);

  // 5. Auth Handlers
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split("@")[0],
          };
          setUser(authUser);
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser));
        }
        return {};
      } else {
        // Fallback local authentication
        const authUser: AuthUser = {
          id: "usr-" + Math.random().toString(36).substring(2, 9),
          email,
          name: email.split("@")[0],
        };
        setUser(authUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser));
        return {};
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      return { error: msg };
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<{ error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) return { error: error.message };
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: name || email.split("@")[0],
          };
          setUser(authUser);
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser));
        }
        return {};
      } else {
        // Fallback local sign up
        const authUser: AuthUser = {
          id: "usr-" + Math.random().toString(36).substring(2, 9),
          email,
          name: name || email.split("@")[0],
        };
        setUser(authUser);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser));
        return {};
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      return { error: msg };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setFamily(null);
    setItems([]);
    setCategories(DEFAULT_SYSTEM_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.FAMILY);
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    toast.success("Signed out successfully");
  };

  // 6. Onboarding: Option A - Create Family (Family Head)
  const createFamily = async (name: string, monthlyBudget: number, headName: string): Promise<Family> => {
    if (!user) throw new Error("User must be authenticated to create a family");
    if (!name.trim() || name.trim().length > 255 || !headName.trim() || headName.trim().length > 150) {
      throw new Error("Enter a valid family name and head name");
    }
    if (
      !Number.isFinite(monthlyBudget) ||
      monthlyBudget < 0 ||
      monthlyBudget > 9_999_999_999.99
    ) {
      throw new Error("Enter a valid monthly budget");
    }

    const joinCode = generateFamilyCode();
    const familyId = "fam-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

    const headMember: FamilyMember = {
      id: "mem-" + Date.now(),
      family_id: familyId,
      user_id: user.id,
      name: headName.trim(),
      role: "Head",
      avatar_color: "#047857",
      relation: "Head",
      created_at: new Date().toISOString(),
    };

    const newFamily: Family = {
      id: familyId,
      name: name.trim(),
      join_code: joinCode,
      monthly_budget: monthlyBudget,
      currency: "INR",
      created_by: user.id,
      created_at: new Date().toISOString(),
      members: [headMember],
    };

    if (isSupabaseConfigured && supabase) {
      const { data: insertedFam, error: famErr } = await supabase
        .from("families")
        .insert({
          name: newFamily.name,
          join_code: newFamily.join_code,
          monthly_budget: newFamily.monthly_budget,
          currency: "INR",
          created_by: user.id,
        })
        .select()
        .single();

      if (famErr || !insertedFam) {
        throw new Error(famErr?.message || "Could not create the family vault");
      }

      const realFamilyId = insertedFam.id;
      newFamily.id = realFamilyId;
      headMember.family_id = realFamilyId;

      const { error: memberError } = await supabase.from("family_members").insert({
        family_id: realFamilyId,
        user_id: user.id,
        name: headMember.name,
        role: "Head",
        relation: "Head",
        avatar_color: "#047857",
      });
      if (memberError) throw new Error(`Family created, but head membership failed: ${memberError.message}`);

      const categoriesToInsert = DEFAULT_SYSTEM_CATEGORIES.map((cat) => ({
        family_id: realFamilyId,
        slug: cat.slug,
        name: cat.name,
        hindi_name: cat.hindi_name,
        description: cat.description,
        icon_name: cat.icon_name,
        monthly_budget: 0,
        is_system: true,
      }));

      const { error: categoriesError } = await supabase.from("categories").insert(categoriesToInsert);
      if (categoriesError) {
        throw new Error(`Family created, but default categories failed: ${categoriesError.message}`);
      }
    }

    setFamily(newFamily);
    setCategories(DEFAULT_SYSTEM_CATEGORIES);
    setItems([]);
    localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(newFamily));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_SYSTEM_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));

    toast.success(`Created "${newFamily.name}" Vault! Join Code: ${newFamily.join_code}`);
    return newFamily;
  };

  // 7. Onboarding: Option B - Join Family (Family Member)
  const joinFamily = async (joinCode: string, memberName: string): Promise<Family> => {
    if (!user) throw new Error("User must be authenticated to join a family");

    const cleanCode = joinCode.trim().toUpperCase();
    if (!isValidFamilyCode(cleanCode) || !memberName.trim() || memberName.trim().length > 150) {
      throw new Error("Enter a valid 6-digit family code and member name");
    }

    if (isSupabaseConfigured && supabase) {
      const memberColors = ["#B45309", "#0284C7", "#7C3AED", "#D97706", "#2563EB"];
      const randomColor = memberColors[Math.floor(Math.random() * memberColors.length)];
      const { data: familyId, error: joinError } = await supabase.rpc("join_family_by_code", {
        p_join_code: cleanCode,
        p_member_name: memberName.trim(),
        p_avatar_color: randomColor,
      });
      if (joinError || typeof familyId !== "string") {
        throw new Error(joinError?.message || "Invalid 6-digit family join code");
      }

      const { data: targetFam, error: familyError } = await supabase
        .from("families")
        .select("*")
        .eq("id", familyId)
        .single();
      if (familyError || !targetFam) {
        throw new Error(familyError?.message || "Could not load the joined family");
      }

      // 3. Load all family details
      const { data: allMembers, error: membersError } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", targetFam.id);
      if (membersError) throw membersError;

      const { data: famCategories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("family_id", targetFam.id);
      if (categoriesError) throw categoriesError;

      const { data: famItems, error: itemsError } = await supabase
        .from("ledger_items")
        .select("*")
        .eq("family_id", targetFam.id)
        .order("created_at", { ascending: false });
      if (itemsError) throw itemsError;

      const joinedFamily: Family = {
        id: targetFam.id,
        name: targetFam.name,
        join_code: targetFam.join_code,
        monthly_budget: Number.isFinite(Number(targetFam.monthly_budget))
          ? Number(targetFam.monthly_budget)
          : 45000,
        currency: "INR",
        created_by: targetFam.created_by,
        created_at: targetFam.created_at,
        members: allMembers || [],
      };

      setFamily(joinedFamily);
      setCategories(famCategories && famCategories.length > 0 ? famCategories : DEFAULT_SYSTEM_CATEGORIES);
      setItems(famItems || []);

      toast.success(`Connected to "${joinedFamily.name}" Vault!`);
      return joinedFamily;
    } else {
      // Fallback local join
      const stored = localStorage.getItem(STORAGE_KEYS.FAMILY);
      if (stored) {
        const parsed: Family = JSON.parse(stored);
        if (parsed.join_code === cleanCode) {
          const newMem: FamilyMember = {
            id: "mem-" + Date.now(),
            family_id: parsed.id,
            user_id: user.id,
            name: memberName.trim(),
            role: "Member",
            avatar_color: "#B45309",
            relation: "Member",
            created_at: new Date().toISOString(),
          };
          const updatedFamily = {
            ...parsed,
            members: [...parsed.members, newMem],
          };
          setFamily(updatedFamily);
          localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(updatedFamily));
          toast.success(`Connected to "${updatedFamily.name}" Vault!`);
          return updatedFamily;
        }
      }
      throw new Error("Invalid 6-digit family join code. Please check with your Family Head.");
    }
  };

  // 8. Update Family Budget
  const updateMonthlyBudget = async (budget: number) => {
    if (!family) return;
    setFamily((prev) => (prev ? { ...prev, monthly_budget: budget } : null));

    if (isSupabaseConfigured && supabase) {
      await supabase.from("families").update({ monthly_budget: budget }).eq("id", family.id);
    }
    toast.success(`Monthly budget updated to ₹${budget.toLocaleString("en-IN")}`);
  };

  // 9. Load Blank Template Items
  const loadBlankTemplate = (categorySlug: string) => {
    if (!family) {
      toast.error("Please set up your family vault first");
      return;
    }

    const templates = BLANK_HOUSEHOLD_TEMPLATES[categorySlug];
    if (!templates || templates.length === 0) {
      toast.info("No standard template available for this category");
      return;
    }

    const memberName = currentMember?.name || "Self";
    const newItems: LedgerItem[] = templates.map((tpl) => ({
      id: "item-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      family_id: family.id,
      category_slug: categorySlug,
      item_name: tpl.item_name,
      quantity: tpl.quantity,
      unit: tpl.unit,
      expected_price: 0,
      actual_price: 0,
      status: "Pending",
      recurrence: "Monthly",
      notes: tpl.notes,
      created_by_name: memberName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      extra_data: tpl.extra_data || {},
    }));

    setItems((prev) => [...newItems, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from("ledger_items").insert(newItems).then();
    }

    toast.success(`Loaded ${newItems.length} blank staple items. Tap any item to enter your prices.`);
  };

  // 10. Ledger Mutations
  const addItem = (itemData: Omit<LedgerItem, "id" | "created_at" | "updated_at">): LedgerItem => {
    const memberName = currentMember?.name || itemData.created_by_name || "Self";
    const newItem: LedgerItem = {
      ...itemData,
      id: "item-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      created_by_name: memberName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);

    if (isSupabaseConfigured && supabase && family?.id) {
      supabase.from("ledger_items").insert({
        ...newItem,
        family_id: family.id,
      }).then();
    }

    toast.success(`Added "${newItem.item_name}"`);
    return newItem;
  };

  const updateItem = (id: string, updates: Partial<LedgerItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            ...updates,
            updated_at: new Date().toISOString(),
          };
          if (isSupabaseConfigured && supabase) {
            supabase.from("ledger_items").update(updates).eq("id", id).then();
          }
          return updated;
        }
        return item;
      })
    );
    toast.success("Item updated");
  };

  const deleteItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (isSupabaseConfigured && supabase) {
      supabase.from("ledger_items").delete().eq("id", id).then();
    }
    toast.info(`Removed ${target ? `"${target.item_name}"` : "item"}`);
  };

  const toggleItemStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let nextStatus: ItemStatus;
          if (item.status === "Pending") nextStatus = "Bought";
          else if (item.status === "Bought") nextStatus = "Paid";
          else if (item.status === "Paid") nextStatus = "Pending";
          else nextStatus = "Pending";

          const updated = {
            ...item,
            status: nextStatus,
            actual_price:
              (nextStatus === "Bought" || nextStatus === "Paid") && item.actual_price === 0
                ? item.expected_price
                : item.actual_price,
            updated_at: new Date().toISOString(),
          };

          if (isSupabaseConfigured && supabase) {
            supabase.from("ledger_items").update({ status: nextStatus }).eq("id", id).then();
          }

          toast.success(`Marked as ${nextStatus}`);
          return updated;
        }
        return item;
      })
    );
  };

  const updateMilkDays = (id: string, daysTaken: number) => {
    if (!Number.isInteger(daysTaken) || daysTaken < 0 || daysTaken > 31) {
      toast.error("Milk days must be between 0 and 31");
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const extra = item.extra_data || {};
          const rate = extra.milk_rate_per_liter || 54;
          const daily = extra.milk_daily_liters || 1.5;
          const newActual = toMoney(daysTaken * daily * rate);
          return {
            ...item,
            actual_price: newActual,
            extra_data: {
              ...extra,
              days_taken: daysTaken,
            },
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    toast.success(`Updated milk consumption to ${daysTaken} days`);
  };

  const addUdhaarRepayment = (
    itemId: string,
    repayment: Omit<UdhaarRepayment, "id" | "recorded_by">
  ) => {
    if (
      !Number.isFinite(repayment.amount) ||
      repayment.amount <= 0 ||
      repayment.amount > 9_999_999_999.99
    ) {
      toast.error("Enter a valid repayment amount");
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const existingRepayments = item.extra_data?.repayments || [];
          const newRepayment: UdhaarRepayment = {
            ...repayment,
            id: "rep-" + Date.now(),
            recorded_by: currentMember?.name || "Self",
          };
          const totalRepaid = sumMoney([
            ...existingRepayments.map((r) => r.amount),
            repayment.amount,
          ]);
          const isFullySettled = totalRepaid >= item.expected_price;
          const balance = toMoney(Math.max(0, item.expected_price - totalRepaid));

          const updatedItem: LedgerItem = {
            ...item,
            actual_price: balance,
            status: isFullySettled ? "Settled" : "Pending",
            extra_data: {
              ...item.extra_data,
              repayments: [...existingRepayments, newRepayment],
            },
            updated_at: new Date().toISOString(),
          };

          toast.success(
            `Recorded payment of ₹${repayment.amount}. Balance: ₹${Math.max(
              0,
              balance
            )}`
          );
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addCustomCategory = (categoryData: Omit<CategoryMeta, "is_system">) => {
    const slug = categoryData.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (
      !slug ||
      slug.length > 64 ||
      !categoryData.name.trim() ||
      categoryData.name.trim().length > 100 ||
      !Number.isFinite(categoryData.monthly_budget) ||
      categoryData.monthly_budget < 0 ||
      categoryData.monthly_budget > 9_999_999_999.99
    ) {
      toast.error("Enter a valid category name and budget");
      return;
    }
    const exists = categories.some((c) => c.slug === slug);
    if (exists) {
      toast.error("A category with this name or slug already exists");
      return;
    }

    const newCategory: CategoryMeta = {
      ...categoryData,
      slug,
      is_system: false,
    };

    setCategories((prev) => [...prev, newCategory]);

    if (isSupabaseConfigured && supabase && family?.id) {
      supabase.from("categories").insert({
        family_id: family.id,
        slug: newCategory.slug,
        name: newCategory.name,
        hindi_name: newCategory.hindi_name,
        description: newCategory.description,
        icon_name: newCategory.icon_name,
        monthly_budget: newCategory.monthly_budget,
        is_system: false,
      }).then();
    }

    toast.success(`Created category "${newCategory.name}"`);
  };

  const addChatMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: "msg-" + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const clearChatHistory = () => {
    setChatMessages([]);
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    toast.info("Conversation history cleared");
  };

  const value = useMemo(
    () => ({
      user,
      authLoading,
      signIn,
      signUp,
      signOut,
      family,
      currentMember,
      categories,
      items,
      chatMessages,
      isLoaded,
      isCloudSynced,
      createFamily,
      joinFamily,
      updateMonthlyBudget,
      addItem,
      updateItem,
      deleteItem,
      toggleItemStatus,
      loadBlankTemplate,
      updateMilkDays,
      addUdhaarRepayment,
      addCustomCategory,
      addChatMessage,
      clearChatHistory,
    }),
    [
      user,
      authLoading,
      family,
      currentMember,
      categories,
      items,
      chatMessages,
      isLoaded,
      isCloudSynced,
    ]
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
}
