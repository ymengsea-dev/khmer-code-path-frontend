const GLASS_CLASS_MARKERS = ["liquid-glass-btn", "topbar-pill", "glass-panel", "glass-btn-primary"] as const;

function isDisabled(el: HTMLElement): boolean {
  return (
    el.matches(":disabled") ||
    el.getAttribute("aria-disabled") === "true" ||
    el.closest(":disabled") !== null
  );
}

function hasGlassClass(el: HTMLElement): boolean {
  return GLASS_CLASS_MARKERS.some((marker) => el.classList.contains(marker));
}

function hasGlassInlineStyle(el: HTMLElement): boolean {
  const attr = el.getAttribute("style") ?? "";
  if (attr.includes("--glass") || attr.includes("glass-bg")) return true;

  const { background, backgroundColor, backdropFilter, webkitBackdropFilter } = el.style;
  const inline = `${background} ${backgroundColor} ${backdropFilter} ${webkitBackdropFilter}`;
  if (inline.includes("var(--glass") || inline.includes("--glass")) return true;
  if (backdropFilter || webkitBackdropFilter) return true;

  const computed = window.getComputedStyle(el);
  return computed.backdropFilter !== "none" && computed.backdropFilter !== "";
}

function isMenuTrigger(el: HTMLElement): boolean {
  return (
    el.matches('[data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-sub-trigger"]') ||
    el.getAttribute("aria-haspopup") === "menu"
  );
}

/** True for liquid-glass styled controls that should get press bounce feedback. */
export function isLiquidGlassButton(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (isDisabled(el)) return false;
  if (el.dataset.noGlassBounce !== undefined) return false;
  if (el.closest("[data-no-glass-bounce]")) return false;

  // Menu triggers use instant CSS :active press — not the JS keyframe bounce.
  if (isMenuTrigger(el)) return false;

  // `<Button>` already uses Framer Motion press feedback.
  if (el.matches('[data-slot="button"]')) return false;

  const interactive = el.matches('button, [role="button"], a[href], input[type="button"], input[type="submit"]');
  if (!interactive) return false;

  return hasGlassClass(el) || hasGlassInlineStyle(el);
}

export function triggerGlassPress(el: HTMLElement): void {
  el.classList.remove("bouncy-press-active");
  void el.offsetWidth;

  const onEnd = (event: AnimationEvent) => {
    if (event.animationName !== "bouncy-press") return;
    el.classList.remove("bouncy-press-active");
    el.removeEventListener("animationend", onEnd);
  };

  el.addEventListener("animationend", onEnd);
  el.classList.add("bouncy-press-active");
}
