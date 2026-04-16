"use client";

type ProfileImageUploadProps = {
  image: string;
  onChange: (value: string) => void;
};

export default function ProfileImageUpload({
  image,
  onChange,
}: ProfileImageUploadProps) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-300 mb-3">Profiilikuva CV:hen</p>

      <div className="flex items-center gap-4">
        <label className="inline-flex cursor-pointer rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm font-medium transition">
          Valitse kuva
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {image && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-medium transition"
          >
            Poista kuva
          </button>
        )}
      </div>

      {image && (
        <div className="mt-4">
          <img
            src={image}
            alt="Profiilikuva"
            className="h-24 w-24 rounded-xl object-cover border border-zinc-700"
          />
        </div>
      )}
    </div>
  );
}