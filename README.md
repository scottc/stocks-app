# Scott's Finance Cockpit

## DISCLAIMER

This is NOT financial advice, always consult qualified financial advice in your legal jurisdiction.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

AUDIT THE SOFTWARE PRIOR TO USEAGE!

## About

Let's you drive your finances, banking, investments & accounts; via a cockpit with various dashoards, trading tools, management tools, analysis tools, tax tools, personalized strategies, goals, tests, automated AI harnesses & manual approval workflows.

Plug in your liquid capital, maximize real returns, minimize risk, effort & cost.

This app merely collects financial information & derives numbers from calculations. As a means to drive finances & investments. The end goal is to make an automated AI harness sandbox, with tailored visual reports, financial goals, projections, risk asessments, manual reviews & approvals, tools for managing data for taxes etc.

Provides a dashboard of financial securities.

* Raw stock ticker data
* Accounts
* Trades
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

## WIP port to roc lang (basic-webserver & joy)

```sh
nix run github:lukewilliamboswell/roc-blueprint/0.8.0 -- run run

# 2) Joy runtime.js
# cp .cache/vendor/joy/hash/runtime.js frontend/www/runtime.js
```
