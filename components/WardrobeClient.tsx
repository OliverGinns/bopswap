"use client";

import { useRef, useState } from "react";
import { resizeImage } from "@/lib/userListings";
import { useWardrobe } from "@/lib/useWardrobe";
import { DEMO_USER, WARDROBE_CATEGORIES, WardrobeCategory, addItem, removeItem } from "@/lib/wardrobe";
import WardrobeThumb from "./WardrobeThumb";

const inputCls =
  "w-full rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-base outline-none placeholder:text-stone focus:border-forest";

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(b);
  });
}

export default function WardrobeClient() {
  const { items, setItems, ready } = useWardrobe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WardrobeCategory>("Tops");
  const [colour, setColour] = useState("");
  const [tags, setTags] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoMsg, setPhotoMsg] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setColour("");
    setTags("");
    setPhoto(undefined);
    setPhotoMsg("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  async function onFile(f: File | undefined) {
    if (!f) return;
    setPhotoMsg("");
    try {
      setPhoto(await blobToDataUrl(await resizeImage(f, 500, 0.75)));
    } catch {
      setPhoto(undefined);
      setPhotoMsg("Couldn't read that photo. No worries, an emoji will do!");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give it a name first.");
      return;
    }
    setItems(
      addItem({
        name: name.trim(),
        category,
        colour: colour.trim(),
        tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8),
        photo,
      })
    );
    reset();
    setOpen(false);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{DEMO_USER}&apos;s wardrobe</h1>
          <p className="mt-1 text-ink/75">
            {ready ? `${items.length} item${items.length === 1 ? "" : "s"}` : "…"} · BopSwap plans around what you already own.
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="font-display pop rounded-full border-2 border-ink bg-forest px-4 py-2 text-sm font-semibold text-cream shadow-pop-sm"
        >
          {open ? "Close" : "＋ Add item"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl border-2 border-ink bg-cream p-4 shadow-pop md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink/75">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Red flannel shirt" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink/75">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as WardrobeCategory)} className={inputCls}>
              {WARDROBE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink/75">Colour</span>
            <input value={colour} onChange={(e) => setColour(e.target.value)} maxLength={30} placeholder="e.g. Red" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink/75">Tags (comma separated)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="grunge, check, layer" className={inputCls} />
          </label>
          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-ink/75">Photo (optional)</span>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="max-w-full text-sm" />
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Preview" className="h-14 w-14 rounded-xl border-2 border-ink object-cover" />
              )}
            </div>
            {photoMsg && <p className="mt-1.5 text-sm text-coral">{photoMsg}</p>}
          </div>
          {error && <p className="text-sm font-semibold text-coral md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="font-display pop rounded-full border-2 border-ink bg-mustard px-6 py-2.5 font-semibold text-ink shadow-pop-sm"
            >
              Save to wardrobe
            </button>
          </div>
        </form>
      )}

      {ready && items.length === 0 ? (
        <div className="mt-5 rounded-2xl border-2 border-ink bg-cream p-10 text-center shadow-pop">
          <p className="text-4xl">🧺</p>
          <p className="font-display mt-2 text-lg font-semibold">Your wardrobe is empty. Add your first item!</p>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((i) => (
            <li key={i.id} className="flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-pop">
              <WardrobeThumb item={i} className="aspect-[4/3] text-5xl" />
              <div className="flex flex-1 flex-col gap-1 border-t-2 border-ink p-2.5">
                <h3 className="font-display line-clamp-1 text-sm font-semibold">{i.name}</h3>
                <p className="text-xs text-stone">
                  {i.category}
                  {i.colour ? ` · ${i.colour}` : ""}
                </p>
                {i.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {i.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full bg-sage px-2 py-0.5 text-[11px] font-bold text-forest">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setItems(removeItem(i.id))}
                  aria-label={`Delete ${i.name}`}
                  className="mt-auto w-fit pt-1 text-xs font-bold text-coral underline-offset-2 hover:underline"
                >
                  🗑 Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
