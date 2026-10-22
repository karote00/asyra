import Group from './svgs/Group.svg?react'
import Rect from './svgs/Rect.svg?react'
import Oval from './svgs/Oval.svg?react'
import Pen from './svgs/Pen.svg?react'
import Text from './svgs/Text.svg?react'
import LineHeight from './svgs/LineHeight.svg?react'
import LetterSpacing from './svgs/LetterSpacing.svg?react'
import Visible from './svgs/Visible.svg?react'
import Invisible from './svgs/Invisible.svg?react'
import Lock from './svgs/Lock.svg?react'
import Unlock from './svgs/Unlock.svg?react'
import Select from './svgs/Select.svg?react'
import ChevronRight from './svgs/ChevronRight.svg?react'
import ChevronDown from './svgs/ChevronDown.svg?react'

const Icons = {
  Group,
  Rect,
  Oval,
  Pen,
  Text,
  LineHeight,
  LetterSpacing,
  Visible,
  Invisible,
  Lock,
  Unlock,
  Select,
  ChevronRight,
  ChevronDown
} as const

export type IconName = keyof typeof Icons

export { Icons }
