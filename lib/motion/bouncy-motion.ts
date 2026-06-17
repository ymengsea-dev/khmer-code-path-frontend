/** Shared easing curves — matches Cmd+/ spotlight search morph. */
export const BOUNCY_EASE = [0.17, 0.84, 0.32, 1.18] as const;
export const BOUNCY_EASE_SNAPPY = [0.18, 0.89, 0.32, 1.16] as const;
export const BOUNCY_EASE_RESULTS = [0.18, 0.89, 0.32, 1.18] as const;

export const bouncyDurations = {
  enter: 0.42,
  morph: 0.76,
  press: 0.32,
  loading: 1.2,
  stagger: 0.06,
} as const;

/** Tap — slight press-in; spring on release overshoots past 1.0 smoothly. */
export const bouncyPressTap = { scale: 0.98 };
export const bouncyPressHover = { scale: 1.015 };

/** Smooth spring — enough overshoot to feel alive, not wobbly. */
export const bouncyPressSpring = {
  type: "spring" as const,
  stiffness: 320,
  damping: 22,
  mass: 0.85,
};

export const bouncyTransitions = {
  enter: { duration: bouncyDurations.enter, ease: BOUNCY_EASE },
  morph: { duration: bouncyDurations.morph, ease: BOUNCY_EASE },
  press: bouncyPressSpring,
  loading: { duration: bouncyDurations.loading, ease: BOUNCY_EASE, repeat: Infinity },
} as const;

/** Mount — cards, panels, list rows. */
export const bouncyEnterVariants = {
  initial: { opacity: 0, y: -8, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: bouncyDurations.enter,
      ease: BOUNCY_EASE,
      opacity: { duration: 0.22 },
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.24, ease: BOUNCY_EASE_SNAPPY },
  },
} as const;

/** Overshoot open — dialogs, shells (search open feel). */
export const bouncyOpenVariants = {
  initial: { opacity: 0, y: -12, scale: 0.92 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.48,
      ease: BOUNCY_EASE,
      y: { duration: 0.48, ease: BOUNCY_EASE },
      scale: { duration: 0.52, ease: BOUNCY_EASE },
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.88,
    transition: { duration: 0.28, ease: BOUNCY_EASE_SNAPPY },
  },
} as const;

/** Width / shape morph — compact ↔ wide transitions. */
export const bouncyMorphVariants = {
  initial: { scaleX: 0.86, scaleY: 1 },
  animate: {
    scaleX: 1,
    scaleY: 1,
    transition: {
      duration: bouncyDurations.morph,
      ease: BOUNCY_EASE,
      scaleX: {
        duration: bouncyDurations.morph,
        ease: BOUNCY_EASE,
        times: [0, 0.64, 1],
        keyframes: [0.86, 1.025, 1],
      },
      scaleY: {
        duration: bouncyDurations.morph,
        ease: BOUNCY_EASE,
        times: [0, 0.64, 1],
        keyframes: [1, 0.985, 1],
      },
    },
  },
} as const;

/** Staggered list children. */
export const bouncyStaggerContainerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: bouncyDurations.stagger, delayChildren: 0.04 },
  },
} as const;

export const bouncyStaggerItemVariants = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: bouncyDurations.enter,
      ease: BOUNCY_EASE_RESULTS,
      y: {
        duration: bouncyDurations.enter,
        ease: BOUNCY_EASE_RESULTS,
        times: [0, 0.65, 1],
        keyframes: [-6, 1, 0],
      },
      scale: {
        duration: bouncyDurations.enter,
        ease: BOUNCY_EASE_SNAPPY,
        times: [0, 0.65, 1],
        keyframes: [0.98, 1.01, 1],
      },
    },
  },
} as const;

/** List rows / cards — smooth fade + slide with a light scale pop. */
export const bouncyListItemVariants = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: bouncyDurations.enter, ease: BOUNCY_EASE },
  },
} as const;

/** Loading pulse — skeleton cards, spinners. */
export const bouncyLoadingVariants = {
  initial: { opacity: 0.45, scaleX: 0.94, scaleY: 1 },
  animate: {
    opacity: [0.45, 0.85, 0.45],
    scaleX: [0.94, 1.02, 0.94],
    scaleY: [1, 0.98, 1],
    transition: {
      duration: bouncyDurations.loading,
      ease: BOUNCY_EASE,
      repeat: Infinity,
    },
  },
} as const;

/** CSS class names (see globals.css `.bouncy-*`). */
export const bouncyClassNames = {
  enter: "bouncy-enter",
  morph: "bouncy-morph",
  press: "bouncy-press",
  pressActive: "bouncy-press-active",
  loading: "bouncy-loading",
  staggerItem: "bouncy-stagger-item",
} as const;
