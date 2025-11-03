{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    bun-overlay.url = "github:0xBigBoss/bun-overlay";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, bun-overlay, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ bun-overlay.overlays.default ];
        };
      in {
        packages.bun = pkgs.bun;
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.bun

            # ai support
            pkgs.ollama

            # linters & formatters
            # pkgs.biome
          ];

          # Automatically pull llama and run it
          # shellHook = ''
          #  if ! ollama list | grep -q "llama3.1:8b-instruct-q4_K_M"; then
          #    echo "Pulling Llama 3.1 8B (Q4_K_M)..."
          #    ollama pull llama3.1:8b-instruct-q4_K_M
          #  fi

          #  if ! pgrep ollama > /dev/null; then
          #    ollama serve > /dev/null 2>&1 &
          #    sleep 3
          #  fi

          #  echo "AI ready! Use Bun to query http://localhost:11434"
          #'';


        };
      });
}
