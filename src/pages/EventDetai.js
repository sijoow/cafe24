// src/pages/EventDetail.jsx

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Input,
} from 'antd';
import {
  UnorderedListOutlined,
  CodeOutlined,
  CopyOutlined,
  BlockOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EventDetail.css';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [htmlModalVisible, setHtmlModalVisible] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [activeTab, setActiveTab] = useState('0');
  const [messageApi, contextHolder] = message.useMessage();

  // 1) 이벤트 데이터 로드
  useEffect(() => {
    axios.get(`${API_BASE}/api/events/${id}`)
      .then(res => {
        const ev = res.data;
        // images, regions에 id 매핑
        ev.images = (ev.images || []).map(img => ({
          ...img,
          id: img._id || img.id,
          regions: (img.regions || []).map(r => ({
            ...r,
            id: r._id || r.id,
          })),
        }));
        setEvent(ev);
      })
      .catch(() => {
        message.error('이벤트 로드 실패');
        navigate('/event/list');
      });
  }, [id, navigate]);

  if (!event) return null;

  const {
    title,
    layoutType,
    gridSize,
    classification = {},
    images = [],
    directProducts = [],      // 직접 등록 상품 번호 배열
  } = event;

  const activeColor = classification.activeColor || '#1890ff';
  const tabs = classification.tabs || [];
  const singleRoot = classification.root;
  const singleSub = classification.sub;

  // 그리드 자리 표시
  const renderGrid = cols => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols},1fr)`,
      gap: 10,
      maxWidth: 800,
      margin: '24px auto'
    }}>
      {Array.from({ length: cols * cols }).map((_, i) => (
        <div key={i} style={{
          height: 120,
          background: '#f0f0f0',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999'
        }}>
          <BlockOutlined style={{ fontSize: 32, color: '#ccc' }} />
        </div>
      ))}
    </div>
  );

  // 쿠폰 다운로드
  const downloadCoupon = couponNo => {
    const couponUrl = `/exec/front/newcoupon/IssueDownload?coupon_no=${couponNo}`;
    window.location.href = couponUrl +
      `&opener_url=${encodeURIComponent(window.location.href)}`;
  };

  const handleShowHtml = () => {
    // 1) 기본 레이아웃 + 이미지 플레이스홀더
    let html = `<!--@layout(/layout/basic/layout.html)-->\n\n`;
    html += `<div id="evt-images">{#images}</div>\n\n`;
  
    // 2) 이미지 매핑 영역에서 사용된 쿠폰 번호 수집
    const couponList = Array.from(new Set(
      images.flatMap(img =>
        (img.regions || [])
          .filter(r => r.coupon)
          .map(r => r.coupon)
      )
    ));
    const couponAttr = couponList.length
      ? ` data-coupon-nos="${couponList.join(',')}"`
      : '';
  
    // 3) 탭 / 싱글 레이아웃 HTML
    if (layoutType === 'tabs') {
      html += `<div class="tabs_${id}">\n`;
      tabs.forEach((t, i) => {
        html += `  <button class="${i === 0 ? 'active' : ''}"
      onclick="showTab('tab-${i}',this)"
    >${t.title || `탭${i+1}`}</button>\n`;
      });
      html += `</div>\n\n`;
  
      // 각 탭별 UL에 data-direct-nos 붙이기
      tabs.forEach((t, i) => {
        const disp = i === 0 ? 'block' : 'none';
        const cate = t.sub || t.root;
  
        // 탭별 직접 등록 ID들만 모아서
        const tabDirect = (classification.tabDirectProducts || {})[i] || [];
        const tabIds    = tabDirect
          .map(p => typeof p === 'object' ? p.product_no : p)
          .filter(Boolean)
          .join(',');
        const directAttrForTab = tabIds ? ` data-direct-nos="${tabIds}"` : '';
  
        html += `<div id="tab-${i}" class="tab-content_${id}" style="display:${disp}">\n`;
        html += `  <ul class="main_Grid_${id}"
          data-cate="${cate}"
          data-grid-size="${gridSize}"${directAttrForTab}
        ></ul>\n`;
        html += `</div>\n\n`;
      });
  
    } else if (layoutType === 'single') {
      const cate = singleSub || singleRoot;
  
      // single mode: one UL, with the single directProducts list
      const singleIds = directProducts
        .map(p => typeof p === 'object' ? p.product_no : p)
        .filter(Boolean)
        .join(',');
      const directAttrForSingle = singleIds ? ` data-direct-nos="${singleIds}"` : '';
  
      html += `<div class="product_list_widget">\n`;
      html += `  <ul class="main_Grid_${id}"
        data-cate="${cate}"
        data-grid-size="${gridSize}"${directAttrForSingle}
      ></ul>\n`;
      html += `</div>\n\n`;
  
    } else {
      html += `<p>상품을 노출하지 않습니다.</p>\n\n`;
    }
  
    // 4) widget.js 스크립트 태그 (쿠폰만 전역으로)
    const scriptAttrs = [
      `src="${API_BASE}/widget.js"`,
      `data-page-id="${id}"`,
      `data-api-base="${API_BASE}"`,
      `data-tab-count="${tabs.length}"`,
      `data-active-color="${activeColor}"`,
      couponAttr
    ].filter(Boolean).join(' ');
  
    html += `<script ${scriptAttrs}></script>\n`;
  
    setHtmlCode(html);
    setHtmlModalVisible(true);
  };
  
  
  // HTML 복사
  const handleCopy = async () => {
    await navigator.clipboard.writeText(htmlCode);
    message.success('코드 복사 완료');
    setHtmlModalVisible(false);
  };

  return (
    <>
      {contextHolder}
      <Card
        title={title}
        className="event-detail-card"
        style={{ '--active-color': activeColor }}
        extra={
          <Space>
            <Button
              icon={<UnorderedListOutlined />}
              onClick={() => navigate('/event/list')}
            >
              목록
            </Button>
            <Button icon={<CodeOutlined />} onClick={handleShowHtml}>
              HTML
            </Button>
          </Space>
        }
      >

        {/* 1) 이미지 + regions 렌더링 */}
        {images.map((img, idx) => (
          <div
            key={img.id}
            style={{
              position: 'relative',
              margin: '0 auto',
              maxWidth: 800,
              fontSize: 0
            }}
          >
            <img
              src={img.src}
              alt={`img-${idx}`}
              style={{ width: '100%' }}
              draggable={false}
            />
            {img.regions.map(r => {
              const l = (r.xRatio * 100).toFixed(2);
              const t = (r.yRatio * 100).toFixed(2);
              const w = (r.wRatio * 100).toFixed(2);
              const h = (r.hRatio * 100).toFixed(2);
              const style = {
                position: 'absolute',
                left: `${l}%`,
                top: `${t}%`,
                width: `${w}%`,
                height: `${h}%`,
                cursor: 'pointer',
                border: r.coupon
                  ? '2px dashed #ff6347'
                  : `2px dashed ${activeColor}`,
                background: r.coupon
                  ? 'rgba(255,99,71,0.2)'
                  : 'rgba(24,144,255,0.2)',
              };
              if (r.coupon) {
                return (
                  <button
                    key={r.id}
                    style={style}
                    onClick={() => downloadCoupon(r.coupon)}
                  />
                );
              } else {
                let hrefVal = r.href;
                if (!/^https?:\/\//.test(hrefVal)) {
                  hrefVal = 'https://' + hrefVal;
                }
                return (
                  <a
                    key={r.id}
                    href={hrefVal}
                    target="_blank"
                    rel="noreferrer"
                    style={style}
                  />
                );
              }
            })}
          </div>
        ))}

        {/* 2) 상품 그리드 (자리표시) */}
        {layoutType === 'none' && (
          <p style={{ textAlign: 'center', marginTop: 24 }}>
            상품을 노출하지 않습니다.
          </p>
        )}
        {layoutType === 'single' && renderGrid(gridSize)}
        {layoutType === 'tabs' && (
          <>
            <div
              style={{
                display: 'grid',
                gap: 8,
                gridTemplateColumns: `repeat(${tabs.length},1fr)`,
                maxWidth: 800,
                margin: '16px auto'
              }}
            >
              {tabs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(String(i))}
                  className={activeTab === String(i) ? 'active' : ''}
                  style={{
                    padding: 8,
                    fontSize: 16,
                    border: 'none',
                    background:
                      activeTab === String(i) ? activeColor : '#f5f5f5',
                    color: activeTab === String(i) ? '#fff' : '#333',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {t.title || `탭${i+1}`}
                </button>
              ))}
            </div>
            {renderGrid(gridSize)}
          </>
        )}

      </Card>

      {/* HTML 모달 */}
      <Modal
        title="전체 HTML 코드"
        open={htmlModalVisible}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopy}>
            복사
          </Button>,
          <Button
            key="close"
            onClick={() => setHtmlModalVisible(false)}
          >
            닫기
          </Button>,
        ]}
        onCancel={() => setHtmlModalVisible(false)}
        width={800}
      >
        <Input.TextArea
          value={htmlCode}
          rows={16}
          readOnly
        />
      </Modal>
    </>
  );
}
