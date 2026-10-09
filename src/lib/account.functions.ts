import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Exclui a conta do próprio usuário (LGPD): fotos + usuário; o resto apaga em cascata. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: files } = await supabaseAdmin.storage.from("pet-photos").list(uid, { limit: 1000 });
    if (files?.length) {
      await supabaseAdmin.storage.from("pet-photos").remove(files.map((f) => `${uid}/${f.name}`));
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error("Não foi possível excluir a conta.");
    return { ok: true };
  });
