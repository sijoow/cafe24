import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';
import { useLocation } from 'react-router-dom';

// 1) Context 생성
const MallContext = createContext({
  mallId: 'onimon'  // 기본값
});

// 2) Provider 컴포넌트
export function MallProvider({ children }) {
  const location = useLocation();
  const [mallId, setMallId] = useState(() => {
    // 초기값: URL 첫번째 세그먼트 or 로컬스토리지 or 'onimon'
    const path = location.pathname.split('/');
    const fromUrl = path[1];
    const fromStorage = localStorage.getItem('mallId');
    return fromUrl || fromStorage || 'onimon';
  });

  // URL이 바뀔 때마다 mallId 업데이트 & 로컬스토리지에 저장
  useEffect(() => {
    const path = location.pathname.split('/');
    const newMall = path[1];
    if (newMall && newMall !== mallId) {
      setMallId(newMall);
      localStorage.setItem('mallId', newMall);
    }
  }, [location.pathname]);

  return (
    <MallContext.Provider value={{ mallId }}>
      {children}
    </MallContext.Provider>
  );
}

// 3) Context 사용을 위한 커스텀 훅
export function useMall() {
  return useContext(MallContext);
}
