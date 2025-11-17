import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthProvider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Mail, Phone, MapPin, IdCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'

export default function ProfilePage() {
  const { user, role } = useAuth()
  const neoBrutalismMode = useNeoBrutalismMode()

  if (!user) {
    return (
      <DashboardLayout>
        <div className={cn(
          "text-[#85878d]",
          getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
        )}>User information not found</div>
      </DashboardLayout>
    )
  }

  const getInitials = () => {
    return `${user.First_Name?.[0] || ''}${user.Last_Name?.[0] || ''}`.toUpperCase()
  }

  return (
    <DashboardLayout 
      title="Profile" 
      subtitle="View and manage your account information"
    >
      <div className="space-y-6">
        <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className={cn(
                "h-20 w-20 border-4 shadow-lg",
                neoBrutalismMode
                  ? "border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "border-white dark:border-[#1a1a1a] rounded-full"
              )}>
                <AvatarFallback className={cn(
                  "text-2xl bg-gradient-to-br from-[#3bafa8] to-[#ff9053] text-white dark:from-[#3bafa8] dark:to-[#ff9053]",
                  neoBrutalismMode ? "rounded-none" : ""
                )}>
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className={cn(
                  "text-2xl text-[#1f1d39] dark:text-white",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
                )}>
                  {user.First_Name} {user.Last_Name}
                </CardTitle>
                <CardDescription className={cn(
                  "capitalize text-[#85878d] dark:text-gray-400",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                )}>{role}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={cn(
                "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                neoBrutalismMode
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <IdCard className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                <div>
                  <p className={cn(
                    "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>University ID</p>
                  <p className={cn(
                    "text-sm font-semibold text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{user.University_ID}</p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                neoBrutalismMode
                  ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                  : "rounded-lg"
              )}>
                <Mail className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                <div>
                  <p className={cn(
                    "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                  )}>Email</p>
                  <p className={cn(
                    "text-sm font-semibold text-[#1f1d39] dark:text-white",
                    getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                  )}>{user.Email}</p>
                </div>
              </div>

              {user.Phone_Number && (
                <div className={cn(
                  "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                  neoBrutalismMode
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                    : "rounded-lg"
                )}>
                  <Phone className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                  <div>
                    <p className={cn(
                      "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>Phone Number</p>
                    <p className={cn(
                      "text-sm font-semibold text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{user.Phone_Number}</p>
                  </div>
                </div>
              )}

              {user.Address && (
                <div className={cn(
                  "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                  neoBrutalismMode
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                    : "rounded-lg"
                )}>
                  <MapPin className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                  <div>
                    <p className={cn(
                      "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>Address</p>
                    <p className={cn(
                      "text-sm font-semibold text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{user.Address}</p>
                  </div>
                </div>
              )}

              {user.National_ID && (
                <div className={cn(
                  "flex items-center gap-3 p-4 bg-[#f5f7f9] dark:bg-[#2a2a2a]",
                  neoBrutalismMode
                    ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,251,235,1)]"
                    : "rounded-lg"
                )}>
                  <IdCard className="h-5 w-5 text-[#85878d] dark:text-gray-400" />
                  <div>
                    <p className={cn(
                      "text-sm font-medium text-[#676767] dark:text-gray-400 mb-1",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'body')
                    )}>National ID</p>
                    <p className={cn(
                      "text-sm font-semibold text-[#1f1d39] dark:text-white",
                      getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                    )}>{user.National_ID}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

