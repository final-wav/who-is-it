import React, { useState, useRef } from 'react';
import { Character, Deck } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import {
  X,
  Upload,
  Download,
  Save,
  Trash2,
  Camera,
  FileJson,
  Check,
  FolderOpen,
} from 'lucide-react';

interface DeckCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomDeck: (deck: Deck) => void;
}

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

export const DeckCreatorModal: React.FC<DeckCreatorModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomDeck,
}) => {
  const [deckName, setDeckName] = useState<string>('Mein Foto-Deck');
  const [deckDesc, setDeckDesc] = useState<string>('Eigene Bilder und Namen');
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('who_is_it_custom_deck');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.characters && parsed.characters.length >= 24) {
          return parsed.characters;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const defaultNames = [
      'Alex', 'Ben', 'Clara', 'David', 'Emma', 'Felix',
      'Greta', 'Hannah', 'Jonas', 'Leon', 'Lina', 'Lukas',
      'Mia', 'Noah', 'Paul', 'Sarah', 'Simon', 'Sophie',
      'Tim', 'Tom', 'Laura', 'Max', 'Anna', 'Julian'
    ];

    return Array.from({ length: 24 }).map((_, i) => ({
      id: `custom_char_${i + 1}`,
      name: defaultNames[i] || `Person ${i + 1}`,
      image: '',
      avatarSeed: `seed_${i + 1}`,
      attributes: {},
    }));
  });

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...characters];
    updated[index] = { ...updated[index], name: newName };
    setCharacters(updated);
  };

  const handleFileUpload = async (index: number, file: File) => {
    try {
      const dataUrl = await compressImageFile(file);
      const updated = [...characters];
      updated[index] = { ...updated[index], image: dataUrl };
      setCharacters(updated);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...characters];
    updated[index] = { ...updated[index], image: '' };
    setCharacters(updated);
  };

  const handleSaveDeck = () => {
    const customDeck: Deck = {
      id: `custom_${Date.now()}`,
      name: deckName.trim() || 'Benutzerdefiniertes Deck',
      description: deckDesc.trim(),
      characters,
      isCustom: true,
    };

    localStorage.setItem('who_is_it_custom_deck', JSON.stringify(customDeck));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUseDeckNow = () => {
    const customDeck: Deck = {
      id: `custom_${Date.now()}`,
      name: deckName.trim() || 'Benutzerdefiniertes Deck',
      description: deckDesc.trim(),
      characters,
      isCustom: true,
    };

    localStorage.setItem('who_is_it_custom_deck', JSON.stringify(customDeck));
    onSelectCustomDeck(customDeck);
    onClose();
  };

  const handleExportJSON = () => {
    const customDeck: Deck = {
      id: `custom_${Date.now()}`,
      name: deckName.trim() || 'Benutzerdefiniertes Deck',
      description: deckDesc.trim(),
      characters,
      isCustom: true,
    };
    const blob = new Blob([JSON.stringify(customDeck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckName.toLowerCase().replace(/\s+/g, '_')}_deck.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.characters && Array.isArray(parsed.characters)) {
          setDeckName(parsed.name || 'Importiertes Deck');
          setDeckDesc(parsed.description || '');
          setCharacters(parsed.characters);
        }
      } catch (err) {
        alert('Fehler beim Importieren der Deck-JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-stone-200 rounded-lg border border-slate-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-white">
                Karten-Werkstatt: Eigene Fotos & Namen
              </h2>
              <p className="text-xs text-stone-400">
                Lade Bilder von Freunden, Familie oder Promis hoch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Name des Decks (z. B. Freundeskreis)"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-retro-blue"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={jsonImportInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleImportJSON(e.target.files[0]);
              }}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => jsonImportInputRef.current?.click()}
              className="btn-tactile px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-stone-300 text-xs font-semibold rounded border border-slate-700 flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Import
            </button>

            <button
              onClick={handleExportJSON}
              className="btn-tactile px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-stone-300 text-xs font-semibold rounded border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>

            <button
              onClick={handleSaveDeck}
              className="btn-tactile px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-stone-200 text-xs font-semibold rounded border border-slate-700 flex items-center gap-1.5"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5 text-retro-green" /> : <Save className="w-3.5 h-3.5" />}
              {saveSuccess ? 'Gespeichert' : 'Speichern'}
            </button>
          </div>
        </div>

        {/* 24 Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {characters.map((char, index) => {
              const hasCustomImg = Boolean(char.image);

              return (
                <div
                  key={char.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center gap-1.5 hover:border-slate-600 transition"
                >
                  {/* Avatar / Image Preview */}
                  <div className="relative w-full aspect-square rounded overflow-hidden border border-slate-700 bg-slate-950 group">
                    <CharacterAvatar character={char} />

                    {/* Upload / Replace Overlay Button */}
                    <label className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition p-2 text-center text-xs text-white">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(index, e.target.files[0]);
                        }}
                      />
                      <Upload className="w-4 h-4 mb-1 text-stone-300" />
                      <span className="text-[10px] font-bold uppercase">{hasCustomImg ? 'Ändern' : 'Foto wählen'}</span>
                    </label>

                    {hasCustomImg && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="absolute top-1 right-1 p-1 bg-retro-red-dark text-white rounded hover:bg-retro-red transition"
                        title="Bild entfernen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Character Name Input */}
                  <input
                    type="text"
                    value={char.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder={`Name ${index + 1}`}
                    className="w-full text-center px-1.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-semibold text-white focus:outline-none focus:border-retro-blue"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-stone-400 font-mono">
            {characters.filter(c => Boolean(c.image)).length} / 24 mit Foto
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-stone-400 hover:text-white transition"
            >
              Abbrechen
            </button>
            <button
              onClick={handleUseDeckNow}
              className="btn-tactile px-4 py-2 bg-retro-blue hover:bg-retro-blue-dark text-white text-xs sm:text-sm font-bold rounded-lg shadow-tactile flex items-center gap-1.5 uppercase tracking-wide"
            >
              <Check className="w-4 h-4" /> Deck im Spiel verwenden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
