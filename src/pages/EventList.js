// src/pages/EventList.jsx

import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Image,
  message,
  Popconfirm,
  Grid,
} from 'antd'
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../axios'
import dayjs from 'dayjs'
import './EventList.css'

const { useBreakpoint } = Grid

// mallId 가져오는 커스텀 훅
function useMallId() {
  const params = new URLSearchParams(window.location.search)
  const paramMallId  = params.get('mall_id') || params.get('state')
  const storedMallId = localStorage.getItem('mallId')
  return paramMallId || storedMallId
}

// ── 샘플 이벤트 빌더 ───────────────────────────────────────────────
// 모든 블록(이미지+클릭영역 · 텍스트 · 이미지슬라이드 · 영상 · 상품 · 유의사항 · 타임세일)을
// 한 이벤트에 담는다. 이미지는 외부 의존 없이 data-URI SVG 배너로 생성, 상품/쿠폰은 실제 데이터 사용.
const _uid = () => Date.now().toString() + Math.random().toString(36).slice(2, 8)
const _banner = (text, from, to) =>
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1200" height="480" fill="url(#g)"/><text x="600" y="262" font-family="sans-serif" font-size="58" font-weight="bold" fill="#ffffff" text-anchor="middle">${text}</text></svg>`
  )

// 프로모션 설명 패널 — 마크업(SVG)으로 작성해 이미지 블록으로 노출(라이브/미리보기 모두 렌더)
const _promoPanel = () => {
  const rows = [
    { t: '🎁 프로모션 안내', y: 64, s: 32, c: '#fe6326', w: 'bold' },
    { t: '이 이벤트 한 페이지에서 이렇게 즐기세요', y: 102, s: 19, c: '#888888', w: 'normal' },
    { t: '✓ 배너의 쿠폰 영역을 누르면 즉시 쿠폰이 다운로드됩니다', y: 162, s: 21, c: '#333333', w: 'normal' },
    { t: '✓ ‘탭 이동’ 버튼으로 원하는 상품 탭으로 바로 이동·스크롤', y: 206, s: 21, c: '#333333', w: 'normal' },
    { t: '✓ 팝업으로 추가 혜택·공지를 한눈에 확인', y: 250, s: 21, c: '#333333', w: 'normal' },
    { t: '✓ ⏱ 타임세일 카운트다운 종료 전 할인가로 구매하세요!', y: 294, s: 21, c: '#e8332e', w: 'bold' },
    { t: '✓ 상품 카드 7종 · 단품/탭 · 2·3·4열로 자유롭게 노출', y: 338, s: 21, c: '#333333', w: 'normal' },
  ]
  const texts = rows.map(r => `<text x="72" y="${r.y}" font-family="sans-serif" font-size="${r.s}" font-weight="${r.w}" fill="${r.c}">${r.t}</text>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400" rx="16" fill="#fff7f2"/><rect width="10" height="400" fill="#fe6326"/>${texts}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// 클릭영역 라벨 박스가 그려진 배너 — zones 좌표(비율)에 라벨/색 박스를 그려 라이브에서도 클릭영역이 보이게 함
const _bannerWithZones = (title, zones) => {
  const W = 1200, H = 480
  const boxes = (zones || []).map(z => {
    const x = Math.round(z.x * W), y = Math.round(z.y * H), w = Math.round(z.w * W), h = Math.round(z.h * H)
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${z.color}" fill-opacity="0.18" stroke="${z.color}" stroke-width="3" stroke-dasharray="9 6"/><text x="${x + 14}" y="${y + 31}" font-family="sans-serif" font-size="20" font-weight="bold" fill="${z.color}">${z.label}</text>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3ec"/><stop offset="1" stop-color="#ffe7d1"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><text x="600" y="58" font-family="sans-serif" font-size="30" font-weight="bold" fill="#fe6326" text-anchor="middle">${title}</text>${boxes}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// 범용 설명 패널(마크업) — 제목 + 줄 목록을 좌측 컬러바 카드로 렌더
const _panel = (title, lines, accent = '#fe6326', bg = '#fff7f2') => {
  const items = lines.map((ln, i) => {
    const t = typeof ln === 'string' ? ln : ln.t
    const c = (typeof ln === 'object' && ln.c) || '#333333'
    const w = (typeof ln === 'object' && ln.w) || 'normal'
    const s = (typeof ln === 'object' && ln.s) || 20
    return `<text x="72" y="${112 + i * 42}" font-family="sans-serif" font-size="${s}" font-weight="${w}" fill="${c}">${t}</text>`
  }).join('')
  const H = 116 + lines.length * 42
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${H}"><rect width="1200" height="${H}" rx="16" fill="${bg}"/><rect width="10" height="${H}" fill="${accent}"/><text x="72" y="62" font-family="sans-serif" font-size="30" font-weight="bold" fill="${accent}">${title}</text>${items}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}
const _optionPanel = () => _panel('🛠 상품 옵션 선택 안내', [
  '✓ 등록 방식 — 상품을 직접 검색해 추가 / 카테고리 지정으로 자동 불러오기',
  '✓ 노출 방식 — 단품(한 목록) 또는 탭(탭마다 다른 상품, 최대 11개)',
  '✓ 그리드 — 한 줄에 2·3·4개 (탭별로 따로 지정 가능)',
  '✓ 카드 디자인 — 기본·쿠폰강조·브랜드·강조(세로)·가운데·심플·세일배지 7종',
  '✓ 썸네일/아이콘 — 사각형·둥근 모서리 / 아이콘 위치 4방향',
  '✓ 상품명·요약·가격은 Cafe24 상품 데이터에 자동 매핑됩니다',
], '#1677ff', '#eef5ff')
const _couponPanel = () => _panel('🎟 쿠폰 선택 안내', [
  '✓ 이벤트 적용 쿠폰 — 연결하면 상품이 “혜택가”로 표시 (저장만으로 자동 반영)',
  '✓ 이미지 쿠폰 영역 — 클릭 시 선택한 쿠폰이 즉시 다운로드됩니다',
  '✓ 미오픈 쿠폰 — 쿠폰 번호를 직접 입력 후 Enter로 미리 추가',
  '✓ 타임세일 — 기간할인(또는 쿠폰)을 골라 할인가 + 카운트다운 노출',
  { t: '※ 표시 할인가는 Cafe24에 적용된 혜택 기준입니다 (직접 입력은 표시용)', c: '#d4380d', w: 'bold' },
], '#ff6347', '#fff1ee')
// 영상 자리표시(실제 임베드 대신) — 무관한 영상이 박히는 어색함 방지
const _videoPlaceholder = () => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500"><rect width="1200" height="500" rx="12" fill="#1a1a1a"/><circle cx="600" cy="222" r="54" fill="#ff0000"/><path d="M582 193 L582 251 L632 222 Z" fill="#ffffff"/><text x="600" y="342" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">YouTube 영상 영역</text><text x="600" y="382" font-family="sans-serif" font-size="17" fill="#aaaaaa" text-anchor="middle">실제 제작 시 YouTube 링크/ID를 넣으면 이 자리에 영상이 표시됩니다</text></svg>`
)

function buildSampleEvent(products, couponNo) {
  const P = (products || []).slice(0, 6).map(p => {
    const price = parseFloat(p.price) || 0
    return {
      product_no: p.product_no, product_code: p.product_code, product_name: p.product_name,
      price: p.price, sale_price: price ? Math.round(price * 0.7) : undefined, // 30% 시연 할인가
      list_image: p.list_image, image_medium: p.image_medium || p.list_image,
      decoration_icon_url: p.decoration_icon_url || undefined,
    }
  })
  const half = Math.ceil(P.length / 2) || 1
  const tabA = P.slice(0, half)
  const tabB = P.slice(half)
  const hasCoupon = !!couponNo

  // 상품 블록 id 확보 — 배너의 '탭 이동' 영역이 이 블록의 '베스트' 탭을 가리킴
  const productBlockId = _uid()
  const hasProducts = P.length > 0

  // 상품 블록 빌더 (노출방식 단품/탭 · 그리드 · 카드 디자인 · 썸네일 · 아이콘 조합)
  const makeProduct = ({ id, layout = 'single', grid = 3, template = 'basic', thumb = 'square', icon = 'top-left' }) => {
    if (!hasProducts) return null
    const base = { id: id || _uid(), type: 'product_group', registerMode: 'direct', gridSize: grid, layoutType: layout, cardTemplate: template, thumbRadius: thumb, iconPosition: icon }
    if (layout === 'tabs') return { ...base, tabDirectProducts: { 0: tabA, 1: (tabB.length ? tabB : tabA) }, tabs: [{ title: '추천', root: null, sub: null }, { title: '베스트', root: null, sub: null }], activeColor: '#fe6326' }
    return { ...base, directProducts: P }
  }
  const label = (text) => ({ id: _uid(), type: 'text', text, style: { align: 'center', fontSize: 15, fontWeight: 'bold', color: '#1f1f1f', mt: 26, mb: 6 } })

  // 클릭영역 정의(좌표를 한 곳에서 관리) — 배너 이미지에도 같은 위치에 라벨 박스를 그려 라이브에서 영역이 보이게 함
  const zones = [
    { kind: 'url', label: 'URL 이동', color: '#fe6326', x: 0.06, y: 0.10, w: 0.32, h: 0.16, href: 'https://www.cafe24.com' },
    ...(hasProducts ? [{ kind: 'tab', label: '탭 이동', color: '#722ed1', x: 0.62, y: 0.10, w: 0.32, h: 0.16, tabTarget: { blockId: productBlockId, tabIndex: 1 } }] : []),
    ...(hasCoupon ? [{ kind: 'coupon', label: '쿠폰 받기', color: '#ff6347', x: 0.06, y: 0.70, w: 0.40, h: 0.18, coupon: String(couponNo) }] : []),
    { kind: 'popup', label: '팝업 열기', color: '#13c2c2', x: 0.58, y: 0.70, w: 0.36, h: 0.18, popup: { images: [{ url: _banner('팝업 이미지 1 · 쿠폰 안내', '#ff6347', '#ffa39e') }, { url: _banner('팝업 이미지 2 · 이벤트 안내', '#13c2c2', '#5cdbd3') }], interval: 3000, showCloseButton: true } },
  ]
  const imageRegions = zones.map(z => {
    const r = { id: _uid(), xRatio: z.x, yRatio: z.y, wRatio: z.w, hRatio: z.h }
    if (z.href) r.href = z.href
    if (z.tabTarget) r.tabTarget = z.tabTarget
    if (z.coupon) r.coupon = z.coupon
    if (z.popup) r.popup = z.popup
    return r
  })
  const imageBlock = { id: _uid(), type: 'image', src: _bannerWithZones('이벤트 배너 · 아래 영역을 클릭해보세요', zones), regions: imageRegions }
  const promoBlock = { id: _uid(), type: 'image', src: _promoPanel(), regions: [] }

  const heroText = { id: _uid(), type: 'text', text: '🎉 전 상품 최대 50% 특가 🎉', style: { align: 'center', fontSize: 24, fontWeight: 'bold', color: '#fe6326', mt: 20, mb: 12 } }
  const slideBlock = { id: _uid(), type: 'image_slide', images: [{ src: _banner('슬라이드 1', '#7b2ff7', '#f107a3') }, { src: _banner('슬라이드 2', '#13c2c2', '#36cfc9') }, { src: _banner('슬라이드 3', '#1a1a1a', '#555555') }], swiper: { perView: 1, loop: true, arrows: true, pagination: true, autoplay: true, interval: 3 } }
  // 영상: 실제 임베드 대신 간단한 자리표시(무관한 영상 박히는 어색함 방지)
  const videoLabel = { id: _uid(), type: 'text', text: '▶️ 영상 블록 — 실제 제작 시 YouTube 링크/ID를 넣으면 이 자리에 영상이 표시됩니다', style: { align: 'center', fontSize: 14, fontWeight: 'normal', color: '#999999', mt: 24, mb: 6 } }
  const videoBlock = { id: _uid(), type: 'image', src: _videoPlaceholder(), regions: [] }

  // 설명 패널(마크업): 쿠폰 선택 / 상품 옵션 선택
  const couponPanelBlock = { id: _uid(), type: 'image', src: _couponPanel(), regions: [] }
  const optionPanelBlock = { id: _uid(), type: 'image', src: _optionPanel(), regions: [] }

  // 섹션 타이틀/구분 (설명 → 실제 라이브)
  const titleText = { id: _uid(), type: 'text', text: '🎁 프로모션 올인원 — 한 페이지로 끝내는 이벤트', style: { align: 'center', fontSize: 26, fontWeight: 'bold', color: '#fe6326', mt: 8, mb: 4 } }
  const introText = { id: _uid(), type: 'text', text: '쿠폰 · 타임세일 · 상품 진열 · 클릭 영역까지 한 페이지에서. 아래에서 사용법과 실제 라이브 화면을 함께 확인하세요.', style: { align: 'center', fontSize: 16, fontWeight: 'normal', color: '#666666', mt: 0, mb: 14 } }
  const sectionLive = { id: _uid(), type: 'text', text: '───  여기서부터 실제 라이브 화면 예시  ───', style: { align: 'center', fontSize: 16, fontWeight: 'bold', color: '#999999', mt: 40, mb: 14 } }

  // 상품 레이아웃 다양한 조합 쇼케이스 — 각 블록 앞에 설명 텍스트
  const layoutsHeader = { id: _uid(), type: 'text', text: '📦 상품 레이아웃 둘러보기 — 단품/탭 · 그리드 2·3·4열 · 카드 디자인 7종', style: { align: 'center', fontSize: 18, fontWeight: 'bold', color: '#333333', mt: 30, mb: 8 } }
  const showcasePairs = [
    ['① 탭형 · 세일 배지형 카드 · 3열  (위 배너의 “탭 이동”이 이 블록의 ‘베스트’ 탭으로 이동합니다)', { id: productBlockId, layout: 'tabs', grid: 3, template: 'badge', thumb: 'rounded' }],
    ['② 단품형 · 기본형 카드 · 3열', { layout: 'single', grid: 3, template: 'basic' }],
    ['③ 단품형 · 쿠폰 강조형 카드 · 2열', { layout: 'single', grid: 2, template: 'gmarket' }],
    ['④ 단품형 · 브랜드 강조형 카드 · 3열', { layout: 'single', grid: 3, template: 'musinsa' }],
    ['⑤ 단품형 · 강조형(세로) 카드 · 4열', { layout: 'single', grid: 4, template: 'emphasis' }],
    ['⑥ 단품형 · 가운데 정렬형 카드 · 3열', { layout: 'single', grid: 3, template: 'center' }],
    ['⑦ 단품형 · 심플형 카드 · 3열', { layout: 'single', grid: 3, template: 'simple' }],
  ]
  const showcaseBlocks = hasProducts
    ? [layoutsHeader, ...showcasePairs.flatMap(([txt, opts]) => { const pb = makeProduct(opts); return pb ? [label('▸ ' + txt), pb] : [] })]
    : []

  const noticeBlock = { id: _uid(), type: 'event_notice', noticeTitle: '이벤트 유의사항', noticeText: '· 본 이벤트는 재고 소진 시 조기 종료될 수 있습니다.\n· 쿠폰은 1인 1회 다운로드 가능하며 일부 상품은 제외됩니다.\n· 자세한 내용은 고객센터로 문의해 주세요.', noticeStyle: { color: '#444444', fontSize: 14, lineHeight: 1.7, padding: 16 } }
  const timesaleBlock = {
    id: _uid(), type: 'timesale', promoType: 'benefit', manual: true, title: '⚡ 오늘의 타임세일',
    startDate: new Date().toISOString(), endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    productNos: P.map(p => Number(p.product_no)).filter(Boolean), manualProducts: P,
    showCountdown: true, gridSize: 3, cardTemplate: 'badge', bannerStyle: 'dark',
  }

  // 설명(올인원이 무엇/어떻게) → 실제 라이브 진행(배너·특가·슬라이드·영상·상품·유의·타임세일)
  const blocks = [
    titleText, introText, promoBlock, couponPanelBlock, optionPanelBlock,
    sectionLive, imageBlock, heroText, slideBlock, videoLabel, videoBlock,
    ...showcaseBlocks, noticeBlock, timesaleBlock,
  ].filter(Boolean)

  return {
    title: '🎁 프로모션 올인원 (샘플)',
    content: { blocks },
    images: blocks.filter(b => b.type === 'image').map(b => ({ _id: b.id, src: b.src, regions: b.regions || [] })),
    couponNos: hasCoupon ? [String(couponNo)] : [],
    pageMaxWidth: null,
  }
}

export default function EventList() {
  const mallId     = useMallId()
  const navigate   = useNavigate()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const screens  = useBreakpoint()
  const isMobile = screens.sm === false

  const R2_PUBLIC_BASE =
    'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev'

  // 이벤트 목록 불러오기
  const fetchEvents = async () => {
    if (!mallId) {
      //message.error('mallId가 없습니다. 다시 로그인해 주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await api.get(`/api/${mallId}/events`)
      const list = res.data.map(ev => ({
        ...ev,
        id: ev._id,
        createdAt: ev.createdAt
          ? dayjs(ev.createdAt).format('YYYY-MM-DD')
          : '',
      }))
      setData(list)
    } catch (err) {
      console.error(err)
      message.error('이벤트 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [mallId])

  // 샘플 이벤트 생성 — 모든 기능이 담긴 이벤트를 실제 상품/쿠폰으로 한 번에 생성
  const createSample = async () => {
    if (!mallId) { message.error('mallId가 없습니다. 앱을 통해 접속해주세요.'); return }
    setCreating(true)
    try {
      let products = []
      let couponNo = null
      try {
        const pr = await api.get(`/api/${mallId}/products`, { params: { limit: 8 } })
        products = pr.data?.products || (Array.isArray(pr.data) ? pr.data : [])
      } catch (e) { /* 상품 없이도 진행 */ }
      try {
        const cr = await api.get(`/api/${mallId}/coupons`)
        const arr = Array.isArray(cr.data) ? cr.data : []
        couponNo = arr[0]?.coupon_no || null
      } catch (e) { /* 쿠폰 없이도 진행 */ }

      if (!products.length) message.warning('상품을 불러오지 못해 상품/타임세일 블록은 비어있게 생성됩니다.')

      const payload = buildSampleEvent(products, couponNo)
      const { data: created } = await api.post(`/api/${mallId}/events`, payload)
      message.success('샘플 이벤트가 생성되었습니다.')
      if (created && created._id) navigate(`/event/detail/${created._id}`)
      else fetchEvents()
    } catch (err) {
      console.error(err)
      message.error('샘플 이벤트 생성에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  // 이벤트 삭제
  const handleDelete = async id => {
    if (!mallId) return
    try {
      await api.delete(`/api/${mallId}/events/${id}`)
      message.success('이벤트가 삭제되었습니다.')
      fetchEvents()
    } catch (err) {
      console.error(err)
      message.error('이벤트 삭제에 실패했습니다.')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 200,
      render: id => (
        <span
          onClick={() => navigate(`/event/detail/${id}`)}
          style={{
            fontSize: isMobile ? '12px' : '14px',
            lineHeight: 1.2,
            wordBreak: 'break-all',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block',
            maxWidth: isMobile ? 100 : 180,
            cursor: 'pointer',
            color: '#000'
          }}
        >
          {id}
        </span>
      ),
    },
    {
      title: '썸네일',
      dataIndex: 'images',
      width: 120,
      render: images => {
        const src = Array.isArray(images) && images.length > 0 ? images[0].src : null
        if (!src) return <span>—</span>
        const url = src.startsWith('http') ? src : `${R2_PUBLIC_BASE}/${src}`
        return (
          <Image
            src={url}
            width={100}
            height={60}
            style={{ objectFit: 'cover', cursor: 'pointer' }}
            preview={false}
            alt="썸네일"
          />
        )
      },
    },
    {
      title: '이벤트 제목',
      dataIndex: 'title',
      width: 240,
      render: (text, record) => (
        <span
          onClick={() => navigate(`/event/detail/${record.id}`)}
          style={{
            fontSize: isMobile ? '13px' : '16px',
            lineHeight: 1.3,
            display: 'inline-block',
            maxWidth: isMobile ? 120 : 200,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
            color: '#000'
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '생성 일자',
      dataIndex: 'createdAt',
      width: 120,
      render: (text, record) => (
        <span
          onClick={() => navigate(`/event/detail/${record.id}`)}
          style={{
            fontSize: isMobile ? '12px' : '14px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            color: '#000'
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '레이아웃',
      dataIndex: 'layoutType',
      width: 100,
      render: lt => {
        const label = lt === 'single' ? '단품' : lt === 'tabs' ? '탭' : '없음'
        return <span style={{ cursor: 'pointer', color: '#000' }}>{label}</span>
      },
    },
    {
      title: '영역 수',
      dataIndex: 'images',
      width: 100,
      render: images => {
        const count = Array.isArray(images)
          ? images.reduce((sum, img) =>
              sum + (Array.isArray(img.regions) ? img.regions.length : 0)
            , 0)
          : 0
        return <span style={{ cursor: 'pointer', color: '#000' }}>{count}</span>
      },
    },
    {
      title: '액션',
      key: 'action',
      width: isMobile ? 140 : 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={e => {
              e.stopPropagation()
              navigate(`/event/edit/${record.id}`)
            }}
          >
            수정
          </Button>
          <Popconfirm
            title="이벤트를 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button size="small" danger onClick={e => e.stopPropagation()}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
     className="eventList"
      title="나의 이벤트 목록"
      extra={
        <Space>
          {/* 샘플 이벤트 생성은 마스터(onimon)에서만 노출 — 일반 몰에는 보이지 않음 */}
          {mallId === 'onimon' && (
            <Button
              icon={<ThunderboltOutlined />}
              loading={creating}
              onClick={createSample}
            >
              샘플 이벤트 생성
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/event/create`)}
          >
            새 이벤트 생성
          </Button>
        </Space>
      }
      style={{ width: '100%', maxWidth: 1800, margin: '0 auto' }}
      bodyStyle={{ padding: isMobile ? 12 : 24 }}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: isMobile ? 4 : 6, size: isMobile ? 'small' : 'default' }}
        scroll={{ x: 1400 }}
        style={{ tableLayout: 'fixed' }}
      />
    </Card>
  )
}
