import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { getIndex } from "@/lib/pinecone";
import { embedTexts } from "@/lib/embeddings";

/**
 * Dim Sum Montijo Excel structure:
 * A: CategoryTitlePt, B: CategoryTitleEn, C: SubcategoryTitlePt, D: SubcategoryTitleEn,
 * E: ItemNamePt, F: ItemNameEn, G: ItemPrice, H: Calories, I: PortionSize, J: Availability,
 * K: ItemDescriptionPt, L: ItemDescriptionEn
 */
const EXCEL_COLUMNS = [
  "CategoryTitlePt",
  "CategoryTitleEn",
  "SubcategoryTitlePt",
  "SubcategoryTitleEn",
  "ItemNamePt",
  "ItemNameEn",
  "ItemPrice",
  "Calories",
  "PortionSize",
  "Availability",
  "ItemDescriptionPt",
  "ItemDescriptionEn",
] as const;

type ExcelRow = Record<(typeof EXCEL_COLUMNS)[number], string | number | undefined>;

function parseDimSumSheet(sheet: XLSX.WorkSheet): ExcelRow[] {
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as string[][];

  if (raw.length < 2) return [];

  const headerRow = raw[0].map((h) => String(h ?? "").trim());
  const colIndex: Record<string, number> = {};
  for (let c = 0; c < headerRow.length; c++) {
    const key = headerRow[c];
    if (key && !(key in colIndex)) colIndex[key] = c;
  }

  const rows: ExcelRow[] = [];
  for (let r = 1; r < raw.length; r++) {
    const cells = raw[r];
    const row: ExcelRow = {} as ExcelRow;
    for (const col of EXCEL_COLUMNS) {
      const idx = colIndex[col];
      const val = idx !== undefined ? cells[idx] : undefined;
      if (typeof val === "number" && (col === "ItemPrice" || col === "Calories" || col === "PortionSize" || col === "Availability")) {
        row[col] = val;
      } else if (val != null && val !== "") {
        row[col] = String(val).trim();
      }
    }
    rows.push(row);
  }
  return rows;
}

function rowToDocument(row: ExcelRow, index: number) {
  const nameEn = row.ItemNameEn ?? row.ItemNamePt ?? "";
  const namePt = row.ItemNamePt ?? row.ItemNameEn ?? "";
  const name = String(nameEn || namePt || `Item ${index + 1}`).trim();

  const descEn = row.ItemDescriptionEn ?? row.ItemDescriptionPt ?? "";
  const descPt = row.ItemDescriptionPt ?? row.ItemDescriptionEn ?? "";
  const description = String(descEn || descPt).trim();

  const categoryEn = row.CategoryTitleEn ?? row.CategoryTitlePt ?? "";
  const categoryPt = row.CategoryTitlePt ?? row.CategoryTitleEn ?? "";
  const category = String(categoryEn || categoryPt || "General").trim();

  const subcatEn = row.SubcategoryTitleEn ?? row.SubcategoryTitlePt ?? "";
  const subcatPt = row.SubcategoryTitlePt ?? row.SubcategoryTitleEn ?? "";
  const subcategory = [subcatEn, subcatPt].filter(Boolean).join(" / ") || undefined;

  let price = 0;
  if (row.ItemPrice != null && row.ItemPrice !== "") {
    const p = String(row.ItemPrice).replace(",", ".");
    price = parseFloat(p) || 0;
  }

  const portionSize = row.PortionSize != null && row.PortionSize !== "" ? String(row.PortionSize) : "1";
  const availability = row.Availability;
  const available =
    availability === 1 ||
    availability === "1" ||
    String(availability).toLowerCase() === "true";

  const dietary = description
    ? `Ingredients: ${description}. Check for allergens.`
    : "See menu for details.";

  const searchText = [
    nameEn,
    namePt,
    description,
    category,
    subcategory,
    `Price: €${price.toFixed(2)}`,
    dietary,
    portionSize && `Portion: ${portionSize}`,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    text: searchText,
    metadata: {
      name,
      namePt: namePt || name,
      description,
      category: category.toLowerCase().replace(/\s+/g, "-"),
      categoryEn: categoryEn || category,
      price,
      dietary: dietary.toLowerCase(),
      portionSize,
      available,
    },
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = parseDimSumSheet(sheet);

    const dataRows = rows.filter((row) => {
      const name = row.ItemNameEn ?? row.ItemNamePt;
      return name != null && String(name).trim() !== "";
    });

    if (dataRows.length === 0) {
      return NextResponse.json(
        { error: "No menu items found. Ensure columns ItemNameEn / ItemNamePt and ItemPrice are present." },
        { status: 400 }
      );
    }

    const namespace = uuidv4();

    const documents = dataRows.map((row, index) => rowToDocument(row, index));

    const BATCH_SIZE = 50;
    const index = getIndex();

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const texts = batch.map((d) => d.text);
      const embeddings = await embedTexts(texts);

      const vectors = batch.map((doc, j) => ({
        id: `${namespace}-${i + j}`,
        values: embeddings[j],
        metadata: doc.metadata,
      }));

      await index.namespace(namespace).upsert({ records: vectors });
    }

    const popularItems = documents
      .filter((d) => d.metadata.available)
      .slice(0, 3)
      .map((d) => ({
        name: d.metadata.name,
        category: d.metadata.categoryEn ?? d.metadata.category,
        price: d.metadata.price,
      }));

    return NextResponse.json({
      namespace,
      itemCount: documents.length,
      popularItems,
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Failed to process file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
