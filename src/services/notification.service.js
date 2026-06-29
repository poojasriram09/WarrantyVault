import { supabase } from "../config/supabase";

export const notificationService = {
  async getForUser(userId) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data ?? [];
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  },

  async markRead(notificationId) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
  },

  /**
   * Subscribe to real-time inserts on the notifications table for a user.
   * Returns the channel — call channel.unsubscribe() on cleanup.
   */
  subscribeToNew(userId, onNotification) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onNotification(payload.new)
      )
      .subscribe();

    return channel;
  },
};
