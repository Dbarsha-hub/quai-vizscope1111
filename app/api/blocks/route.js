import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  const BLOCKS_URL = process.env.QUAISCAN_BLOCKS_URL;
  const FETCH_TIMEOUT_MS = 10000;

  // 1️⃣ Check env variable
  if (!BLOCKS_URL) {
    return NextResponse.json(
      { error: "QUAISCAN_BLOCKS_URL not set in .env.local" },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // 2️⃣ Fetch from QuaiScan
    const res = await fetch(BLOCKS_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "quai-vizscope-app/1.0",
      },
      signal: controller.signal,
    });

    // 3️⃣ Handle upstream failure
    if (!res.ok) {
      const { data: cached } = await supabase
        .from("blocks")
        .select("block_number, gas_used, miner")
        .order("block_number", { ascending: false })
        .limit(50);

      if (cached && cached.length > 0) {
        return NextResponse.json(cached, { status: 200 });
      }

      return NextResponse.json(
        { error: "QuaiScan API failed", status: res.status },
        { status: 502 }
      );
    }

    // 4️⃣ Parse response
    const data = await res.json();

    // 5️⃣ Upsert mapped blocks into Supabase and return
    const items = Array.isArray(data?.items) ? data.items : [];
    const blocks = items
      .map((item) => ({
        block_number: item.number_full?.[0],
        gas_used: item.gas_used,
        miner: item.miner?.hash ?? "N/A",
      }))
      .filter((b) => b.block_number !== undefined);

    if (blocks.length === 0) {
      const { data: cached } = await supabase
        .from("blocks")
        .select("block_number, gas_used, miner")
        .order("block_number", { ascending: false })
        .limit(50);

      if (cached && cached.length > 0) {
        return NextResponse.json(cached, { status: 200 });
      }

      return NextResponse.json(
        { error: "No blocks returned from QuaiScan" },
        { status: 502 }
      );
    }

    const { error } = await supabase
      .from("blocks")
      .upsert(blocks, { onConflict: "block_number" });

    if (error) {
      return NextResponse.json(
        { error: "Failed to persist blocks", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(blocks);

  } catch (err) {
    // Attempt to serve cached data if available
    const { data: cached } = await supabase
      .from("blocks")
      .select("block_number, gas_used, miner")
      .order("block_number", { ascending: false })
      .limit(50);

    if (cached && cached.length > 0) {
      return NextResponse.json(cached, { status: 200 });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch QuaiScan blocks",
        detail: err?.message ?? String(err),
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
