import React from 'react';
import { Character } from '../../../worker/types';

interface CharacterAvatarProps {
  character: Character;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ character, className = 'w-full h-full' }) => {
  // If custom uploaded image exists (Data URL or HTTP URL), show it!
  if (character.image && character.image.trim() !== '') {
    return (
      <img
        src={character.image}
        alt={character.name}
        className={`${className} object-cover rounded-lg`}
        loading="lazy"
      />
    );
  }

  const attrs = character.attributes || {};
  const seed = character.avatarSeed || character.id || character.name;

  // Check if it's an animal deck character
  if (attrs.category || ['lion', 'tiger', 'elephant', 'giraffe', 'zebra', 'panda', 'kangaroo', 'koala', 'eagle', 'penguin', 'flamingo', 'parrot', 'dolphin', 'shark', 'whale', 'turtle', 'crocodile', 'frog', 'wolf', 'fox', 'bear', 'rabbit', 'owl', 'butterfly'].includes(seed)) {
    const animalEmojis: Record<string, string> = {
      lion: '🦁', tiger: '🐯', elephant: '🐘', giraffe: '🦒', zebra: '🦓',
      panda: '🐼', kangaroo: '🦘', koala: '🐨', eagle: '🦅', penguin: '🐧',
      flamingo: '🦩', parrot: '🦜', dolphin: '🐬', shark: '🦈', whale: '🐋',
      turtle: '🐢', crocodile: '🐊', frog: '🐸', wolf: '🐺', fox: '🦊',
      bear: '🐻', rabbit: '🐰', owl: '🦉', butterfly: '🦋',
    };
    const emoji = animalEmojis[seed] || '🐾';
    
    // Pick background color based on habitat
    const bg = attrs.habitat === 'water' ? 'from-cyan-600 to-blue-800' :
               attrs.habitat === 'air' ? 'from-sky-500 to-indigo-700' : 'from-amber-600 to-emerald-800';

    return (
      <div className={`${className} bg-gradient-to-br ${bg} flex items-center justify-center rounded-lg select-none shadow-inner`}>
        <span className="text-4xl filter drop-shadow-md transform transition-transform hover:scale-110">{emoji}</span>
      </div>
    );
  }

  // Classic Human Character SVG Generation
  const hairColorMap: Record<string, string> = {
    black: '#1f2937',
    brown: '#78350f',
    blonde: '#facc15',
    red: '#dc2626',
    white: '#f3f4f6',
  };
  const hairColor = hairColorMap[attrs.hairColor] || '#4b5563';

  const eyeColorMap: Record<string, string> = {
    blue: '#38bdf8',
    brown: '#92400e',
    green: '#22c55e',
  };
  const eyeColor = eyeColorMap[attrs.eyeColor] || '#1e293b';

  // Deterministic background gradient from seed
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-rose-500 to-orange-600',
    'from-violet-600 to-indigo-800',
    'from-cyan-600 to-teal-800',
    'from-emerald-600 to-green-800',
    'from-amber-500 to-red-600',
    'from-fuchsia-600 to-pink-700',
  ];
  const bgGrad = gradients[hash % gradients.length];

  const hasGlasses = Boolean(attrs.glasses);
  const hasHat = Boolean(attrs.hat);
  const facialHair = attrs.facialHair || 'none';
  const isFemale = attrs.gender === 'female';

  return (
    <div className={`${className} bg-gradient-to-br ${bgGrad} flex items-center justify-center rounded-lg overflow-hidden relative shadow-inner`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Soft back aura */}
        <circle cx="50" cy="50" r="45" fill="rgba(255, 255, 255, 0.12)" />

        {/* Shoulders / Shirt */}
        <path d="M 22 92 C 22 75 35 70 50 70 C 65 70 78 75 78 92 Z" fill="#334155" />
        <path d="M 40 70 L 50 82 L 60 70 Z" fill="#e2e8f0" />

        {/* Neck */}
        <rect x="44" y="58" width="12" height="15" rx="3" fill="#fed7aa" />

        {/* Face / Head */}
        <ellipse cx="50" cy="46" rx="20" ry="24" fill="#ffedd5" />

        {/* Cheeks */}
        <circle cx="36" cy="52" r="3" fill="#fca5a5" opacity="0.6" />
        <circle cx="64" cy="52" r="3" fill="#fca5a5" opacity="0.6" />

        {/* Hair - Base (Female long or short) */}
        {isFemale ? (
          <path
            d="M 28 38 C 28 20 72 20 72 38 C 74 52 74 65 68 68 C 64 63 68 45 68 38 C 68 28 32 28 32 38 C 32 45 36 63 32 68 C 26 65 26 52 28 38 Z"
            fill={hairColor}
          />
        ) : (
          <path
            d="M 28 40 C 28 22 72 22 72 40 C 74 34 70 24 50 22 C 30 24 26 34 28 40 Z"
            fill={hairColor}
          />
        )}

        {/* Eyes */}
        <circle cx="42" cy="45" r="3" fill="#ffffff" />
        <circle cx="58" cy="45" r="3" fill="#ffffff" />
        <circle cx="42" cy="45" r="1.8" fill={eyeColor} />
        <circle cx="58" cy="45" r="1.8" fill={eyeColor} />
        <circle cx="43" cy="44" r="0.6" fill="#ffffff" />
        <circle cx="59" cy="44" r="0.6" fill="#ffffff" />

        {/* Eyebrows */}
        <path d="M 38 39 Q 42 37 46 39" stroke={hairColor} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path d="M 54 39 Q 58 37 62 39" stroke={hairColor} strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* Nose */}
        <path d="M 50 46 Q 52 50 49 52" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Mouth / Smile */}
        <path d="M 44 57 Q 50 62 56 57" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Facial Hair */}
        {facialHair === 'mustache' && (
          <path
            d="M 41 55 Q 50 52 59 55 Q 50 58 41 55 Z"
            fill={hairColor}
          />
        )}
        {facialHair === 'beard' && (
          <path
            d="M 34 50 C 34 68 66 68 66 50 C 64 64 36 64 34 50 Z"
            fill={hairColor}
          />
        )}

        {/* Glasses */}
        {hasGlasses && (
          <g stroke="#0f172a" strokeWidth="1.8" fill="rgba(255, 255, 255, 0.25)">
            <circle cx="41" cy="45" r="6.5" />
            <circle cx="59" cy="45" r="6.5" />
            <line x1="47.5" y1="45" x2="52.5" y2="45" />
            <line x1="28" y1="44" x2="34.5" y2="45" />
            <line x1="65.5" y1="45" x2="72" y2="44" />
          </g>
        )}

        {/* Hat / Beanie / Cap */}
        {hasHat && (
          <g>
            <ellipse cx="50" cy="27" rx="25" ry="8" fill="#1e293b" />
            <path d="M 30 27 C 30 14 70 14 70 27 Z" fill="#0f172a" />
            <rect x="28" y="25" width="44" height="4" rx="2" fill="#ef4444" />
          </g>
        )}
      </svg>
    </div>
  );
};
