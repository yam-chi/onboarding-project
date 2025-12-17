"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OnboardingState, statusToLabel } from "@/lib/onboarding";

type TimeRow = { id?: string; day_of_week: string; start_time: string; end_time: string; note?: string | null };

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TIMES = Array.from({ length: 19 }, (_, i) => {
  const h = i + 6; // 06:00~24:00
  return `${h.toString().padStart(2, "0")}:00`;
});

export default function Step5Page() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [info, setInfo] = useState<{ step_status: OnboardingState } | null>(null);
  const [timeMap, setTimeMap] = useState<Record<string, TimeRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) throw new Error("유효하지 않은 경로입니다.");
        const res = await fetch(`/api/onboarding/${id}/step4`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "불러오기 실패");
        if (!mounted) return;
        setInfo({ step_status: json.step_status });
        const grouped: Record<string, TimeRow[]> = {};
        (json.times || []).forEach((t: any) => {
          if (!grouped[t.day_of_week]) grouped[t.day_of_week] = [];
          grouped[t.day_of_week].push({
            id: t.id,
            day_of_week: t.day_of_week,
            start_time: t.start_time,
            end_time: t.end_time,
            note: t.note,
          });
        });
        setTimeMap(grouped);
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
    if (info.step_status === "step5_submitted") return "세팅 가능 시간이 제출되었습니다. 담당자 검토 중입니다.";
    if (info.step_status === "step4_complete") return "CSV 완료. 세팅 가능 시간을 제출해주세요.";
    return "요일별로 운영 가능한 시간을 선택해 제출해주세요.";
  }, [info]);

  const allTimes = useMemo(() => {
    return Object.entries(timeMap)
      .flatMap(([day, rows]) =>
        (rows || []).map((r) => ({
          day_of_week: day,
          start_time: r.start_time,
          end_time: r.end_time,
          note: r.note ?? null,
        })),
      )
      .filter((r, idx, arr) => arr.findIndex((x) => x.day_of_week === r.day_of_week && x.start_time === r.start_time) === idx);
  }, [timeMap]);

  const addOneHour = (time: string) => {
    const [h, m] = time.split(":").map((n) => Number(n));
    const next = h + 1;
    return `${Math.min(next, 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const submit = async () => {
    if (!id) return;
    setError(null);
    setBanner(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/${id}/step4`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ times: allTimes, submit: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "제출 실패");
      setBanner("세팅 가능 시간이 제출되었습니다.");
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
          <h1 className="text-xl font-semibold text-[#111827]">STEP4 · 세팅 가능 시간 입력</h1>
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
          <div className="overflow-auto border border-[#E3E6EC] rounded-xl bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-[#F3F4F6] text-[#1C1E26]">
                <tr>
                  <th className="px-3 py-2 text-left">시간</th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-2 py-2 text-center">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMES.map((t) => (
                  <tr key={t} className="border-t border-[#E3E6EC]">
                    <td className="px-3 py-2 font-semibold text-[#111827]">{t}</td>
                    {DAY_KEYS.map((dayKey) => {
                      const list = timeMap[dayKey] || [];
                      const checked = list.some((row) => row.start_time === t);
                      const disabled = info?.step_status === "step5_submitted";
                      return (
                        <td key={dayKey} className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // 추가
                                const end = addOneHour(t);
                                setTimeMap((prev) => {
                                  const prevList = prev[dayKey] || [];
                                  return { ...prev, [dayKey]: [...prevList, { day_of_week: dayKey, start_time: t, end_time: end }] };
                                });
                              } else {
                                setTimeMap((prev) => {
                                  const prevList = prev[dayKey] || [];
                                  return { ...prev, [dayKey]: prevList.filter((row) => row.start_time !== t) };
                                });
                              }
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-white font-semibold disabled:bg-gray-400"
            style={{ background: "#1C5DFF" }}
          >
            {saving ? "제출 중..." : "세팅 가능 시간 제출하기"}
          </button>
        </div>
      </div>
    </main>
  );
}
