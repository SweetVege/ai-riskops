import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        panel: "#F7F9FB",
        line: "#DDE4EC",
        risk: {
          low: "#1F8A5B",
          medium: "#A46B09",
          high: "#B73535",
          severe: "#7B2CBF",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
