
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './MissionMap.css';
import BottomNav from './BottomNav';

import type { MapMission } from '../types/mission';
import { missionsApi } from '../api/missions';

// H.1 내가 완료한 장소에 꽂는 빨간 깃발 (SVG를 이미지로 써서 파일 없이 그린다)
const FLAG_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">' +
  '<rect x="5" y="3" width="3" height="38" rx="1.5" fill="#B83A3A"/>' +
  '<path d="M8 4 C14 1 20 8 26 5 C29 4 32 3 34 4 L34 20 C31 19 29 20 26 21 C20 24 14 17 8 20 Z" fill="#E04848"/>' +
  '</svg>';
const FLAG_IMAGE_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FLAG_SVG)}`;

// mine: 내가 간 곳(완료 장소 깃발, H.1) / find: 장소 미션 찾기(수락 안 한 장소 핀, H.2)
type MapMode = 'mine' | 'find';

export default function MissionMap() {
  // 하단 지도 탭을 누를 때마다 주소 기록(key)이 새로 생긴다 → 내 깃발 화면으로 돌아가기
  const { key: locationKey } = useLocation();

  // 카카오 지도 관련 참조
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const toastTimer = useRef<number | null>(null);
  const fittedMode = useRef<MapMode | null>(null); // 마지막으로 범위를 맞춘 모드

  // 지도 상태
  const [mapReady, setMapReady] = useState(false);

  // 미션 데이터
  const [missions, setMissions] = useState<MapMission[]>([]);
  const [selectedMission, setSelectedMission] =
    useState<MapMission | null>(null);

  // 화면 상태
  const [mode, setMode] = useState<MapMode>('mine');
  const [seenLocationKey, setSeenLocationKey] = useState(locationKey);

  // 지도 탭을 다시 눌렀으면(주소 기록이 새로 생김) 내 깃발 화면으로 되돌린다
  if (locationKey !== seenLocationKey) {
    setSeenLocationKey(locationKey);
    setMode('mine');
    setSelectedMission(null);
  }
  const [showReview, setShowReview] = useState(false);
  const [showReviewDetail, setShowReviewDetail] = useState(false);

  // 후기 상태
  const [reviewText, setReviewText] = useState('');
  const [savedReview, setSavedReview] = useState('');

  // 알림 및 로딩 상태
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ========================================
  // 1. 미션 데이터 불러오기
  // ========================================

  useEffect(() => {
    let mounted = true;

    const loadMissions = async () => {
      try {
        const data = await missionsApi.list();

        if (mounted) {
          setMissions(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '미션 정보를 불러오지 못했어요.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMissions();

    return () => {
      mounted = false;
    };
  }, []);

  // ========================================
  // 2. 카카오 지도 SDK 불러오기
  // ========================================

  useEffect(() => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!key) {
      setError('카카오 지도 JavaScript 키가 설정되지 않았어요.');
      return;
    }

    let cancelled = false;

    const initialize = () => {
      if (cancelled || !mapElement.current) return;
      if (!window.kakao?.maps) return;

      window.kakao.maps.load(() => {
        if (cancelled || !mapElement.current) return;

        const options = {
          center: new window.kakao.maps.LatLng(
            37.5665,
            126.978
          ),
          level: 7,
        };

        const map = new window.kakao.maps.Map(
          mapElement.current,
          options
        );

        mapInstance.current = map;
        setMapReady(true);
      });
    };

    const existingScript = document.querySelector(
      'script[data-kakao-map="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.kakao?.maps) {
        initialize();
      } else {
        existingScript.addEventListener(
          'load',
          initialize,
          { once: true }
        );
      }

      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement('script');

    script.dataset.kakaoMap = 'true';

    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;

    script.async = true;
    script.onload = initialize;

    script.onerror = () => {
      if (!cancelled) {
        setError('카카오 지도를 불러오지 못했어요.');
      }
    };

    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  // ========================================
  // 3. 지도 마커 갱신
  // ========================================

  useEffect(() => {
    const map = mapInstance.current;

    if (!mapReady || !map || !window.kakao?.maps) {
      return;
    }

    markers.current.forEach((marker) => {
      marker.setMap(null);
    });

    markers.current = [];

    const shown = missions.filter((mission) =>
      mode === 'mine'
        ? mission.completed // 내가 완료한 장소
        : !mission.accepted && !mission.completed // 아직 수락 안 한 장소
    );

    const flagImage =
      mode === 'mine'
        ? new window.kakao.maps.MarkerImage(
            FLAG_IMAGE_URL,
            new window.kakao.maps.Size(36, 42),
            { offset: new window.kakao.maps.Point(6, 41) } // 깃대 아래 끝이 장소를 가리키게
          )
        : undefined;

    const bounds = new window.kakao.maps.LatLngBounds();

    shown.forEach((mission) => {
      const position = new window.kakao.maps.LatLng(
        mission.latitude,
        mission.longitude
      );

      bounds.extend(position);

      const marker = new window.kakao.maps.Marker({
        position,
        map,
        ...(flagImage ? { image: flagImage } : {}),
      });

      window.kakao.maps.event.addListener(
        marker,
        'click',
        () => {
          setSelectedMission(mission);
          map.panTo(position);
        }
      );

      markers.current.push(marker);
    });

    // 모드를 바꿨거나 처음 그릴 때만, 마커가 모두 보이게 지도 범위를 맞춘다
    if (fittedMode.current !== mode && shown.length > 0) {
      if (shown.length === 1) {
        map.setLevel(5);
        map.setCenter(bounds.getSouthWest());
      } else {
        map.setBounds(bounds);
      }
      fittedMode.current = mode;
    }

    return () => {
      markers.current.forEach((marker) => {
        marker.setMap(null);
      });

      markers.current = [];
    };
  }, [missions, mapReady, mode]);

  // ========================================
  // 4. 알림 메시지
  // ========================================

  const showToast = (message: string) => {
    setToast(message);

    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setToast('');
      toastTimer.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  // ========================================
  // 5. 미션 수락
  // ========================================

  const handleAccept = async () => {
    if (!selectedMission) return;

    try {
      const id = selectedMission.id;
      const updated = await missionsApi.accept(id);

      setMissions(updated);

      const updatedMission = updated.find(
        (item: MapMission) => item.id === id
      );

      if (updatedMission) {
        setSelectedMission(updatedMission);
      }

      showToast('미션을 수락했어요!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '미션 수락에 실패했어요.');
    }
  };

  // ========================================
  // 6. 미션 완료
  // ========================================

  const handleComplete = async () => {
    if (!selectedMission) return;

    try {
      const id = selectedMission.id;
      const { missions: updated, message } = await missionsApi.complete(id);

      setMissions(updated);

      const completedMission = updated.find(
        (item: MapMission) => item.id === id
      );

      if (completedMission) {
        setSelectedMission(completedMission);
      }

      showToast(message); // 예) 미션 완료! 30 경험치를 얻었어요 🎉 Lv.2 ...
    } catch (err) {
      showToast(err instanceof Error ? err.message : '미션 완료 처리에 실패했어요.');
    }
  };

  // ========================================
  // 7. 미션 기록 삭제
  // ========================================

  const handleDelete = async () => {
    if (!selectedMission) return;

    if (!window.confirm('미션 기록을 삭제할까요?')) {
      return;
    }

    try {
      const updated = await missionsApi.remove(
        selectedMission.id
      );

      setMissions(updated);
      setSelectedMission(null);

      showToast('삭제되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '기록 삭제에 실패했어요.');
    }
  };

  // ========================================
  // 8. 후기 작성
  // ========================================

  const handleSaveReview = async () => {
    if (!selectedMission || !reviewText.trim()) {
      showToast('후기를 입력해 주세요.');
      return;
    }

    try {
      const review = {
        missionId: selectedMission.id,
        text: reviewText.trim(),
        writtenAt: new Date().toISOString().slice(0, 10),
      };

      await missionsApi.saveReview(review);

      setSavedReview(review.text);
      setReviewText('');

      setShowReview(false);
      setShowReviewDetail(true);

      showToast('후기가 저장되었어요!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '후기 저장에 실패했어요.');
    }
  };

  // ========================================
  // 9. 후기 조회
  // ========================================

  const handleViewReview = async () => {
    if (!selectedMission) return;

    try {
      const review = await missionsApi.getReview(
        selectedMission.id
      );

      setSavedReview(review?.text ?? '');
      setShowReviewDetail(true);
    } catch {
      showToast('후기를 불러오지 못했어요.');
    }
  };

  // ========================================
  // 10. 현재 표시할 미션 목록
  // ========================================

  const visibleMissions = missions.filter(
    (mission) => !mission.accepted && !mission.completed
  );
  const myFlagCount = missions.filter((mission) => mission.completed).length;

  // 모드 바꾸기 (열려 있던 카드는 닫는다)
  const changeMode = (next: MapMode) => {
    setSelectedMission(null);
    setMode(next);
  };

  // ========================================
  // 11. 화면 출력
  // ========================================

  return (
    <div className="mission-map-page">

      {/* 카카오 지도 */}
      <div
        ref={mapElement}
        className="mission-map-area"
      />

      {/* 장소 미션 찾기 */}
      <button
        type="button"
        className="mission-map-top-button"
        onClick={() => {
          // 누를 때마다 내 깃발(mine) ↔ 수락 안 한 장소 핀(find)을 바꾼다
          changeMode(mode === 'mine' ? 'find' : 'mine');
        }}
      >
        {mode === 'mine' ? '장소 미션 찾기 ⌕' : '장소 미션 목록 ☰'}
      </button>

      {/* 불러오기 실패 / 장소 찾기에 보여줄 핀이 없을 때 안내 */}
      {error && !toast && (
        <div className="mission-map-toast">{error}</div>
      )}
      {mode === 'find' && !loading && !error && visibleMissions.length === 0 && !toast && (
        <div className="mission-map-toast">지금 도전할 수 있는 장소 미션이 없어요.</div>
      )}

      {/* 미션 상세 카드 */}
      {selectedMission && (
        <section className="mission-map-card">

          <div className="mission-map-meta">
            <span>한국</span>
            <span>{selectedMission.category}</span>
            <small>
              {new Date().toLocaleDateString('ko-KR')}
            </small>
          </div>

          <h3>{selectedMission.title}</h3>

          <p>{selectedMission.description}</p>

          <p>
            <strong>주소</strong>
            {' '}{selectedMission.address}
          </p>

          <p>
            <strong>획득 경험치</strong>
            {' '}+{selectedMission.experience}XP
          </p>

          <div className="mission-map-actions">

            {selectedMission.completed ? (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                >
                  기록 삭제
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReviewText('');
                    setShowReview(true);
                  }}
                >
                  후기 작성하기
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedMission(null)}
                >
                  닫기
                </button>

                {selectedMission.accepted ? (
                  <button
                    type="button"
                    onClick={handleComplete}
                  >
                    미션 완료
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAccept}
                  >
                    수락하기
                  </button>
                )}
              </>
            )}

          </div>

          {selectedMission.completed && (
            <button
              type="button"
              onClick={handleViewReview}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '10px',
                border: '1px solid #4C3D34',
                borderRadius: '22px',
                background: 'white',
                color: '#4C3D34',
                fontWeight: 'bold',
              }}
            >
              후기 보기
            </button>
          )}

        </section>
      )}

      {/* 후기 작성 모달 */}
      {showReview && (
        <div className="mission-map-overlay">
          <div className="mission-map-review">

            <h3>후기 작성</h3>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="후기를 작성해주세요."
            />

            <button
              type="button"
              onClick={handleSaveReview}
            >
              저장하기
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => setShowReview(false)}
            >
              취소
            </button>

          </div>
        </div>
      )}

      {/* 후기 조회 모달 */}
      {showReviewDetail && (
        <div className="mission-map-overlay">
          <div className="mission-map-review">

            <h3>후기</h3>

            <p>
              {savedReview || '아직 작성된 후기가 없어요.'}
            </p>

            <button
              type="button"
              onClick={() => setShowReviewDetail(false)}
            >
              확인
            </button>

          </div>
        </div>
      )}

      {/* H.1 빈 상태: 완료한 장소가 없을 때 안내 */}
      {mode === 'mine' && !loading && !error && myFlagCount === 0 && !toast && (
        <div className="mission-map-toast">
          아직 위치 인증으로 완료한 장소가 없어요. 장소 미션을 찾아 도전해 보세요!
        </div>
      )}

      {/* 알림 */}
      {toast && (
        <div className="mission-map-toast">
          {toast}
        </div>
      )}

      {/* 하단 탭: 모든 화면 공통 BottomNav (지도 탭을 누르면 내 깃발 화면으로) */}
      <BottomNav />
    </div>
  );
}
