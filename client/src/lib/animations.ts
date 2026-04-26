// Animation variants for the chat panel
export const panelVariants = {
  hidden: {
    scale: 0.1, // Tiny at bottom-right
    originX: 1, // ✅ RIGHT edge anchor point
    originY: 1, // ✅ BOTTOM edge anchor point
    rotate: -5,
    opacity: 0,
  },
  visible: {
    scale: 1,
    originX: 1, // Stays anchored to bottom-right
    originY: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 25,
      mass: 0.9,
      duration: 0.55,
    },
  },
  exit: {
    scale: 0.25,
    originX: 1,
    originY: 1,
    rotate: 5,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.25,
    },
  },
} as const;
