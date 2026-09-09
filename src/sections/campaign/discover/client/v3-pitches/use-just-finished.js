import { useState } from 'react';

/**
 * True after `active` goes true → false. Stays true until `active` becomes
 * true again. Used so a scrape reveal plays once when loading ends, not on
 * every mount of an already-ready row.
 */
export default function useJustFinished(active) {
  const [prev, setPrev] = useState(active);
  const [justFinished, setJustFinished] = useState(false);

  if (active !== prev) {
    setPrev(active);
    setJustFinished(!active && prev);
  }

  return justFinished;
}
