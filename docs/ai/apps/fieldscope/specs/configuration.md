# Configuration and history

The editor exposes length, bay width, total height, an ordered array of typed soil/drain strips, pole distance from water, front and rear insets, pole extension above the crossbeam, and absolute net top/bottom heights above soil. A strip explicitly carries `kind: soil | drain`; neither first-item kind nor alternation is assumed.

Width left after strip allocation is split equally between the two bay margins. Roof shape, steel stations, passages, supports, and netting are derived from the accepted dimensions. Adjacent drain strips do not create planting rows without adjacent soil.

Unfinished text stays in the editor. Apply validates all values before a single Core Props transaction. Invalid input presents an error without changing the scene or history. One Apply is one Undo; Redo restores the accepted configuration. A new Apply after Undo clears the redo branch. Reload uses defaults.

The right panel contains the editor; the left contains presentation controls. Icon buttons above the canvas collapse each panel toward its screen edge. Collapsed controls are inert. Narrow layouts overlay panels rather than destroying the canvas. Panel toggles, layer changes, camera navigation and drafts create no history entries and do not rebuild geometry.

Each strip row ends with an up triangle, down triangle, and red X. Controls occupy one row and use 24×24 SVG viewports with drawing contained in the central 16×16 area. Reordering/removal edit only the draft until Apply; first/last reordering and removal of the final strip are disabled.
