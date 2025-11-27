import React from "react";

const isChunkLoadError = (error) => {
  if (!error) return false;
  const message = String(error.message || error);
  return (
    message.includes("ChunkLoadError") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading chunk") ||
    message.includes("Importing a module script failed")
  );
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const lazyWithRetry = (factory, options = {}) => {
  const { retries = 3, retryDelay = 400 } = options;

  const load = async (attempt = 1) => {
    try {
      return await factory();
    } catch (error) {
      if (!isChunkLoadError(error) || attempt >= retries) {
        if (
          typeof window !== "undefined" &&
          isChunkLoadError(error) &&
          attempt >= retries
        ) {
          window.location.reload();
        }
        throw error;
      }

      if (import.meta.env.DEV) {
        console.warn(
          `[lazyWithRetry] retrying dynamic import (attempt ${attempt + 1}/${retries})`,
          error
        );
      }

      await wait(retryDelay * attempt);
      return load(attempt + 1);
    }
  };

  return React.lazy(() => load());
};

export default lazyWithRetry;
