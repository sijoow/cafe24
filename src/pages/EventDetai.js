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
        ev.images = (ev.images || []).map(img => ({
          ...img,
          id: img._id || img.id,
          regions: (img.regions || []).map(r => ({
            ...r,
            id: r._id || r.id
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

  const { title, layoutType, gridSize, classification = {}, images } = event;
  const activeColor = classification.activeColor || '#1890ff';
  const tabs = classification.tabs || [];
  const { root: singleRoot, sub: singleSub } = classification;

  // 상품 그리드 미리보기
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

  // 쿠폰 다운로드 함수
  const downloadCoupon = couponNo => {
    const couponUrl = `/exec/front/newcoupon/IssueDownload?coupon_no=${couponNo}`;
    const opener = encodeURIComponent(window.location.href);
    window.location.href = couponUrl + `&opener_url=${opener}`;
  };

  // HTML 코드 생성 (모달)
  const handleShowHtml = () => {
    let html = `<!--@layout(/layout/basic/layout.html)-->\n\n`;
  
    // 1) 모든 이미지 & 영역 매핑
    images.forEach((img, idx) => {
      html += `<div style="position:relative;margin:0 auto;width:100%;max-width:800px;">\n`;
      html += `<img src="${img.src}" style="max-width:100%;height:auto;" />\n`;
      // 각 이미지의 regions 순회
      img.regions.forEach(r => {
        const l = (r.xRatio * 100).toFixed(2),
              t = (r.yRatio * 100).toFixed(2),
              w = (r.wRatio * 100).toFixed(2),
              h = (r.hRatio * 100).toFixed(2);
  
        if (r.coupon) {
          html += `  <button data-track-click="coupon" data-region-id="${r.coupon}" style="\n`;
          html += `    position:absolute; left:${l}%; top:${t}%; width:${w}%; height:${h}%;\n`;
          html += `    border:none; cursor:pointer; opacity:0;\n`;
          html += `  " onclick="downloadCoupon('${r.coupon}')"></button>\n`;
        } else {
          let hrefVal = r.href;
          if (!/^https?:\/\//.test(hrefVal) && /^[^\/].+\..+/.test(hrefVal)) {
            hrefVal = 'https://' + hrefVal;
          }
          html += `  <a href="${hrefVal}" data-track-click="product" data-region-id="${r.href}" style="\n`;
          html += `    position:absolute; left:${l}%; top:${t}%; width:${w}%; height:${h}%;\n`;
          html += `    display:block; cursor:pointer;\n`;
          html += `  "></a>\n`;
        }
      });
     // ─── ❗️ &nbsp; 제거 ❗️ ────────────────────────────────────────
     html = html.replace(/&nbsp;/g, '');
    });

    // 2) 탭 레이아웃
    if (layoutType === 'tabs') {
      html += `<div class="tabs_${id}">\n`;
      tabs.forEach((t, idx) => {
        const cls = idx === 0 ? 'active' : '';
        html += `  <button class="${cls}" onclick="showTab('tab-${idx}', this)">${t.title || `탭${idx+1}`}</button>\n`;
      });
      html += `</div>\n\n`;
      tabs.forEach((t, idx) => {
        const disp = idx === 0 ? 'block' : 'none';
        const cate = t.sub || t.root;
        html += `<div id="tab-${idx}" class="tab-content_${id}" style="display:${disp}">\n`;
        html += `  <div module="product_listnormal">\n`;
        html += `    <ul class="main_Grid" style="display:grid;grid-template-columns:repeat(${gridSize},1fr);gap:10px;max-width:800px;margin:0 auto">\n`;
        html += `      <!-- $count=300\n `;
        html += `   $cate_no=${cate} -->\n`;
        html += `      <!--@import(/goods_info_grd.html)-->\n`;
        html += `      <!--@import(/goods_info_grd.html)-->\n`;
        html += `    </ul>\n`;
        html += `  </div>\n`;
        html += `</div>\n\n`;
      });
    }
    // 3) 단일 레이아웃
    else if (layoutType === 'single') {
      const cate = singleSub || singleRoot;
      html += `<div module="product_listnormal">\n`;
      html += `  <ul class="main_Grid" style="display:grid;grid-template-columns:repeat(${gridSize},1fr);gap:10px;max-width:800px;margin:0 auto">\n`;
      html += `    <!-- $count=300 $cate_no=${cate} -->\n`;
      html += `    <!--@import(/goods_info_grd.html)-->\n`;
      html += `    <!--@import(/goods_info_grd.html)-->\n`;
      html += `  </ul>\n`;
      html += `</div>\n\n`;
    }

    // 4) widget.js 삽입
    html += `<script src="${API_BASE}/widget.js"\n`;
    html += `  data-page-id="${id}"\n`;
    html += `  data-tab-count="${tabs.length}"\n`;
    html += `  data-active-color="${activeColor}"\n`;
    html += `  data-api-base="${API_BASE}">\n`;
    html += `</script>\n`;

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
        extra={(
          <Space>
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/event/list')}>
              목록
            </Button>
            <Button icon={<CodeOutlined />} onClick={handleShowHtml}>
              HTML
            </Button>
          </Space>
        )}
      >
        {/* 이미지 & 영역 매핑 */}
        {images.map((img, idx) => (
          <div
            key={img.id}
            style={{
              position: 'relative',
              margin: '0 auto',
              maxWidth: 800,
              fontSize: 0  // ← 공백 문자 크기를 0으로 만들어 완전히 숨깁니다
            }}
          >
            {/* <img> 다음 줄바꿈 없이 바로 regions 매핑 */}
            <img
              src={img.src}
              alt={`img-${idx}`}
              style={{ width: '100%' }}
              draggable={false}
            />{img.regions.map(r => {
              let hrefValue = r.href;
              if (!/^https?:\/\//.test(hrefValue) && /^[^\/].+\..+/.test(hrefValue)) {
                hrefValue = 'https://' + hrefValue;
              }
              const l = (r.xRatio * 100).toFixed(2),
                    t = (r.yRatio * 100).toFixed(2),
                    w = (r.wRatio * 100).toFixed(2),
                    h = (r.hRatio * 100).toFixed(2);
              const st = {
                position: 'absolute',
                left:     `${l}%`,
                top:      `${t}%`,
                width:    `${w}%`,
                height:   `${h}%`,
                cursor:   'pointer',
                border:   r.coupon ? '2px dashed #ff6347' : `2px dashed ${activeColor}`,
                background: r.coupon ? 'rgba(255,99,71,0.2)' : 'rgba(24,144,255,0.2)'
              };
              if (r.coupon) {
                return (
                  <button
                    key={r.id}
                    style={st}
                    data-track-click="coupon"
                    data-region-id={r.coupon}
                    onClick={() => downloadCoupon(r.coupon)}
                  />
                );
              } else {
                return (
                  <a
                    key={r.id}
                    href={hrefValue}
                    target="_blank"
                    rel="noreferrer"
                    style={st}
                    data-track-click="product"
                    data-region-id={r.href}
                  />
                );
              }
            })}
          </div>
        ))}

        {/* 레이아웃별 상품 미리보기 */}
        {layoutType === 'single' && renderGrid(gridSize)}
        {layoutType === 'tabs' && (
          <>
            <div style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: `repeat(${tabs.length},1fr)`,
              maxWidth: 800,
              margin: '16px auto'
            }}>
              {tabs.map((t, i) => {
                const isActive = activeTab === String(i);
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTab(String(i))}
                    style={{
                      padding: 8,
                      fontSize: 16,
                      lineHeight: 1.4,
                      border: 'none',
                      background: isActive ? activeColor : '#f5f5f5',
                      color: isActive ? '#fff' : '#333',
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
                );
              })}
            </div>
            {renderGrid(gridSize)}
          </>
        )}
        {layoutType === 'none' && (
          <p style={{ textAlign: 'center', marginTop: 24 }}>
            상품을 노출하지 않습니다.
          </p>
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
          <Button key="close" onClick={() => setHtmlModalVisible(false)}>
            닫기
          </Button>
        ]}
        onCancel={() => setHtmlModalVisible(false)}
        width={800}
      >
        <Input.TextArea value={htmlCode} rows={16} readOnly />
      </Modal>
    </>
  );
}
