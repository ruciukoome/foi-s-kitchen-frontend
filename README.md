# Foi's Kitchen — Web Application

A modern, mobile-first web application for **Foi's Kitchen**, a premier Nairobi-based culinary business specializing in home-style catering, weekly meal prep subscriptions, and seamless online food ordering.

---

## 🍽️ Overview

Foi's Kitchen combines appetite-forward visual presentation with smooth digital ordering. Designed with a warm, trustworthy aesthetic and optimized for mobile devices, the platform allows customers to browse menus, order meals, request event catering quotes, and subscribe to tailored meal prep plans.

---

## ✨ Key Features

### 1. Interactive Menu & Online Ordering

- **Categorized Menu Catalog**: Filter items across Breakfast, Mains, Sides, Drinks, and Desserts.
- **Search & Dietary Filters**: Quickly locate items with badges for vegetarian, gluten-free, and chef specials.
- **Dynamic Cart & Checkout Flow**: Add items to cart, adjust quantities, input delivery/pickup details, and calculate subtotals in real-time.
- **Flexible Payment & Order Channels**: Direct M-Pesa checkout flow alongside instant one-click WhatsApp order confirmation.

### 2. Tailored Catering & Services

- **Corporate Catering**: Tiered corporate packages, sample menus, minimum order quantity (MOQ) guidelines, and downloadable menu resources.
- **Weddings & Private Events**: Curated packages for bespoke celebrations, lead-time recommendations, and an inquiry system.
- **Meal Prep Subscription Plans**: Clean plan cards featuring transparent pricing, dietary inclusions, and simple subscription ordering.

### 3. Quote Request System

- Interactive multi-field quotation calculator capturing event type, guest count, venue date, budget expectations, and custom dietary requirements.

### 4. Customer Engagement & Social Proof

- **Hero Carousel**: Highlight daily specials and signature dishes with high-resolution imagery.
- **Gallery & Testimonials**: Filterable showcase of past events and authentic customer reviews.
- **Persistent Accessibility**: Floating WhatsApp button and sticky mobile order bar for immediate customer inquiries.

---

## 🎨 Design System & Palette

The user interface follows a warm, earthy, food-inspired palette crafted for clarity and appetite appeal:

| Token / Color                 | Hex Code  | Usage                                            |
| :---------------------------- | :-------- | :----------------------------------------------- |
| **Warm Charcoal-Brown**       | `#3B2A20` | Headings, primary text, dark backgrounds         |
| **Terracotta / Ochre Accent** | `#C97B3D` | Action buttons, active tabs, price highlights    |
| **Soft Cream**                | `#F4EFE9` | Main page background, section alternation        |
| **Pure White**                | `#FFFFFF` | Card containers, modals, crisp contrast elements |
| **Muted Sage**                | `#7C8B6B` | Healthy/meal-prep badges, secondary accents      |
| **WhatsApp Green**            | `#25D366` | Instant messaging and WhatsApp direct actions    |

---

## 🛠️ Technology Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Routing & State**: [TanStack Router](https://tanstack.com/router) & [TanStack Query](https://tanstack.com/query)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom animations via `tw-animate-css`
- **UI Components & Icons**: [Radix UI](https://www.radix-ui.com/) accessible primitives & [Lucide Icons](https://lucide.dev/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) schema validation
- **Carousel & Sliders**: [Embla Carousel](https://www.embla-carousel.com/)
- **Build Tool**: [Vite](https://vite.dev/)

---

## 📁 Project Structure

```text
├── public/                # Static assets (icons, robots.txt, _redirects)
├── src/
│   ├── assets/            # Images, branding assets, and graphics
│   ├── components/        # Reusable UI elements
│   │   ├── ui/            # Radix UI primitive components (buttons, dialogs, inputs)
│   │   ├── HeroCarousel.tsx
│   │   ├── MenuCard.tsx
│   │   ├── OrderBar.tsx
│   │   ├── QuoteForm.tsx
│   │   ├── SiteHeader.tsx
│   │   ├── SiteFooter.tsx
│   │   └── WhatsAppFloatButton.tsx
│   ├── data/              # Static menu catalog, plans, testimonials & gallery datasets
│   │   ├── gallery.ts
│   │   ├── menu.ts
│   │   ├── plans.ts
│   │   └── testimonials.ts
│   ├── hooks/             # Custom React utility hooks
│   ├── lib/               # Helper utilities and form validators
│   ├── routes/            # TanStack Router file-based pages
│   │   ├── __root.tsx     # Root layout wrapper (Header, Footer, Floating actions)
│   │   ├── index.tsx      # Homepage
│   │   ├── menu.tsx       # Menu catalog & filter page
│   │   ├── order.tsx      # Online order cart & checkout page
│   │   ├── quote.tsx      # Catering quote request page
│   │   ├── about.tsx      # Story & kitchen standards
│   │   ├── contact.tsx    # Contact information, map & operating hours
│   │   ├── gallery.tsx    # Photo showcase & testimonials
│   │   ├── services.corporate.tsx
│   │   ├── services.meal-prep.tsx
│   │   └── services.weddings.tsx
│   ├── router.tsx         # TanStack Router initialization
│   └── styles.css         # Tailwind directives and custom theme variables
├── netlify.toml           # Netlify build and routing configuration
├── package.json           # Project dependencies and npm scripts
├── tsconfig.json          # TypeScript compiler configuration
└── vite.config.ts         # Vite build configuration
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js** (v18.0.0 or higher) and **npm** installed on your machine.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd foi-s-kitchen-website
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 📜 Available Scripts

| Script                | Command              | Description                                                              |
| :-------------------- | :------------------- | :----------------------------------------------------------------------- |
| **`npm run dev`**     | `vite dev`           | Starts the local development server with hot-module reloading.           |
| **`npm run build`**   | `vite build`         | Compiles and bundles production-ready assets into the `dist/` directory. |
| **`npm run preview`** | `vite preview`       | Serves the production build locally to test behavior before deployment.  |
| **`npm run lint`**    | `eslint .`           | Runs ESLint to inspect and enforce code quality rules.                   |
| **`npm run format`**  | `prettier --write .` | Formats all source files according to Prettier configuration.            |

---

## 🌐 Deployment

### Netlify Deployment

This repository includes a pre-configured [`netlify.toml`](./netlify.toml) and [`public/_redirects`](./public/_redirects) for Single Page Application (SPA) routing.

1. Connect your repository to Netlify.
2. Ensure the build configuration is set as follows:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Deploy the site.

---

## 📄 License

This project is proprietary and confidential. All rights reserved by Foi's Kitchen.
