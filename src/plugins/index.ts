// src/plugins/index.ts
export * from "./auth";
export * from "./rateLimit";
export * from "./logging";
// React hooks are exported separately to avoid React dependency in non-React environments
// import them from 'omnirequest/react' instead
export { setupAutoAuth, AutoAuthPlugin } from './autoAuth';
