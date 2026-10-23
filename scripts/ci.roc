app [main!] {
    pf: platform "https://github.com/scottc/roc-build/releases/download/nightly-2026-10-17-ca0be2b/B1AWvSBFiSLJnEvin7Rm1k4pRUMLdgE4ZVhVrey2rHSi.tar.zst",
}

import pf.Mem
import pf.Build
import pf.BuildCmd
import pf.Log

main! : List(Str) => Try(_, _)
main! = |_args| {

    roc_test_server = BuildCmd.new({
        program: "roc",
        args: [
     			"test",
     			"app/server.roc",
        ],
        description: "roc test",
    })
    .with_memory(Mem.mb(256))

    roc_check_server = BuildCmd.new({
        program: "roc",
        args: [
     			"check",
     			"app/server.roc",
        ],
        description: "roc test",
    })
    .with_memory(Mem.mb(256))

    roc_test_client = BuildCmd.new({
        program: "roc",
        args: [
     			"test",
     			"app/client.roc",
        ],
        description: "roc test",
    })
    .with_memory(Mem.mb(256))

    roc_check_client = BuildCmd.new({
        program: "roc",
        args: [
     			"check",
     			"app/client.roc",
        ],
        description: "roc test",
    })
    .with_memory(Mem.mb(256))

    roc_test_ci = BuildCmd.new({
        program: "roc",
        args: [
     			"test",
     			"scripts/ci.roc",
        ],
        description: "roc test",
    })
    .with_memory(Mem.mb(256))

    roc_check_ci = BuildCmd.new({
        program: "roc",
        args: [
     			"check",
     			"scripts/ci.roc",
        ],
        description: "roc test",
    })
    .with_memory(Mem.mb(256))

    # roc_test_publish = BuildCmd.new({
    #     program: "roc",
    #     args: [
    #  			"test",
    #  			"scripts/publish.roc",
    #     ],
    #     description: "roc test",
    # })

    graph = Build.graph_with(
        [
            roc_test_client,
            roc_check_client,
            roc_test_server,
            roc_check_server,
            roc_test_ci,
            roc_check_ci,
            # roc_test_publish,
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
