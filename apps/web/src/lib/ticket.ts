export type StoredTicket = { claim_code: string; first_name: string; category: string; mode: string };

const KEY = "jc27.ticket";

/** Keeps the claim ticket on the device so the pass can render offline (full offline pass: build step 4). */
export function saveTicket(ticket: StoredTicket) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ticket));
  } catch {
    // storage can be unavailable (private mode); the ticket is also sent by SMS/email
  }
}
