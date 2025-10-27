// src/components/MorePrd.js
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, message, Input, Button } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../axios';

/** Thumbnail Component */
function Thumbnail({ src }) {
  const [errored, setErrored] = useState(false);
  if (errored || !src) {
    return <FileImageOutlined style={{ fontSize: 50, color: '#ccc' }} />;
  }
  return (
    <img
      src={src}
      alt="thumbnail"
      onError={() => setErrored(true)}
      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, background: '#f0f0f0' }}
    />
  );
}

/** MorePrd Modal */
export default function MorePrd({ visible, onOk, onCancel, initialSelected = [] }) {
  const params = new URLSearchParams(window.location.search);
  const paramMallId = params.get('mall_id') || params.get('state');
  const storedMallId = localStorage.getItem('mallId');
  const mallId = paramMallId || storedMallId;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState([]);

  useEffect(() => {
    if (visible) {
      setSearchText('');
      setSearchResults([]);
      fetchPage(1, 10);
      
      if (initialSelected && initialSelected.length > 0) {
        const initialKeys = initialSelected.map(p => p.product_no);
        setSelectedRowKeys(initialKeys);
        setSelectedDetails(initialSelected);
      } else {
        setSelectedRowKeys([]);
        setSelectedDetails([]);
      }
    }
  }, [visible, initialSelected]); // initialSelected를 의존성 배열에 추가하여 모달이 열릴 때마다 초기값 반영

  useEffect(() => {
    const missingKeys = selectedRowKeys.filter(
      key => !selectedDetails.some(detail => detail.product_no === key)
    );

    if (missingKeys.length > 0 && mallId) {
      const fetchMissingDetails = async () => {
        try {
          const newDetails = await Promise.all(
            missingKeys.map(async key => {
              const foundLocally = products.find(p => p.product_no === key) || searchResults.find(p => p.product_no === key);
              if (foundLocally) return foundLocally;
              const { data } = await api.get(`/api/${mallId}/products/${key}`);
              return data;
            })
          );
          // 중복 방지 로직 추가
          setSelectedDetails(prev => {
              const existingKeys = new Set(prev.map(p => p.product_no));
              const uniqueNewDetails = newDetails.filter(p => p && !existingKeys.has(p.product_no));
              return [...prev, ...uniqueNewDetails];
          });
        } catch (err) {
          console.error('[MorePrd] Failed to load product details', err);
          message.error('선택된 상품 정보를 가져오는데 실패했습니다.');
        }
      };
      fetchMissingDetails();
    }
  }, [selectedRowKeys, products, searchResults, mallId]);

  const fetchPage = useCallback(async (page, pageSize) => {
    if (!mallId) return message.error('mallId가 없습니다.');
    setLoading(true);
    try {
      const { data } = await api.get(`/api/${mallId}/products`, {
        params: { offset: (page - 1) * pageSize, limit: pageSize },
      });
      setProducts(data.products);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: data.total }));
    } catch (err) {
      message.error('상품 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [mallId]);

  // ✅ [수정] 모든 상품을 불러와서 필터링하는 원본 로직으로 복구
  const fetchAllAndFilter = useCallback(async (q) => {
    if (!mallId) return message.error('mallId가 없습니다.');
    setLoading(true);
    try {
      let all = [], offset = 0, chunk = 100;
      while (true) {
        const res = await api.get(`/api/${mallId}/products`, {
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
      setPagination(prev => ({ ...prev, current: 1, total: filtered.length }));
    } catch (err) {
      console.error('[MorePrd] 검색 실패', err);
      message.error('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [mallId, pagination.pageSize]);


  const handleTableChange = (newPagination) => {
    const { current, pageSize } = newPagination;
    if (searchText) {
      const start = (current - 1) * pageSize;
      setProducts(searchResults.slice(start, start + pageSize));
      setPagination(prev => ({ ...prev, current, pageSize }));
    } else {
      fetchPage(current, pageSize);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  };

  const onDragEnd = useCallback(result => {
    if (!result.destination) return;
    const items = Array.from(selectedRowKeys);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedRowKeys(items);
  }, [selectedRowKeys]);

  const handleOk = useCallback(() => {
    const orderedSelectedProducts = selectedRowKeys
      .map(key => selectedDetails.find(p => p.product_no === key))
      .filter(Boolean);
    onOk(orderedSelectedProducts);
  }, [selectedRowKeys, selectedDetails, onOk]);

  const columns = [
    { title: '번호', dataIndex: 'product_no', width: 80 },
    { title: '상품명', dataIndex: 'product_name' },
    { title: '판매가', dataIndex: 'price', width: 120, render: v => `${Number(v).toLocaleString()}원` },
    { title: '썸네일', dataIndex: 'list_image', width: 80, render: src => <Thumbnail src={src} /> },
  ];

  return (
    <Modal
      title="상품 직접 등록"
      open={visible}
      width={1000}
      onCancel={onCancel}
      onOk={handleOk}
      okText="선택 완료"
      cancelText="닫기"
      destroyOnClose
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <Input.Search
            placeholder="상품명 검색"
            allowClear
            enterButton
            onSearch={q => {
              const query = q.trim();
              setSearchText(query);
              if (query) {
                fetchAllAndFilter(query);
              } else {
                setSearchResults([]);
                fetchPage(1, pagination.pageSize);
              }
            }}
            style={{ marginBottom: 16 }}
          />
          <Table
            rowKey="product_no"
            loading={loading}
            dataSource={products}
            columns={columns}
            pagination={pagination}
            onChange={handleTableChange}
            rowSelection={rowSelection}
            scroll={{ y: 350 }}
          />
        </div>
        <div>
          <h4>선택된 상품 ({selectedRowKeys.length}개)</h4>
          <p>드래그하여 노출 순서를 변경할 수 있습니다.</p>
          {selectedRowKeys.length > 0 ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="selected-products">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ height: 450, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}
                  >
                    {selectedRowKeys.map((key, index) => {
                      const prod = selectedDetails.find(d => d.product_no === key) || {};
                      return (
                        <Draggable key={key} draggableId={String(key)} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                display: 'flex', alignItems: 'center', padding: 8, marginBottom: 8,
                                background: '#fff', border: '1px solid #eee', borderRadius: 4,
                                ...provided.draggableProps.style,
                              }}
                            >
                              <Thumbnail src={prod.list_image} />
                              <div style={{ flex: 1, marginLeft: 12, fontSize: '12px' }}>
                                <div>{prod.product_name}</div>
                                <div style={{ color: '#888' }}>{Number(prod.price).toLocaleString()}원</div>
                              </div>
                              <Button
                                danger
                                type="text"
                                size="small"
                                onClick={() => setSelectedRowKeys(prev => prev.filter(k => k !== key))}
                              >
                                제외
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 4 }}>
              왼쪽 테이블에서 상품을 선택하세요.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}