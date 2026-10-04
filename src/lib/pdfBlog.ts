import { getDocumentProxy, extractImages } from "unpdf";
import sharp from "sharp";
import type { BlogBlock } from "./blogs";

// Server-only: turns an uploaded PDF into a blog post.
//
//   - the biggest text at the top of page 1 is the title
//   - a run of bold lines is a heading
//   - a paragraph starting "The Takeaway:" is a takeaway callout
//   - a line made only of #hashtags becomes the post's tags
//   - the largest image in the PDF becomes the cover
//   - everything else is a paragraph (lines are joined, and a bigger
//     vertical gap starts a new paragraph)

export interface ParsedPdfBlog {
  title: string;
  excerpt: string;
  tags: string[];
  body: BlogBlock[];
  // JPEG bytes of the cover, or null if the PDF has no usable image.
  cover: Buffer | null;
}

interface Line {
  text: string;
  y: number;
  page: number;
  size: number;
  bold: boolean;
}

const MAX_COVER_BYTES = 700_000;
const MAX_TAGS = 4;

const isBoldFont = (name: string) => /bold|black|heavy|semibold/i.test(name);
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

async function readLines(pdf: Awaited<ReturnType<typeof getDocumentProxy>>) {
  const lines: Line[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    // Loads the page's fonts so their real names (e.g. "Arial-BoldMT") are
    // available to tell bold from regular text.
    await page.getOperatorList();
    const content = await page.getTextContent();

    const fontIsBold: Record<string, boolean> = {};
    const items: { str: string; x: number; y: number; h: number; bold: boolean }[] = [];
    for (const it of content.items) {
      if (!("str" in it) || !it.str) continue;
      if (!(it.fontName in fontIsBold)) {
        try {
          fontIsBold[it.fontName] = isBoldFont(page.commonObjs.get(it.fontName).name ?? "");
        } catch {
          fontIsBold[it.fontName] = false;
        }
      }
      items.push({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        h: it.height,
        bold: fontIsBold[it.fontName],
      });
    }

    // Group items sharing a baseline into lines, top of the page first.
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const groups: (typeof items)[] = [];
    for (const it of items) {
      const g = groups[groups.length - 1];
      if (g && Math.abs(g[0].y - it.y) < 2.5) g.push(it);
      else groups.push([it]);
    }

    for (const g of groups) {
      g.sort((a, b) => a.x - b.x);
      const text = g.map((i) => i.str).join("").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const real = g.filter((i) => i.str.trim());
      lines.push({
        text,
        y: g[0].y,
        page: p,
        size: Math.max(...real.map((i) => i.h)),
        bold: real.every((i) => i.bold),
      });
    }
  }

  // Stray page numbers.
  return lines.filter((l) => !/^(page\s*)?\d{1,3}$/i.test(l.text));
}

const typicalSize = (lines: Line[]) => {
  const weight = new Map<number, number>();
  for (const l of lines) {
    const s = Math.round(l.size * 2) / 2;
    weight.set(s, (weight.get(s) ?? 0) + l.text.length);
  }
  return [...weight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 11;
};

const typicalGap = (lines: Line[]) => {
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].page !== lines[i - 1].page) continue;
    const g = lines[i - 1].y - lines[i].y;
    if (g > 0 && g < 40) gaps.push(g);
  }
  gaps.sort((a, b) => a - b);
  return gaps.length ? gaps[Math.floor(gaps.length / 4)] : 14;
};

const humanize = (tag: string) => tag.replace(/([a-z])([A-Z])/g, "$1 $2");

async function pickCover(
  pdf: Awaited<ReturnType<typeof getDocumentProxy>>,
): Promise<Buffer | null> {
  let best: Awaited<ReturnType<typeof extractImages>>[number] | null = null;
  for (let p = 1; p <= pdf.numPages; p++) {
    for (const img of await extractImages(pdf, p)) {
      if (img.width < 300 || img.height < 150) continue;
      if (!best || img.width * img.height > best.width * best.height) best = img;
    }
  }
  if (!best) return null;

  try {
    let width = Math.min(best.width, 1600);
    for (let quality = 82; ; quality -= 8) {
      const jpeg = await sharp(Buffer.from(best.data.buffer, best.data.byteOffset, best.data.byteLength), {
        raw: { width: best.width, height: best.height, channels: best.channels },
      })
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      if (jpeg.length <= MAX_COVER_BYTES || quality <= 50) return jpeg;
      width = Math.round(width * 0.9);
    }
  } catch {
    return null;
  }
}

export async function parsePdfBlog(data: Uint8Array): Promise<ParsedPdfBlog> {
  const pdf = await getDocumentProxy(data);
  const all = await readLines(pdf);
  if (all.length === 0) {
    throw new Error(
      "Couldn't find any text in that PDF. Scanned/image-only PDFs aren't supported.",
    );
  }

  const bodySize = typicalSize(all);
  const lineGap = typicalGap(all);

  // --- Title: the leading larger-than-body lines (or just the first line).
  let i = 0;
  const titleLines: string[] = [];
  while (i < all.length && all[i].size > bodySize + 1 && all[i].page === 1) {
    titleLines.push(all[i].text);
    i++;
  }
  if (titleLines.length === 0) {
    titleLines.push(all[0].text);
    i = 1;
  }
  const title = titleLines.join(" ");

  // Many documents repeat the title right under itself as a subtitle.
  let repeated = "";
  let j = i;
  while (j < all.length && repeated.length < normalize(title).length) {
    repeated += normalize(all[j].text);
    j++;
  }
  if (repeated === normalize(title)) i = j;

  const lines = all.slice(i);

  // --- Group lines into blocks.
  type Block =
    | { kind: "p" | "takeaway" | "heading"; text: string }
    | { kind: "hashtags"; tags: string[] };
  const blocks: Block[] = [];
  let hashtags: string[] = [];
  let prev: Line | null = null;

  for (const line of lines) {
    let gapBreak = true;
    if (prev) {
      gapBreak =
        prev.page === line.page
          ? prev.y - line.y > lineGap * 1.6
          : /[.!?:"”')\]]$/.test(prev.text);
    }
    prev = line;
    const last = blocks[blocks.length - 1];
    const takeaway = /^the\s+takeaways?\s*:?\s*/i.exec(line.text);

    if (/^(#\w+\s*)+$/.test(line.text)) {
      const tags = line.text.split(/\s+/).map((h) => h.slice(1));
      hashtags = hashtags.concat(tags);
      // A hashtag line that wraps onto a second line is still one block.
      if (last?.kind === "hashtags") last.tags.push(...tags);
      else blocks.push({ kind: "hashtags", tags });
    } else if (takeaway) {
      blocks.push({ kind: "takeaway", text: line.text.slice(takeaway[0].length).trim() });
    } else if (line.bold) {
      if (last?.kind === "heading" && !gapBreak) last.text += ` ${line.text}`;
      else blocks.push({ kind: "heading", text: line.text });
    } else if (last && (last.kind === "p" || last.kind === "takeaway") && !gapBreak) {
      last.text = `${last.text} ${line.text}`.trim();
    } else {
      blocks.push({ kind: "p", text: line.text });
    }
  }

  const body: BlogBlock[] = [];
  for (const b of blocks) {
    if (b.kind === "hashtags") body.push({ hashtags: b.tags });
    else if (!b.text) continue;
    else if (b.kind === "heading") body.push({ heading: b.text });
    else if (b.kind === "takeaway") body.push({ takeaway: b.text });
    else body.push(b.text);
  }
  if (!body.some((b) => typeof b === "string")) {
    throw new Error("Couldn't find any body text in that PDF.");
  }

  const firstParagraph = body.find((b): b is string => typeof b === "string") ?? "";
  const excerpt =
    firstParagraph.length > 160
      ? `${firstParagraph.slice(0, 160).replace(/\s+\S*$/, "")}…`
      : firstParagraph;

  return {
    title,
    excerpt,
    tags: [...new Set(hashtags.map(humanize))].slice(0, MAX_TAGS),
    body,
    cover: await pickCover(pdf),
  };
}
