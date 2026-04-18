import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY =
  "pk_live_51TMtQZGtAb4naFW50LmXRNjofcpK6vuI1VF6ajAsAyrxlv4tohTROPIl3ECQmk7SgonpCrWZZEWTtvEpMQxLHLdh003jX4GxbH";

console.log(
  "[stripe config] publishable key present:",
  !!STRIPE_PUBLISHABLE_KEY
);
console.log(
  "[stripe config] publishable key preview:",
  STRIPE_PUBLISHABLE_KEY
    ? `${STRIPE_PUBLISHABLE_KEY.slice(0, 16)}...`
    : "(empty)"
);

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

stripePromise
  ?.then((stripe) => {
    console.log("[stripe config] stripePromise resolved:", !!stripe, stripe);
  })
  ?.catch((err) => {
    console.error("[stripe config] stripePromise failed:", err);
  });