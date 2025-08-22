// src/pages/Redirect.jsx
import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../axios'

export default function Redirect() {
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(search)
    const mallId = params.get('mall_id') || params.get('state') || params.get('mallId')
    if (!mallId) {
      console.error('mall_id가 없습니다')
      return navigate('/', { replace: true })
    }

    localStorage.setItem('mallId', mallId)

    // 백엔드에 설치여부 확인
    api.get(`/api/${mallId}/mall`)
      .then(({ data }) => {
        if (data.installed) {
          if (data.userId) localStorage.setItem('userId', data.userId)
          if (data.userName) localStorage.setItem('userName', data.userName)
          navigate('/', { replace: true })
        } else {
          if (data.installUrl) {
            window.location.href = data.installUrl  // 전체 페이지 네비게이션
          } else {
            console.error('installUrl이 응답에 없습니다', data)
            navigate('/', { replace: true })
          }
        }
      })
      .catch(err => {
        console.warn('mall 확인 실패', err)
        navigate('/', { replace: true })
      })
  }, [search, navigate])

  return null
}
