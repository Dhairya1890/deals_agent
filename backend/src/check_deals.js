import supabase from './db/supabase.js';

async function checkDeals() {
  console.log("Checking deals table...");
  const { data, error } = await supabase.from('deals').select('*').limit(1);
  if (error) {
    console.error("Error querying deals:", error.message);
  } else {
    console.log("Query successful! Data:", data);
  }
}

checkDeals().catch(console.error);
