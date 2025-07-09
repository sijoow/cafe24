// src/components/MorePrd.js
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, message, Input, Button } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';
import axios from 'axios';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from 'react-beautiful-dnd';

/** 썸네일 컴포넌트 */
function Thumbnail({ src }) {
  const [errored, setErrored] = useState(false);
  if (errored || !src) {
    return <FileImageOutlined style={{ fontSize: 50, color: '#ccc' }} />;
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setErrored(true)}
      style={{
        width: 50,
        height: 50,
        objectFit: 'cover',
        borderRadius: 4,
        background: '#f0f0f0',
      }}
    />
  );
}

/** MorePrd 모달 */
export default function MorePrd({
  visible,
  target = 'direct',   // 'direct' 또는 'tab'
  tabIndex = 0,        // 탭 인덱스 (0,1,2…)
  onOk,
  onCancel,
}) {
  // 탭별 storage 키
  const keyPrefix        = `MorePrd_${target}_${tabIndex}`;
  const storageKeyKeys   = `${keyPrefix}_selectedKeys`;
  const storageKeyDetail = `${keyPrefix}_selectedDetails`;

  // 1) sessionStorage 복원
  const [selectedRowKeys, setSelectedRowKeys] = useState(() => {
    return JSON.parse(sessionStorage.getItem(storageKeyKeys) || '[]');
  });
  const [selectedDetails, setSelectedDetails] = useState(() => {
    return JSON.parse(sessionStorage.getItem(storageKeyDetail) || '[]');
  });

  // 2) 로컬 테이블/검색 상태
  const [loading, setLoading]       = useState(false);
  const [products, setProducts]     = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchResults, setSearchResults] = useState([]);

  // 3) sessionStorage 동기화
  useEffect(() => {
    sessionStorage.setItem(storageKeyKeys, JSON.stringify(selectedRowKeys));
  }, [selectedRowKeys]);
  useEffect(() => {
    sessionStorage.setItem(storageKeyDetail, JSON.stringify(selectedDetails));
  }, [selectedDetails]);

  // 4) 기본 페이징 조회
  const fetchPage = async (page, pageSize) => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/products', {
        params: { offset: (page - 1) * pageSize, limit: pageSize },
      });
      setProducts(data.products);
      setPagination({ current: page, pageSize, total: data.total });
    } catch {
      message.error('상품 로드에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 5) 전체 조회 + 필터(검색)
  const fetchAllAndFilter = async q => {
    setLoading(true);
    try {
      let all = [], offset = 0, chunk = 100;
      while (true) {
        const res = await axios.get('/api/products', {
          params: { offset, limit: chunk },
        });
        all = all.concat(res.data.products);
        if (res.data.products.length < chunk) break;
        offset += chunk;
      }
      const filtered = all.filter(p =>
        p.product_name.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(filtered);
      setProducts(filtered.slice(0, pagination.pageSize));
      setPagination({ current: 1, pageSize: pagination.pageSize, total: filtered.length });
    } catch {
      message.error('검색에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 6) 모달 열릴 때 & 탭/모드 변경 시 초기 로드
  useEffect(() => {
    if (!visible) return;

    // 1) 검색어·테이블 초기화
    setSearchText('');
    fetchPage(1, pagination.pageSize);

    // 2) 탭별로 분리된 sessionStorage에서 선택 상태 복원
    const savedKeys = JSON.parse(sessionStorage.getItem(storageKeyKeys) || '[]');
    setSelectedRowKeys(savedKeys);

    const savedDetails = JSON.parse(sessionStorage.getItem(storageKeyDetail) || '[]');
    setSelectedDetails(savedDetails);

    // 3) 혹시 savedDetails에 부족한 키가 있으면 보충
    const toLoad = savedKeys.filter(
      k => !savedDetails.some(d => String(d.product_no) === String(k))
    );
    if (toLoad.length > 0) {
      Promise.all(
        toLoad.map(k => axios.get(`/api/products/${k}`, { params: { shop_no: 1 } }).then(r => r.data))
      )
      .then(arr => {
        setSelectedDetails(prev => [...prev, ...arr]);
      })
      .catch(() => message.error('선택 상품 상세 로드 실패'));
    }

  }, [visible, target, tabIndex]);

  // 7) 체크박스 변경 시 상세 보충
  useEffect(() => {
    const missing = selectedRowKeys.filter(
      k => !selectedDetails.find(d => d.product_no === k)
    );
    if (!missing.length) return;
    Promise.all(
      missing.map(k => {
        const loc = products.find(p => p.product_no === k) ||
                    searchResults.find(p => p.product_no === k) ||
                    selectedDetails.find(d => d.product_no === k);
        if (loc) return Promise.resolve({ data: loc });
        return axios.get(`/api/products/${k}`, { params: { shop_no: 1 } });
      })
    )
      .then(resps => {
        setSelectedDetails(prev => [...prev, ...resps.map(r => r.data)]);
      })
      .catch(() => message.error('선택 상품 상세 추가 로드 실패'));
  }, [selectedRowKeys, products, searchResults]);

  // 8) 페이지 변경
  const onTableChange = (page, pageSize) => {
    if (searchText) {
      const start = (page - 1) * pageSize;
      setProducts(searchResults.slice(start, start + pageSize));
      setPagination({ current: page, pageSize, total: searchResults.length });
    } else {
      fetchPage(page, pageSize);
    }
  };

  // 9) rowSelection
  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: keys => setSelectedRowKeys(keys),
  };

  // 10) 드래그 순서 변경
  const onDragEnd = useCallback(
    result => {
      if (!result.destination) return;
      const arr = Array.from(selectedRowKeys);
      const [m] = arr.splice(result.source.index, 1);
      arr.splice(result.destination.index, 0, m);
      setSelectedRowKeys(arr);
    },
    [selectedRowKeys]
  );

  // 11) 컬럼
  const columns = [
    { title: '번호', dataIndex: 'product_no', width: 80 },
    { title: '상품명', dataIndex: 'product_name', width: 200 },
    {
      title: '판매가',
      dataIndex: 'price',
      width: 120,
      render: v => `${Number(v).toLocaleString()}원`,
    },
    {
      title: '썸네일',
      dataIndex: 'list_image',
      width: 80,
      render: src => <Thumbnail src={src} />,
    },
  ];

  return (
    <Modal
      title={target === 'direct' ? '상품 직접 등록' : `탭 ${tabIndex + 1} 등록`}
      open={visible}
      width={840}
      onCancel={onCancel}
      onOk={() => onOk(selectedRowKeys.map(k => Number(k)))}
      okText="추가"
      cancelText="닫기"
    >
      <Input.Search
        placeholder="상품명 검색"
        allowClear
        enterButton
        onSearch={q => {
          setSearchText(q);
          q.trim() ? fetchAllAndFilter(q) : fetchPage(1, pagination.pageSize);
        }}
        style={{ marginBottom: 16 }}
      />

      <Table
        rowKey="product_no"
        loading={loading}
        dataSource={products}
        columns={columns}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: onTableChange,
        }}
        rowSelection={rowSelection}
        scroll={{ y: 300 }}
      />

      {selectedRowKeys.length > 0 && (
        <>
          <h4 style={{ marginTop: 24 }}>선택된 상품 (드래그해서 순서 변경)</h4>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sel-list">
              {prov => (
                <div
                  ref={prov.innerRef}
                  {...prov.droppableProps}
                  style={{
                    maxHeight: 250,
                    overflowY: 'auto',
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    padding: 8,
                    marginTop: 8,
                  }}
                >
                  {selectedRowKeys.map((key, idx) => {
                    const prod = selectedDetails.find(d => d.product_no === key) || {};
                    return (
                      <Draggable key={key} draggableId={String(key)} index={idx}>
                        {dProv => (
                          <div
                            ref={dProv.innerRef}
                            {...dProv.draggableProps}
                            {...dProv.dragHandleProps}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px',
                              marginBottom: 4,
                              background: '#fff',
                              border: '1px solid #eee',
                              borderRadius: 4,
                              ...dProv.draggableProps.style,
                            }}
                          >
                            <Thumbnail src={prod.list_image} />
                            <div style={{ flex: 1, marginLeft: 12 }}>
                              <div><strong>번호:</strong> {prod.product_no}</div>
                              <div><strong>이름:</strong> {prod.product_name}</div>
                              <div><strong>판매가:</strong> {prod.price != null ? `${Number(prod.price).toLocaleString()}원` : '-'}</div>
                            </div>
                            <Button
                              danger
                              size="small"
                              onClick={() =>
                                setSelectedRowKeys(prev => prev.filter(x => x !== key))
                              }
                            >
                              취소
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {prov.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </Modal>
  );
}
