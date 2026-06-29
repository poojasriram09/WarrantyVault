import { useEffect } from "react";
import { auth, onAuthStateChanged } from "../config/firebase";
import { supabase } from "../config/supabase";
import { setFirebaseUid, clearFirebaseUid } from "../config/supabase";
import { useAuthStore } from "../stores/authStore";
import { sendExpiryEmail } from "../services/email.service";

export function useAuth() {
  const { setUser, setDbUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Set Firebase UID header so RLS policies can identify the user
        setFirebaseUid(firebaseUser.uid);

        let dbUser = null;

        // Try UPSERT via SECURITY DEFINER RPC (works even without Supabase Auth JWT)
        try {
          const { data: rpcUser, error: rpcErr } = await supabase.rpc("sync_firebase_user", {
            p_firebase_uid: firebaseUser.uid,
            p_email:        firebaseUser.email,
            p_display_name: firebaseUser.displayName ?? null,
            p_avatar_url:   firebaseUser.photoURL    ?? null,
          });
          if (!rpcErr && rpcUser) {
            dbUser = rpcUser;
          } else if (rpcErr) {
            console.warn("sync_firebase_user RPC failed:", rpcErr.message);
          }
        } catch (e) {
          console.warn("sync_firebase_user RPC exception:", e);
        }

        // Fallback: direct upsert
        if (!dbUser) {
          try {
            const { data: upserted, error: upsertErr } = await supabase
              .from("users")
              .upsert(
                {
                  firebase_uid: firebaseUser.uid,
                  email:        firebaseUser.email,
                  display_name: firebaseUser.displayName ?? null,
                  avatar_url:   firebaseUser.photoURL    ?? null,
                },
                { onConflict: "firebase_uid" }
              )
              .select()
              .single();
            if (!upsertErr && upserted) {
              dbUser = upserted;
            } else if (upsertErr) {
              console.error("users upsert fallback failed:", upsertErr.message);
            }
          } catch (e) {
            console.error("users upsert fallback exception:", e);
          }
        }

        if (!dbUser) {
          console.error("useAuth: both sync methods failed — dbUser is null");
        }

        // Fire expiry notifications + email alerts on every login
        if (dbUser?.id) {
          fireExpiryAlerts(dbUser, firebaseUser);
        }

        setDbUser(dbUser);
      } else {
        clearFirebaseUid();
        setDbUser(null);
      }
    });

    return () => unsubscribe();
  }, []);
}

// Fire expiry notifications and email alerts
async function fireExpiryAlerts(dbUser, firebaseUser) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const day7 = new Date();
    day7.setDate(day7.getDate() + 7);
    const day7Str = day7.toISOString().split("T")[0];
    const day8 = new Date();
    day8.setDate(day8.getDate() + 8);
    const day8Str = day8.toISOString().split("T")[0];
    const day30 = new Date();
    day30.setDate(day30.getDate() + 30);
    const day30Str = day30.toISOString().split("T")[0];

    const [res7, res30, resExpired] = await Promise.all([
      supabase
        .from("warranties_with_status")
        .select("*, products(product_name, brand)")
        .eq("user_id", dbUser.id)
        .gte("end_date", today)
        .lte("end_date", day7Str),
      supabase
        .from("warranties_with_status")
        .select("*, products(product_name, brand)")
        .eq("user_id", dbUser.id)
        .gte("end_date", day8Str)
        .lte("end_date", day30Str),
      supabase
        .from("warranties_with_status")
        .select("*, products(product_name, brand)")
        .eq("user_id", dbUser.id)
        .lt("end_date", today),
    ]);

    const w7 = res7.data ?? [];
    const w30 = res30.data ?? [];
    const wExpired = resExpired.data ?? [];

    // Insert in-app notifications (dedup: check existing for today)
    const { data: existingNotifs } = await supabase
      .from("notifications")
      .select("warranty_id, type")
      .eq("user_id", dbUser.id)
      .gte("created_at", today + "T00:00:00Z");

    const existingSet = new Set(
      (existingNotifs ?? []).map((n) => `${n.warranty_id}_${n.type}`)
    );

    const notifications = [];

    for (const w of w7) {
      const daysLeft = Math.ceil((new Date(w.end_date).getTime() - Date.now()) / 86400000);
      const type = daysLeft <= 1 ? "expiry_1d" : "expiry_7d";
      if (!existingSet.has(`${w.id}_${type}`)) {
        notifications.push({
          user_id: dbUser.id,
          warranty_id: w.id,
          type,
          channel: "in_app",
          message: `⚠️ ${w.products?.product_name ?? "Product"} (${w.products?.brand ?? ""}) warranty expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}!`,
        });
      }
    }

    for (const w of w30) {
      const daysLeft = Math.ceil((new Date(w.end_date).getTime() - Date.now()) / 86400000);
      if (!existingSet.has(`${w.id}_expiry_30d`)) {
        notifications.push({
          user_id: dbUser.id,
          warranty_id: w.id,
          type: "expiry_30d",
          channel: "in_app",
          message: `🔔 ${w.products?.product_name ?? "Product"} (${w.products?.brand ?? ""}) warranty expires in ${daysLeft} days.`,
        });
      }
    }

    for (const w of wExpired) {
      if (!existingSet.has(`${w.id}_expiry_0d`)) {
        notifications.push({
          user_id: dbUser.id,
          warranty_id: w.id,
          type: "expiry_0d",
          channel: "in_app",
          message: `❌ ${w.products?.product_name ?? "Product"} (${w.products?.brand ?? ""}) warranty has expired.`,
        });
      }
    }

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    // Send email alert
    if (w7.length + w30.length > 0) {
      await sendExpiryEmail({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        warranties7d: w7,
        warranties30d: w30,
      });
    }
  } catch (e) {
    console.warn("Expiry notifications/email failed:", e);
  }
}
