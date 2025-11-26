import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useNeoBrutalismMode, 
  getNeoBrutalismCardClasses, 
  getNeoBrutalismButtonClasses,
  getNeoBrutalismInputClasses,
  getNeoBrutalismTextClasses 
} from '@/lib/utils/theme-utils'

export interface SearchFilters {
  search?: string
  min_credit?: number
  max_credit?: number
  has_sections?: boolean
  has_students?: boolean
}

interface AdvancedSearchPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: () => void
  onReset: () => void
  onAddCourse?: () => void
}

export default function AdvancedSearchPanel({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  onAddCourse,
}: AdvancedSearchPanelProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const neoBrutalismMode = useNeoBrutalismMode()

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '')

  return (
    <Card className={getNeoBrutalismCardClasses(neoBrutalismMode)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-lg text-[#1f1d39] dark:text-white",
            getNeoBrutalismTextClasses(neoBrutalismMode, 'heading')
          )}>
            {t('admin.searchAndFilter')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className={cn(
                  "text-xs",
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                    : ""
                )}
              >
                <X className="h-3 w-3 mr-1" />
                {t('admin.clearFilters')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                  : ""
              )}
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? t('admin.hideFilters') : t('admin.showFilters')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('admin.searchPlaceholder')}
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className={cn(
                "pl-10 bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                getNeoBrutalismInputClasses(neoBrutalismMode)
              )}
            />
          </div>

          {/* Advanced Filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-[#e5e7e7] dark:border-[#333]">
              {/* Credit Range */}
              <div className="space-y-2">
                <Label className={cn(
                  "text-[#211c37] dark:text-white text-sm",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.minCredit')}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.min_credit || ''}
                  onChange={(e) => updateFilter('min_credit', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(
                  "text-[#211c37] dark:text-white text-sm",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.maxCredit')}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.max_credit || ''}
                  onChange={(e) => updateFilter('max_credit', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={cn(
                    "bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    getNeoBrutalismInputClasses(neoBrutalismMode)
                  )}
                />
              </div>

              {/* Boolean Filters */}
              <div className="space-y-2">
                <Label className={cn(
                  "text-[#211c37] dark:text-white text-sm",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.hasSections')}
                </Label>
                <Select
                  value={filters.has_sections === undefined ? 'all' : filters.has_sections ? 'true' : 'false'}
                  onValueChange={(value) => updateFilter('has_sections', value === 'all' ? undefined : value === 'true')}
                >
                  <SelectTrigger className={cn(
                    "w-full bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <SelectValue placeholder={t('admin.all')} />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    "bg-white dark:bg-[#2a2a2a]",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : ""
                  )}>
                    <SelectItem value="all">{t('admin.all')}</SelectItem>
                    <SelectItem value="true">{t('admin.yes')}</SelectItem>
                    <SelectItem value="false">{t('admin.no')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={cn(
                  "text-[#211c37] dark:text-white text-sm",
                  getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')
                )}>
                  {t('admin.hasStudents')}
                </Label>
                <Select
                  value={filters.has_students === undefined ? 'all' : filters.has_students ? 'true' : 'false'}
                  onValueChange={(value) => updateFilter('has_students', value === 'all' ? undefined : value === 'true')}
                >
                  <SelectTrigger className={cn(
                    "w-full bg-white dark:bg-[#2a2a2a] text-[#211c37] dark:text-white",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : "border-[#e5e7e7] dark:border-[#333]"
                  )}>
                    <SelectValue placeholder={t('admin.all')} />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    "bg-white dark:bg-[#2a2a2a]",
                    neoBrutalismMode 
                      ? "border-4 border-[#1a1a1a] dark:border-[#FFFBEB] rounded-none"
                      : ""
                  )}>
                    <SelectItem value="all">{t('admin.all')}</SelectItem>
                    <SelectItem value="true">{t('admin.yes')}</SelectItem>
                    <SelectItem value="false">{t('admin.no')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onSearch}
              className={cn(
                "flex-1",
                neoBrutalismMode 
                  ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                  : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
              )}
            >
              <Search className="h-4 w-4 mr-2" />
              <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.search')}</span>
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onReset}
                className={cn(
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'outline')
                    : ""
                )}
              >
                <X className="h-4 w-4 mr-2" />
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.reset')}</span>
              </Button>
            )}
            {onAddCourse && (
              <Button
                onClick={onAddCourse}
                className={cn(
                  "w-full md:w-auto",
                  neoBrutalismMode 
                    ? getNeoBrutalismButtonClasses(neoBrutalismMode, 'primary', "bg-[#3bafa8] hover:bg-[#2a8d87] text-white")
                    : "bg-[#3bafa8] hover:bg-[#2a8d87] text-white"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className={getNeoBrutalismTextClasses(neoBrutalismMode, 'bold')}>{t('admin.addQuiz')}</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

