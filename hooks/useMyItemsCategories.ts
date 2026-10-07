// Turns lib/myItems.ts's kinds for one tab into the rows MyItemsHub draws,
// counted fresh each time the menu opens. A kind with nothing in it is left
// out, so the menu lists what the person has made. Until the first count
// comes back the list is undefined, which MyItemsHub reads as nothing yet.

import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import type { MyItemsCategory } from '../components/MyItemsHub';
import { MY_ITEM_KINDS, type MyItemsTab } from '../lib/myItems';
import { countMyItems } from '../lib/myItemsDb';

export function useMyItemsCategories(
  tab: MyItemsTab,
  openLens: (lens: string) => void,
): { categories: MyItemsCategory[] | undefined; load: () => void } {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  const load = useCallback(() => {
    countMyItems(tab)
      .then(setCounts)
      .catch(() => setCounts({}));
  }, [tab]);

  const categories = useMemo(() => {
    if (!counts) return undefined;
    return MY_ITEM_KINDS[tab]
      .filter((kind) => (counts[kind.id] ?? 0) > 0)
      .map(
        (kind): MyItemsCategory => ({
          id: kind.id,
          label: kind.label,
          count: counts[kind.id],
          onPress: () => {
            if (kind.elsewhere) {
              router.push({ pathname: kind.elsewhere.pathname, params: { [kind.elsewhere.param]: kind.lens } } as Href);
            } else {
              openLens(kind.lens);
            }
          },
        }),
      );
  }, [counts, tab, openLens, router]);

  return { categories, load };
}
