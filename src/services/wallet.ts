import { supabase } from "@/integrations/supabase/client";

export const fetchProfiles = async () => {
  const { data, error } = await supabase.from("profiles").select("id, full_name, balance").order("full_name");
  if (error) throw error;
  return data;
};

export const fetchMyProfile = async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
};

export const sendMoney = async (receiverId: string, amount: number) => {
  const { error } = await supabase.rpc("transfer_money", { receiver: receiverId, amt: amount });
  if (error) throw error;
};
