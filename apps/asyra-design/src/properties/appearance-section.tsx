import { UIItems } from '../workspace/ui-parts'
import type { ReactNode } from 'react'

const AppearanceSection = ({
  section,
  label,
  actions,
  children,
  testId
}: {
  section: string
  label: string
  actions?: ReactNode
  children: ReactNode
  testId?: string
}) => (
  <div
    data-inspector-section={section}
    className="grid grid-cols-1 w-full pb-2"
    data-testid={testId}
  >
    <UIItems
      id="fills"
      parts={{
        fillHeading: (
          <div className="group flex items-center justify-between h-10 pl-4 pr-2 text-white">
            <UIItems
              id="fillHeading"
              parts={{
                fillLabel: (
                  <span className="text-[11px] font-medium opacity-60 tracking-wider">
                    {label}
                  </span>
                ),
                addFill: actions
              }}
            />
          </div>
        ),
        fillRecords: children
      }}
    />
  </div>
)

export default AppearanceSection
