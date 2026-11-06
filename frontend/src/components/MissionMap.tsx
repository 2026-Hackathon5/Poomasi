import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './MissionMap.css';

import type {
  MapMission,
  Mission,
  CatalogMission,
  CompletedMission,
} from '../types/mission';

import { missionsApi } from '../api/missions';
import { useMissionStore } from '../mocks/missionStoreContext';

// ========================================
// 지도 마커 이미지 생성
// ========================================

function createMarkerImage(isMyMap: boolean) {
  const svg = isMyMap
    ? `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="40" height="48" viewBox="0 0 40 48">
        <path d="M8 43 V5" stroke="#4C3D34"
          stroke-width="3" stroke-linecap="round"/>
        <path d="M9 5 L34 12 L9 21 Z"
          fill="#D9534F" stroke="#9D3535"
          stroke-width="1"/>
      </svg>
    `
    : `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="40" height="48" viewBox="0 0 40 48">
        <path d="M20 1 C9 1 2 9 2 19
          C2 31 20 47 20 47
          C20 47 38 31 38 19
          C38 9 31 1 20 1 Z"
          fill="#4C3D34"/>
        <circle cx="20" cy="19" r="8" fill="white"/>
      </svg>
    `;

  const imageSrc =
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return new window.kakao.maps.MarkerImage(
    imageSrc,
    new window.kakao.maps.Size(40, 48),
    {
      offset: new window.kakao.maps.Point(20, 48),
    }
  );
}

// ========================================
// 랜덤미션 데이터를 지도용 데이터로 변환
// ========================================

function convertToMapMission(
  mission: Mission | CatalogMission | CompletedMission,
  accepted: boolean,
  completed: boolean
): MapMission | null {

  // 좌표가 없는 미션은 지도에 표시하지 않음
  if (
    typeof mission.latitude !== 'number' ||
    typeof mission.longitude !== 'number'
  ) {
    return null;
  }

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,

    address:
      mission.address ||
      mission.placeName ||
      '',

    latitude: mission.latitude,
    longitude: mission.longitude,

    category: mission.category,
    experience: mission.xp,

    country: mission.country,

    accepted,
    completed,
  };
}

// ========================================
// 지도 화면
// ========================================

export default function MissionMap() {
  const navigate = useNavigate();

  // ========================================
  // 1. 랜덤미션 데이터 공유
  // ========================================

  const {
    available,
    progress,
    completed,
    accept,
    removeMissionRecord,
  } = useMissionStore();

  // ========================================
  // 2. 카카오 지도 관련 참조
  // ========================================

  const mapElement = useRef<HTMLDivElement>(null);

  const mapInstance = useRef<any>(null);

  const markers = useRef<any[]>([]);

  const toastTimer = useRef<number | null>(null);

  // ========================================
  // 3. 상태 관리
  // ========================================

  const [mapReady, setMapReady] = useState(false);

  const [selectedMission, setSelectedMission] =
    useState<MapMission | null>(null);

  // 처음에는 나의 지도
  const [myMap, setMyMap] = useState(true);

  // 후기 상태
  const [showReview, setShowReview] = useState(false);

  const [showReviewDetail, setShowReviewDetail] =
    useState(false);

  const [reviewText, setReviewText] = useState('');

  const [savedReview, setSavedReview] = useState('');

  const [reviewExists, setReviewExists] = useState(false);

  const [reviewLoading, setReviewLoading] = useState(false);

  // 기록 삭제 확인 팝업
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  // 알림 및 오류
  const [toast, setToast] = useState('');

  const [error, setError] = useState('');

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
  // 5. 지도에 표시할 미션 결정
  // ========================================

  const visibleMissions = useMemo(() => {

    // ----------------------------------------
    // 나의 지도
    // 수락한 미션 + 완료한 미션
    // ----------------------------------------

    if (myMap) {
      const acceptedMissions = progress
        .map((mission) =>
          convertToMapMission(
            mission,
            true,
            false
          )
        )
        .filter(
          (mission): mission is MapMission =>
            mission !== null
        );

      const completedMissions = completed
        .map((mission) =>
          convertToMapMission(
            mission,
            true,
            true
          )
        )
        .filter(
          (mission): mission is MapMission =>
            mission !== null
        );

      // 동일 ID 중복 표시 방지
      const uniqueMissions = new Map<number, MapMission>();

      [...acceptedMissions, ...completedMissions].forEach(
        (mission) => {
          uniqueMissions.set(mission.id, mission);
        }
      );

      return Array.from(uniqueMissions.values());
    }

    // ----------------------------------------
    // 장소 미션 찾기
    // 아직 수락하지 않은 장소 미션
    // ----------------------------------------

    return available
      .filter(
        (mission) => mission.verifyType === 'location'
      )
      .map((mission) =>
        convertToMapMission(
          mission,
          false,
          false
        )
      )
      .filter(
        (mission): mission is MapMission =>
          mission !== null
      );

  }, [myMap, progress, completed, available]);

  // ========================================
  // 6. 카카오 지도 SDK 불러오기
  // ========================================

  useEffect(() => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!key) {
      setError(
        '카카오 지도 JavaScript 키가 설정되지 않았어요.'
      );
      return;
    }

    let cancelled = false;

    const initialize = () => {
      if (cancelled || !mapElement.current) return;

      if (!window.kakao?.maps) return;

      window.kakao.maps.load(() => {
        if (cancelled || !mapElement.current) return;

        const map = new window.kakao.maps.Map(
          mapElement.current,
          {
            center: new window.kakao.maps.LatLng(
              37.5665,
              126.978
            ),
            level: 7,
          }
        );

        mapInstance.current = map;

        setMapReady(true);
        setError('');
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
  // 7. 지도 마커 갱신
  // ========================================

  useEffect(() => {
    const map = mapInstance.current;

    if (!mapReady || !map || !window.kakao?.maps) {
      return;
    }

    // 기존 마커 제거
    markers.current.forEach((marker) => {
      marker.setMap(null);
    });

    markers.current = [];

    // 현재 지도 모드에 맞는 마커
    const markerImage = createMarkerImage(myMap);

    visibleMissions.forEach((mission) => {

      const position = new window.kakao.maps.LatLng(
        mission.latitude,
        mission.longitude
      );

      const marker = new window.kakao.maps.Marker({
        position,
        map,
        image: markerImage,
      });

      // 마커 클릭
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

    return () => {
      markers.current.forEach((marker) => {
        marker.setMap(null);
      });

      markers.current = [];
    };

  }, [visibleMissions, myMap, mapReady]);

  // ========================================
  // 8. 선택한 미션의 후기 조회
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const loadReview = async () => {

      if (!selectedMission || !myMap) {
        setReviewExists(false);
        setSavedReview('');
        setReviewLoading(false);
        return;
      }

      setReviewLoading(true);

      try {
        const review = await missionsApi.getReview(
          selectedMission.id
        );

        if (cancelled) return;

        const hasReview = Boolean(
          review?.text?.trim()
        );

        setReviewExists(hasReview);

        setSavedReview(review?.text ?? '');

      } catch {
        if (!cancelled) {
          setReviewExists(false);
          setSavedReview('');

          showToast('후기 정보를 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) {
          setReviewLoading(false);
        }
      }
    };

    loadReview();

    return () => {
      cancelled = true;
    };

  }, [selectedMission?.id, myMap]);

  // ========================================
  // 9. 지도 모드 전환
  // ========================================

  const toggleMapMode = () => {

    setMyMap((prev) => !prev);

    // 상세 카드 초기화
    setSelectedMission(null);

    // 후기 창 초기화
    setShowReview(false);

    setShowReviewDetail(false);

    setShowDeleteConfirm(false);

    setReviewText('');

    setSavedReview('');

    setReviewExists(false);

    setReviewLoading(false);
  };

  // ========================================
  // 10. 미션 수락
  // ========================================

  const handleAccept = () => {
    if (!selectedMission) return;

    // 현재 선택한 미션을 랜덤미션 목록에서 찾기
    const mission = available.find(
      (item) => item.id === selectedMission.id
    );

    if (!mission) {
      showToast('이미 수락했거나 삭제된 미션이에요.');
      setSelectedMission(null);
      return;
    }

    // 기존 MissionStore의 수락 기능 사용
    accept(mission);

    setSelectedMission(null);

    showToast('미션을 수락했어요!');
  };

  // ========================================
  // 11. 기록 삭제
  // ========================================

  const handleDelete = async () => {
    if (!selectedMission) return;

    const id = selectedMission.id;

    // 진행 중 / 완료 기록 삭제
    removeMissionRecord(id);

    // 해당 미션 후기 삭제
    try {
      await missionsApi.removeReview(id);
    } catch {
      showToast('기록은 삭제했지만 후기 삭제에 실패했어요.');
      setSelectedMission(null);
      setShowDeleteConfirm(false);
      return;
    }

    // 화면 초기화
    setSelectedMission(null);

    setShowDeleteConfirm(false);

    setShowReview(false);

    setShowReviewDetail(false);

    setSavedReview('');

    setReviewText('');

    setReviewExists(false);

    showToast('기록이 삭제되었어요.');
  };

  // ========================================
  // 12. 후기 작성
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
        writtenAt: new Date()
          .toISOString()
          .slice(0, 10),
      };

      await missionsApi.saveReview(review);

      setSavedReview(review.text);

      setReviewExists(true);

      setReviewText('');

      setShowReview(false);

      setShowReviewDetail(true);

      showToast('후기가 저장되었어요!');

    } catch {
      showToast('후기 저장에 실패했어요.');
    }
  };

  // ========================================
  // 13. 후기 조회
  // ========================================

  const handleViewReview = async () => {
    if (!selectedMission) return;

    try {
      const review = await missionsApi.getReview(
        selectedMission.id
      );

      if (!review?.text) {
        setReviewExists(false);

        showToast('작성된 후기가 없어요.');

        return;
      }

      setSavedReview(review.text);

      setShowReviewDetail(true);

    } catch {
      showToast('후기를 불러오지 못했어요.');
    }
  };

  // ========================================
  // 14. 화면 출력
  // ========================================

  return (
    <div className="mission-map-page">

      {/* 카카오 지도 */}
      <div
        ref={mapElement}
        className="mission-map-area"
      />

      {/* ====================================
          상단 지도 모드 전환 버튼
      ==================================== */}

      <button
        type="button"
        className="mission-map-top-button"
        onClick={toggleMapMode}
      >
        {myMap
          ? '장소 미션 찾기 ⌕'
          : '나의 지도 ♧'}
      </button>

      {/* ====================================
          오류 메시지
      ==================================== */}

      {error && (
        <div className="mission-map-toast">
          {error}
        </div>
      )}

      {/* ====================================
          미션 상세 카드
      ==================================== */}

      {selectedMission && (
        <section className="mission-map-card">

          <div className="mission-map-meta">

            <span>
              {selectedMission.country || '한국'}
            </span>

            <span>
              {selectedMission.category}
            </span>

            <small>
              {new Date().toLocaleDateString('ko-KR')}
            </small>

          </div>

          <h3>
            {selectedMission.title}
          </h3>

          <p>
            {selectedMission.description}
          </p>

          <p>
            <strong>주소</strong>
            {' '}
            {selectedMission.address}
          </p>

          <p>
            <strong>획득 경험치</strong>
            {' '}
            +{selectedMission.experience}XP
          </p>

          {/* ====================================
              나의 지도
          ==================================== */}

          <div className="mission-map-actions">

            {myMap ? (
              <>
                {/* 기록 삭제는 항상 표시 */}

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  기록 삭제
                </button>

                {/* 후기 유무에 따라 버튼 하나만 표시 */}

                {reviewLoading ? (
                  <button type="button" disabled>
                    후기 확인 중...
                  </button>
                ) : reviewExists ? (
                  <button
                    type="button"
                    onClick={handleViewReview}
                  >
                    후기 보기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewText('');
                      setShowReview(true);
                    }}
                  >
                    후기 작성하기
                  </button>
                )}

              </>
            ) : (
              <>
                {/* 장소 미션 찾기 */}

                <button
                  type="button"
                  onClick={() => setSelectedMission(null)}
                >
                  닫기
                </button>

                <button
                  type="button"
                  onClick={handleAccept}
                >
                  수락하기
                </button>

              </>
            )}

          </div>
        </section>
      )}

      {/* ====================================
          기록 삭제 확인 팝업
      ==================================== */}

      {showDeleteConfirm && (
        <div className="mission-map-overlay">

          <div className="mission-map-review">

            <h3>미션 기록을 삭제할까요?</h3>

            <p>
              삭제한 기록은 나의 지도에서 사라져요.
            </p>

            <button
              type="button"
              onClick={handleDelete}
            >
              삭제하기
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              취소
            </button>

          </div>
        </div>
      )}

      {/* ====================================
          후기 작성 모달
      ==================================== */}

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

      {/* ====================================
          후기 조회 모달
      ==================================== */}

      {showReviewDetail && (
        <div className="mission-map-overlay">

          <div className="mission-map-review">

            <h3>후기</h3>

            <p style={{ whiteSpace: 'pre-wrap' }}>
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

      {/* ====================================
          알림 메시지
      ==================================== */}

      {toast && (
        <div className="mission-map-toast">
          {toast}
        </div>
      )}

      {/* ====================================
          하단 네비게이션
      ==================================== */}

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