"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface FavoriteWine {
  id: string;
  notes: string;
  imageBase64?: string;
  mimeType?: string;
}

interface Profile {
  id: string;
  name: string;
  favorites: FavoriteWine[];
}

const DEFAULT_PROFILES: Profile[] = [
  { id: "1", name: "Roseviner", favorites: [] },
  { id: "2", name: "Rodviner", favorites: [] },
  { id: "3", name: "Vitviner", favorites: [] },
];

type View = "main" | "train";

const CREAM = "#F4EFE6";
const GOLD = "#C9A84C";

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>(DEFAULT_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [view, setView] = useState<View>("main");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [menuImage, setMenuImage] = useState<string | null>(null);
  const [menuMimeType, setMenuMimeType] = useState("image/jpeg");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);
  const [wineNotes, setWineNotes] = useState("");
  const [wineImage, setWineImage] = useState<string | null>(null);
  const [wineMimeType, setWineMimeType] = useState("image/jpeg");

  const menuInputRef = useRef<HTMLInputElement>(null);
  const wineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("winify-profiles");
    if (saved) setProfiles(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("winify-profiles", JSON.stringify(profiles));
  }, [profiles]);

  const handleMenuImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMenuMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => setMenuImage((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  };

  const handleWineImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWineMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => setWineImage((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  };

  const addFavoriteWine = () => {
    if (!wineNotes && !wineImage) return;
    const wine: FavoriteWine = {
      id: Date.now().toString(),
      notes: wineNotes,
      imageBase64: wineImage || undefined,
      mimeType: wineImage ? wineMimeType : undefined,
    };
    setProfiles(profiles.map(p =>
      p.id === editingProfileId ? { ...p, favorites: [...p.favorites, wine] } : p
    ));
    setWineNotes("");
    setWineImage(null);
    if (wineInputRef.current) wineInputRef.current.value = "";
  };

  const removeFavoriteWine = (profileId: string, wineId: string) => {
    setProfiles(profiles.map(p =>
      p.id === profileId ? { ...p, favorites: p.favorites.filter(w => w.id !== wineId) } : p
    ));
  };

  const addProfile = () => {
    if (!newProfileName.trim()) return;
    setProfiles([...profiles, { id: Date.now().toString(), name: newProfileName.trim(), favorites: [] }]);
    setNewProfileName("");
    setShowNewProfileInput(false);
  };

  const deleteProfile = (id: string) => {
    setProfiles(profiles.filter(p => p.id !== id));
    if (selectedProfileId === id) setSelectedProfileId(null);
  };

  const openTrainView = (profileId: string) => {
    setEditingProfileId(profileId);
    setWineNotes("");
    setWineImage(null);
    setView("train");
  };

  const analyzeMenu = async () => {
    if (!menuImage) return;
    setLoading(true);
    setResult("");
    const profile = profiles.find(p => p.id === selectedProfileId) || null;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: menuImage, mimeType: menuMimeType, profile }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch {
      setResult("Nagot gick fel. Forsok igen.");
    }
    setLoading(false);
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  const editingProfile = profiles.find(p => p.id === editingProfileId);

  // --- TRAIN VIEW ---
  if (view === "train" && editingProfile) {
    return (
      <main className="min-h-screen text-black relative" style={{ backgroundColor: CREAM }}>
        <Image
          src="/hero.png"
          alt=""
          width={420}
          height={420}
          className="fixed bottom-0 right-0 opacity-30 pointer-events-none select-none"
          style={{ objectFit: "contain", objectPosition: "bottom right" }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">
          <button
            onClick={() => setView("main")}
            className="text-black/40 hover:text-black mb-8 text-xs uppercase tracking-widest transition-colors"
          >
            Tillbaka
          </button>

          <p className="text-xs uppercase tracking-widest text-black/40 mb-1">Lar upp profil</p>
          <h1 className="text-4xl font-extrabold uppercase mb-10">{editingProfile.name}</h1>

          <div className="border border-black/15 rounded-2xl p-6 mb-8 bg-white/40 backdrop-blur-sm">
            <h2 className="font-bold text-xs uppercase tracking-widest text-black/40 mb-5">Lagg till favoritvin</h2>

            <div
              onClick={() => wineInputRef.current?.click()}
              className="border-2 border-dashed border-black/20 rounded-xl p-6 text-center cursor-pointer hover:border-black/50 transition-all mb-4"
            >
              {wineImage ? (
                <p className="font-semibold">Bild tillagd — klicka for att byta</p>
              ) : (
                <>
                  <p className="text-black/50 mb-1">Fota eller ladda upp vinflaskan</p>
                  <p className="text-black/30 text-sm">JPG, PNG eller WEBP</p>
                </>
              )}
            </div>
            <input ref={wineInputRef} type="file" accept="image/*" className="hidden" onChange={handleWineImage} />

            <textarea
              className="w-full border border-black/15 rounded-xl p-4 text-sm mb-4 resize-none focus:outline-none focus:border-black transition-colors placeholder-black/30 bg-white/60"
              rows={3}
              value={wineNotes}
              onChange={(e) => setWineNotes(e.target.value)}
              placeholder="Beskriv vinet (t.ex. Torr rose med jordgubb och citrus, lagom syra, Provence-stil)"
            />

            <button
              onClick={addFavoriteWine}
              disabled={!wineNotes && !wineImage}
              className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm bg-black text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Lagg till vin
            </button>
          </div>

          {editingProfile.favorites.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-widest text-black/40 mb-4">
                Sparade viner ({editingProfile.favorites.length})
              </p>
              <div className="flex flex-col gap-3">
                {editingProfile.favorites.map((wine) => (
                  <div key={wine.id} className="border border-black/10 rounded-xl p-4 flex gap-4 items-start bg-white/40">
                    {wine.imageBase64 && (
                      <img
                        src={`data:${wine.mimeType};base64,${wine.imageBase64}`}
                        alt="Vin"
                        className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black/70 leading-relaxed">{wine.notes || "Ingen beskrivning"}</p>
                    </div>
                    <button
                      onClick={() => removeFavoriteWine(editingProfile.id, wine.id)}
                      className="text-black/30 hover:text-red-500 transition-colors text-xs uppercase tracking-widest flex-shrink-0"
                    >
                      Ta bort
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-black/30 text-center text-sm">Inga favoritviner sparade an.</p>
          )}
        </div>
      </main>
    );
  }

  // --- MAIN VIEW ---
  return (
    <main className="min-h-screen text-black relative overflow-hidden" style={{ backgroundColor: CREAM }}>

      {/* Hero image bottom right */}
      <Image
        src="/hero.png"
        alt=""
        width={520}
        height={520}
        className="fixed bottom-0 right-0 pointer-events-none select-none"
        style={{ objectFit: "contain", objectPosition: "bottom right" }}
        priority
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-black/40 mb-3">Vinrekommendationer</p>
          <h1 className="text-7xl font-black uppercase tracking-tight leading-none">Wineify</h1>
        </div>

        {/* Smakprofiler */}
        <section className="mb-10">
          <p className="text-xs uppercase tracking-widest text-black/40 mb-4">Smakprofiler</p>
          <div className="flex flex-col gap-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`rounded-xl border transition-all ${
                  selectedProfileId === profile.id
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white/40 hover:border-black/40"
                }`}
              >
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => setSelectedProfileId(selectedProfileId === profile.id ? null : profile.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-bold uppercase tracking-wide">{profile.name}</div>
                    <div className={`text-xs mt-0.5 uppercase tracking-widest ${selectedProfileId === profile.id ? "text-white/50" : "text-black/40"}`}>
                      {profile.favorites.length === 0
                        ? "Inga favoritviner sparade"
                        : `${profile.favorites.length} favoritvin${profile.favorites.length > 1 ? "er" : ""}`}
                    </div>
                  </button>
                  <button
                    onClick={() => openTrainView(profile.id)}
                    className={`text-xs uppercase tracking-widest border px-3 py-1.5 rounded-lg transition-colors ${
                      selectedProfileId === profile.id
                        ? "border-white/30 text-white/60 hover:border-white hover:text-white"
                        : "border-black/20 text-black/40 hover:border-black hover:text-black"
                    }`}
                  >
                    Lar upp
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className={`text-xs uppercase tracking-widest transition-colors ml-1 ${
                      selectedProfileId === profile.id ? "text-white/30 hover:text-red-400" : "text-black/20 hover:text-red-500"
                    }`}
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            ))}

            {showNewProfileInput ? (
              <div className="border border-black/15 rounded-xl p-4 flex gap-2 bg-white/40">
                <input
                  className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-white/60 placeholder-black/30"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Profilnamn (t.ex. Bubbelvin)"
                  onKeyDown={(e) => e.key === "Enter" && addProfile()}
                  autoFocus
                />
                <button onClick={addProfile} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black/80 transition-colors">
                  Spara
                </button>
                <button onClick={() => setShowNewProfileInput(false)} className="border border-black/15 px-3 py-2 rounded-lg text-xs hover:border-black/40 transition-colors">
                  Avbryt
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewProfileInput(true)}
                className="rounded-xl border-2 border-dashed border-black/15 px-5 py-4 text-black/40 hover:text-black hover:border-black/40 transition-all text-left text-xs uppercase tracking-widest"
              >
                + Skapa ny profil
              </button>
            )}
          </div>
        </section>

        {/* Vinmeny */}
        <section className="mb-8">
          <p className="text-xs uppercase tracking-widest text-black/40 mb-4">Vinmeny</p>
          <div
            onClick={() => menuInputRef.current?.click()}
            className="border-2 border-dashed border-black/20 rounded-xl p-10 text-center cursor-pointer hover:border-black/50 transition-all bg-white/20"
          >
            {menuImage ? (
              <div>
                <p className="font-bold uppercase tracking-wide mb-1">Bild uppladdad</p>
                <p className="text-black/40 text-sm">Klicka for att byta bild</p>
              </div>
            ) : (
              <div>
                <p className="text-black/50 mb-1">Ladda upp en bild pa vinmenyn</p>
                <p className="text-black/30 text-sm">JPG, PNG eller WEBP</p>
              </div>
            )}
          </div>
          <input ref={menuInputRef} type="file" accept="image/*" className="hidden" onChange={handleMenuImage} />
        </section>

        {/* Analysera */}
        <button
          onClick={analyzeMenu}
          disabled={!menuImage || loading}
          className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-lg text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: GOLD }}
        >
          {loading ? "Analyserar..." : "Hitta mitt favoritvin"}
        </button>

        {selectedProfile && (
          <p className="text-center text-black/40 text-xs uppercase tracking-widest mt-3">
            Matchar mot: {selectedProfile.name}
            {selectedProfile.favorites.length > 0 && ` (${selectedProfile.favorites.length} favoritviner)`}
          </p>
        )}

        {/* Resultat */}
        {result && (
          <section className="mt-10 border border-black/10 rounded-2xl p-6 bg-white/40 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-black/40 mb-4">Vinanalys</p>
            <div className="text-black/80 whitespace-pre-wrap leading-relaxed text-sm">
              {result}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
