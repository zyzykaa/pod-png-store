const PINTEREST_API = 'https://api.pinterest.com/v5'

interface PinInput {
  title: string
  description: string
  imageUrl: string
  link: string
  altText?: string
}

export async function createPinterestPin(pin: PinInput) {
  const token = process.env.PINTEREST_ACCESS_TOKEN
  const boardId = process.env.PINTEREST_BOARD_ID

  if (!token || !boardId) {
    throw new Error('not_configured')
  }

  const res = await fetch(`${PINTEREST_API}/pins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: boardId,
      title: pin.title.slice(0, 50),
      description: pin.description.slice(0, 500),
      link: pin.link,
      alt_text: (pin.altText || pin.title).slice(0, 500),
      media_source: {
        source_type: 'image_url',
        url: pin.imageUrl,
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || `Pinterest API error ${res.status}`)
  }
  return data as { id: string; link: string }
}
