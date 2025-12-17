"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OnboardingState, statusToLabel } from "@/lib/onboarding";

type DocRow = { doc_type: string; file_url: string; uploaded_at: string };
type Stadium = { stadium_name?: string; region?: string; address?: string; address_detail?: string; stadium_contact?: string };
type Court = { court_name?: string; capacity?: number | null; size_x?: number | null; size_y?: number | null; floor_type?: string; indoor_outdoor?: string };

export default function Step3DocsPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [info, setInfo] = useState<{ step_status: OnboardingState } | null>(null);
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [businessUrl, setBusinessUrl] = useState<string | null>(null);
  const [bankbookUrl, setBankbookUrl] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) throw new Error("유효하지 않은 경로입니다.");
        const res = await fetch(`/api/onboarding/${id}/step3`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        if (!mounted) return;
        setInfo({ step_status: json.step_status });
        setStadium(json.stadium || null);
        setCourts(json.courts || []);
        const b = (json.documents || []).find((d: DocRow) => d.doc_type === "business_registration");
        const bank = (json.documents || []).find((d: DocRow) => d.doc_type === "bankbook");
        setBusinessUrl(b?.file_url || null);
        setBankbookUrl(bank?.file_url || null);
      } catch (e: any) {
        if (mounted) setError(e.message ?? "오류가 발생했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const statusLabel = info ? statusToLabel(info.step_status) : "";
  const statusMessage = useMemo(() => {
    if (!info) return null;
    const s = info.step_status;
    if (s === "step4_submitted") return "서류가 제출되었습니다. 담당자 검토 중입니다.";
    if (s === "step3_approved") return "정산안 승인 완료. 서류를 제출해주세요.";
    return "현재 상태에서 서류를 제출할 수 있습니다.";
  }, [info]);

  const handleUpload = async (file: File, docType: "business_registration" | "bankbook") => {
    if (!id) return;
    setUploadingType(docType);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/onboarding/${id}/step3/upload?doc_type=${docType}`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "업로드 실패");
      if (docType === "business_registration") setBusinessUrl(json.url);
      else setBankbookUrl(json.url);
    } catch (e: any) {
      setError(e.message ?? "업로드 오류");
    } finally {
      setUploadingType(null);
    }
  };

  const submit = async () => {
    if (!id) return;
    setError(null);
    setBanner(null);
    if (!businessUrl || !bankbookUrl) {
      setError("두 서류를 모두 업로드해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/${id}/step3`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_url: businessUrl, bankbook_url: bankbookUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "제출 실패");
      setBanner("서류가 제출되었습니다.");
      setInfo((prev) => (prev ? { ...prev, step_status: json.step_status as OnboardingState } : prev));
    } catch (e: any) {
      setError(e.message ?? "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;
  if (!id) return <div className="p-6 text-sm text-red-600">유효하지 않은 경로입니다.</div>;

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-2">
          <h1 className="text-xl font-semibold text-[#111827]">STEP3 · 서류 제출</h1>
          <div className="text-sm text-[#4b5563]">온보딩 ID: {id}</div>
          {info && (
            <div className="text-xs text-[#6b7280]">
              현재 상태: <span className="text-[#1C5DFF] font-semibold">{statusLabel}</span>
            </div>
          )}
          {statusMessage && <div className="bg-blue-50 text-[#1C5DFF] text-sm px-3 py-2 rounded-lg">{statusMessage}</div>}
        </header>

        {banner && <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-sm">{banner}</div>}
        {error && <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <div className="text-lg font-semibold text-[#111827]">필수 서류 업로드</div>
          <p className="text-sm text-[#4b5563]">사업자등록증과 통장사본을 모두 업로드해주세요. (JPG/PNG/PDF)</p>
          <UploadField
            label="사업자등록증 사본"
            url={businessUrl}
            uploading={uploadingType === "business_registration"}
            onFile={(file) => handleUpload(file, "business_registration")}
            required
            note="사업자등록증 상 대표자명과 동일해야 합니다. (차명계좌 불가)"
          />
          <UploadField
            label="통장 사본"
            url={bankbookUrl}
            uploading={uploadingType === "bankbook"}
            onFile={(file) => handleUpload(file, "bankbook")}
            required
          />
        </section>

        <section className="bg-white border border-[#E3E6EC] rounded-xl shadow-sm p-6 space-y-4">
          <div className="text-lg font-semibold text-[#111827]">구장 정보 요약</div>
          {stadium ? (
            <div className="space-y-2 text-sm text-[#1C1E26]">
              <div>
                <span className="font-semibold">구장명: </span>
                <span>{stadium.stadium_name || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">지역/주소: </span>
                <span>
                  {stadium.region || "-"} · {stadium.address || "-"} {stadium.address_detail || ""}
                </span>
              </div>
              <div>
                <span className="font-semibold">연락처: </span>
                <span>{stadium.stadium_contact || "-"}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#6b7280]">구장 정보가 아직 입력되지 않았습니다.</div>
          )}

          <div className="space-y-2">
            <div className="font-semibold text-sm text-[#111827]">면(코트) 정보</div>
            {courts.length === 0 ? (
              <div className="text-sm text-[#6b7280]">등록된 면 정보가 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {courts.map((c, idx) => (
                  <div key={idx} className="border border-[#E3E6EC] rounded-lg p-3 text-sm text-[#1C1E26] bg-[#F9FAFB]">
                    <div className="font-semibold">{c.court_name || `면 ${idx + 1}`}</div>
                    <div className="text-xs text-[#6b7280]">
                      인원 {c.capacity || "-"}명 · 크기 {c.size_x || "-"} x {c.size_y || "-"} · 구장유형 {c.floor_type || "-"} ·{" "}
                      실내외 {c.indoor_outdoor || "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!businessUrl || !bankbookUrl || saving}
            className="px-5 py-2 rounded-lg text-white font-semibold disabled:bg-gray-400"
            style={{ background: "#1C5DFF" }}
          >
            {saving ? "제출 중..." : "서류 제출 완료"}
          </button>
        </div>
      </div>
    </main>
  );
}

function UploadField({
  label,
  url,
  onFile,
  uploading,
  required,
  note,
}: {
  label: string;
  url: string | null;
  onFile: (file: File) => void;
  uploading: boolean;
  required?: boolean;
  note?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-[#1C1E26] font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <div className="flex items-center gap-3">
        <input
          id={`${label}-input`}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => document.getElementById(`${label}-input`)?.click()}
          className="px-3 py-2 rounded-lg border border-[#1C5DFF] text-[#1C5DFF] text-sm font-semibold"
        >
          파일 선택 / 업로드
        </button>
        {uploading && <div className="text-xs text-[#6b7280]">업로드 중...</div>}
      </div>
      {url && (
        <div className="text-xs text-[#1C1E26]">
          업로드됨:{" "}
          <a href={url} target="_blank" rel="noreferrer" className="text-[#1C5DFF] underline">
            {url.split("/").pop()}
          </a>
        </div>
      )}
      {note && <div className="text-xs text-[#EF4444]">{note}</div>}
    </div>
  );
}
