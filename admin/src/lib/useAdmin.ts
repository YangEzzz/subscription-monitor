import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  defaultAddress,
  getJson,
  sections,
  type AdminPage,
  type Overview,
  type Section,
  type View,
} from './data';

export function useAdmin() {
  const params = new URLSearchParams(location.search);
  const initialView = params.get('view') || params.get('section') || 'overview';
  const validView = (value: string): value is View =>
    value === 'overview' ||
    value === 'connection' ||
    Object.hasOwn(sections, value);
  const view = ref<View>(validView(initialView) ? initialView : 'overview');
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
  const remembered = new Map<View, { search: string; page: number }>();
  let controller: AbortController | undefined;
  let generation = 0;
  let recordsKey = '';
  let overviewAddress = '';

  async function load() {
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const id = ++generation;
    const key = `${address.value}|${section.value}|${search.value}|${page.value}|${view.value}`;
    if (recordsKey !== key) {
      records.value = undefined;
      recordsUpdated.value = '';
      recordsKey = key;
    }
    if (overviewAddress !== address.value) {
      overview.value = undefined;
      overviewUpdated.value = '';
      overviewAddress = address.value;
    }
    overviewError.value = '';
    recordsError.value = '';
    busy.value = true;
    const query = new URLSearchParams({
      section: section.value,
      page: String(view.value === 'overview' ? 1 : page.value),
      search: view.value === 'overview' ? '' : search.value,
    });
    const results = await Promise.allSettled([
      getJson<Overview>(address.value, 'overview', signal),
      view.value === 'connection'
        ? Promise.resolve(undefined)
        : getJson<AdminPage>(address.value, `data?${query}`, signal),
    ]);
    if (id !== generation) return;
    const [summary, data] = results;
    const now = new Date().toISOString();
    if (summary.status === 'fulfilled') {
      if (
        summary.value &&
        [
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
    if (data.status === 'fulfilled' && view.value !== 'connection') {
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
        if (view.value !== 'overview' && page.value > lastPage) {
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
  function navigate(next: View, query?: string) {
    remembered.set(view.value, { search: search.value, page: page.value });
    const stored = remembered.get(next);
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
    const name = next.get('view') || 'overview';
    view.value = validView(name) ? name : 'overview';
    search.value = (next.get('search') || '').slice(0, 128);
    page.value = /^[1-9]\d{0,5}$/.test(next.get('page') || '')
      ? Number(next.get('page'))
      : 1;
  }
  window.addEventListener('popstate', onPopState);
  watch([view, search, page], () => {
    {
      const next = new URLSearchParams({ view: view.value });
      if (view.value in sections) {
        if (search.value) next.set('search', search.value);
        if (page.value > 1) next.set('page', String(page.value));
      }
      const target = `?${next}`;
      if (location.search !== target) history.pushState(null, '', target);
    }
  });
  watch(
    [view, search, page, address],
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
    view,
    section,
    search,
    page,
    address,
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
