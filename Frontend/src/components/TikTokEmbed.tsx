import { useEffect } from 'react'

interface TikTokEmbedProps {
  videoId?: string
  videoUrl?: string
  username?: string
  className?: string
}

/**
 * TikTok Embed Component
 * 
 * TikTok không cho phép embed feed `/foryou` do X-Frame-Options
 * 
 * Cách dùng:
 * 1. Với Video ID (embed 1 video):
 *    <TikTokEmbed videoId="7234567890123456789" />
 * 
 * 2. Với Video URL (embed 1 video):
 *    <TikTokEmbed videoUrl="https://www.tiktok.com/@username/video/7234567890123456789" />
 * 
 * 3. Với Username (embed creator profile - hiển thị tối đa 10 video gần nhất):
 *    <TikTokEmbed username="username" />
 */
export default function TikTokEmbed({ 
  videoId, 
  videoUrl, 
  username,
  className = '' 
}: TikTokEmbedProps) {
  useEffect(() => {
    // Load TikTok embed script (cần cho cả video và creator profile)
    if (videoId || videoUrl || username) {
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
      
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://www.tiktok.com/embed.js'
        script.async = true
        document.body.appendChild(script)
        
        return () => {
          const scriptToRemove = document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
          if (scriptToRemove) {
            document.body.removeChild(scriptToRemove)
          }
        }
      }
    }
  }, [videoId, videoUrl, username])

  // Nếu chỉ có username, embed creator profile (hiển thị tối đa 10 video gần nhất)
  if (username && !videoId && !videoUrl) {
    return (
      <div className={`flex justify-center ${className}`}>
        <blockquote
          className="tiktok-embed"
          cite={`https://www.tiktok.com/@${username}`}
          data-embed-from="embed_page"
          style={{ maxWidth: '100%', minWidth: '325px', width: '100%' }}
        >
          <section>
            <a
              target="_blank"
              title={`@${username}`}
              href={`https://www.tiktok.com/@${username}`}
              rel="noopener noreferrer"
            >
              @{username}
            </a>
          </section>
        </blockquote>
      </div>
    )
  }

  // Extract video ID from URL if provided
  const getVideoId = () => {
    if (videoId) return videoId
    if (videoUrl) {
      const match = videoUrl.match(/\/video\/(\d+)/)
      return match ? match[1] : null
    }
    return null
  }

  const finalVideoId = getVideoId()

  if (!finalVideoId) {
    return (
      <div className={`flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">
          Vui lòng cung cấp Video ID hoặc Video URL
        </p>
      </div>
    )
  }

  // Extract username from URL if provided
  const getUsername = () => {
    if (username) return username
    if (videoUrl) {
      const match = videoUrl.match(/@([^/]+)/)
      return match ? match[1] : 'tiktok'
    }
    return 'tiktok'
  }

  const finalUsername = getUsername()

  return (
    <div className={`flex justify-center ${className}`}>
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/@${finalUsername}/video/${finalVideoId}`}
        data-video-id={finalVideoId}
        style={{ maxWidth: '100%', minWidth: '325px', width: '100%' }}
      >
        <section>
          <a
            target="_blank"
            title={`@${finalUsername}`}
            href={`https://www.tiktok.com/@${finalUsername}/video/${finalVideoId}`}
            rel="noopener noreferrer"
          >
            Video by @{finalUsername}
          </a>
        </section>
      </blockquote>
    </div>
  )
}

