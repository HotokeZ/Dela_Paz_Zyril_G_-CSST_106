import { useEffect, useState } from "react";
import InputSourceBar from "../components/InputSourceBar";
import VisionViewport from "../components/VisionViewport";
import { runLabApi } from "../utils/api";

export default function Lab1View({ samples }) {
  const [selectedSample, setSelectedSample] = useState("rb_target");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [params, setParams] = useState({
    px_x: 160,
    px_y: 210,
    patch_w: 60,
    patch_h: 60,
    fill_mode: "solid",
    new_r: 255,
    new_g: 215,
    new_b: 0,
    crop_x: 80,
    crop_y: 60,
    crop_w: 280,
    crop_h: 200,
    scale: 0.5,
    rotate_deg: 90,
  });

  const execute = async (overrideParams = params) => {
    setLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab1", {
        sample: selectedSample,
        file: uploadedFile,
        params: overrideParams,
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSample, uploadedFile]);

  const handlePixelClick = (normX, normY) => {
    if (!result?.properties) return;
    const x = Math.round(normX * result.properties.width);
    const y = Math.round(normY * result.properties.height);
    const next = { ...params, px_x: x, px_y: y };
    setParams(next);
    execute(next);
  };

  const handleAreaSelect = (nx1, ny1, nx2, ny2) => {
    if (!result?.properties) return;
    const w = result.properties.width;
    const h = result.properties.height;
    const x1 = Math.round(nx1 * w);
    const y1 = Math.round(ny1 * h);
    const x2 = Math.round(nx2 * w);
    const y2 = Math.round(ny2 * h);
    const next = {
      ...params,
      px_x: Math.round((x1 + x2) / 2),
      px_y: Math.round((y1 + y2) / 2),
      patch_w: Math.max(1, x2 - x1),
      patch_h: Math.max(1, y2 - y1),
    };
    setParams(next);
    execute(next);
  };

  const toHex = (r, g, b) =>
    "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");

  return (
    <div className="space-y-5">
      <InputSourceBar
        samples={samples}
        selectedSample={selectedSample}
        onSelectSample={(id) => {
          setUploadedFile(null);
          setSelectedSample(id);
        }}
        uploadedFile={uploadedFile}
        onUploadFile={(f) => setUploadedFile(f)}
        onRun={() => execute()}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg border border-[#DC0000] bg-[#DC0000]/15 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Telemetry Properties Strip */}
      {result?.properties && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            ["Shape (H, W, C)", result.properties.shape_str],
            ["DType", result.properties.dtype],
            ["Total Pixels", result.properties.total_pixels.toLocaleString()],
            ["Color Order", "BGR -> RGB"],
            [
              `Pixel (${result.pixel_inspection.x}, ${result.pixel_inspection.y})`,
              `RGB(${result.pixel_inspection.original_rgb.join(", ")})`,
            ],
            ["Resized Dims", `${result.resize_info.w}×${result.resize_info.h}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] px-3 py-2.5">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">{k}</div>
              <div className="text-xs font-bold font-mono-tech text-[#FFD700] mt-0.5 truncate">{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
              Pixel &amp; Area Editor
            </div>
            <input
              type="color"
              value={toHex(params.new_r, params.new_g, params.new_b)}
              onChange={(e) => {
                const hex = e.target.value;
                setParams({
                  ...params,
                  new_r: parseInt(hex.slice(1, 3), 16),
                  new_g: parseInt(hex.slice(3, 5), 16),
                  new_b: parseInt(hex.slice(5, 7), 16),
                });
              }}
              className="h-6 w-8 cursor-pointer rounded border border-[#1E2B4D] bg-transparent"
              title="Pick replacement color"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <label className="flex flex-col gap-1 text-slate-300">
              Center X
              <input
                type="number"
                value={params.px_x}
                onChange={(e) => setParams({ ...params, px_x: Number(e.target.value) })}
                className="rounded border border-[#1E2B4D] bg-[#060A17] px-2 py-1 font-mono-tech"
              />
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              Center Y
              <input
                type="number"
                value={params.px_y}
                onChange={(e) => setParams({ ...params, px_y: Number(e.target.value) })}
                className="rounded border border-[#1E2B4D] bg-[#060A17] px-2 py-1 font-mono-tech"
              />
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              Area W
              <input
                type="number"
                min={1}
                value={params.patch_w}
                onChange={(e) => setParams({ ...params, patch_w: Number(e.target.value) })}
                className="rounded border border-[#1E2B4D] bg-[#060A17] px-2 py-1 font-mono-tech"
              />
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              Area H
              <input
                type="number"
                min={1}
                value={params.patch_h}
                onChange={(e) => setParams({ ...params, patch_h: Number(e.target.value) })}
                className="rounded border border-[#1E2B4D] bg-[#060A17] px-2 py-1 font-mono-tech"
              />
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs items-end">
            {["new_r", "new_g", "new_b"].map((ch, idx) => (
              <label key={ch} className="flex flex-col gap-1 text-slate-300">
                {["R", "G", "B"][idx]}
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={params[ch]}
                  onChange={(e) => setParams({ ...params, [ch]: Number(e.target.value) })}
                  className="rounded border border-[#1E2B4D] bg-[#060A17] px-2 py-1 font-mono-tech"
                />
              </label>
            ))}
            <select
              value={params.fill_mode}
              onChange={(e) => setParams({ ...params, fill_mode: e.target.value })}
              className="rounded border border-[#1E2B4D] bg-[#060A17] px-2 py-1.5 font-mono-tech text-slate-200"
            >
              <option value="solid">Solid Fill</option>
              <option value="tint">Color Tint</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
            ROI Crop Region (px)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["crop_x", "Crop X"],
              ["crop_y", "Crop Y"],
              ["crop_w", "Width"],
              ["crop_h", "Height"],
            ].map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1 text-slate-300">
                {label}
                <input
                  type="number"
                  value={params[key]}
                  onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
                  className="rounded border border-[#1E2B4D] bg-[#060A17] px-2 py-1 font-mono-tech"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
            Resize &amp; Rotation
          </div>
          <label className="flex flex-col gap-1.5 text-xs text-slate-300">
            <span>Resize Scale: {params.scale}×</span>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.1"
              value={params.scale}
              onChange={(e) => setParams({ ...params, scale: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Rotate:</span>
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => {
                  const next = { ...params, rotate_deg: deg };
                  setParams(next);
                  execute(next);
                }}
                className={`rounded px-2.5 py-1 text-xs font-mono-tech border transition cursor-pointer ${
                  params.rotate_deg === deg
                    ? "bg-[#0038A8] border-[#FFD700] text-white"
                    : "bg-[#060A17] border-[#1E2B4D] text-slate-300"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output Viewports */}
      {result?.images && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <VisionViewport
              title="Original Color (Click or Drag Area)"
              badge="BGR->RGB"
              src={result.images.original}
              onImageClick={handlePixelClick}
              onAreaSelect={handleAreaSelect}
              interactiveHint="Click to move or drag box to edit area"
            />
            <VisionViewport
              title="Selected Area Modified"
              badge={`${result.pixel_inspection.area_box.w}×${result.pixel_inspection.area_box.h}`}
              src={result.images.pixel_modified}
              subtitle={`Center BGR: [${result.pixel_inspection.original_bgr.join(", ")}] | Mode: ${result.pixel_inspection.area_box.fill_mode}`}
            />
            <VisionViewport
              title="Grayscale Conversion"
              badge="1-CH"
              src={result.images.grayscale}
            />
            <VisionViewport
              title="Cropped ROI"
              badge={`${result.crop_info.w}×${result.crop_info.h}`}
              src={result.images.cropped}
            />
            <VisionViewport
              title="Resized Output"
              badge={`${result.resize_info.scale}×`}
              src={result.images.resized}
              subtitle={`${result.resize_info.w} × ${result.resize_info.h} px`}
            />
            <VisionViewport
              title={`Rotated (${result.rotate_deg}°)`}
              badge={`${result.rotate_deg}°`}
              src={result.images.rotated}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VisionViewport title="Red Channel" badge="R" src={result.images.channel_r} />
            <VisionViewport title="Green Channel" badge="G" src={result.images.channel_g} />
            <VisionViewport title="Blue Channel" badge="B" src={result.images.channel_b} />
          </div>
        </>
      )}
    </div>
  );
}

