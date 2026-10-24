app [config] {
    pf: platform "https://github.com/lukewilliamboswell/roc-blueprint/releases/download/0.8.0/FbJymjYdCxx9vqMcau7r4tQfeAbnVGqqJoYrLGqPCqKu.tar.zst",
}

import pf.Recipes

config = [
    Name("stocks-app"),
    Environment(
        "dev",
        [
            Programs([
                Fetch("roc", Recipes.roc_nightly("nightly-2026-10-21-5349569")),
            ]),
            Expect(["git"]),
        ],
    ),
    Shell("default", [Use("dev")]),
    Task("ci", [Use("dev"), Run(["roc", "run", "scripts/ci.roc"])]),
    Task("run", [Use("dev"), Run(["roc", "run", "scripts/run.roc"])]),
]
