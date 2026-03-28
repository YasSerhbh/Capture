import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b', // zinc-950
          borderRadius: 128, 
          border: '16px solid #27272a', // zinc-800
        }}
      >
        {/* Background Grid Pattern */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,1) 4px, transparent 4px), linear-gradient(to bottom, rgba(255,255,255,1) 4px, transparent 4px)',
          backgroundSize: '64px 64px',
          opacity: 0.05,
        }} />

        <div
          style={{
            fontSize: 280,
            fontWeight: 900,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 10px 15px rgba(0, 0, 0, 0.5)',
            paddingTop: 16, 
          }}
        >
          C
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
