app [main!] {
    pf: platform "https://github.com/scottc/roc-build/releases/download/nightly-2026-10-17-ca0be2b/B1AWvSBFiSLJnEvin7Rm1k4pRUMLdgE4ZVhVrey2rHSi.tar.zst",
}

import pf.Mem
import pf.Build
import pf.BuildCmd
import pf.Log

main! : List(Str) => Try(_, _)
main! = |_args| {

    build_client = BuildCmd.new({
        program: "roc",
        args: ["build", "--target=wasm32", "app/client.roc", "--output=app/www/client.wasm"],
        description: "roc build client",
    })
    .with_memory(Mem.mb(256))

    run_server = BuildCmd.new({
        program: "roc",
        args: [
     			"run",
     			"app/server.roc",
        ],
        description: "roc run server",
    })
    .with_memory(Mem.mb(256))
    .depends_on([build_client])

    graph = Build.graph_with(
        [
            build_client,
            run_server,
        ],
        {
            max_memory: Mem.gb(2),
            max_parallel: 6,
        },
    )
    Log.info!(Str.inspect(graph))

    _result = Build.run!(graph)
    # TODO: log result.

    Ok({})
}
