import client from "@/client";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/efts/$id/chart-webgpu")({
  component: ChartWebGPUPage,
  loader: async ({ params }) =>
    await client.api.yahoo
      .chart({ symbol: `${params.id.toUpperCase()}.AX` })({ interval: "1d" })
      .get(),
});

function ChartWebGPUPage() {
  const d = useLoaderData({ from: "/efts/$id/chart-webgpu" });
  const val = d.data?.value;

  if (val === undefined) {
    return <></>;
  }

  return (
    <>
      <HelloTriangleWebGPU />
    </>
  );
}

const HelloTriangleWebGPU: React.FC<{ data?: any }> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const canvas = canvasRef.current!;
      if (!canvas) return;

      // --------------------------------------------------------------
      // 1. WebGPU setup
      // --------------------------------------------------------------
      if (!navigator.gpu) {
        alert("WebGPU is not supported in this browser");
        return;
      }

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        alert("No GPU adapter found");
        return;
      }

      const device = await adapter.requestDevice();
      const context = canvas.getContext("webgpu")!;
      const format = navigator.gpu.getPreferredCanvasFormat();

      context.configure({
        device,
        format,
        alphaMode: "premultiplied",
      });

      // --------------------------------------------------------------
      // 2. WGSL shader (vertex + fragment)
      // --------------------------------------------------------------
      const shaderCode = `
        @vertex
        fn vs_main(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4<f32> {
          // Hard-coded triangle positions in NDC space
          let positions = array<vec2<f32>, 3>(
            vec2<f32>( 0.0,  0.5),   // top
            vec2<f32>(-0.5, -0.5),   // bottom-left
            vec2<f32>( 0.5, -0.5)    // bottom-right
          );
          let p = positions[idx];
          return vec4<f32>(p, 0.0, 1.0);
        }

        @fragment
        fn fs_main() -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.4, 0.7, 1.0); // pinkish
        }
      `;

      const shaderModule = device.createShaderModule({ code: shaderCode });

      // --------------------------------------------------------------
      // 3. Render pipeline (no buffers – vertex_index is enough)
      // --------------------------------------------------------------
      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: shaderModule,
          entryPoint: "vs_main",
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fs_main",
          targets: [{ format }],
        },
        primitive: { topology: "triangle-list" },
      });

      // --------------------------------------------------------------
      // 4. Render loop
      // --------------------------------------------------------------
      const render = () => {
        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: textureView,
              clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });

        renderPass.setPipeline(pipeline);
        renderPass.draw(3); // 3 vertices → 1 triangle
        renderPass.end();

        device.queue.submit([commandEncoder.finish()]);
        animationRef.current = requestAnimationFrame(render);
      };

      render();
    };

    init();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={600} height={400} />
    </div>
  );
};
