# Frontend Design Skill

> Auto-trigger: when working on UI components in `apps/dashboard`

## Design Tokens

### Colors
- Background: `#f9fafb` (warm gray)
- Card: `#ffffff`
- Border: `#e5e7eb`
- Foreground: `#0f172a`
- Muted: `#64748b`
- Primary/Info: `#3b82f6`
- Success: `#22c55e`
- Warning: `#f59e0b`
- Danger: `#ef4444`

### Shadows
- `--shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `--shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)`
- `--shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)`

### Radii
- Cards/containers: `0.75rem` (rounded-xl)
- Buttons/inputs: `0.5rem` (rounded-lg)
- Badges: `9999px` (rounded-full)

### Spacing Scale
Use Tailwind defaults: 1=0.25rem, 2=0.5rem, 3=0.75rem, 4=1rem, 6=1.5rem, 8=2rem

## Animation Patterns (framer-motion)

### Page Transitions
```tsx
const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
```

### Stagger Children
```tsx
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};
```

### Hover/Tap (Buttons)
```tsx
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

### Card Hover
```tsx
whileHover={{ y: -2, boxShadow: "var(--shadow-lg)" }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}
```

### Layout Animations
Use `layoutId` for shared-element transitions (e.g., sidebar active indicator).

## Component Guidelines

### Cards
- Always use `--shadow-md` at rest, `--shadow-lg` on hover
- Hover lifts card by -2px (translateY)
- Use `AnimatedCard` wrapper from `components/ui/animated`

### Tables
- Rows stagger in on mount with `StaggerContainer` + `StaggerItem`
- Row hover: subtle background shift + slight translateX(2px)

### Buttons
- All interactive buttons get `whileHover` / `whileTap` spring animations
- Primary buttons: `bg-info`, secondary: `bg-card-bg border`

### Badges
- Scale entrance: `initial={{ scale: 0.8, opacity: 0 }}` → `animate={{ scale: 1, opacity: 1 }}`

### Forms
- Cards containing forms use standard shadow treatment
- Inputs: clean borders, focus ring

## Rules
1. Always use `motion` component variants (not raw CSS transitions) for entrance/exit animations
2. Prefer spring physics (`type: "spring"`) over eased durations
3. Keep all animations under 400ms perceived duration
4. Use `staggerChildren` for any list of 3+ items
5. Every page must be wrapped in `<PageTransition>`
6. Use `AnimatePresence` for conditional rendering animations
7. Client components that use motion must have `"use client"` directive
