import React, { useState, useRef } from 'react';
import { Character, Deck } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import {
  getAllAvailableDecks,
  getAllCustomDecks,
  saveCustomDeck,
  deleteCustomDeck,
} from '../utils/decks';
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
    <div className="min-h-screen bg-slate-950 text-stone-100 p-3 sm:p-5">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        {/* Top Bar */}
        <header className="flex items-center justify-between bg-slate-900 border-2 border-slate-800 p-3.5 rounded-xl shadow-tray">
          <div className="flex items-center gap-3">
            <a
              href={window.location.pathname}
              className="btn-toy px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-stone-300 rounded font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Zum Spiel
            </a>
            <div>
              <h1 className="text-lg font-display font-black text-white">
                Admin: Deck-Editor & Foto-Upload
              </h1>
              <p className="text-xs text-stone-400">
                Nur über diese geheime URL erreichbar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              className="btn-toy px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-stone-300 rounded text-xs font-bold flex items-center gap-1"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Import
            </button>
            <button
              onClick={handleExport}
              className="btn-toy px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-stone-300 rounded text-xs font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={handleSave}
              className="btn-toy px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-black uppercase tracking-wider flex items-center gap-1"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Gespeichert' : 'Speichern'}
            </button>
          </div>
        </header>

        {/* Deck List & Active Deck Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border-2 border-slate-800 p-3 rounded-xl">
          {/* Deck Chooser Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {availableDecks.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDeck(d)}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  activeDeck.id === d.id
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-800 text-stone-400 hover:text-white'
                }`}
              >
                <span>{d.name}</span>
                {d.isCustom && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(d.id);
                    }}
                    className="hover:text-red-600 ml-1"
                    title="Löschen"
                  >
                    ×
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={handleCreateNew}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs font-bold flex items-center gap-1"
              title="Neues Deck anlegen"
            >
              <Plus className="w-3 h-3" /> Neu
            </button>
          </div>

          {/* Deck Name Input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-bold">Deck-Name:</span>
            <input
              type="text"
              value={activeDeck.name}
              onChange={(e) => setActiveDeck({ ...activeDeck, name: e.target.value })}
              className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white font-bold focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 24 Tiles Editor */}
        <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-3 sm:p-4 shadow-tray">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {activeDeck.characters.map((char, index) => {
              const hasCustomImg = Boolean(char.image);

              return (
                <div
                  key={char.id}
                  className="bg-amber-400 border-2 border-amber-600 rounded-lg p-1.5 flex flex-col items-center gap-1 shadow-tile-up"
                >
                  {/* Avatar / Image Box */}
                  <div className="relative w-full aspect-square rounded overflow-hidden border border-amber-500 bg-white group">
                    <CharacterAvatar character={char} />

                    {/* Overlay Upload Button */}
                    <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition p-1 text-center text-xs text-white">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(index, e.target.files[0]);
                        }}
                      />
                      <Upload className="w-4 h-4 mb-0.5 text-amber-400" />
                      <span className="text-[9px] font-black uppercase">
                        {hasCustomImg ? 'Ändern' : 'Foto'}
                      </span>
                    </label>

                    {hasCustomImg && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="absolute top-1 right-1 p-0.5 bg-red-700 text-white rounded hover:bg-red-600"
                        title="Foto löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Name Input */}
                  <input
                    type="text"
                    value={char.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder={`Person ${index + 1}`}
                    className="w-full text-center px-1 py-0.5 bg-white border border-amber-500 rounded text-xs font-black text-slate-900 focus:outline-none"
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
