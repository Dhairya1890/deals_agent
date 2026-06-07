import supabase from '../db/supabase.js';

export async function getPatternForCategory(category) {
  const { data } = await supabase
    .from('patterns')
    .select('*')
    .eq('objection_category', category)
    .maybeSingle(); // Use maybeSingle to prevent exceptions if no rows are found
  return data;
}

export async function getAllPatterns() {
  const { data } = await supabase
    .from('patterns')
    .select('*')
    .order('win_count', { ascending: false });
  return data;
}
