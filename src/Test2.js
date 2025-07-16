// src/Test2.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategorySelector() {
  const [allCats, setAllCats]           = useState([]);
  const [selectedRoot, setSelectedRoot] = useState('');
  const [selectedSub, setSelectedSub]   = useState('');

  // 전체 카테고리 한 번만 로드
  useEffect(() => {
    axios
      .get('http://localhost:5000/api/categories/all')
      .then(res => setAllCats(res.data))
      .catch(err => {
        console.error('전체 카테고리 로딩 실패', err);
        alert('전체 카테고리 로딩에 실패했습니다.');
      });
  }, []);

  // depth=1 대분류 필터
  const roots = allCats.filter(cat => cat.category_depth === 1);

  // 선택된 대분류의 depth=2 소분류 필터
  const subs = allCats.filter(
    cat => cat.parent_category_no === Number(selectedRoot) && cat.category_depth === 2
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>카테고리 대→소분류 선택</h2>

      <div style={{ marginBottom: 12 }}>
        <label>대분류:</label>
        <select
          value={selectedRoot}
          onChange={e => {
            setSelectedRoot(e.target.value);
            setSelectedSub(''); // 대분류 바뀌면 소분류 초기화
          }}
          style={{ marginLeft: 8, padding: 4, minWidth: 200 }}
        >
          <option value="">-- 대분류 선택 --</option>
          {roots.map(r => (
            <option key={r.category_no} value={r.category_no}>
              {r.category_name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>소분류:</label>
        <select
          value={selectedSub}
          onChange={e => setSelectedSub(e.target.value)}
          disabled={!subs.length}
          style={{ marginLeft: 8, padding: 4, minWidth: 200 }}
        >
          <option value="">-- 소분류 선택 --</option>
          {subs.map(s => (
            <option key={s.category_no} value={s.category_no}>
              {s.category_name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 16, lineHeight: 1.6 }}>
        <div>
          선택된 대분류 번호: <strong>{selectedRoot || '없음'}</strong>
        </div>
        <div>
          선택된 소분류 번호: <strong>{selectedSub || '없음'}</strong>
        </div>
      </div>
    </div>
  );
}
