<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Dish detail presentation stays in DishDetailSheet with scoped layout styles in the global stylesheet; the overlay preserves the menu route and existing cart operations.
- POS-only dishes live separately from the public menu and use explicit recipe links so selling them deducts stock without publishing them.
- Purchase receipts are capped at 5 MB, stored in a separate admin-only document table and attached atomically to check-ins so private documents are never included in public media or stock list queries.
- Accidental stock removal uses reason-required database RPCs and appended corrections, never ledger deletion, to preserve accountability.
