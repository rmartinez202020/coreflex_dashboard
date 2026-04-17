import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51TMtQZGtAb4naFW5VCn0KIYu4q3MV5kdydVe509jnrMZOvc1Mu73eMwhgWZKMEMEmD18Ht7KbvTaJ0z106ycvWQ00e1D21A42";

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