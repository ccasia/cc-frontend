import { useLayoutEffect } from 'react';

const SESSION_HINT = 'cc-boot-shell';
const SNAP_PREFIX = 'cc-boot-snap:';
const SNAP_INDEX = 'cc-boot-snaps';
const SNAP_LIMIT = 8;

// Keep in sync with the boot script in index.html.
const breakpoint = (width) => {
  if (width >= 1536) return 'xl';
  if (width >= 1200) return 'lg';
  if (width >= 900) return 'md';
  if (width >= 600) return 'sm';
  return 'xs';
};

// The HTML boot screen in index.html covers the app until the first real view is ready.
export function hideBootScreen(onlyMode) {
  const boot = document.getElementById('boot');
  if (!boot || (onlyMode && boot.dataset.mode !== onlyMode)) return;
  boot.remove();
}

export function rememberDashboardSession() {
  try {
    localStorage.setItem(SESSION_HINT, '1');
  } catch (error) {
    // Storage can be blocked; the boot screen falls back to the ring.
  }
}

export function forgetDashboardSession() {
  try {
    localStorage.removeItem(SESSION_HINT);
    JSON.parse(localStorage.getItem(SNAP_INDEX) || '[]').forEach((key) =>
      localStorage.removeItem(key)
    );
    localStorage.removeItem(SNAP_INDEX);
    // Cached campaign names and counts belong to this user only.
    Object.keys(localStorage)
      .filter((key) => key.startsWith('cc-campaign-'))
      .forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    // Storage can be blocked; nothing to clear.
  }
}

// Skeleton loops (the wave shimmer, or the reduced-motion pulse) all run on the page clock,
// so a skeleton that mounts later moves in step with the ones already on screen.
const isSkeletonLoop = (animation) =>
  animation.effect?.getTiming().iterations === Infinity &&
  animation.effect.target?.matches?.('.MuiSkeleton-root, .bt-sk');

const toPageClock = (animation) => {
  if (animation.startTime !== 0) animation.startTime = 0;
};

function syncShimmers() {
  document.getAnimations?.().filter(isSkeletonLoop).forEach(toPageClock);
}

let followingShimmers = false;

function followNewShimmers() {
  if (followingShimmers || !document.getAnimations) return;
  followingShimmers = true;
  document.addEventListener('animationstart', (event) => {
    if (!event.target.matches?.('.MuiSkeleton-root')) return;
    event.target.getAnimations({ subtree: true }).filter(isSkeletonLoop).forEach(toPageClock);
  });
}

// Only the rules the snapshot uses, plus global, font and keyframe rules.
function collectCss(used) {
  const pick = (rule) => {
    if (rule instanceof CSSStyleRule) {
      const classes = rule.selectorText.match(/\.[\w-]+/g);
      return !classes || classes.some((name) => used.has(name.slice(1))) ? rule.cssText : '';
    }
    if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
      const inner = [...rule.cssRules].map(pick).join('');
      const at = rule instanceof CSSMediaRule ? 'media' : 'supports';
      return inner && `@${at} ${rule.conditionText}{${inner}}`;
    }
    if (rule instanceof CSSKeyframesRule || rule instanceof CSSFontFaceRule) return rule.cssText;
    return '';
  };

  return [...document.styleSheets]
    .filter((sheet) => sheet.ownerNode?.id !== 'boot-css')
    .map((sheet) => {
      let rules;
      try {
        rules = [...sheet.cssRules];
      } catch (error) {
        return '';
      }
      const css = rules.map(pick).join('');
      if (!sheet.href) return css;
      return css.replace(
        /url\((['"]?)(?![a-z]+:|\/)([^'")]+)\1\)/gi,
        (match, quote, path) => `url("${new URL(path, sheet.href)}")`
      );
    })
    .join('');
}

// Saves the app's first frame (real chrome + loading skeletons) so the next refresh can show it at once.
function saveBootSnapshot(snapshot, url, width) {
  snapshot.querySelectorAll('script, iframe, noscript').forEach((node) => node.remove());
  snapshot.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));

  const used = new Set();
  snapshot
    .querySelectorAll('[class]')
    .forEach((node) => node.classList.forEach((name) => used.add(name)));

  const key = `${SNAP_PREFIX}${url}|${breakpoint(width)}`;
  try {
    const index = JSON.parse(localStorage.getItem(SNAP_INDEX) || '[]').filter(
      (item) => item !== key
    );
    index.unshift(key);
    index.splice(SNAP_LIMIT).forEach((item) => localStorage.removeItem(item));
    localStorage.setItem(SNAP_INDEX, JSON.stringify(index));
    localStorage.setItem(key, JSON.stringify({ html: snapshot.innerHTML, css: collectCss(used) }));
  } catch (error) {
    // Storage full or blocked; the boot screen falls back to the generic frame.
  }
}

// Mounts after the page inside the same Suspense boundary, so its layout effect runs last.
// The snapshot waits one microtask so icons that render right after mount (Iconify) are in it,
// which is still before paint and before any data can arrive.
export function BootRelease() {
  useLayoutEffect(() => {
    let active = true;
    let timer;
    queueMicrotask(() => {
      const snapshot = active && document.getElementById('root')?.cloneNode(true);
      const url = window.location.pathname + window.location.search;
      const width = window.innerWidth;
      if (snapshot) timer = setTimeout(() => saveBootSnapshot(snapshot, url, width), 300);
    });

    rememberDashboardSession();
    syncShimmers();
    followNewShimmers();
    hideBootScreen();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
