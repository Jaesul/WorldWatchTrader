# Design doc — luxury watch resell & reputation (World mini app)

## Problem space

Online luxury resell marketplaces (e.g. buy/sell groups for luxury watches) often rely on an informal **reference-check** flow:

1. A **seller** asks for a reference check publicly in the trading group.
2. **Previous buyers** comment (e.g. “legit seller — I’ve bought from them before”), which signals reputation.
3. The **buyer** gains enough confidence to complete the purchase.

That pattern works on the happy path, but it breaks down in predictable ways.

### Pain points

**Friction**  
Each time a seller must convince a hesitant buyer, they start a **new** reference check. That repeatedly burdens past buyers to vouch again after their own deal is done.

**Fraud**  
Sellers can operate multiple accounts to launder reputation. Buyers can do the same — e.g. claiming past scams to negotiate a lower “risk-adjusted” price.

**Fragmented seller identity**  
Active sellers often run several accounts across Instagram, Facebook, and other channels, so **reputation does not travel** with a single, portable identity.

---

## Core functionality

### Identity

| Actor | Need |
|--------|------|
| **Seller** | Link external profiles (Instagram, Facebook, etc.) to their **WRLD** account. |

- *Implementation direction:* account linking / reputation import.

| Actor | Need |
|--------|------|
| **Buyer** | Confidence that the counterparty is a **real human** and operates **only one account** in the system (per your product rules). |

---

### Reputation & reviews

**Buyer → evaluating a seller**  
The buyer should see, for each seller:

- Percentage of positive reviews  
- Total number of sales  
- Tenure in the app  

- *Implementation direction:* ledger of previous sales.

**Seller → reviews without nagging**  
The seller should only need to ask a given past buyer for a review **once** (not on every future deal).

- *Implementation direction:* verified review service.

**Seller → evaluating a buyer**  
The seller should see, for each buyer:

- Percentage of positive reviews  
- Number of purchases  
- Tenure in the app  
- Conversion rate (e.g. inquiries → completed purchases)  

- *Implementation direction:* ledger of previous purchases.

**Cross-cutting**  
Ability to **tie transaction records to reputation** (on-platform, and ideally attestable off-platform where allowed).

---

### Transaction logic

| Actor | Need |
|--------|------|
| **Buyer** | Purchase **in-app / on-chain** with **$0 transaction fee** (goal — subject to chain and product constraints). |
| **Buyer & seller** | Complete a deal **outside** the WRLD / World mini app and still have it **count toward reputation** (with a credible attestation or reporting flow — TBD). |

---

### Messaging

**Buyer & seller**  
Basic **1:1 or thread-style messaging**, similar in spirit to Facebook Marketplace (negotiation, logistics, questions).

---

### Listings & comments

**Seller — create listing**  
Fields (minimum):

- **Title**  
- **Details** (qualitative description, model number, condition, etc.)

**Prospective buyer**  
**Comments on a listing** for questions, follow-ups, and public Q&A-style discussion.

---

## Open questions (for roadmap)

- How strictly “one account per human” is enforced (World ID, device signals, manual review, etc.).
- How off-app sales are verified without opening abuse vectors.
- Fee model vs. “$0 fee” under real network and mini-app constraints.
- Scope for hackathon MVP vs. post-hackathon phases.
