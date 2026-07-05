# Fiscal Precision - Design System Guidelines

## Brand & Style
The design system is anchored in a **Corporate Modern** aesthetic, prioritizing clarity, reliability, and precision. It is designed for users who seek a professional and organized approach to personal finance. The brand personality is that of a "Trusted Advisor"—knowledgeable and calm, yet highly efficient.

The visual style utilizes a systematic approach to whitespace and information density, ensuring that complex financial data remains legible and actionable. High-quality typography and a restrained color palette convey a sense of security, while subtle elevation and soft edges prevent the interface from feeling cold or institutional.

## Colors
This design system employs a functional color strategy where every hue serves a specific semantic purpose:

*   **Primary (Trustworthy Blue):** Used for core navigation, primary actions, and branding elements to reinforce stability and security.
*   **Secondary (Success Green):** Reserved for positive financial indicators, such as income, savings goals reached, and upward trends.
*   **Tertiary (Caution Orange):** Utilized for budget warnings, upcoming bills, and items requiring user attention without being critical errors.
*   **Neutral (Slate Gray):** Provides a balanced scale for secondary text, borders, and UI iconography, ensuring high readability without the harshness of pure black.
*   **Background & Surface:** A layered approach using Slate-50 for backgrounds and pure white for cards and containers to create clear visual separation.

## Typography
The system relies exclusively on **Inter** for its neutral, systematic, and highly legible characteristics. 

- **Weight Usage:** Use `600` (Semi-bold) for headings to provide strong hierarchy. Use `500` (Medium) for interactive elements and labels. Standard body text should always be `400` (Regular).
- **Numbers:** Since this is a money management app, tabular figures (monospaced numbers) should be enabled via `font-variant-numeric: tabular-nums` for all data tables and balance displays to ensure perfect vertical alignment of currency values.
- **Scaling:** Large display sizes should use negative letter spacing to maintain a tight, modern feel.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. On desktop, content is centered within a 1280px container using a 12-column grid. On mobile and tablet, the layout shifts to a fluid system with reduced margins.

- **The 4px Rule:** All spacing increments must be multiples of 4px.
- **Vertical Rhythm:** Use `stack-md` (16px) for related elements within a card and `stack-lg` (32px) to separate major sections.
- **Responsiveness:** For mobile, stack all multi-column layouts into a single column. Cards should span the full width of the safe area minus the `margin-mobile`.

## Elevation & Depth
Depth is created through **Tonal Layering** supplemented by soft, ambient shadows. This design system avoids heavy shadows in favor of a "lifted" effect for interactive surfaces.

- **Level 0 (Base):** Background color (`#F8FAFC`).
- **Level 1 (Cards):** White surface with a 1px border (`#E2E8F0`) and a very soft shadow (0px 1px 3px rgba(0,0,0,0.05)).
- **Level 2 (Dropdowns/Modals):** White surface with a more pronounced, diffused shadow (0px 10px 15px -3px rgba(0,0,0,0.1)) to signify temporary overlay.
- **Interaction:** On hover, buttons or interactive cards should transition to a slightly deeper shadow or a subtle background tint to provide tactile feedback.

## Shapes
The shape language is consistently **Rounded**, striking a balance between the rigid "sharp" professional look and the overly "soft" consumer look.

- **Standard (8px):** Used for buttons, input fields, and small UI components.
- **Large (16px):** Used for main content cards and dashboard modules.
- **Extra Large (24px):** Used for modal containers.
- **Pill:** Reserved exclusively for status indicators (Chips) to differentiate them from interactive buttons.

## Components
- **Buttons:** Primary buttons use a solid Blue background with white text. Secondary buttons use a ghost style (Slate border and text).
- **Cards:** The primary container for all financial data. Must include a consistent 24px internal padding. Title areas should be separated by a subtle 1px divider if the card contains complex lists.
- **Inputs:** Use a 1px border in Slate-200. On focus, the border shifts to Primary Blue with a 2px outer glow (30% opacity).
- **Chips:** Small, pill-shaped indicators for categories (e.g., "Groceries", "Rent"). Use low-opacity background tints of the semantic colors (Success Green, Caution Orange) with high-contrast text for accessibility.
- **Data Tables:** Clean, no vertical lines. Use horizontal dividers only. The header row should use `label-sm` styling with a subtle Slate-50 background.
- **Progress Bars:** Use a thick 8px track for budget tracking. The background track should be a light neutral gray, with the fill using the semantic colors based on the budget status.
