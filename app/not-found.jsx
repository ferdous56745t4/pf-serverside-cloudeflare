// app/not-found.js
import { Suspense } from "react";
import NotFoundContent from "./not-found-content"; // Import your new component

export default function NotFound() {
  return (
    // Wrap the component in Suspense, just like your ThankYouPage
    <Suspense fallback={<p>Loading error...</p>}>
      <NotFoundContent />
    </Suspense>
  );
}