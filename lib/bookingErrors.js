/** User-facing message; optional modal title */
export function bookingErrorInfo(err) {
  if (!err) return null;
  const code = err.code || "";
  const msg = String(err.message || "").toLowerCase();

  if (
    code === "23505" ||
    msg.includes("unique") ||
    msg.includes("duplicate key")
  ) {
    return {
      title: "No longer available",
      body: "Someone else just booked this time. It has been updated below.",
    };
  }

  return {
    title: "Could not book",
    body: err.message || "Something went wrong. Try again.",
  };
}
