import React, {
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';

import { type CustomReportEntity } from 'loot-core/src/types/models';

import { useResponsive } from '../../ResponsiveProvider';
import { type CSSProperties, theme } from '../../style';
import { MenuButton } from '../common/MenuButton';
import { Popover } from '../common/Popover';
import { Link } from '../common/Link';
import { Menu } from '../common/Menu';
import { View } from '../common/View';

const DRAG_HANDLE_HEIGHT = 5;

type ReportCardProps = {
  to: string;
  children: ReactNode;
  report?: CustomReportEntity;
  menuItems?: ComponentProps<typeof Menu>['items'];
  onMenuSelect?: ComponentProps<typeof Menu>['onMenuSelect'];
  size?: number;
  style?: CSSProperties;
};

export function ReportCard({
  to,
  report,
  menuItems,
  onMenuSelect,
  children,
  size = 1,
  style,
}: ReportCardProps) {
  const triggerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isNarrowWidth } = useResponsive();
  const containerProps = {
    flex: isNarrowWidth ? '1 1' : `0 0 calc(${size * 100}% / 3 - 20px)`,
  };

  const content = (
    <View
      style={{
        backgroundColor: theme.tableBackground,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        height: `calc(100% - ${DRAG_HANDLE_HEIGHT}px)`,
        boxShadow: '0 2px 6px rgba(0, 0, 0, .15)',
        transition: 'box-shadow .25s',
        '& .recharts-surface:hover': {
          cursor: 'pointer',
        },
        ':hover': to && {
          boxShadow: '0 4px 6px rgba(0, 0, 0, .15)',
        },
        ...(to ? null : containerProps),
        ...style,
      }}
    >
      {children}
    </View>
  );

  if (to) {
    return (
      <View
        style={{
          display: 'block',
          height: '100%',
          '& .hover-visible': {
            opacity: 0,
            transition: 'opacity .25s',
          },
          '&:hover .hover-visible': {
            opacity: 1,
          },
        }}
      >
        <View
          className="draggable-handle"
          style={{
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            height: DRAG_HANDLE_HEIGHT,
            backgroundColor: theme.buttonNormalBorder,
            ':hover': {
              cursor: 'grab',
            },
          }}
        />

        {menuItems && (
          <View
            className={menuOpen ? undefined : 'hover-visible'}
            style={{
              position: 'absolute',
              top: 7,
              right: 3,
              zIndex: 1,
            }}
          >
            <MenuButton ref={triggerRef} onClick={() => setMenuOpen(true)} />
            <Popover
              triggerRef={triggerRef}
              isOpen={menuOpen}
              onOpenChange={() => setMenuOpen(false)}
            >
              <Menu onMenuSelect={onMenuSelect} items={menuItems} />
            </Popover>
          </View>
        )}

        <Link
          to={to}
          report={report}
          style={{ textDecoration: 'none', ...containerProps }}
        >
          {content}
        </Link>
      </View>
    );
  }
  return content;
}
