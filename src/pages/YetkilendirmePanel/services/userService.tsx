import { supabase } from "../../../lib/supabaseClient";

export async function getUsers() {
    return await supabase
        .from("kullanicilar")
        .select("*")
        .order("created_at", { ascending: false });
}

export async function createUser(payload: any) {
    return await supabase
        .from("kullanicilar")
        .insert(payload)
        .select("*")
        .single();
}

export async function updateUser(id: string, payload: any) {
    return await supabase
        .from("kullanicilar")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
}

export async function updateUserStatus(id: string, aktif: boolean) {
    return await supabase
        .from("kullanicilar")
        .update({ aktif })
        .eq("id", id);
}

export async function deleteUserById(id: string) {
    return await supabase
        .from("kullanicilar")
        .delete()
        .eq("id", id);
}

export async function updateUserPermissions(id: string, payload: any) {
    return await supabase
        .from("kullanicilar")
        .update(payload)
        .eq("id", id);
}