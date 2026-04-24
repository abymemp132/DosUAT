# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: doctorSpeciality.spec.ts >> doctor speciality page - without login (guest user) >> [Guest] speciality filter updates catalog
- Location: tests\doctorSpeciality.spec.ts:33:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByText(/^\s*Cardiologist\s*$/i).first()
    - locator resolved to <p class="↵          mt-2 text-[13px] sm:text-sm↵          text-gray-700 text-center↵          leading-tight↵          line-clamp-2↵          font-medium↵        ">Cardiologist</p>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  12 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  7 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  3 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <img width="48" height="48" data-nimg="1" loading="lazy" decoding="async" class="mb-2 rounded-full object-cover" src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FDelhiNCR.366397e1.png&w=96&q=75" srcset="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FDelhiNCR.366397e1.png&w=48&q=75 1x, /_next/image?url=%2F_next%2Fstatic%2Fmedia%2FDelhiNCR.366397e1.png&w=96&q=75 2x"/> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  3 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <h2 class="text-xl font-semibold text-white mb-4 text-left">Select your Location</h2> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="flex flex-col items-center border border-gray-300 rounded-sm p-3 w-28 hover:shadow-md cursor-pointer">…</div> from <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - navigation [ref=e5]:
        - link "Oncquest Laboratories" [ref=e6] [cursor=pointer]:
          - /url: /
          - img "Oncquest Laboratories" [ref=e8]
        - generic [ref=e9]:
          - link "Test Catalog" [ref=e11] [cursor=pointer]:
            - /url: /new-test
          - link "Doctor Speciality" [ref=e13] [cursor=pointer]:
            - /url: /doctor-speciality
          - link "Disease Condition" [ref=e15] [cursor=pointer]:
            - /url: /disease-condition
          - link "Test Requisition & Consent Forms" [ref=e17] [cursor=pointer]:
            - /url: /consent-forms
          - link "Brochures" [ref=e19] [cursor=pointer]:
            - /url: /brochure
          - link "FAQ's" [ref=e21] [cursor=pointer]:
            - /url: /FAQs
        - generic [ref=e22] [cursor=pointer]:
          - img "location" [ref=e23]
          - img [ref=e24]
        - button [ref=e27] [cursor=pointer]:
          - img [ref=e28]
        - button "0" [ref=e30] [cursor=pointer]:
          - img [ref=e31]
          - generic [ref=e33]: "0"
    - generic [ref=e35]:
      - button "Please select your location first" [disabled] [ref=e36]:
        - img [ref=e37]
      - generic [ref=e39]:
        - heading "Select your Location" [level=2] [ref=e40]
        - generic [ref=e41]:
          - generic [ref=e42]:
            - textbox "Search your City" [ref=e43]
            - button [ref=e44] [cursor=pointer]:
              - img [ref=e45]
          - button "Location Icon Use Current Location" [ref=e47] [cursor=pointer]:
            - img "Location Icon" [ref=e48]
            - generic [ref=e49]: Use Current Location
      - generic [ref=e50]:
        - heading "Metro Cities" [level=3] [ref=e51]
        - generic [ref=e52]:
          - generic [ref=e53] [cursor=pointer]:
            - img [ref=e54]
            - generic [ref=e55]: Delhi
          - generic [ref=e56] [cursor=pointer]:
            - img [ref=e57]
            - generic [ref=e58]: Mumbai
          - generic [ref=e59] [cursor=pointer]:
            - img [ref=e60]
            - generic [ref=e61]: Kolkata
          - generic [ref=e62] [cursor=pointer]:
            - img [ref=e63]
            - generic [ref=e64]: Bengaluru
          - generic [ref=e65] [cursor=pointer]:
            - img [ref=e66]
            - generic [ref=e67]: Chennai
          - generic [ref=e68] [cursor=pointer]:
            - img [ref=e69]
            - generic [ref=e70]: Hyderabad
        - heading "Other Cities" [level=3] [ref=e71]
        - generic [ref=e72]:
          - generic [ref=e73] [cursor=pointer]: 24 Parganas - North
          - generic [ref=e74] [cursor=pointer]: 24 Parganas - South
          - generic [ref=e75] [cursor=pointer]: Agartala
          - generic [ref=e76] [cursor=pointer]: Ahmedabad
          - generic [ref=e77] [cursor=pointer]: Ahmednagar
          - generic [ref=e78] [cursor=pointer]: Almora
          - generic [ref=e79] [cursor=pointer]: Amalapuram
          - generic [ref=e80] [cursor=pointer]: Ambala
          - generic [ref=e81] [cursor=pointer]: Amritsar
          - generic [ref=e82] [cursor=pointer]: Anakapalli
          - generic [ref=e83] [cursor=pointer]: Anantapuram
          - generic [ref=e84] [cursor=pointer]: Annavaram
          - generic [ref=e85] [cursor=pointer]: Asansol
          - generic [ref=e86] [cursor=pointer]: Aurangabad
          - generic [ref=e87] [cursor=pointer]: Ballabgarh
          - generic [ref=e88] [cursor=pointer]: Bankura
          - generic [ref=e89] [cursor=pointer]: Bardhaman
          - generic [ref=e90] [cursor=pointer]: Bareilly
          - generic [ref=e91] [cursor=pointer]: Bathinda
          - generic [ref=e92] [cursor=pointer]: Belagavi
          - generic [ref=e93] [cursor=pointer]: Bengaluru
          - generic [ref=e94] [cursor=pointer]: Bhagalpur
          - generic [ref=e95] [cursor=pointer]: Bhilai
          - generic [ref=e96] [cursor=pointer]: Bhiwadi
          - generic [ref=e97] [cursor=pointer]: Bhopal
          - generic [ref=e98] [cursor=pointer]: Bhubaneswar
          - generic [ref=e99] [cursor=pointer]: Bijapur
          - generic [ref=e100] [cursor=pointer]: Bikaner
          - generic [ref=e101] [cursor=pointer]: Bilaspur
          - generic [ref=e102] [cursor=pointer]: Calicut
          - generic [ref=e103] [cursor=pointer]: Chandigarh
          - generic [ref=e104] [cursor=pointer]: Chennai
          - generic [ref=e105] [cursor=pointer]: Chikmagalur
          - generic [ref=e106] [cursor=pointer]: Chilakaluripet
          - generic [ref=e107] [cursor=pointer]: Cochi
          - generic [ref=e108] [cursor=pointer]: Coimbatore
          - generic [ref=e109] [cursor=pointer]: Cuttack
          - generic [ref=e110] [cursor=pointer]: Darbanga
          - generic [ref=e111] [cursor=pointer]: Dehradun
          - generic [ref=e112] [cursor=pointer]: Delhi
          - generic [ref=e113] [cursor=pointer]: Dharamshala
          - generic [ref=e114] [cursor=pointer]: Dibrugarh
          - generic [ref=e115] [cursor=pointer]: Durgapur
          - generic [ref=e116] [cursor=pointer]: Eluru
          - generic [ref=e117] [cursor=pointer]: Faizabad
          - generic [ref=e118] [cursor=pointer]: Faridabad
          - generic [ref=e119] [cursor=pointer]: Gangtok
          - generic [ref=e120] [cursor=pointer]: Gaya
          - generic [ref=e121] [cursor=pointer]: Ghaziabad
          - generic [ref=e122] [cursor=pointer]: Godavari Khani
          - generic [ref=e123] [cursor=pointer]: Greater Noida
          - generic [ref=e124] [cursor=pointer]: Gudivada
          - generic [ref=e125] [cursor=pointer]: Guntur
          - generic [ref=e126] [cursor=pointer]: Gurdaspur
          - generic [ref=e127] [cursor=pointer]: Gurgaon
          - generic [ref=e128] [cursor=pointer]: Guwahati
          - generic [ref=e129] [cursor=pointer]: Gwalior
          - generic [ref=e130] [cursor=pointer]: Hajipur
          - generic [ref=e131] [cursor=pointer]: Haldwani
          - generic [ref=e132] [cursor=pointer]: Hisar
          - generic [ref=e133] [cursor=pointer]: Howrah
          - generic [ref=e134] [cursor=pointer]: Hubli
          - generic [ref=e135] [cursor=pointer]: Hugli
          - generic [ref=e136] [cursor=pointer]: Hyderabad
          - generic [ref=e137] [cursor=pointer]: Jabalpur
          - generic [ref=e138] [cursor=pointer]: Jaggampet
          - generic [ref=e139] [cursor=pointer]: Jagityal
          - generic [ref=e140] [cursor=pointer]: Jaipur
          - generic [ref=e141] [cursor=pointer]: Jalandhar
          - generic [ref=e142] [cursor=pointer]: Jhansi
          - generic [ref=e143] [cursor=pointer]: Jhusi
          - generic [ref=e144] [cursor=pointer]: Jodhpur
          - generic [ref=e145] [cursor=pointer]: Kakinada
          - generic [ref=e146] [cursor=pointer]: Kamakhyanagar
          - generic [ref=e147] [cursor=pointer]: Kamareddy
          - generic [ref=e148] [cursor=pointer]: Kanpur
          - generic [ref=e149] [cursor=pointer]: Karimnagar
          - generic [ref=e150] [cursor=pointer]: Kashipur
          - generic [ref=e151] [cursor=pointer]: Kathmandu
          - generic [ref=e152] [cursor=pointer]: Khammam
          - generic [ref=e153] [cursor=pointer]: Kochi
          - generic [ref=e154] [cursor=pointer]: Kolkata
          - generic [ref=e155] [cursor=pointer]: Kota
          - generic [ref=e156] [cursor=pointer]: Kozhikode
          - generic [ref=e157] [cursor=pointer]: Krishna Nagar
          - generic [ref=e158] [cursor=pointer]: Kurnool
          - generic [ref=e159] [cursor=pointer]: Lucknow
          - generic [ref=e160] [cursor=pointer]: Ludhiana
          - generic [ref=e161] [cursor=pointer]: Machilipatnam
          - generic [ref=e162] [cursor=pointer]: Madurai
          - generic [ref=e163] [cursor=pointer]: Mahabubnagar
          - generic [ref=e164] [cursor=pointer]: Malda
          - generic [ref=e165] [cursor=pointer]: Mancherial
          - generic [ref=e166] [cursor=pointer]: Mandapeta
          - generic [ref=e167] [cursor=pointer]: Mangalore
          - generic [ref=e168] [cursor=pointer]: Manipal
          - generic [ref=e169] [cursor=pointer]: Mansa
          - generic [ref=e170] [cursor=pointer]: Meerut
          - generic [ref=e171] [cursor=pointer]: Midnapur
          - generic [ref=e172] [cursor=pointer]: Modinagar
          - generic [ref=e173] [cursor=pointer]: Mohali
          - generic [ref=e174] [cursor=pointer]: Moradabad
          - generic [ref=e175] [cursor=pointer]: Mughal Sarai
          - generic [ref=e176] [cursor=pointer]: Mumbai
          - generic [ref=e177] [cursor=pointer]: Munger
          - generic [ref=e178] [cursor=pointer]: Muzaffarpur
          - generic [ref=e179] [cursor=pointer]: Nagpur
          - generic [ref=e180] [cursor=pointer]: Nalanda
          - generic [ref=e181] [cursor=pointer]: Nalgonda
          - generic [ref=e182] [cursor=pointer]: Narasaraopet
          - generic [ref=e183] [cursor=pointer]: Nashik
          - generic [ref=e184] [cursor=pointer]: Nawada
          - generic [ref=e185] [cursor=pointer]: Nellore
          - generic [ref=e186] [cursor=pointer]: Nizamabad
          - generic [ref=e187] [cursor=pointer]: Noida
          - generic [ref=e188] [cursor=pointer]: Nuzvid
          - generic [ref=e189] [cursor=pointer]: Ongole
          - generic [ref=e190] [cursor=pointer]: Panchkula
          - generic [ref=e191] [cursor=pointer]: Patna
          - generic [ref=e192] [cursor=pointer]: Perinthalmanna
          - generic [ref=e193] [cursor=pointer]: Prayagraj
          - generic [ref=e194] [cursor=pointer]: Pune
          - generic [ref=e195] [cursor=pointer]: Purnia
          - generic [ref=e196] [cursor=pointer]: Raipur
          - generic [ref=e197] [cursor=pointer]: Rajamahendravaram
          - generic [ref=e198] [cursor=pointer]: Ravulapalem
          - generic [ref=e199] [cursor=pointer]: Rishikesh
          - generic [ref=e200] [cursor=pointer]: Rohtak
          - generic [ref=e201] [cursor=pointer]: Salem
          - generic [ref=e202] [cursor=pointer]: Shimla
          - generic [ref=e203] [cursor=pointer]: Shimoga
          - generic [ref=e204] [cursor=pointer]: Siddipet
          - generic [ref=e205] [cursor=pointer]: Siliguri
          - generic [ref=e206] [cursor=pointer]: Srikakulam
          - generic [ref=e207] [cursor=pointer]: Srinagar
          - generic [ref=e208] [cursor=pointer]: Tanuku
          - generic [ref=e209] [cursor=pointer]: Tauru
          - generic [ref=e210] [cursor=pointer]: Thalassery
          - generic [ref=e211] [cursor=pointer]: Thiruvananthapuram
          - generic [ref=e212] [cursor=pointer]: Thrissur
          - generic [ref=e213] [cursor=pointer]: Timmapuram
          - generic [ref=e214] [cursor=pointer]: Tiruchirapalli
          - generic [ref=e215] [cursor=pointer]: Tiruchirappalli
          - generic [ref=e216] [cursor=pointer]: Tirupati
          - generic [ref=e217] [cursor=pointer]: Trivandrum
          - generic [ref=e218] [cursor=pointer]: Tumkur
          - generic [ref=e219] [cursor=pointer]: Tuni
          - generic [ref=e220] [cursor=pointer]: Udaipur
          - generic [ref=e221] [cursor=pointer]: Varanasi
          - generic [ref=e222] [cursor=pointer]: Vijayawada
          - generic [ref=e223] [cursor=pointer]: Visakhapatnam
          - generic [ref=e224] [cursor=pointer]: Vizianagaram
          - generic [ref=e225] [cursor=pointer]: Warangal
          - generic [ref=e226] [cursor=pointer]: Zirakpur
    - main [ref=e227]:
      - generic [ref=e228]:
        - generic [ref=e229]:
          - img "Back" [ref=e231] [cursor=pointer]
          - paragraph [ref=e232]: Home > Doctor Speciality
        - generic [ref=e233]:
          - generic:
            - generic:
              - generic:
                - img
          - generic [ref=e234]:
            - generic [ref=e235]:
              - textbox "Search" [ref=e236]
              - button [ref=e237] [cursor=pointer]:
                - img [ref=e238]
            - button "View All" [ref=e240] [cursor=pointer]
          - generic [ref=e241]:
            - generic [ref=e243]:
              - generic [ref=e245] [cursor=pointer]:
                - img [ref=e247]
                - paragraph [ref=e248]: Autoimmune Disorder
              - generic [ref=e250] [cursor=pointer]:
                - img [ref=e252]
                - paragraph [ref=e253]: Cardiologist
              - generic [ref=e255] [cursor=pointer]:
                - img [ref=e257]
                - paragraph [ref=e258]: Client Specific
              - generic [ref=e260] [cursor=pointer]:
                - img [ref=e262]
                - paragraph [ref=e263]: Dermatologist
              - generic [ref=e265] [cursor=pointer]:
                - img [ref=e267]
                - paragraph [ref=e268]: Endocrinologist
              - generic [ref=e270] [cursor=pointer]:
                - img [ref=e272]
                - paragraph [ref=e273]: Gastrologist
              - generic [ref=e275] [cursor=pointer]:
                - img [ref=e277]
                - paragraph [ref=e278]: GP
              - generic [ref=e280] [cursor=pointer]:
                - img [ref=e282]
                - paragraph [ref=e283]: GPs
              - generic [ref=e285] [cursor=pointer]:
                - img [ref=e287]
                - paragraph [ref=e288]: Gynae
              - generic [ref=e290] [cursor=pointer]:
                - img [ref=e292]
                - paragraph [ref=e293]: Hematology
              - generic [ref=e295] [cursor=pointer]:
                - img [ref=e297]
                - paragraph [ref=e298]: Infertility
              - generic [ref=e300] [cursor=pointer]:
                - img [ref=e302]
                - paragraph [ref=e303]: Nephrologist
              - generic [ref=e305] [cursor=pointer]:
                - img [ref=e307]
                - paragraph [ref=e308]: Neurologist
              - generic [ref=e310] [cursor=pointer]:
                - img [ref=e312]
                - paragraph [ref=e313]: Oncologist
              - generic [ref=e315] [cursor=pointer]:
                - img [ref=e317]
                - paragraph [ref=e318]: Orthopedist
              - generic [ref=e320] [cursor=pointer]:
                - img [ref=e322]
                - paragraph [ref=e323]: Others
              - generic [ref=e325] [cursor=pointer]:
                - img [ref=e327]
                - paragraph [ref=e328]: Pediatrician
              - generic [ref=e330] [cursor=pointer]:
                - img [ref=e332]
                - paragraph [ref=e333]: Phy
              - generic [ref=e335] [cursor=pointer]:
                - img [ref=e337]
                - paragraph [ref=e338]: Preventive
              - generic [ref=e340] [cursor=pointer]:
                - img [ref=e342]
                - paragraph [ref=e343]: Pulmologist
              - generic [ref=e345] [cursor=pointer]:
                - img [ref=e347]
                - paragraph [ref=e348]: Surgeon & PMT
            - button "Previous" [ref=e349] [cursor=pointer]:
              - img "Previous" [ref=e350]
            - button "Next" [ref=e351] [cursor=pointer]:
              - img "Next" [ref=e352]
        - generic [ref=e354]:
          - generic [ref=e355]:
            - generic [ref=e356]:
              - generic [ref=e357]:
                - button [ref=e358] [cursor=pointer]:
                  - img [ref=e359]
                - button [ref=e361] [cursor=pointer]:
                  - img [ref=e362]
              - generic [ref=e364]: 2425 Items
            - generic [ref=e365]:
              - generic [ref=e366]:
                - textbox "Search by Tests" [ref=e367]
                - button [ref=e368] [cursor=pointer]:
                  - img [ref=e369]
              - button "download Download" [ref=e371] [cursor=pointer]:
                - img "download" [ref=e372]
                - text: Download
              - generic [ref=e373]:
                - img [ref=e374]
                - generic [ref=e380]: Sample Report
                - button [ref=e381] [cursor=pointer]
          - table [ref=e385]:
            - rowgroup [ref=e386]:
              - row "View S/No Test Code Test Name Sample Type Department Method Billing Category Price Sample Report Download Add to Cart" [ref=e387]:
                - columnheader [ref=e388]:
                  - checkbox [ref=e389]
                - columnheader "View" [ref=e390]
                - columnheader "S/No" [ref=e391]
                - columnheader "Test Code" [ref=e392]
                - columnheader "Test Name" [ref=e393]
                - columnheader "Sample Type" [ref=e394]
                - columnheader "Department" [ref=e395]
                - columnheader "Method" [ref=e396]
                - columnheader "Billing Category" [ref=e397]
                - columnheader "Price" [ref=e398]
                - columnheader "Sample Report Download" [ref=e399]
                - columnheader "Add to Cart" [ref=e400]
            - rowgroup [ref=e401]:
              - row "view 1 RCP10067 5-Aminolevulinic Acid (5-ALA) 2nd Morning Urine Mornings 2nd Urine Biochemistry & Immunoassay Column Chromatography O3 5690 pdf PDF Add to Cart" [ref=e402]:
                - cell [ref=e403]:
                  - checkbox [ref=e404]
                - cell "view" [ref=e405] [cursor=pointer]:
                  - img "view" [ref=e406]
                - cell "1" [ref=e407]
                - cell "RCP10067" [ref=e408] [cursor=pointer]
                - cell "5-Aminolevulinic Acid (5-ALA) 2nd Morning Urine" [ref=e409]
                - cell "Mornings 2nd Urine" [ref=e410]
                - cell "Biochemistry & Immunoassay" [ref=e411]
                - cell "Column Chromatography" [ref=e412]
                - cell "O3" [ref=e413]
                - cell "5690" [ref=e414]:
                  - generic [ref=e415]:
                    - img [ref=e416]
                    - text: "5690"
                - cell "pdf PDF" [ref=e418]:
                  - generic [ref=e419]:
                    - img "pdf" [ref=e420]
                    - text: PDF
                - cell "Add to Cart" [ref=e421]:
                  - button "Add to Cart" [ref=e422] [cursor=pointer]
              - row "view 2 RSR10059 (1-3)-β-D Glucan Assay Serum Serology Chemiluminescence Immunoassay (CLIA) O4 8000 pdf PDF Add to Cart" [ref=e423]:
                - cell [ref=e424]:
                  - checkbox [ref=e425]
                - cell "view" [ref=e426] [cursor=pointer]:
                  - img "view" [ref=e427]
                - cell "2" [ref=e428]
                - cell "RSR10059" [ref=e429] [cursor=pointer]
                - cell "(1-3)-β-D Glucan Assay" [ref=e430]
                - cell "Serum" [ref=e431]
                - cell "Serology" [ref=e432]
                - cell "Chemiluminescence Immunoassay (CLIA)" [ref=e433]
                - cell "O4" [ref=e434]
                - cell "8000" [ref=e435]:
                  - generic [ref=e436]:
                    - img [ref=e437]
                    - text: "8000"
                - cell "pdf PDF" [ref=e439]:
                  - generic [ref=e440]:
                    - img "pdf" [ref=e441]
                    - text: PDF
                - cell "Add to Cart" [ref=e442]:
                  - button "Add to Cart" [ref=e443] [cursor=pointer]
              - row "view 3 RBC10482 11-Deoxycortisol, Serum Serum Biochemistry & Immunoassay Chromatography/Mass Spectrometry O5 19910 pdf PDF Add to Cart" [ref=e444]:
                - cell [ref=e445]:
                  - checkbox [ref=e446]
                - cell "view" [ref=e447] [cursor=pointer]:
                  - img "view" [ref=e448]
                - cell "3" [ref=e449]
                - cell "RBC10482" [ref=e450] [cursor=pointer]
                - cell "11-Deoxycortisol, Serum" [ref=e451]
                - cell "Serum" [ref=e452]
                - cell "Biochemistry & Immunoassay" [ref=e453]
                - cell "Chromatography/Mass Spectrometry" [ref=e454]
                - cell "O5" [ref=e455]
                - cell "19910" [ref=e456]:
                  - generic [ref=e457]:
                    - img [ref=e458]
                    - text: "19910"
                - cell "pdf PDF" [ref=e460]:
                  - generic [ref=e461]:
                    - img "pdf" [ref=e462]
                    - text: PDF
                - cell "Add to Cart" [ref=e463]:
                  - button "Add to Cart" [ref=e464] [cursor=pointer]
              - row "view 4 SFI10023 11q22 by FISH Whole Blood/Bone Marrow Heparinized FISH & Cytogenetics FISH O3 4500 pdf PDF Add to Cart" [ref=e465]:
                - cell [ref=e466]:
                  - checkbox [ref=e467]
                - cell "view" [ref=e468] [cursor=pointer]:
                  - img "view" [ref=e469]
                - cell "4" [ref=e470]
                - cell "SFI10023" [ref=e471] [cursor=pointer]
                - cell "11q22 by FISH" [ref=e472]
                - cell "Whole Blood/Bone Marrow Heparinized" [ref=e473]
                - cell "FISH & Cytogenetics" [ref=e474]
                - cell "FISH" [ref=e475]
                - cell "O3" [ref=e476]
                - cell "4500" [ref=e477]:
                  - generic [ref=e478]:
                    - img [ref=e479]
                    - text: "4500"
                - cell "pdf PDF" [ref=e481]:
                  - generic [ref=e482]:
                    - img "pdf" [ref=e483]
                    - text: PDF
                - cell "Add to Cart" [ref=e484]:
                  - button "Add to Cart" [ref=e485] [cursor=pointer]
              - row "view 5 RCP10021 17-Ketosteroids 24Hrs, Urine 24Hr. Urine Biochemistry & Immunoassay Column Chromatography O3 8470 pdf PDF Add to Cart" [ref=e486]:
                - cell [ref=e487]:
                  - checkbox [ref=e488]
                - cell "view" [ref=e489] [cursor=pointer]:
                  - img "view" [ref=e490]
                - cell "5" [ref=e491]
                - cell "RCP10021" [ref=e492] [cursor=pointer]
                - cell "17-Ketosteroids 24Hrs, Urine" [ref=e493]
                - cell "24Hr. Urine" [ref=e494]
                - cell "Biochemistry & Immunoassay" [ref=e495]
                - cell "Column Chromatography" [ref=e496]
                - cell "O3" [ref=e497]
                - cell "8470" [ref=e498]:
                  - generic [ref=e499]:
                    - img [ref=e500]
                    - text: "8470"
                - cell "pdf PDF" [ref=e502]:
                  - generic [ref=e503]:
                    - img "pdf" [ref=e504]
                    - text: PDF
                - cell "Add to Cart" [ref=e505]:
                  - button "Add to Cart" [ref=e506] [cursor=pointer]
              - row "view 6 RCP10020 17-OH Corticosteroids 24Hr, Urine 24Hr. Urine Biochemistry & Immunoassay Column Chromatography O3 8470 pdf PDF Add to Cart" [ref=e507]:
                - cell [ref=e508]:
                  - checkbox [ref=e509]
                - cell "view" [ref=e510] [cursor=pointer]:
                  - img "view" [ref=e511]
                - cell "6" [ref=e512]
                - cell "RCP10020" [ref=e513] [cursor=pointer]
                - cell "17-OH Corticosteroids 24Hr, Urine" [ref=e514]
                - cell "24Hr. Urine" [ref=e515]
                - cell "Biochemistry & Immunoassay" [ref=e516]
                - cell "Column Chromatography" [ref=e517]
                - cell "O3" [ref=e518]
                - cell "8470" [ref=e519]:
                  - generic [ref=e520]:
                    - img [ref=e521]
                    - text: "8470"
                - cell "pdf PDF" [ref=e523]:
                  - generic [ref=e524]:
                    - img "pdf" [ref=e525]
                    - text: PDF
                - cell "Add to Cart" [ref=e526]:
                  - button "Add to Cart" [ref=e527] [cursor=pointer]
              - row "view 7 RIM10060 17-OH Progesterone Serum Biochemistry & Immunoassay ELISA (Enzyme Linked Immuno sorbent Assay) O5 1450 pdf PDF Add to Cart" [ref=e528]:
                - cell [ref=e529]:
                  - checkbox [ref=e530]
                - cell "view" [ref=e531] [cursor=pointer]:
                  - img "view" [ref=e532]
                - cell "7" [ref=e533]
                - cell "RIM10060" [ref=e534] [cursor=pointer]
                - cell "17-OH Progesterone" [ref=e535]
                - cell "Serum" [ref=e536]
                - cell "Biochemistry & Immunoassay" [ref=e537]
                - cell "ELISA (Enzyme Linked Immuno sorbent Assay)" [ref=e538]
                - cell "O5" [ref=e539]
                - cell "1450" [ref=e540]:
                  - generic [ref=e541]:
                    - img [ref=e542]
                    - text: "1450"
                - cell "pdf PDF" [ref=e544]:
                  - generic [ref=e545]:
                    - img "pdf" [ref=e546]
                    - text: PDF
                - cell "Add to Cart" [ref=e547]:
                  - button "Add to Cart" [ref=e548] [cursor=pointer]
              - row "view 8 QSR0007 3-Hydroxy-3-Methylglutaryl-Coenzyme A Reductase (HMGCR) Antibody (Igg) Serum-Red Top Plain Serology Chemiluminescence (CL) O5 43990 pdf PDF Add to Cart" [ref=e549]:
                - cell [ref=e550]:
                  - checkbox [ref=e551]
                - cell "view" [ref=e552] [cursor=pointer]:
                  - img "view" [ref=e553]
                - cell "8" [ref=e554]
                - cell "QSR0007" [ref=e555] [cursor=pointer]
                - cell "3-Hydroxy-3-Methylglutaryl-Coenzyme A Reductase (HMGCR) Antibody (Igg)" [ref=e556]
                - cell "Serum-Red Top Plain" [ref=e557]
                - cell "Serology" [ref=e558]
                - cell "Chemiluminescence (CL)" [ref=e559]
                - cell "O5" [ref=e560]
                - cell "43990" [ref=e561]:
                  - generic [ref=e562]:
                    - img [ref=e563]
                    - text: "43990"
                - cell "pdf PDF" [ref=e565]:
                  - generic [ref=e566]:
                    - img "pdf" [ref=e567]
                    - text: PDF
                - cell "Add to Cart" [ref=e568]:
                  - button "Add to Cart" [ref=e569] [cursor=pointer]
              - row "view 9 RIM10068 5-Alpha DHT (Di-Hydro Testosterone) Serum Biochemistry & Immunoassay Enzyme Immunoassay (EIA) O3 3870 pdf PDF Add to Cart" [ref=e570]:
                - cell [ref=e571]:
                  - checkbox [ref=e572]
                - cell "view" [ref=e573] [cursor=pointer]:
                  - img "view" [ref=e574]
                - cell "9" [ref=e575]
                - cell "RIM10068" [ref=e576] [cursor=pointer]
                - cell "5-Alpha DHT (Di-Hydro Testosterone)" [ref=e577]
                - cell "Serum" [ref=e578]
                - cell "Biochemistry & Immunoassay" [ref=e579]
                - cell "Enzyme Immunoassay (EIA)" [ref=e580]
                - cell "O3" [ref=e581]
                - cell "3870" [ref=e582]:
                  - generic [ref=e583]:
                    - img [ref=e584]
                    - text: "3870"
                - cell "pdf PDF" [ref=e586]:
                  - generic [ref=e587]:
                    - img "pdf" [ref=e588]
                    - text: PDF
                - cell "Add to Cart" [ref=e589]:
                  - button "Add to Cart" [ref=e590] [cursor=pointer]
              - row "view 10 RCP10047 5-HIAA, Random Urine Random Urine Biochemistry & Immunoassay HPLC O5 3520 pdf PDF Add to Cart" [ref=e591]:
                - cell [ref=e592]:
                  - checkbox [ref=e593]
                - cell "view" [ref=e594] [cursor=pointer]:
                  - img "view" [ref=e595]
                - cell "10" [ref=e596]
                - cell "RCP10047" [ref=e597] [cursor=pointer]
                - cell "5-HIAA, Random Urine" [ref=e598]
                - cell "Random Urine" [ref=e599]
                - cell "Biochemistry & Immunoassay" [ref=e600]
                - cell "HPLC" [ref=e601]
                - cell "O5" [ref=e602]
                - cell "3520" [ref=e603]:
                  - generic [ref=e604]:
                    - img [ref=e605]
                    - text: "3520"
                - cell "pdf PDF" [ref=e607]:
                  - generic [ref=e608]:
                    - img "pdf" [ref=e609]
                    - text: PDF
                - cell "Add to Cart" [ref=e610]:
                  - button "Add to Cart" [ref=e611] [cursor=pointer]
      - button [ref=e613] [cursor=pointer]:
        - img [ref=e614]
    - contentinfo [ref=e616]:
      - generic [ref=e617]:
        - paragraph [ref=e618]:
          - text: Copyright © 2026 Oncquest – All rights reserved.
          - generic [ref=e619]: Designed & Developed by AbyM Technology
          - text: — v2.18.04.25.1
        - generic [ref=e620]:
          - link "facebook" [ref=e621] [cursor=pointer]:
            - /url: https://www.facebook.com/OncquestLaboratories/?ref=aymt_homepage_panel
            - img "facebook" [ref=e622]
          - link "instagram" [ref=e623] [cursor=pointer]:
            - /url: https://www.instagram.com/oncquestlab/
            - img "instagram" [ref=e624]
          - link "twitter" [ref=e625] [cursor=pointer]:
            - /url: https://twitter.com/Oncquest1?t=U1pQPbKhT53oZSpBuqXDDw&s=09
            - img "twitter" [ref=e626]
          - link "linkedin" [ref=e627] [cursor=pointer]:
            - /url: https://www.linkedin.com/company/oncquest-labs-ltd-?trk=tyah
            - img "linkedin" [ref=e628]
          - link "youtube" [ref=e629] [cursor=pointer]:
            - /url: https://www.youtube.com/c/OncquestLaboratoriesLtd
            - img "youtube" [ref=e630]
        - generic [ref=e631]:
          - link "Privacy Policy" [ref=e632] [cursor=pointer]:
            - /url: /privacy-policy
          - generic [ref=e633]: "|"
          - link "Terms & Conditions" [ref=e634] [cursor=pointer]:
            - /url: /terms-conditions
  - alert [ref=e635]
```

# Test source

```ts
  21  |       .filter({ hasText: "Select your Location" })
  22  |       .first();
  23  |     this.locationIcon = this.page.locator('header img[alt="location"]').first();
  24  |     this.cartButton = this.page.locator("header button").filter({ hasText: /^\d+$/ }).first();
  25  |     this.specialitySearchInput = this.page.locator('input[placeholder="Search"]').first();
  26  |     this.testSearchInput = this.page.locator('input[placeholder="Search by Tests"]').first();
  27  |     this.testSearchButton = this.page
  28  |       .locator('div:has(input[placeholder="Search by Tests"]) button')
  29  |       .first();
  30  |     this.itemsCountLabel = this.page.getByText(/\d+\s*Items/i).first();
  31  |     this.tableRows = this.page.locator("tbody tr");
  32  |     this.firstTestCodeCell = this.page.locator("tbody tr td:nth-child(3)").first();
  33  |     this.addToCartButton = this.page.getByRole("button", { name: "Add to Cart" }).first();
  34  |     this.toastMessage = this.page.locator(".Toastify__toast, [role=\"alert\"], [data-sonner-toast]");
  35  |   }
  36  | 
  37  |   async open(): Promise<void> {
  38  |     await this.goto("/doctor-speciality");
  39  |   }
  40  | 
  41  |   async openAndSelectCity(city = "Delhi"): Promise<void> {
  42  |     await this.open();
  43  |     await this.selectCity(city);
  44  |     await this.waitForCatalogRows();
  45  |   }
  46  | 
  47  |   async selectCity(city = "Delhi"): Promise<void> {
  48  |     if (!(await this.locationModal.isVisible().catch(() => false))) {
  49  |       return;
  50  |     }
  51  | 
  52  |     const loadingCities = this.locationModal.getByText("Loading cities...", { exact: false });
  53  |     if (await loadingCities.isVisible().catch(() => false)) {
  54  |       await expect(loadingCities).toBeHidden({ timeout: 30_000 }).catch(() => {});
  55  |     }
  56  | 
  57  |     const preferredCityOption = this.locationModal
  58  |       .getByText(new RegExp(`^\\s*${this.escapeRegExp(city)}\\s*$`, "i"))
  59  |       .first();
  60  |     const clickPreferredCity = async (): Promise<boolean> => {
  61  |       if (!(await preferredCityOption.isVisible({ timeout: 10_000 }).catch(() => false))) {
  62  |         return false;
  63  |       }
  64  | 
  65  |       await preferredCityOption.click();
  66  |       return true;
  67  |     };
  68  | 
  69  |     if (await clickPreferredCity()) {
  70  |       await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
  71  |       return;
  72  |     }
  73  | 
  74  |     const searchInput = this.locationModal.getByPlaceholder("Search your City");
  75  |     if (await searchInput.isVisible().catch(() => false)) {
  76  |       await searchInput.fill(city);
  77  |       if (await clickPreferredCity()) {
  78  |         await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
  79  |         return;
  80  |       }
  81  |       await searchInput.fill("");
  82  |     }
  83  | 
  84  |     const fallbackCityClicked = await this.clickFirstAvailableCity();
  85  |     expect(
  86  |       fallbackCityClicked,
  87  |       `City option "${city}" was not available and no fallback city option was found.`
  88  |     ).toBe(true);
  89  |     await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
  90  |   }
  91  | 
  92  |   async openLocationSelector(): Promise<void> {
  93  |     await expect(this.locationIcon).toBeVisible({ timeout: 10_000 });
  94  |     await this.locationIcon.click();
  95  |     await expect(this.locationModal).toBeVisible({ timeout: 10_000 });
  96  |   }
  97  | 
  98  |   async assertPageShell(): Promise<void> {
  99  |     await expect(this.page.getByText(/Home\s*>\s*Doctor Speciality/i)).toBeVisible();
  100 |     await expect(this.page.getByRole("button", { name: "View All" })).toBeVisible();
  101 |     await expect(this.specialitySearchInput).toBeVisible();
  102 |     await expect(this.testSearchInput).toBeVisible();
  103 |     await expect(this.itemsCountLabel).toBeVisible();
  104 |     await expect(this.page.getByText("Test Code", { exact: true }).first()).toBeVisible();
  105 |     await expect(this.tableRows.first()).toBeVisible();
  106 |   }
  107 | 
  108 |   async assertSpecialityFilterChangesCatalog(speciality = "Cardiologist"): Promise<void> {
  109 |     await this.waitForCatalogRows();
  110 | 
  111 |     const totalBeforeFilter = await this.readItemsCount();
  112 |     expect(totalBeforeFilter, "Doctor Speciality page should list at least one test.").toBeGreaterThan(0);
  113 | 
  114 |     const specialityCard = this.page
  115 |       .getByText(new RegExp(`^\\s*${this.escapeRegExp(speciality)}\\s*$`, "i"))
  116 |       .first();
  117 | 
  118 |     await expect(specialityCard, `Speciality "${speciality}" should be visible.`).toBeVisible({
  119 |       timeout: 15_000
  120 |     });
> 121 |     await specialityCard.click();
      |                          ^ Error: locator.click: Test timeout of 120000ms exceeded.
  122 | 
  123 |     await expect
  124 |       .poll(async () => this.readItemsCount(), {
  125 |         timeout: 20_000,
  126 |         message: `Filtering by "${speciality}" should reduce total listed items.`
  127 |       })
  128 |       .toBeLessThan(totalBeforeFilter);
  129 | 
  130 |     await this.waitForCatalogRows();
  131 |   }
  132 | 
  133 |   async assertSearchByTestCodeWorks(): Promise<void> {
  134 |     await this.waitForCatalogRows();
  135 | 
  136 |     const totalBeforeSearch = await this.readItemsCount();
  137 |     const firstTestCode = (await this.firstTestCodeCell.innerText()).trim();
  138 |     expect(firstTestCode, "Could not read the first row test code on Doctor Speciality page.").not.toBe("");
  139 | 
  140 |     await this.testSearchInput.fill(firstTestCode);
  141 |     if (await this.testSearchButton.isVisible().catch(() => false)) {
  142 |       await this.testSearchButton.click();
  143 |     } else {
  144 |       await this.testSearchInput.press("Enter");
  145 |     }
  146 | 
  147 |     await expect(this.tableRows.filter({ hasText: firstTestCode }).first()).toBeVisible({ timeout: 15_000 });
  148 |     await expect
  149 |       .poll(async () => this.readItemsCount(), {
  150 |         timeout: 15_000,
  151 |         message: "Search should not increase the number of listed doctor speciality tests."
  152 |       })
  153 |       .toBeLessThanOrEqual(totalBeforeSearch);
  154 |   }
  155 | 
  156 |   async assertAddToCartShowsLoginWarning(): Promise<void> {
  157 |     await this.waitForCatalogRows();
  158 |     await expect(this.addToCartButton).toBeVisible({ timeout: 15_000 });
  159 |     await this.addToCartButton.click();
  160 |     await expect(this.toastMessage.filter({ hasText: "User not Login" }).first()).toBeVisible({
  161 |       timeout: 10_000
  162 |     });
  163 |   }
  164 | 
  165 |   async assertLoggedInAddToCartUpdatesCartCount(): Promise<void> {
  166 |     await this.waitForCatalogRows();
  167 | 
  168 |     const initialCount = await this.readCartCount();
  169 |     await expect(this.addToCartButton).toBeVisible({ timeout: 15_000 });
  170 |     await this.addToCartButton.click();
  171 | 
  172 |     await expect
  173 |       .poll(async () => this.readCartCount(), {
  174 |         timeout: 20_000,
  175 |         message: "Cart count should increase after adding a doctor speciality test for logged-in user."
  176 |       })
  177 |       .toBeGreaterThan(initialCount);
  178 | 
  179 |     await expect(this.toastMessage.filter({ hasText: "User not Login" }).first()).toBeHidden({
  180 |       timeout: 5_000
  181 |     });
  182 |   }
  183 | 
  184 |   private async waitForCatalogRows(timeoutMs = 120_000): Promise<void> {
  185 |     const loadingTests = this.page.getByText("Loading tests...", { exact: false }).first();
  186 |     const noDataFound = this.page.getByText("No Data Found", { exact: false }).first();
  187 | 
  188 |     if (await loadingTests.isVisible().catch(() => false)) {
  189 |       await expect(loadingTests).toBeHidden({ timeout: timeoutMs }).catch(() => {});
  190 |     }
  191 | 
  192 |     for (let attempt = 1; attempt <= 2; attempt += 1) {
  193 |       if (!(await noDataFound.isVisible().catch(() => false))) {
  194 |         break;
  195 |       }
  196 | 
  197 |       await this.page.reload({ waitUntil: "domcontentloaded" });
  198 |       if (await loadingTests.isVisible().catch(() => false)) {
  199 |         await expect(loadingTests).toBeHidden({ timeout: timeoutMs }).catch(() => {});
  200 |       }
  201 |     }
  202 | 
  203 |     if (await noDataFound.isVisible().catch(() => false)) {
  204 |       for (const fallbackCity of ["Mumbai", "Bengaluru", "Hyderabad"]) {
  205 |         await this.openLocationSelector().catch(() => {});
  206 |         await this.selectCity(fallbackCity);
  207 |         if (await loadingTests.isVisible().catch(() => false)) {
  208 |           await expect(loadingTests).toBeHidden({ timeout: timeoutMs }).catch(() => {});
  209 |         }
  210 | 
  211 |         if (await this.tableRows.first().isVisible().catch(() => false)) {
  212 |           return;
  213 |         }
  214 |       }
  215 |     }
  216 | 
  217 |     if (await noDataFound.isVisible().catch(() => false)) {
  218 |       throw new Error(
  219 |         "Doctor Speciality catalog returned 'No Data Found' after retry and fallback-city attempts. This is likely an environment or data issue."
  220 |       );
  221 |     }
```