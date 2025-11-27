// Minimal Prisma config to replace deprecated package.json#prisma.
// Docs: https://pris.ly/prisma-config
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
});