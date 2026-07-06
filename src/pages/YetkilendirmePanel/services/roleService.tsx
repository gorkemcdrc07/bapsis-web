import { supabase } from "../../../lib/supabaseClient";

export async function getRolePermissions() {
    return await supabase
        .from("yetki_rolleri")
        .select("role_key, perms");
}

export async function saveRolePermissions(payload: any[]) {
    return await supabase
        .from("yetki_rolleri")
        .upsert(payload, { onConflict: "role_key" });
}