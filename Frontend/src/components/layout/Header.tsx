import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'

export default function Header() {
  const { user, logout, role } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const getInitials = () => {
    if (!user) return 'U'
    return `${user.First_Name?.[0] || ''}${user.Last_Name?.[0] || ''}`.toUpperCase()
  }

  const getUserName = () => {
    if (!user) return 'User'
    return `${user.First_Name} ${user.Last_Name}`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LMS
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getUserName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.Email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

