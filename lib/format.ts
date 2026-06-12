export function formatKg(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function statusTone(status: string): "green" | "blue" | "amber" | "red" | "violet" | "cyan" {
  const normalized = status.toLowerCase();
  if (["available", "active", "received", "staged_verified", "confirmed", "approved", "closed", "dispatched"].includes(normalized)) {
    return "green";
  }
  if (["planned", "submitted", "reserved", "picked", "dn_created", "allocated", "counting", "partial", "received_verified"].includes(normalized)) {
    return "blue";
  }
  if (["label_printed", "staged", "counted", "warning", "variance", "variance_review", "draft", "pending"].includes(normalized)) {
    return "amber";
  }
  if (["blocked", "failed", "void", "damaged", "shipped", "rejected", "inactive"].includes(normalized)) {
    return "red";
  }
  if (["quarantine", "quarantine seed"].includes(normalized)) {
    return "cyan";
  }
  return "violet";
}

export function formatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Active",
    adjusted: "Adjusted",
    allocated: "Dialokasikan",
    approved: "Disetujui",
    available: "Available",
    blocked: "Blocked",
    closed: "Closed",
    confirmed: "Dikonfirmasi",
    counted: "Dihitung",
    counting: "Sedang Dihitung",
    damaged: "Rusak",
    dispatched: "Dikirim",
    dn_created: "DN Dibuat",
    draft: "Draft",
    failed: "Gagal",
    inactive: "Tidak Aktif",
    label_printed: "Label Dicetak",
    loading: "Loading",
    open: "Terbuka",
    partial: "Sebagian",
    pending: "Pending",
    picked: "Dipick",
    planned: "Direncanakan",
    quarantine: "Karantina",
    received: "Diterima",
    received_verified: "Penerimaan Terverifikasi",
    receiving: "Sedang Diterima",
    rejected: "Ditolak",
    reserved: "Direservasi",
    shipped: "Dispatched",
    staged: "Di Staging",
    staged_verified: "Staging Terverifikasi",
    submitted: "Disubmit",
    success: "Sukses",
    variance: "Selisih",
    variance_review: "Review Selisih",
    void: "Dibatalkan",
    warning: "Perhatian"
  };

  const normalized = status.toLowerCase();
  return (
    labels[normalized] ??
    status
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}
