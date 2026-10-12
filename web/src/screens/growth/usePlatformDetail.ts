import { useNavigate } from 'react-router';
import { findPlatform, type Platform } from '../../config/platforms';
import { growthSession } from './session';
import { useGrowthLinks, usePlatformParam } from './paths';
import type { PlatformDetailData } from './types';

export interface PlatformDetailFlow {
  platform: Platform;
  /** Switches the screen to another platform (it becomes the URL's `?platform=`). */
  choose: (id: string) => void;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Platform-Detail flow state: which platform (from `?platform=`, else the fixture default) and its preview connection.
 * Nothing really connects: no platform integration exists in web/worker, so Connect only records a preview state that
 * Platforms reads too.
 */
export function usePlatformDetail(data: PlatformDetailData): PlatformDetailFlow {
  const param = usePlatformParam();
  const navigate = useNavigate();
  const links = useGrowthLinks();
  const [session, set] = growthSession.use();
  const platform = findPlatform(param) ?? findPlatform(data.defaultId) ?? data.platforms[0];
  const connected = session.connections[platform.id] === 'connected';
  function setConnected(on: boolean) {
    const { [platform.id]: _drop, ...rest } = session.connections;
    // INTEGRATION: GET /api/connect/:platform/start, then /callback (connect); DELETE /api/connections/:id (disconnect).
    // Backend map §4, row "Settings › Connections".
    set({ connections: on ? { ...rest, [platform.id]: 'connected' } : rest });
  }
  return {
    platform,
    choose: (id) => navigate(links.platform(id)),
    connected,
    connect: () => setConnected(true),
    disconnect: () => setConnected(false),
  };
}
