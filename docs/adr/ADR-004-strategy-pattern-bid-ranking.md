# ADR-004: Strategy Pattern for Bid Ranking

**Date:** 2026-02-20
**Status:** Accepted
**Author:** Nikola

---

## Context

In the freelance project management system, clients need to rank freelancer bids based on different criteria:

- Lowest proposed price
- Highest freelancer rating
- A composite score combining price and rating

We anticipate adding more ranking criteria in the future (e.g., number of completed projects, delivery time). Therefore, we need an architecture that:

- Allows easy addition of new ranking algorithms
- Avoids code duplication
- Supports unit testing and maintainability
- Enables dynamic selection of ranking logic at runtime (via query parameter)

---

## Options Considered

### Option A: Hardcoded Switch Logic in BidRanker

- **Pros:** Simple and quick to implement.
- **Cons:** Tightly couples the ranking logic. Adding a new algorithm requires modifying the existing class, violating the Open/Closed Principle. Harder to test individual strategies.

### Option B: Plain Functions Instead of Classes

- **Pros:** Minimal boilerplate, no class overhead.
- **Cons:** Reduced flexibility for strategies that need injected dependencies. Integration with NestJS's dependency injection is less ergonomic.

### Option C: Strategy Pattern (chosen)

- **Pros:** Each ranking algorithm is encapsulated in its own class implementing a shared `BidRankingStrategy` interface. New strategies can be added without modifying existing logic. Each strategy can be independently unit-tested. Strategies can be swapped dynamically at runtime.
- **Cons:** All strategies and the factory must be registered as NestJS providers. Slightly more boilerplate than plain functions.

---

## Decision

We chose to implement the **Strategy Pattern** with the following components:

- **`BidRankingStrategy`** — shared interface that all ranking strategies implement
- **`PriceAscStrategy`** — sorts bids by proposed rate ascending (cheapest first)
- **`RatingDescStrategy`** — sorts bids by freelancer rating descending (highest rated first)
- **`CompositeStrategy`** — weighted composite of price and rating
- **`BidRanker`** — context class that delegates ranking to the injected strategy
- **`BidRankingStrategyFactory`** — selects the appropriate strategy based on a runtime `rankBy` query parameter

The API exposes this via `GET /projects/:id/bids?rankBy=price|rating|composite`.

---

## Consequences

- **Positive:** Separation of concerns — each ranking algorithm is isolated. Extensible — new strategies require only a new class and a factory entry. Testable — each strategy has its own unit test suite (`price-asc.strategy.spec.ts`, `rating-desc.strategy.spec.ts`, `composite.strategy.spec.ts`). Flexible — clients can choose the ranking at request time.
- **Negative:** All strategies and the factory must be registered as providers in the NestJS module. When adding a new strategy, it must implement the `BidRankingStrategy` interface and be added to the factory's map.
