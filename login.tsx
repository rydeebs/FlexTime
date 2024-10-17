import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [logoSrc, setLogoSrc] = useState('')

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    const logoPath = isDarkMode ? 'images/FT-blackb.png' : 'images/FT-whiteb.png'
    const fullLogoPath = chrome.runtime.getURL(logoPath)
    setLogoSrc(fullLogoPath)
  }, [isDarkMode])

  const bgColor = isDarkMode 
    ? 'bg-gradient-to-br from-gray-900 to-black' 
    : 'bg-gradient-to-br from-gray-100 to-white'
  const textColor = isDarkMode ? 'text-white' : 'text-black'

  return (
    <div className={`w-full min-h-screen ${bgColor} ${textColor} p-6 flex flex-col items-center justify-center`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        
        .gradient-button {
          background: linear-gradient(135deg, #09C87E, #4A90E2);
        }

        .gradient-button:hover {
          background: linear-gradient(135deg, #08B070, #3A80D2);
        }

        .logo-transition {
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>
      
      <div className="w-full max-w-md">
        <header className="flex justify-between items-center mb-12">
          {logoSrc ? (
            <img 
              src={logoSrc}
              alt="FlexTime Logo" 
              className="h-12 w-auto logo-transition"
              onError={() => console.error(`Failed to load logo: ${logoSrc}`)}
            />
          ) : (
            <div className="h-12 w-36 bg-gray-300 animate-pulse rounded"></div>
          )}
          <div className="flex items-center space-x-2">
            <Sun className="w-4 h-4" />
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            <Moon className="w-4 h-4" />
          </div>
        </header>
        
        <main className="space-y-6">
          <h1 className="text-3xl font-bold text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Sign in to FlexTime
          </h1>
          
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full py-6 flex items-center justify-center space-x-2"
              onClick={() => window.handleGoogleSignIn()}
            >
              <img 
                src={chrome.runtime.getURL('images/google-logo.png')} 
                alt="Google logo" 
                className="w-6 h-6"
              />
              <span style={{ fontFamily: 'Orbitron, sans-serif' }}>Sign in with Google</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full py-6 flex items-center justify-center space-x-2"
              onClick={() => console.log('Microsoft sign-in')}
            >
              <img 
                src={chrome.runtime.getURL('images/microsoft-logo.png')} 
                alt="Microsoft logo" 
                className="w-6 h-6"
              />
              <span style={{ fontFamily: 'Orbitron, sans-serif' }}>Sign in with Microsoft</span>
            </Button>
          </div>
        </main>
        
        <footer className="mt-8 text-center text-sm">
          <p>Don't have an account? Contact your administrator.</p>
        </footer>
      </div>
    </div>
  )
}