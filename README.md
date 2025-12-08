# Scott's Financial Dashboard

## DISCLAIMER

This is NOT financial advice, always consult certified financial advice.

This is NOT a secure application, always secure your personal and financial information.

Use this application at your own risk, it does not come with any warrenty, and it is not liable for any damages or losses as a result of damages, harm or loss of value. As a result of your useage of it. You are personally responsable for yourself, your finances and your security.

## About

This app merely collects financial information & derives numbers from calculations.

Provides me with a dashboard of financial securities.

* Raw data
* Derived data
* Rating scores
* Timing indicators
* Charts & histograms
* Comparison & testing tools
* etc.

## Dependencies

Nix flakes package manager or [Bun](https://bun.com) ~v1.3.1 or newer.
See `flake.lock` & `bun.lock` for exact dependency versions.

## Build & Run

To install dependencies:

```bash
nix develop # requires nix flakes, see flake.nix, provides bun.
bun install # requires bun, see package.json, provides npm package dependencies.
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

To lint:

```sh
bun lint
```

To unit test:

```sh
bun test
```
