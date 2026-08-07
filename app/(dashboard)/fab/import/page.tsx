"use client";

import { useState } from "react";

export default function ImportFabPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleImport = async () => {
    console.log("File yang dipilih:", file);

    if (!file) {
      alert("Pilih file Excel terlebih dahulu!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/fab/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      console.log(result);

      if (result.success) {
        alert(`Import berhasil!\nJumlah data: ${result.total}`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat import.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-5">Import Data FAB</h1>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];

          console.log("Selected File:", selectedFile);

          if (selectedFile) {
            setFile(selectedFile);
          }
        }}
      />

      {file && (
        <p className="mt-3 text-green-600">
          File dipilih: <b>{file.name}</b>
        </p>
      )}

      <br />

      <button
        onClick={handleImport}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Import Excel
      </button>
    </div>
  );
}