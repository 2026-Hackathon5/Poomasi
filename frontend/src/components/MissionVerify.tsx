import { useEffect, useRef, useState } from 'react';
import type { Mission } from '../types/mission';
import { sleep } from '../utils/mission';
import { styles } from '../styles/poomasi';
import { Alert, Btn, Panel } from './ui';
import samplePhoto from '../assets/profile-sample-photo.jpg';

/* ────────────────────────────────────────────────────────────────
 * 미션 인증 (F) — 진행 중 미션의 [인증하기]를 누르면 뜨는 팝업 흐름
 *
 *  (사진) 안내 → 카메라 → 확인 중 → 성공 / 실패(→ 안내로 롤백)
 *  (위치) 안내 → 확인 중 → 성공 / 실패(→ 안내로 롤백)
 *  (인증 없음) 바로 완료
 *
 * 쓰는 법: <MissionVerify mission={m} onVerified={(m, photoUrl) => ...} onClose={() => ...} />
 *  - onVerified: 인증에 성공한 순간 한 번 불림 → 진행 중 → 완료로 옮기고 경험치 더하기
 *  - onClose: 성공 팝업의 [확인]이나 안내 팝업의 [닫기]를 누르면 불림
 * 프로필(I)뿐 아니라 메인(B.1)의 추천 미션 [인증하기]에서도 그대로 쓸 수 있다.
 * ──────────────────────────────────────────────────────────────── */

// 데모용 설정: true면 사진/위치 인증이 "첫 시도에서는 실패 → 다시 시도하면 성공"으로 동작해
// Flow 3, 4(실패 시 롤백) 화면을 확인할 수 있습니다. 실제 API 연결 시 false로 두고 verify* 함수를 교체하세요.
const DEMO_FAIL_FIRST_TRY = true;

// TODO(F.2.1): 사진 → AI 판정 API 연결
async function verifyPhoto(attempt: number): Promise<boolean> {
  await sleep(1800);
  return !(DEMO_FAIL_FIRST_TRY && attempt === 1);
}

// TODO(F.1.1): navigator.geolocation으로 현재 위치를 한 번만 확인하고 미션 장소 반경 300m 이내인지 계산
async function verifyLocation(attempt: number): Promise<{ ok: boolean; distance: number }> {
  await sleep(1500);
  const ok = !(DEMO_FAIL_FIRST_TRY && attempt === 1);
  return { ok, distance: ok ? 120 : 340 };
}

/* ───────────────────────── 카메라 (F.2) ───────────────────────── */

function CameraView({ onCapture, onClose }: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch {
        // 권한 거부/카메라 없음 → 아래 대체 화면으로 데모 진행
      }
    };
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const shoot = () => {
    const v = videoRef.current;
    if (ready && v && v.videoWidth > 0) {
      const scale = Math.min(1, 800 / v.videoWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(v.videoWidth * scale);
      canvas.height = Math.round(v.videoHeight * scale);
      canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height);
      onCapture(canvas.toDataURL('image/jpeg', 0.8));
    } else {
      onCapture(samplePhoto); // 카메라를 쓸 수 없는 환경(PC 등)에서는 샘플 사진으로 대체
    }
  };

  return (
    <div style={styles.camera}>
      <div style={styles.camTop}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={styles.camIcon} />
        ))}
      </div>
      <div style={styles.camPreview}>
        <video ref={videoRef} playsInline muted style={{ ...styles.camVideo, display: ready ? 'block' : 'none' }} />
        {!ready && <div style={styles.camFallback} />}
      </div>
      <div style={styles.camLabels}>
        {['ISO 80', 'A 1/90', '기본', 'AF', 'WB 자동', '-1.0'].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div style={styles.camControls}>
        <span style={styles.camRec}>
          <span style={styles.camRecDot} />
        </span>
        <button type="button" aria-label="촬영" onClick={shoot} style={styles.shutter} />
        <span style={styles.camThumb} />
      </div>
      <div style={styles.camNav}>
        <button type="button" aria-label="뒤로" onClick={onClose} style={styles.camNavBtn}>
          ‹
        </button>
        <span style={styles.camNavBtn}>□</span>
        <span style={styles.camNavBtn}>⌃</span>
      </div>
    </div>
  );
}

/* ───────────────────────── 인증 흐름 ───────────────────────── */

type Step =
  | { kind: 'photoGuide' }
  | { kind: 'camera' }
  | { kind: 'photoChecking' }
  | { kind: 'photoFail' }
  | { kind: 'locationGuide' }
  | { kind: 'locationChecking' }
  | { kind: 'locationFail'; distance: number }
  | { kind: 'done' };

// 미션별 시도 횟수. 팝업을 닫았다 다시 열어도 유지돼서 데모의 "첫 시도 실패"가 한 번만 나온다
const attempts: Record<number, number> = {};

interface Props {
  mission: Mission;
  onVerified: (m: Mission, photoUrl?: string) => void;
  onClose: () => void;
}

export default function MissionVerify({ mission: m, onVerified, onClose }: Props) {
  const [step, setStep] = useState<Step>(() =>
    m.verifyType === 'photo'
      ? { kind: 'photoGuide' }
      : m.verifyType === 'location'
        ? { kind: 'locationGuide' }
        : { kind: 'done' },
  );
  const mounted = useRef(true);
  const finished = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const nextAttempt = () => (attempts[m.id] = (attempts[m.id] ?? 0) + 1);

  // 성공은 딱 한 번만 알린다 (경험치가 두 번 더해지지 않게)
  const finish = (photoUrl?: string) => {
    if (finished.current) return;
    finished.current = true;
    onVerified(m, photoUrl);
    setStep({ kind: 'done' });
  };

  // F.3 인증 없음 → 열자마자 완료
  useEffect(() => {
    if (m.verifyType === 'none') finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = async (photo: string) => {
    setStep({ kind: 'photoChecking' });
    const ok = await verifyPhoto(nextAttempt());
    if (!mounted.current) return;
    if (ok) finish(photo);
    else setStep({ kind: 'photoFail' });
  };

  const checkLocation = async () => {
    setStep({ kind: 'locationChecking' });
    const result = await verifyLocation(nextAttempt());
    if (!mounted.current) return;
    if (result.ok) finish();
    else setStep({ kind: 'locationFail', distance: result.distance });
  };

  switch (step.kind) {
    case 'photoGuide':
      return (
        <Panel tall>
          <h2 style={styles.modalTitle}>{m.title}</h2>
          <h4 style={styles.guideHead}>사진 인증 방법</h4>
          <ol style={styles.guideList}>
            <li>카메라로 미션 결과를 촬영해주세요</li>
            <li>사진에 다른 행인의 얼굴이 나오지 않게 주의해 주세요</li>
            <li>촬영된 사진이 미션과 관련 없다고 판단 시 인증되지 않아요</li>
          </ol>
          <div style={styles.spacer} />
          <p style={styles.footnote}>※ ‘품앗이’의 촬영 권한이 허용됐는지 확인해주세요!</p>
          <Btn onClick={() => setStep({ kind: 'camera' })}>촬영하기</Btn>
          <Btn variant="taupe" onClick={onClose}>
            닫기
          </Btn>
        </Panel>
      );

    case 'camera':
      return (
        <CameraView
          onCapture={(url) => void handleCapture(url)}
          onClose={() => setStep({ kind: 'photoGuide' })}
        />
      );

    case 'photoChecking':
      return <Alert title="사진을 확인하고 있어요…" />;

    case 'photoFail':
      return (
        <Alert
          title="사진 인증에 실패하였습니다"
          sub="미션 대상이 잘 나오도록 다시 촬영해 주세요!"
          button="다시 시도하기"
          onClick={() => setStep({ kind: 'photoGuide' })}
        />
      );

    case 'locationGuide':
      return (
        <Panel tall>
          <h2 style={styles.modalTitle}>{m.title}</h2>
          <h4 style={styles.guideHead}>위치 인증 방법</h4>
          <ol style={styles.guideList}>
            <li>설정에서 ‘위치’를 켜주세요</li>
            <li>미션 장소 반경 300m 안에 있다면 인증이 완료돼요</li>
          </ol>
          <div style={styles.spacer} />
          <p style={styles.footnote}>※ ‘품앗이’의 위치 권한이 허용됐는지 확인해주세요!</p>
          <Btn onClick={() => void checkLocation()}>위치 확인하기</Btn>
          <Btn variant="taupe" onClick={onClose}>
            닫기
          </Btn>
        </Panel>
      );

    case 'locationChecking':
      return <Alert title="위치를 확인하고 있어요…" />;

    case 'locationFail':
      return (
        <Alert
          title="위치 인증에 실패하였습니다"
          sub={`장소까지의 현재 거리 ${step.distance}m`}
          button="다시 시도하기"
          onClick={() => setStep({ kind: 'locationGuide' })}
        />
      );

    case 'done': {
      const title =
        m.verifyType === 'photo'
          ? '사진이 인증되었습니다!'
          : m.verifyType === 'location'
            ? '위치가 인증되었습니다!'
            : '미션을 완료했습니다!';
      return <Alert title={title} sub={`+${m.xp} XP`} button="확인" onClick={onClose} />;
    }
  }
}
