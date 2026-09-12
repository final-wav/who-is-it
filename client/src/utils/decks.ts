import classicDeckRaw from '../../../decks/classic.json';
import animalsDeckRaw from '../../../decks/animals.json';
import { Deck } from '../../../worker/types';

export function getAllAvailableDecks(): Deck[] {
  const baseDecks: Deck[] = [
    classicDeckRaw as unknown as Deck,
    animalsDeckRaw as unknown as Deck,
  ];

  try {
    const customList = localStorage.getItem('who_is_it_custom_decks');
    if (customList) {
      const parsed = JSON.parse(customList);
      if (Array.isArray(parsed)) {
        return [...baseDecks, ...parsed];
      }
    }
    const single = localStorage.getItem('who_is_it_custom_deck');
    if (single) {
      const parsed = JSON.parse(single);
      if (parsed && parsed.name) {
        return [...baseDecks, parsed];
      }
    }
  } catch (e) {
    console.error(e);
  }

  return baseDecks;
}

export function getAllCustomDecks(): Deck[] {
  try {
    const customList = localStorage.getItem('who_is_it_custom_decks');
    if (customList) {
      const parsed = JSON.parse(customList);
      if (Array.isArray(parsed)) return parsed;
    }
    const single = localStorage.getItem('who_is_it_custom_deck');
    if (single) {
      const parsed = JSON.parse(single);
      if (parsed && parsed.name) return [parsed];
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveCustomDeck(deck: Deck) {
  try {
    const list = getAllCustomDecks().filter((d) => d.id !== deck.id);
    list.push(deck);
    localStorage.setItem('who_is_it_custom_decks', JSON.stringify(list));
    localStorage.setItem('who_is_it_custom_deck', JSON.stringify(deck));
  } catch (e) {
    console.error(e);
  }
}

export function deleteCustomDeck(deckId: string) {
  try {
    const list = getAllCustomDecks().filter((d) => d.id !== deckId);
    localStorage.setItem('who_is_it_custom_decks', JSON.stringify(list));
    if (localStorage.getItem('who_is_it_custom_deck')) {
      const single = JSON.parse(localStorage.getItem('who_is_it_custom_deck') || '{}');
      if (single.id === deckId) {
        localStorage.removeItem('who_is_it_custom_deck');
      }
    }
  } catch (e) {
    console.error(e);
  }
}
