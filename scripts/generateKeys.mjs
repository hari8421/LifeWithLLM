// Generates the JWT keypair that Convex Auth needs to sign sessions.
// Run with: bun run generate:keys
// Then add the two printed values as env vars on your Convex deployment.
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

console.log("Add BOTH of these to your Convex deployment environment variables:");
console.log("");
console.log(`JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"`);
console.log("");
console.log(`JWKS=${jwks}`);
