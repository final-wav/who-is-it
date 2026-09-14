import React, { useState, useRef } from 'react';
import { Character, Deck } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import {
  getAllAvailableDecks,
  getAllCustomDecks,
  saveCustomDeck,
  deleteCustomDeck,
} from '../utils/decks';
import { useTheme } from '../hooks/useTheme';
import {
  Upload,
  Download,
  Save,
  Trash2,
  Camera,
  FolderOpen,
  Plus,
  ArrowLeft,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

async function compressImageFile(file: File, maxSize: number = 220): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const AdminDeckEditor: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [availableDecks, setAvailableDecks] = useState<Deck[]>(() => getAllAvailableDecks());
  const [activeDeck, setActiveDeck] = useState<Deck>(() => {
    const customs = getAllCustomDecks();
    if (customs.length > 0) return customs[0];
    return {
      id: `custom_${Date.now()}`,
      name: 'Eigenes Deck 1',
      description: 'Eigene Fotos und Namen',
      characters: Array.from({ length: 24 }).map((_, i) => ({
        id: `char_${i + 1}`,
        name: `Person ${i + 1}`,
        image: '',
        avatarSeed: `seed_${i + 1}`,
      })),
      isCustom: true,
    };
  });

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const handleNameChange = (index: number, newName: string) => {
    const updatedChars = [...activeDeck.characters];
    updatedChars[index] = { ...updatedChars[index], name: newName };
    setActiveDeck({ ...activeDeck, characters: updatedChars });
  };

  const handleFileUpload = async (index: number, file: File) => {
    try {
      const dataUrl = await compressImageFile(file);
      const updatedChars = [...activeDeck.characters];
      updatedChars[index] = { ...updatedChars[index], image: dataUrl };
      setActiveDeck({ ...activeDeck, characters: updatedChars });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedChars = [...activeDeck.characters];
    updatedChars[index] = { ...updatedChars[index], image: '' };
    setActiveDeck({ ...activeDeck, characters: updatedChars });
  };

  const handleSave = () => {
    saveCustomDeck(activeDeck);
    setAvailableDecks(getAllAvailableDecks());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCreateNew = () => {
    const newDeck: Deck = {
      id: `custom_${Date.now()}`,
      name: `Eigenes Deck ${getAllCustomDecks().length + 1}`,
      characters: Array.from({ length: 24 }).map((_, i) => ({
        id: `char_${i + 1}`,
        name: `Person ${i + 1}`,
        image: '',
        avatarSeed: `seed_${i + 1}`,
      })),
      isCustom: true,
    };
    setActiveDeck(newDeck);
  };

  const handleDelete = (deckId: string) => {
    if (confirm('Dieses Deck wirklich löschen?')) {
      deleteCustomDeck(deckId);
      const updated = getAllAvailableDecks();
      setAvailableDecks(updated);
      setActiveDeck(updated[0]);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(activeDeck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDeck.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.characters && Array.isArray(parsed.characters)) {
          const imported: Deck = {
            id: `custom_${Date.now()}`,
            name: parsed.name || 'Importiertes Deck',
            characters: parsed.characters,
            isCustom: true,
          };
          setActiveDeck(imported);
          saveCustomDeck(imported);
          setAvailableDecks(getAllAvailableDecks());
        }
      } catch (e) {
        alert('Ungültige Deck-JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white font-display p-3 sm:p-5 select-none">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        {/* Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-2 border-stone-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <a
              href={window.location.pathname}
              className="btn-board px-3 py-1.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 rounded-xl font-black text-xs flex items-center gap-1.5 border border-stone-300 dark:border-zinc-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Zum Spiel
            </a>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">
                <span className="text-red-600">Wer </span>
                <span className="text-stone-400 dark:text-zinc-500">ist </span>
                <span className="text-blue-600">es?</span>
                <span className="text-stone-500 dark:text-zinc-400 font-bold text-sm ml-2 font-sans normal-case tracking-normal">
                  — Deck-Editor
                </span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-zinc-400 font-bold font-sans">
                Eigene Fotos, Porträts und Namen für 24 Spielkarten anpassen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-xs hover:bg-stone-100 dark:hover:bg-zinc-700 transition"
              title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
            </button>
            <input
              type="file"
              ref={jsonImportRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleImport(e.target.files[0]);
              }}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => jsonImportRef.current?.click()}
              className="btn-board px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 rounded-xl text-xs font-black flex items-center gap-1.5 border border-stone-300 dark:border-zinc-700 shadow-2xs transition"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Import
            </button>
            <button
              onClick={handleExport}
              className="btn-board px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 rounded-xl text-xs font-black flex items-center gap-1.5 border border-stone-300 dark:border-zinc-700 shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Export
            </button>
            <button
              onClick={handleSave}
              className="btn-board px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Gespeichert!' : 'Speichern'}
            </button>
          </div>
        </header>

        {/* Deck List & Active Deck Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border-2 border-stone-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-sm">
          {/* Deck Chooser Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {availableDecks.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDeck(d)}
                className={`btn-board px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border-2 ${
                  activeDeck.id === d.id
                    ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                    : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 hover:border-stone-300 dark:hover:border-zinc-600'
                }`}
              >
                <span>{d.name}</span>
                {d.isCustom && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(d.id);
                    }}
                    className="hover:text-red-600 ml-1 text-sm font-black"
                    title="Löschen"
                  >
                    ×
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={handleCreateNew}
              className="btn-board px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition"
              title="Neues Deck anlegen"
            >
              <Plus className="w-3.5 h-3.5" /> Neu
            </button>
          </div>

          {/* Deck Name Input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 dark:text-zinc-400 font-black uppercase tracking-wider">Deck-Name:</span>
            <input
              type="text"
              value={activeDeck.name}
              onChange={(e) => setActiveDeck({ ...activeDeck, name: e.target.value })}
              className="px-3.5 py-1.5 bg-stone-50 dark:bg-zinc-800 border-2 border-stone-200 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* 24 Tiles Editor */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-stone-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200 dark:border-zinc-800">
            <span className="text-xs font-black text-stone-600 dark:text-zinc-400 uppercase tracking-wider">
              24 Karten dieses Decks ({activeDeck.characters.length} Personen)
            </span>
            <span className="text-xs text-stone-500 dark:text-zinc-400 font-bold font-sans">
              Klicke auf ein Bild, um ein Foto hochzuladen
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {activeDeck.characters.map((char, index) => {
              const hasCustomImg = Boolean(char.image);

              return (
                <div
                  key={char.id}
                  className="bg-amber-400 border-2 border-amber-500 rounded-2xl p-2 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition group/tile"
                >
                  {/* Avatar / Image Box */}
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-amber-600/30 bg-white group shadow-inner">
                    <CharacterAvatar character={char} />

                    {/* Overlay Upload Button */}
                    <label className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition p-1 text-center text-xs text-white backdrop-blur-2xs">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(index, e.target.files[0]);
                        }}
                      />
                      <Upload className="w-5 h-5 mb-1 text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {hasCustomImg ? 'Ändern' : 'Foto hochladen'}
                      </span>
                    </label>

                    {hasCustomImg && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm transition"
                        title="Foto löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Name Input */}
                  <input
                    type="text"
                    value={char.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder={`Person ${index + 1}`}
                    className="w-full text-center px-2 py-1.5 bg-white border-2 border-amber-500 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-stone-900 transition shadow-2xs"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
