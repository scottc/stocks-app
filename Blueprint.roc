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
                Fetch("roc", Recipes.roc_nightly("nightly-2026-10-09-258ab27")),
            ]),
            Expect(["git"]),
        ],
    ),
    Shell("default", [Use("dev")]),
    Task("check", [Use("dev"), Run(["roc", "check", "server/main.roc"])]),
    Task("run", [Use("dev"), Run(["roc", "server/main.roc"])]),
    Task("build", [Use("dev"), Run(["roc", "build", "--optimize", "server/main.roc"])]),
]
