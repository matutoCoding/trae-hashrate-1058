/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        space: {
          50: "#f0f4ff",
          100: "#e0e8ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#0a0e27",
        },
        cosmic: {
          dark: "#050510",
          deeper: "#0a0e27",
          purple: "#1a1435",
          blue: "#1e3a5f",
        },
        meteor: {
          yellow: "#fbbf24",
          orange: "#f97316",
          red: "#ef4444",
        },
        aurora: {
          green: "#10b981",
          teal: "#14b8a6",
          cyan: "#06b6d4",
        },
        moon: {
          silver: "#e5e7eb",
          glow: "#fef3c7",
        },
      },
      fontFamily: {
        mono: ["SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.3s ease-out forwards",
        "twinkle": "twinkle 2s ease-in-out infinite",
        "shooting-star": "shootingStar 3s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        shootingStar: {
          "0%": { transform: "translateX(0) translateY(0)", opacity: "1" },
          "100%": { transform: "translateX(300px) translateY(300px)", opacity: "0" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(251, 191, 36, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(251, 191, 36, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
