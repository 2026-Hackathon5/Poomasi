import { useEffect, useRef, useState } from 'react';
import type { Mission } from '../types/mission';
import { styles } from '../styles/poomasi';
import { Alert, Btn, Panel } from './ui';
import samplePhoto from '../assets/profile-sample-photo.jpg';
import { verifyLocation, verifyNone, verifyPhoto } from '../api/verify';
import type { VerifyResult } from '../api/verify';

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

// 서버 주소에 쓰는 "내 미션 id"
// 프로필은 userMissionId 칸에, 메인(api/home.ts)은 id 칸에 내 미션 id를 넣어 준다
const userMissionIdOf = (m: Mission) => m.userMissionId ?? m.id;

// 실패 문구 꺼내기 (서버가 보낸 한국어 안내를 그대로 보여준다)
const failMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

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
      const scale = Math.min(1, 1280 / v.videoWidth); // 긴 변 1280px JPEG (서버 추천 크기)
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
  | { kind: 'photoFail'; message: string }
  | { kind: 'locationGuide' }
  | { kind: 'locationChecking' }
  | { kind: 'locationFail'; distance: number | null; message: string }
  | { kind: 'noneChecking' }
  | { kind: 'noneFail'; message: string }
  | { kind: 'done'; result?: VerifyResult };

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
        : { kind: 'noneChecking' },
  );
  const mounted = useRef(true);
  const finished = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // 성공은 딱 한 번만 알린다 (경험치가 두 번 더해지지 않게)
  const finish = (result: VerifyResult, photoUrl?: string) => {
    if (finished.current) return;
    finished.current = true;
    onVerified(m, photoUrl);
    setStep({ kind: 'done', result });
  };

  // F.3 인증 없음 → 열자마자 서버에 완료 요청
  useEffect(() => {
    if (m.verifyType !== 'none') return;
    verifyNone(userMissionIdOf(m))
      .then((result) => {
        if (!mounted.current) return;
        if (result.success) finish(result);
        else setStep({ kind: 'noneFail', message: result.message });
      })
      .catch((err) => {
        if (mounted.current) setStep({ kind: 'noneFail', message: failMessage(err, '미션을 완료하지 못했어요.') });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // F.2 찍은 사진(dataURL) → 파일로 바꿔 서버에 보내고 AI 판정 결과를 받는다
  const handleCapture = async (photo: string) => {
    setStep({ kind: 'photoChecking' });
    try {
      const blob = await (await fetch(photo)).blob();
      const result = await verifyPhoto(userMissionIdOf(m), blob);
      if (!mounted.current) return;
      if (result.success) finish(result, photo);
      else setStep({ kind: 'photoFail', message: result.message });
    } catch (err) {
      if (mounted.current) setStep({ kind: 'photoFail', message: failMessage(err, '사진을 확인하지 못했어요.') });
    }
  };

  // F.1 지금 위치를 서버에 보내 미션 장소 반경 안인지 확인
  const checkLocation = async () => {
    setStep({ kind: 'locationChecking' });
    try {
      const result = await verifyLocation(userMissionIdOf(m));
      if (!mounted.current) return;
      if (result.success) finish(result);
      else setStep({ kind: 'locationFail', distance: result.distance_m, message: result.message });
    } catch (err) {
      if (mounted.current) {
        setStep({ kind: 'locationFail', distance: null, message: failMessage(err, '위치를 확인하지 못했어요.') });
      }
    }
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
          sub={step.message}
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
          sub={step.distance !== null ? `장소까지의 현재 거리 ${step.distance}m` : step.message}
          button="다시 시도하기"
          onClick={() => setStep({ kind: 'locationGuide' })}
        />
      );

    case 'noneChecking':
      return <Alert title="미션을 완료하고 있어요…" />;

    case 'noneFail':
      return <Alert title="미션을 완료하지 못했어요" sub={step.message} button="닫기" onClick={onClose} />;

    case 'done': {
      const title =
        m.verifyType === 'photo'
          ? '사진이 인증되었습니다!'
          : m.verifyType === 'location'
            ? '위치가 인증되었습니다!'
            : '미션을 완료했습니다!';
      // 서버 문구: 예) 미션 완료! 20 경험치를 얻었어요 🎉 Lv.2 싹을 틔운 볍씨가 되었어요
      const sub = step.result?.message ?? `+${m.xp} XP`;
      return <Alert title={title} sub={sub} button="확인" onClick={onClose} />;
    }
  }
}
