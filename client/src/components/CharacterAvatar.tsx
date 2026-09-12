import React from 'react';
import { Character } from '../../../worker/types';

interface CharacterAvatarProps {
  character: Character;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ character, className = 'w-full h-full' }) => {
  if (character.image && character.image.trim() !== '') {
    return (
      <img
        src={character.image}
        alt={character.name}
        className={`${className} object-cover`}
        loading="lazy"
      />
    );
  }

  const attrs = character.attributes || {};
  const seed = (character.avatarSeed || character.name || '').toLowerCase();

  // Animal deck handling
  if (attrs.category || ['lion', 'tiger', 'elephant', 'giraffe', 'zebra', 'panda', 'kangaroo', 'koala', 'eagle', 'penguin', 'flamingo', 'parrot', 'dolphin', 'shark', 'whale', 'turtle', 'crocodile', 'frog', 'wolf', 'fox', 'bear', 'rabbit', 'owl', 'butterfly'].includes(seed)) {
    const animalEmojis: Record<string, string> = {
      lion: '🦁', tiger: '🐯', elephant: '🐘', giraffe: '🦒', zebra: '🦓',
      panda: '🐼', kangaroo: '🦘', koala: '🐨', eagle: '🦅', penguin: '🐧',
      flamingo: '🦩', parrot: '🦜', dolphin: '🐬', shark: '🦈', whale: '🐋',
      turtle: '🐢', crocodile: '🐊', frog: '🐸', wolf: '🐺', fox: '🦊',
      bear: '🐻', rabbit: '🐰', owl: '🦉', butterfly: '🦋',
    };
    return (
      <div className={`${className} bg-[#dbeafe] flex items-center justify-center select-none`}>
        <span className="text-4xl filter drop-shadow">{animalEmojis[seed] || '🐾'}</span>
      </div>
    );
  }

  // Classic Human Character SVG Generation (Authentic Who Is It Style)
  const hairColorMap: Record<string, string> = {
    black: '#1c1917',
    brown: '#78350f',
    blonde: '#facc15',
    red: '#ea580c',
    white: '#f1f5f9',
  };
  const hairColor = hairColorMap[attrs.hairColor] || '#78350f';

  const isFemale = attrs.gender === 'female';
  const hasGlasses = Boolean(attrs.glasses);
  const facialHair = attrs.facialHair || 'none';

  // Hat specific colors
  const isThomas = seed.includes('thomas');
  const isEmma = seed.includes('emma');
  const isPeter = seed.includes('peter');
  const isJohn = seed.includes('john');
  const isAmy = seed.includes('amy');
  const isRichard = seed.includes('richard');
  const isDavid = seed.includes('david');

  return (
    <div className={`${className} bg-[#e0f2fe] flex items-center justify-center overflow-hidden relative select-none`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Soft background glow */}
        <circle cx="50" cy="45" r="38" fill="#f0f9ff" />

        {/* Neck */}
        <rect x="43" y="60" width="14" height="15" rx="3" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.8" />

        {/* Head Base */}
        <ellipse cx="50" cy="46" rx="22" ry="24" fill="#ffedd5" stroke="#ea580c" strokeWidth="1" />

        {/* Cheeks */}
        <circle cx="34" cy="52" r="3.5" fill="#f87171" opacity="0.45" />
        <circle cx="66" cy="52" r="3.5" fill="#f87171" opacity="0.45" />

        {/* Hair Back / Female Hair */}
        {isFemale && (
          <path
            d="M 24 38 C 22 20 78 20 76 38 C 80 55 78 70 70 72 C 65 65 70 48 70 38 C 70 26 30 26 30 38 C 30 48 35 65 30 72 C 22 70 20 55 24 38 Z"
            fill={hairColor}
            stroke="#451a03"
            strokeWidth="1.2"
          />
        )}

        {/* Male Hair / Richard Bald with Bushy Sides */}
        {!isFemale && (
          isRichard ? (
            <g fill={hairColor} stroke="#451a03" strokeWidth="1.2">
              <circle cx="26" cy="44" r="8" />
              <circle cx="74" cy="44" r="8" />
            </g>
          ) : (
            <path
              d="M 26 40 C 24 20 76 20 74 40 C 76 32 70 23 50 21 C 30 23 24 32 26 40 Z"
              fill={hairColor}
              stroke="#451a03"
              strokeWidth="1.2"
            />
          )
        )}

        {/* Eyes (Big friendly cartoon pupils) */}
        <ellipse cx="40" cy="44" rx="4.5" ry="5" fill="#ffffff" stroke="#1c1917" strokeWidth="1.2" />
        <ellipse cx="60" cy="44" rx="4.5" ry="5" fill="#ffffff" stroke="#1c1917" strokeWidth="1.2" />
        <circle cx="41" cy="44.5" r="2.6" fill="#1e293b" />
        <circle cx="61" cy="44.5" r="2.6" fill="#1e293b" />
        <circle cx="42" cy="43" r="0.9" fill="#ffffff" />
        <circle cx="62" cy="43" r="0.9" fill="#ffffff" />

        {/* Eyebrows */}
        <path d="M 35 37 Q 41 34 46 37" stroke={hairColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M 54 37 Q 59 34 65 37" stroke={hairColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />

        {/* Big Cartoon Nose */}
        <path d="M 48 44 Q 54 48 49 52" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Big Smile */}
        <path d="M 40 58 Q 50 67 60 58" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" fill="#ffffff" />

        {/* Facial Hair */}
        {(facialHair === 'mustache' || isDavid || isRichard) && (
          <path
            d="M 37 56 Q 50 50 63 56 Q 50 62 37 56 Z"
            fill={hairColor}
            stroke="#451a03"
            strokeWidth="1"
          />
        )}
        {(facialHair === 'beard' || isPeter) && (
          <path
            d="M 32 50 C 32 75 68 75 68 50 C 64 68 36 68 32 50 Z"
            fill={hairColor}
            stroke="#451a03"
            strokeWidth="1.2"
          />
        )}

        {/* Eyeglasses */}
        {(hasGlasses || isJohn || isRichard) && (
          <g stroke={isJohn ? '#2563eb' : '#b45309'} strokeWidth="2.4" fill="rgba(255, 255, 255, 0.2)">
            <circle cx="40" cy="44" r="7.5" />
            <circle cx="60" cy="44" r="7.5" />
            <line x1="47.5" y1="44" x2="52.5" y2="44" />
          </g>
        )}

        {/* Hats from the reference photo */}
        {isThomas && (
          // Red Baseball Cap
          <g>
            <ellipse cx="50" cy="27" rx="22" ry="10" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            <path d="M 28 27 C 28 14 72 14 72 27 Z" fill="#b91c1c" />
            <path d="M 42 27 Q 66 23 76 31 Q 58 33 42 27" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          </g>
        )}

        {isEmma && (
          // Green Beret
          <g>
            <ellipse cx="48" cy="26" rx="24" ry="11" fill="#15803d" stroke="#166534" strokeWidth="1.5" transform="rotate(-6 48 26)" />
            <circle cx="46" cy="16" r="2.5" fill="#166534" />
          </g>
        )}

        {isPeter && (
          // Green Hunter / Robin Hood Hat
          <g>
            <path d="M 26 31 C 35 15 65 15 74 31 Z" fill="#15803d" stroke="#14532d" strokeWidth="1.5" />
            <path d="M 64 22 L 74 12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {isJohn && (
          // Blue Sunhat with Red Ribbon
          <g>
            <ellipse cx="50" cy="29" rx="27" ry="8" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
            <path d="M 32 29 C 32 17 68 17 68 29 Z" fill="#1d4ed8" />
            <rect x="32" y="27" width="36" height="3" fill="#dc2626" />
          </g>
        )}

        {isAmy && (
          // Amy's Blue Hat with Yellow Ribbon
          <g>
            <ellipse cx="50" cy="28" rx="26" ry="8" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
            <path d="M 32 28 C 32 16 68 16 68 28 Z" fill="#1d4ed8" />
            <rect x="32" y="26" width="36" height="3" fill="#facc15" />
          </g>
        )}

        {/* Iconic Green Sweater with Name on Chest */}
        <path d="M 12 95 C 12 73 34 68 50 68 C 66 68 88 73 88 95 Z" fill="#166534" stroke="#14532d" strokeWidth="1.5" />
        <path d="M 40 68 L 50 78 L 60 68 Z" fill="#ffedd5" />

        {/* Name Printed Across the Green Sweater */}
        <text
          x="50"
          y="90"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="Fredoka, sans-serif"
          letterSpacing="0.5"
        >
          {character.name.toUpperCase()}
        </text>
      </svg>
    </div>
  );
};
