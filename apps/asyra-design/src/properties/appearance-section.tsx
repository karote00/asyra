import type { ReactNode } from 'react'

const AppearanceSection = ({
  label,
  actions,
  children,
  testId
}: {
  label: string
  actions?: ReactNode
  children: ReactNode
  testId?: string
}) => (
  <div className="grid grid-cols-1 w-full pb-2" data-testid={testId}>
    <div className="group flex items-center justify-between h-10 pl-4 pr-2 text-white">
      <span className="text-[11px] font-medium opacity-60 tracking-wider">
        {label}
      </span>
      {actions}
    </div>
    {children}
  </div>
)
export default AppearanceSection
