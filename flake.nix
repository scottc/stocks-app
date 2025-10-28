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
          packages = [ pkgs.bun ];
        };
      });
}