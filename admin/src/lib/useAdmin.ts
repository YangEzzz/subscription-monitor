import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import {
  defaultAddress,
  AdminUnauthorizedError,
  getJson,
  sections,
  type AdminPage,
  type Overview,
  type Section,
  type View,
} from './data';

export function useAdmin(
  authenticated: Ref<boolean>,
  expireSession: () => void,
) {
  const params = new URLSearchParams(location.search);
  const initialView = params.get('view') || params.get('section') || 'overview';
  const validView = (value: string): value is View =>
    value === 'overview' ||
    value === 'analytics' ||
    Object.hasOwn(sections, value);
  const userId = ref((params.get('userId') || '').slice(0, 128));
  const view = ref<View>(
    initialView === 'subscriptions' && !userId.value
      ? 'users'
      : validView(initialView)
        ? initialView
        : 'overview',
  );
  const parseDays = (value: string | null) =>
    [7, 30, 90].includes(Number(value)) ? Number(value) : 30;
  const rangeDays = ref(parseDays(params.get('days')));
  const excludeTest = ref(params.get('excludeTest') !== 'false');
  const search = ref((params.get('search') || '').slice(0, 128));
  const page = ref(
    /^[1-9]\d{0,5}$/.test(params.get('page') || '')
      ? Number(params.get('page'))
      : 1,
  );
  const address = ref(defaultAddress());
  const overview = ref<Overview>();
  const records = ref<AdminPage>();
  const overviewError = ref('');
  const recordsError = ref('');
  const overviewUpdated = ref('');
  const recordsUpdated = ref('');
  const busy = ref(false);
  const section = computed<Section>(() =>
    view.value in sections ? (view.value as Section) : 'subscriptions',
  );
  const remembered = new Map<string, { search: string; page: number }>();
  let controller: AbortController | undefined;
  let generation = 0;
  let recordsKey = '';
  let overviewAddress = '';

  async function load() {
    controller?.abort();
    if (!authenticated.value) {
      generation++;
      overview.value = undefined;
      records.value = undefined;
      overviewUpdated.value = '';
      recordsUpdated.value = '';
      busy.value = false;
      return;
    }
    controller = new AbortController();
    const signal = controller.signal;
    const id = ++generation;
    const key = `${address.value}|${section.value}|${search.value}|${page.value}|${view.value}|${userId.value}`;
    if (recordsKey !== key) {
      records.value = undefined;
      recordsUpdated.value = '';
      recordsKey = key;
    }
    const overviewKey = `${address.value}|${excludeTest.value}`;
    if (overviewAddress !== overviewKey) {
      overview.value = undefined;
      overviewUpdated.value = '';
      overviewAddress = overviewKey;
    }
    overviewError.value = '';
    recordsError.value = '';
    busy.value = true;
    const query = new URLSearchParams({
      section: section.value,
      page: String(page.value),
      search: search.value,
    });
    if (['subscriptions', 'notifications'].includes(view.value) && userId.value)
      query.set('userId', userId.value);
    if (view.value === 'notifications' && !userId.value)
      query.set('failedOnly', 'true');
    const results = await Promise.allSettled([
      getJson<Overview>(
        address.value,
        `overview?excludeTest=${excludeTest.value}`,
        signal,
      ),
      ['overview', 'analytics'].includes(view.value)
        ? Promise.resolve(undefined)
        : getJson<AdminPage>(address.value, `data?${query}`, signal),
    ]);
    if (id !== generation) return;
    if (
      results.some(
        (result) =>
          result.status === 'rejected' &&
          result.reason instanceof AdminUnauthorizedError,
      )
    ) {
      expireSession();
      busy.value = false;
      return;
    }
    const [summary, data] = results;
    const now = new Date().toISOString();
    if (summary.status === 'fulfilled') {
      if (
        summary.value &&
        [
          'activeMembers',
          'paidAmountCny',
          'paymentIssues',
          'users',
          'subscriptions',
          'notifications',
          'failedNotifications',
        ].every(
          (key) => typeof summary.value[key as keyof Overview] === 'number',
        )
      ) {
        overview.value = summary.value;
        overviewUpdated.value = now;
      } else overviewError.value = '概览响应格式不正确，请检查管理接口地址。';
    } else
      overviewError.value =
        summary.reason instanceof Error
          ? summary.reason.message
          : '概览读取失败，请重试。';
    if (
      !['overview', 'analytics'].includes(view.value) &&
      data.status === 'fulfilled'
    ) {
      if (
        !data.value ||
        !Array.isArray(data.value.items) ||
        !data.value.items.every(
          (row) => row !== null && typeof row === 'object',
        ) ||
        !Number.isInteger(data.value.total) ||
        data.value.total < 0 ||
        data.value.pageSize !== 20
      )
        recordsError.value = '列表响应格式不正确，请检查管理接口地址。';
      else if (data.value) {
        const lastPage = Math.max(
          1,
          Math.ceil(data.value.total / data.value.pageSize),
        );
        if (page.value > lastPage) {
          page.value = lastPage;
          return;
        }
        records.value = data.value;
        recordsUpdated.value = now;
      }
    } else if (data.status === 'rejected')
      recordsError.value =
        data.reason instanceof Error
          ? data.reason.message
          : '列表读取失败，请重试。';
    busy.value = false;
  }
  function navigate(next: View, query?: string, owner?: string) {
    remembered.set(`${view.value}|${userId.value}`, {
      search: search.value,
      page: page.value,
    });
    userId.value = ['subscriptions', 'notifications'].includes(next)
      ? owner || ''
      : '';
    if (next === 'subscriptions' && !userId.value) next = 'users';
    const stored = remembered.get(`${next}|${userId.value}`);
    view.value = next;
    search.value = query !== undefined ? query : stored?.search || '';
    page.value = query !== undefined ? 1 : stored?.page || 1;
  }
  function commitSearch(value: string) {
    search.value = value.trim().slice(0, 128);
    page.value = 1;
  }
  function routeHref(next: View): string {
    return `?view=${next}`;
  }
  function onPopState() {
    const next = new URLSearchParams(location.search);
    rangeDays.value = parseDays(next.get('days'));
    excludeTest.value = next.get('excludeTest') !== 'false';
    const name = next.get('view') || 'overview';
    userId.value = (next.get('userId') || '').slice(0, 128);
    view.value =
      name === 'subscriptions' && !userId.value
        ? 'users'
        : validView(name)
          ? name
          : 'overview';
    search.value = (next.get('search') || '').slice(0, 128);
    page.value = /^[1-9]\d{0,5}$/.test(next.get('page') || '')
      ? Number(next.get('page'))
      : 1;
  }
  window.addEventListener('popstate', onPopState);
  watch([view, search, page, userId, rangeDays, excludeTest], () => {
    {
      const next = new URLSearchParams({ view: view.value });
      if (!excludeTest.value) next.set('excludeTest', 'false');
      if (view.value === 'analytics') next.set('days', String(rangeDays.value));
      if (view.value in sections) {
        if (search.value) next.set('search', search.value);
        if (page.value > 1) next.set('page', String(page.value));
      }
      if (
        ['subscriptions', 'notifications'].includes(view.value) &&
        userId.value
      )
        next.set('userId', userId.value);
      const target = `?${next}`;
      if (location.search !== target) history.pushState(null, '', target);
    }
  });
  watch(
    [view, search, page, address, userId, authenticated, excludeTest],
    () => {
      void load();
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    controller?.abort();
    generation++;
    window.removeEventListener('popstate', onPopState);
  });
  return {
    rangeDays,
    excludeTest,
    userId,
    view,
    section,
    search,
    page,
    overview,
    records,
    overviewError,
    recordsError,
    overviewUpdated,
    recordsUpdated,
    busy,
    navigate,
    commitSearch,
    routeHref,
    load,
  };
}
