// 设计稿共享外壳：状态栏、氛围层、胶囊按钮、底部 Dock、滑块控件
(() => {
  const ICONS = {
    statusbar: `<span>11:07</span><div class="icons">
      <svg width="18" height="12" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4 10.6 10.6 0 0 0 .5 3.4l1.2 1.3A9 9 0 0 1 8 2.2zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.3-1.3A7.2 7.2 0 0 0 8 4 7.2 7.2 0 0 0 3 5.9l1.3 1.3c1-.9 2.3-1.4 3.7-1.4zm0 3.5c-.6 0-1.2.2-1.6.6L8 11.6l1.6-1.7c-.4-.4-1-.6-1.6-.6z"/></svg>
      <svg width="26" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/><path d="M23 4v4a2 2 0 0 0 0-4z" fill="currentColor" opacity=".4"/></svg></div>`,
    capsule: `<span><svg width="18" height="4" viewBox="0 0 18 4" fill="currentColor"><circle cx="2" cy="2" r="2"/><circle cx="9" cy="2" r="2"/><circle cx="16" cy="2" r="2"/></svg></span>
      <span><svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="9" r="7.2"/><circle cx="9" cy="9" r="2.6" fill="currentColor"/></svg></span>`
  };

  const TABS = [
    { label: '首页',
      o: '<path d="M11.3 3.1a1.1 1.1 0 0 1 1.4 0l7.5 6.2c.2.2.3.5.3.8V19.5a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9V21H5a1.5 1.5 0 0 1-1.5-1.5V10.1c0-.3.1-.6.3-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
      f: '<path d="M11.3 2.6a1.1 1.1 0 0 1 1.4 0l8 6.6c.2.2.3.5.3.8V20a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20v-10c0-.3.1-.6.3-.8z" fill="currentColor"/>' },
    { label: '订阅',
      o: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8.5 6h12M8.5 12h12M8.5 18h12"/></g><circle cx="4" cy="6" r="1.1" fill="currentColor"/><circle cx="4" cy="12" r="1.1" fill="currentColor"/><circle cx="4" cy="18" r="1.1" fill="currentColor"/>',
      f: '<rect x="2.5" y="3" width="19" height="18" rx="5" fill="currentColor"/><path d="M10 8h7.5M10 12h7.5M10 16h7.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="6.8" cy="8" r="1.1" fill="#fff"/><circle cx="6.8" cy="12" r="1.1" fill="#fff"/><circle cx="6.8" cy="16" r="1.1" fill="#fff"/>' },
    { label: '日历',
      o: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="16" rx="3.5"/><path d="M8 2.5v4M16 2.5v4M3.5 9.5h17M9 14.5l2 2 4-4"/></g>',
      f: '<path d="M8 2.5v4M16 2.5v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3" y="4.5" width="18" height="16.5" rx="4" fill="currentColor"/><path d="M3 9.5h18" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/><path d="M9 14.5l2 2 4-4" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' },
    { label: '我的',
      o: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></g>',
      f: '<circle cx="12" cy="7.8" r="4.4" fill="currentColor"/><path d="M3.8 20.2C3.8 15.9 7.5 13 12 13s8.2 2.9 8.2 7.2c0 .7-.5 1.3-1.2 1.3H5c-.7 0-1.2-.6-1.2-1.3z" fill="currentColor"/>' }
  ];

  const q = new URLSearchParams(location.search);
  const body = document.body;
  const device = document.querySelector('.device');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (q.has('full')) body.classList.add('full');
  if (!q.has('live')) body.classList.add('shot');
  body.classList.add('no-anim');

  device.insertAdjacentHTML('afterbegin', '<div class="aurora"><i class="a1"></i><i class="a2"></i><i class="a3"></i><i class="a4"></i></div>');
  document.querySelector('.page').insertAdjacentHTML('afterbegin', `<div class="statusbar">${ICONS.statusbar}</div>`);
  document.querySelectorAll('.capsule').forEach(c => { c.innerHTML = ICONS.capsule; });

  if (body.dataset.tab !== undefined) {
    const active = +body.dataset.tab;
    const NOTCH = 'M24,0 H131 C146,0 149,2 151,8 C156,24 168,33 183,33 C198,33 210,24 215,8 C217,2 220,0 235,0 H342 A24,24 0 0 1 366,24 V40 A24,24 0 0 1 342,64 H24 A24,24 0 0 1 0,40 V24 A24,24 0 0 1 24,0 Z';
    const tabHtml = (t, i) => `<div class="tab${i === active ? ' active' : ''}" role="tab" aria-selected="${i === active}">
        <div class="ico"><svg class="o" viewBox="0 0 24 24">${t.o}</svg><svg class="f" viewBox="0 0 24 24">${t.f}</svg></div>
        <span class="lbl">${t.label}</span></div>`;
    device.insertAdjacentHTML('beforeend', `<div class="dock-fade"></div><nav class="dock" aria-label="主导航">
      <svg class="dock-shadow" viewBox="0 0 366 64" width="366" height="64"><path d="${NOTCH}" fill="#F8F9FC"/></svg>
      <div class="dock-glass"></div>
      <svg class="dock-stroke" viewBox="0 0 366 64" width="366" height="64"><path d="${NOTCH}" fill="none" stroke="rgba(21,22,28,.09)"/></svg>
      <div class="tabs"><div class="indicator"></div>
        ${TABS.slice(0, 2).map(tabHtml).join('')}
        <div class="fab-slot"><button class="fab" aria-label="新增订阅"><span class="halo"></span><span class="ripple"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
          <span class="fab-lbl">新增</span></div>
        ${TABS.slice(2).map((t, i) => tabHtml(t, i + 2)).join('')}
      </div></nav>`);
    const dock = device.querySelector('.dock');
    const ind = dock.querySelector('.indicator');
    const tabs = [...dock.querySelectorAll('.tab')];
    const fab = dock.querySelector('.fab');
    let cur = active;
    const xOf = i => tabs[i].offsetLeft + (tabs[i].offsetWidth - ind.offsetWidth) / 2;
    ind.style.transform = `translateX(${xOf(cur)}px)`;
    tabs.forEach((t, i) => t.addEventListener('click', () => {
      if (i === cur) return;
      const a = xOf(cur), b = xOf(i);
      const crossesFab = (cur < 2) !== (i < 2);
      tabs.forEach((el, k) => { el.classList.toggle('active', k === i); el.setAttribute('aria-selected', k === i); });
      ind.style.transform = `translateX(${b}px)`;
      if (!reduce) {
        const s = 1 + Math.min(Math.abs(b - a) / 300, 0.45);
        ind.animate([
          { transform: `translateX(${a}px) scale(1,1)`, opacity: 1 },
          { transform: `translateX(${a + (b - a) * 0.6}px) scale(${s},${crossesFab ? .72 : .9})`, opacity: crossesFab ? .25 : 1, offset: 0.45 },
          { transform: `translateX(${b}px) scale(1,1)`, opacity: 1 }
        ], { duration: 480, easing: 'cubic-bezier(.25,.8,.25,1)' });
        t.querySelector('.ico').animate([
          { transform: 'scale(1)' }, { transform: 'scale(.8)', offset: .25 },
          { transform: 'scale(1.12)', offset: .65 }, { transform: 'scale(1)' }
        ], { duration: 460, easing: 'ease-out' });
      }
      cur = i;
    }));
    fab.addEventListener('click', () => {
      if (reduce) return;
      fab.animate([{ transform: 'scale(1)' }, { transform: 'scale(.86)', offset: .28 }, { transform: 'scale(1.06)', offset: .62 }, { transform: 'scale(1)' }],
        { duration: 520, easing: 'cubic-bezier(.3,.7,.3,1)' });
      fab.querySelector('svg').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(90deg)' }], { duration: 420, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      fab.querySelector('.ripple').animate([{ transform: 'scale(.4)', opacity: .55 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 520, easing: 'ease-out' });
    });
  }
  device.insertAdjacentHTML('beforeend', '<div class="home-ind"></div>');

  // 下划线 Tabs / 分段控件：指示器跟随选中项滑动
  function slider(root, itemSel, barSel) {
    const items = [...root.querySelectorAll(itemSel)];
    const bar = root.querySelector(barSel);
    const place = el => { bar.style.width = el.offsetWidth + 'px'; bar.style.transform = `translateX(${el.offsetLeft}px)`; };
    place(items.find(i => i.classList.contains('on')) || items[0]);
    items.forEach(el => el.addEventListener('click', () => {
      items.forEach(i => i.classList.toggle('on', i === el));
      place(el);
      root.dispatchEvent(new CustomEvent('change', { detail: el }));
    }));
  }
  document.querySelectorAll('.utabs').forEach(r => slider(r, '.utab', '.bar'));
  document.querySelectorAll('.segmented').forEach(r => slider(r, '.seg', '.thumb'));

  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('no-anim')));
})();
