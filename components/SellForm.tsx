"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COLLEGES, Category, Condition, DEFAULT_USER, Theme } from "@/lib/seed";
import { suggestPrice } from "@/lib/myListings";
import {
  CATEGORIES,
  CONDITIONS,
  TAG_CHIPS,
  THEMES,
  createListing,
  resizeImage,
} from "@/lib/userListings";

const SIZES = ["XS", "S", "M", "L", "XL", "One size", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];

const inputCls =
  "w-full rounded-2xl border-2 border-ink bg-canvas px-4 py-3 text-base outline-none placeholder:text-stone focus:border-forest";
const chip = (on: boolean) =>
  `rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition ${
    on ? "border-ink bg-forest text-cream " : "border-ink bg-canvas text-ink/75 hover:border-ink"
  }`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-ink/75">{label}</p>
      {children}
    </div>
  );
}

export interface SellPrefill {
  name: string;
  category: Category;
  tags: string[];
  /** Wardrobe photo (data URL), if the item has one. */
  photo?: string;
}

/** 90s-ish tags/names -> 90s theme; costumes -> fancy dress. */
function guessTheme(p: SellPrefill): Theme {
  if (p.category === "Costume") return "fancy-dress";
  return "90s";
}

export default function SellForm({ prefill }: { prefill?: SellPrefill }) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<Blob | null>(null);
  const [photoMsg, setPhotoMsg] = useState("");
  const [title, setTitle] = useState(prefill?.name ?? "");
  const [category, setCategory] = useState<Category>(prefill?.category ?? "Tops");
  const [size, setSize] = useState("M");
  const [condition, setCondition] = useState<Condition>("Good");
  const [theme, setTheme] = useState<Theme>(prefill ? guessTheme(prefill) : "90s");
  const [tags, setTags] = useState<string[]>(prefill?.tags ?? []);
  const [mode, setMode] = useState<"swap" | "price">("swap");
  const [price, setPrice] = useState("");
  // Seed colleges are stored without the " College" suffix ("St Anne's").
  const [college, setCollege] = useState(DEFAULT_USER.college.replace(/ College$/, ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  // The autofill button only shows when the server is in live mode. Any failure just hides it.
  useEffect(() => {
    let alive = true;
    fetch("/api/autofill")
      .then((r) => r.json())
      .then((j) => alive && setAiAvailable(j?.available === true))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // A wardrobe photo is a data URL: turn it into the same resized Blob a fresh upload would be.
  useEffect(() => {
    const src = prefill?.photo;
    if (!src) return;
    let alive = true;
    fetch(src)
      .then((r) => r.blob())
      .then((b) => resizeImage(b, 1200))
      .then((b) => alive && setImage(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [prefill?.photo]);

  // Object URLs must be revoked.
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  async function onFile(file?: File) {
    if (!file) return;
    setPhotoMsg("");
    setAiMsg("");
    try {
      setImage(await resizeImage(file, 1200));
    } catch {
      setPhotoMsg("Couldn't read that photo. Try another, or skip it and we'll use an emoji.");
    }
  }

  async function autofill() {
    if (!image || aiBusy) return;
    setAiBusy(true);
    setAiMsg("");
    try {
      const small = await resizeImage(image, 768, 0.7);
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => rej(r.error);
        r.readAsDataURL(small);
      });
      const r = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "failed");
      // Prefill only: everything stays editable.
      if (j.title) setTitle(j.title);
      if (j.category) setCategory(j.category);
      if (j.condition) setCondition(j.condition);
      if (j.theme) setTheme(j.theme);
      if (Array.isArray(j.tags) && j.tags.length) setTags(j.tags);
      setAiMsg("✨ Filled in. Check it over and tweak anything.");
    } catch {
      setAiMsg("Couldn't read that photo, fill it in by hand.");
    } finally {
      setAiBusy(false);
    }
  }

  const toggleTag = (t: string) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length >= 8 ? p : [...p, t]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError("Give it a title first.");
    const priceNum = Number(price);
    if (mode === "price" && !(priceNum > 0 && priceNum < 1000)) return setError("Enter a price, or switch to Swap.");
    setError("");
    setBusy(true);
    try {
      const listing = await createListing({
        title: cleanTitle,
        category,
        size,
        condition,
        theme,
        tags,
        price: mode === "swap" ? null : Math.round(priceNum * 100) / 100,
        college,
        image,
      });
      router.push(`/listing/${listing.id}`);
    } catch {
      setError("Couldn't save that one. Please try again.");
      setBusy(false);
    }
  }

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    void onFile(e.target.files?.[0]);
    e.target.value = "";
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border-2 border-ink bg-cream p-5 shadow-pop sm:p-6">
      <Field label="Photo">
        <div className="flex items-center gap-4">
          <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-ink bg-canvas text-4xl">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview of your photo" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>📷</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => cameraRef.current?.click()} className="rounded-full border-2 border-ink bg-forest text-cream shadow-pop-sm pop px-4 py-2 text-sm font-bold">
              📸 Take photo
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full border-2 border-ink bg-canvas px-4 py-2 text-sm font-semibold hover:border-ink"
            >
              🖼️ Choose file
            </button>
            {image && (
              <button type="button" onClick={() => setImage(null)} className="text-xs text-stone hover:text-ink">
                Remove photo
              </button>
            )}
          </div>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pickFile} />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
        {photoMsg && <p className="mt-2 text-sm text-forest">{photoMsg}</p>}
        {aiAvailable && image && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => void autofill()}
              disabled={aiBusy}
              className="rounded-full border border-ink px-4 py-2 text-sm font-bold text-forest transition hover:bg-mustard hover:text-ink disabled:opacity-50"
            >
              {aiBusy ? "Looking at your photo…" : "✨ AI autofill"}
            </button>
            {aiMsg && <p className="mt-2 text-sm text-ink/75">{aiMsg}</p>}
          </div>
        )}
      </Field>

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="e.g. Baggy 90s denim jacket"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Size">
          <select value={size} onChange={(e) => setSize(e.target.value)} className={inputCls}>
            {SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Condition">
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button key={c} type="button" aria-pressed={condition === c} onClick={() => setCondition(c)} className={chip(condition === c)}>
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Theme">
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)} className={chip(theme === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Tags">
        <div className="flex flex-wrap gap-2">
          {[...TAG_CHIPS, ...tags.filter((t) => !TAG_CHIPS.includes(t))].map((t) => (
            <button key={t} type="button" aria-pressed={tags.includes(t)} onClick={() => toggleTag(t)} className={chip(tags.includes(t))}>
              #{t.replace(/\s+/g, "")}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Swap or sell">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={mode === "swap"} onClick={() => setMode("swap")} className={chip(mode === "swap")}>
            🔁 Swap
          </button>
          <button type="button" aria-pressed={mode === "price"} onClick={() => setMode("price")} className={chip(mode === "price")}>
            £ Set a price
          </button>
          {mode === "price" && (
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="12.50"
              aria-label="Price in pounds"
              className="w-28 rounded-full border-2 border-ink bg-canvas px-4 py-2 text-base outline-none focus:border-forest"
            />
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/75">
          <span aria-hidden>🤖</span>
          <span>
            BopBot suggests <strong className="text-forest">£{suggestPrice(category)}</strong> for {category.toLowerCase()}
          </span>
          {mode !== "price" || Number(price) !== suggestPrice(category) ? (
            <button
              type="button"
              onClick={() => {
                setMode("price");
                setPrice(String(suggestPrice(category)));
              }}
              className="rounded-full border-2 border-ink bg-mustard px-3 py-0.5 text-xs font-bold"
            >
              Use £{suggestPrice(category)}
            </button>
          ) : null}
        </p>
      </Field>

      <Field label="Pickup spot">
        <select value={college} onChange={(e) => setCollege(e.target.value)} className={inputCls}>
          {COLLEGES.map((c) => (
            <option key={c.college} value={c.college}>
              {c.college}
            </option>
          ))}
        </select>
      </Field>

      {error && (
        <p role="alert" className="rounded-2xl bg-sage px-4 py-3 text-sm font-semibold text-forest">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full border-2 border-ink bg-forest text-cream shadow-pop-sm pop py-4 text-lg font-extrabold shadow-pop transition  disabled:opacity-60"
      >
        {busy ? "Posting…" : "🚀 Post listing"}
      </button>
    </form>
  );
}
