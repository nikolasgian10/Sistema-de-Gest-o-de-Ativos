// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, role, pendingId } = await req.json();

    // Criar cliente Supabase com service role key (admin privileges)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // 1. Criar usuário no auth.users
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (signUpError) {
      console.error("Error creating auth user:", signUpError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${signUpError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!signUpData?.user) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário - resposta vazia" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = signUpData.user.id;

    // 2. Criar profile do usuário
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar perfil: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Atualizar status da solicitação de cadastro
    const { error: updateError } = await supabase
      .from("pending_signups")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingId);

    if (updateError) {
      console.error("Error updating pending signup:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        message: `Usuário ${fullName} aprovado como ${role}!`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar solicitação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
