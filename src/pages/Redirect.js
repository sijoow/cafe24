// (A) /redirect -> /auth/callback 위임 (카페24가 redirect로 보낼 수도 있으니 안전하게 위임)
app.get('/redirect', (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  return res.redirect(`/auth/callback?${qs}`);
});

// (B) 설치 상태 확인 API
app.get('/api/:mallId/mall', async (req, res) => {
  const { mallId } = req.params;
  try {
    const tokenDoc = await db.collection('token').findOne({ mallId });

    if (tokenDoc && tokenDoc.accessToken) {
      return res.json({
        installed: true,
        mallId,
        userId: tokenDoc.userId || null,
        userName: tokenDoc.userName || null
      });
    }

    // 미설치 -> installUrl 생성
    const scopes = process.env.CAFE24_SCOPES || 'mall.read_category,mall.read_product,mall.read_analytics';
    const redirectUri = `${process.env.APP_URL}/auth/callback`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.CAFE24_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: scopes,
      state: mallId,
    }).toString();

    const installUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?${params}`;

    return res.json({
      installed: false,
      mallId,
      installUrl
    });
  } catch (err) {
    console.error('[MALL INFO ERROR]', err);
    return res.status(500).json({ error: 'mall info fetch failed' });
  }
});
