
import { supabase } from "../supabaseClient";

export async function listarPessoas() {
  const { data, error } = await supabase
    .from("Pessoa")
    .select("*");

  console.log("Dados:", data);
  console.log("Erro:", error);

  if (error) throw error;

  return data;
}

export async function inserirPessoa(pessoa: any) {
  const { error } = await supabase
    .from("Pessoa")
    .insert([pessoa]);

  if (error) throw error;
}

export async function atualizarPessoa(id: number, pessoa: any) {
  const { error } = await supabase
    .from("Pessoa")
    .update(pessoa)
    .eq("id", id);

  if (error) throw error;
}

export async function excluirPessoa(id: number) {
  const { error } = await supabase
    .from("Pessoa")
    .delete()
    .eq("id", id);

  if (error) throw error;
}