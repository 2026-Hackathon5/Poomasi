
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MissionMap.css';

import type { Mission } from '../types/mission';
import { missionsApi } from '../api/missions';

export default function MissionMap() {
  const navigate = useNavigate();

  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] =
    useState<Mission | null>(null);

  const [myMap, setMyMap] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showReviewDetail, setShowReviewDetail] =
    useState(false);

  const [reviewText, setReviewText] = useState('');
  const [savedReview, setSavedReview] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 미션 데이터 불러오기
  const loadMissions = async () => {
    try {
      const data = await missionsApi.list();
      setMissions(data);
    } catch {
      setError('미션 정보를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  // 카카오 지도 SDK 불러오기
  useEffect(() => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!key) {
      setError('카카오 지도 JavaScript 키가 설정되지 않았어요.');
      return;
    }

    const existingScript = document.querySelector(
      'script[data-kakao-map="true"]'
    ) as HTMLScriptElement | null;

    const initialize = () => {
      window.kakao.maps.load(() => {
        if (!mapElement.current) return;

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
      });
    };

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

      return;
    }

    const script = document.createElement('script');

    script.dataset.kakaoMap = 'true';
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;

    script.async = true;

    script.onload = initialize;

    script.onerror = () => {
      setError('카카오 지도를 불러오지 못했어요.');
    };

    document.head.appendChild(script);

  }, []);

  // 지도 마커 갱신
  useEffect(() => {
    const map = mapInstance.current;

    if (!map || !window.kakao?.maps) return;

    markers.current.forEach((marker) =>
      marker.setMap(null)
    );

    markers.current = [];

    const visibleMissions = missions.filter((mission) =>
      myMap
        ? mission.completed || mission.accepted
        : !mission.completed
    );

    visibleMissions.forEach((mission) => {
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
        }
      );

      markers.current.push(marker);
    });

  }, [missions, myMap]);

  const showToast = (message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast('');
    }, 2500);
  };

  // 미션 수락
  const handleAccept = async () => {
    if (!selectedMission) return;

    try {
      const updated = await missionsApi.accept(
        selectedMission.id
      );

      setMissions(updated);

      setSelectedMission(
        updated.find(
          (item) => item.id === selectedMission.id
        ) ?? null
      );

      showToast('미션을 수락했어요!');
    } catch {
      showToast('미션 수락에 실패했어요.');
    }
  };

  // 미션 완료 (프로토타입 확인용)
  const handleComplete = async () => {
    if (!selectedMission) return;

    try {
      const updated = await missionsApi.complete(
        selectedMission.id
      );

      setMissions(updated);

      setSelectedMission(null);
      showToast('미션 수행 완료!');
    } catch {
      showToast('미션 완료 처리에 실패했어요.');
    }
  };

  // 미션 기록 삭제
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

  // 후기 작성
  const handleSaveReview = async () => {
    if (!selectedMission || !reviewText.trim()) {
      showToast('후기를 입력해 주세요.');
      return;
    }

    try {
      await missionsApi.saveReview({
        missionId: selectedMission.id,
        content: reviewText.trim(),
        createdAt: new Date().toISOString(),
      });

      setSavedReview(reviewText.trim());
      setShowReview(false);
      setShowReviewDetail(true);

      showToast('후기가 저장되었어요!');
    } catch {
      showToast('후기 저장에 실패했어요.');
    }
  };

  // 후기 조회
  const handleViewReview = async () => {
    if (!selectedMission) return;

    try {
      const review = await missionsApi.getReview(
        selectedMission.id
      );

      setSavedReview(review?.content ?? '');
      setShowReviewDetail(true);
    } catch {
      showToast('후기를 불러오지 못했어요.');
    }
  };

  const visibleMissions = missions.filter((mission) =>
    myMap
      ? mission.completed || mission.accepted
      : !mission.completed
  );

  return (
    <div className="mission-map-page">

      {/* 카카오 지도 */}
      <div
        ref={mapElement}
        className="mission-map-area"
      />

      {/* 상단 버튼 */}
      <button
        className="mission-map-top-button"
        onClick={() => {
          setMyMap(false);
          setSelectedMission(null);
        }}
      >
        장소 미션 찾기 ⌕
      </button>

      <button
        className="mission-map-my-button"
        onClick={() => {
          setMyMap(true);
          setSelectedMission(null);
        }}
      >
        나의 지도 ♧
      </button>

      {/* 미션 선택 목록 */}
      {!selectedMission && (
        <div className="mission-map-list">
          <strong>
            {myMap ? '나의 미션 기록' : '장소 미션 목록'}
          </strong>

          {loading && <p>미션을 불러오고 있어요...</p>}

          {error && <p>{error}</p>}

          {visibleMissions.map((mission) => (
            <button
              key={mission.id}
              onClick={() => setSelectedMission(mission)}
            >
              📍 {mission.title}
            </button>
          ))}

          {!loading && visibleMissions.length === 0 && (
            <p>표시할 미션이 없어요.</p>
          )}
        </div>
      )}

      {/* 선택한 미션 상세 카드 */}
      {selectedMission && (
        <section className="mission-map-card">

          <div className="mission-map-meta">
            <span>한국</span>
            <span>{selectedMission.category}</span>
            <small>{new Date().toLocaleDateString('ko-KR')}</small>
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

            {myMap ? (
              <>
                <button onClick={handleDelete}>
                  기록 삭제
                </button>

                <button onClick={handleViewReview}>
                  후기 보기
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedMission(null)}
                >
                  닫기
                </button>

                {selectedMission.accepted ? (
                  <button onClick={handleComplete}>
                    미션 완료
                  </button>
                ) : (
                  <button onClick={handleAccept}>
                    수락하기
                  </button>
                )}
              </>
            )}

          </div>
        </section>
      )}

      {/* 후기 작성 */}
      {showReview && (
        <div className="mission-map-overlay">
          <div className="mission-map-review">

            <h3>후기 작성</h3>

            <textarea
              value={reviewText}
              onChange={(e) =>
                setReviewText(e.target.value)
              }
              placeholder="후기를 작성해주세요."
            />

            <button onClick={handleSaveReview}>
              저장하기
            </button>

            <button
              className="secondary"
              onClick={() => setShowReview(false)}
            >
              취소
            </button>

          </div>
        </div>
      )}

      {/* 후기 조회 */}
      {showReviewDetail && (
        <div className="mission-map-overlay">
          <div className="mission-map-review">

            <h3>후기</h3>

            <p>
              {savedReview || '아직 작성된 후기가 없어요.'}
            </p>

            <button
              onClick={() => setShowReviewDetail(false)}
            >
              확인
            </button>

          </div>
        </div>
      )}

      {/* 임시 오류 및 성공 안내 */}
      {toast && (
        <div className="mission-map-toast">
          {toast}
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="pm-bottom-nav">

        <button onClick={() => navigate('/')}>
          랜덤미션
        </button>

        <button onClick={() => navigate('/posts')}>
          숨은 뜻
        </button>

        <button className="active">
          지도
        </button>

        <button onClick={() => navigate('/profile')}>
          프로필
        </button>

      </nav>

      <div className="pm-home-indicator" />

    </div>
  );
}
