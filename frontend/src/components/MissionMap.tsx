
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MissionMap.css';

import type { MapMission } from '../types/mission';
import { missionsApi } from '../api/missions';

export default function MissionMap() {
  const navigate = useNavigate();

  // 카카오 지도 관련 참조
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const toastTimer = useRef<number | null>(null);

  // 지도 상태
  const [mapReady, setMapReady] = useState(false);

  // 미션 데이터
  const [missions, setMissions] = useState<MapMission[]>([]);
  const [selectedMission, setSelectedMission] =
    useState<MapMission | null>(null);

  // 화면 상태
  const [showMissionList, setShowMissionList] = useState(false);
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
      } catch {
        if (mounted) {
          setError('미션 정보를 불러오지 못했어요.');
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

    missions.forEach((mission) => {
      const position = new window.kakao.maps.LatLng(
        mission.latitude,
        mission.longitude
      );

      const marker = new window.kakao.maps.Marker({
        position,
        map,
      });

      window.kakao.maps.event.addListener(
        marker,
        'click',
        () => {
          setSelectedMission(mission);
          setShowMissionList(false);
          map.panTo(position);
        }
      );

      markers.current.push(marker);
    });

    return () => {
      markers.current.forEach((marker) => {
        marker.setMap(null);
      });

      markers.current = [];
    };
  }, [missions, mapReady]);

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
    } catch {
      showToast('미션 수락에 실패했어요.');
    }
  };

  // ========================================
  // 6. 미션 완료
  // ========================================

  const handleComplete = async () => {
    if (!selectedMission) return;

    try {
      const id = selectedMission.id;
      const updated = await missionsApi.complete(id);

      setMissions(updated);

      const completedMission = updated.find(
        (item: MapMission) => item.id === id
      );

      if (completedMission) {
        setSelectedMission(completedMission);
      }

      showToast('미션 수행 완료!');
    } catch {
      showToast('미션 완료 처리에 실패했어요.');
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
    } catch {
      showToast('기록 삭제에 실패했어요.');
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
    } catch {
      showToast('후기 저장에 실패했어요.');
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
    (mission) => !mission.completed
  );

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
          setSelectedMission(null);
          setShowMissionList((prev) => !prev);
        }}
      >
        장소 미션 찾기 ⌕
      </button>

      {/* 지도 위 미션 목록 */}
      {showMissionList && (
        <div className="mission-map-list">
          <strong>장소 미션 목록</strong>

          {loading && (
            <p>미션을 불러오고 있어요...</p>
          )}

          {error && <p>{error}</p>}

          {visibleMissions.map((mission) => (
            <button
              type="button"
              key={mission.id}
              onClick={() => {
                setSelectedMission(mission);
                setShowMissionList(false);

                if (mapInstance.current && window.kakao?.maps) {
                  const position = new window.kakao.maps.LatLng(
                    mission.latitude,
                    mission.longitude
                  );

                  mapInstance.current.panTo(position);
                }
              }}
            >
              📍 {mission.title}
            </button>
          ))}

          {!loading && visibleMissions.length === 0 && (
            <p>표시할 미션이 없어요.</p>
          )}
        </div>
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

      {/* 알림 */}
      {toast && (
        <div className="mission-map-toast">
          {toast}
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="pm-bottom-nav">

        <button
          type="button"
          onClick={() => navigate('/missions')}
        >
          랜덤미션
        </button>

        <button
          type="button"
          onClick={() => navigate('/posts')}
        >
          숨은 뜻
        </button>

        <button
          type="button"
          className="active"
        >
          지도
        </button>

        <button
          type="button"
          onClick={() => navigate('/profile')}
        >
          프로필
        </button>

      </nav>

      {/* 하단 홈 인디케이터 */}
      <div className="pm-home-indicator" />

    </div>
  );
}
