# TODO

- [ ] Implement: auto-create a "Personal" (Person type) SubNode for every newly created manager.
  - [ ] Update `src/App.tsx` `handleAddManager` to POST manager first, then POST a new subnode with `managerId` pointing to the created manager.
  - [ ] Ensure UI state stays consistent by re-syncing or updating local `subNodes`.
  - [ ] Handle failures gracefully (fallback: re-sync database state).
- [ ] Test: create a manager in Management portal, verify a new subnode appears and materials can be assigned to it.
- [ ] (Optional) Add cleanup: when deleting a manager, ensure related subnodes/materials are already cascaded (current code suggests yes).

