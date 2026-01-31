import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";


export async function GET() {
  const res = await fetch(
    "https://quaiscan.io/api/v2/blocks?type=block,uncle,reorg"
  );

  const data = await res.json();

  const blocks = data.items.map((item) => ({

    block_number: item.number_full?.[0],
    gas_used: item.gas_used,
    miner: item.miner?.hash ?? "N/A",
  }));

  // Save to Supabase
  await supabase
  .from("blocks")
  .upsert(blocks, { onConflict: "block_number" });

  return NextResponse.json(blocks);
}
