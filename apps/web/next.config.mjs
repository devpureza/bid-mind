import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bidmind/types"],
  // Silencia o warning de workspace root no monorepo — aponta para a raiz do pnpm-lock.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
